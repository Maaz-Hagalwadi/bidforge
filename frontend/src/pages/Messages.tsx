import { useState, useRef, useEffect, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { NotificationBell } from '@/components/NotificationBell';
import { useNavigate, useLocation } from 'react-router-dom';
import { CLIENT_SIDEBAR, FREELANCER_SIDEBAR, withActive } from '@/constants/sidebar';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import { ProfileDropdown } from '@/components/ui/ProfileDropdown';
import { chatApi, type ChatRoom, type ChatMessage } from '@/api/chat';

const SIDEBAR_BG = '#0A192F';
const WS_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080') + '/ws';

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatLastSeen(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'last seen just now';
  if (diffMin < 60) return `last seen ${diffMin}m ago`;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  if (d.toDateString() === now.toDateString()) return `last seen today at ${time}`;
  if (d.toDateString() === yesterday.toDateString()) return `last seen yesterday at ${time}`;
  return `last seen ${d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} at ${time}`;
}

const AVATAR_COLORS = [
  'bg-purple-500', 'bg-blue-600', 'bg-emerald-500',
  'bg-amber-500', 'bg-rose-500', 'bg-indigo-500',
];

function roomColor(roomId: string) {
  let hash = 0;
  for (let i = 0; i < roomId.length; i++) hash = roomId.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

async function downloadFile(url: string, filename: string) {
  const res = await fetch(url);
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(blobUrl);
}

export default function Messages() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { pathname, state: locationState } = useLocation();
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const sidebarLinks = withActive(
    user?.role === 'FREELANCER' ? FREELANCER_SIDEBAR : CLIENT_SIDEBAR,
    pathname
  );

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [pendingFile, setPendingFile] = useState<{ fileUrl: string; fileName: string; fileType: 'image' | 'file' } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [connected, setConnected] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());
  const [lastSeenMap, setLastSeenMap] = useState<Record<number, string>>({});

  const profileRef = useRef<HTMLDivElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stompRef = useRef<Client | null>(null);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  const typingSubRef = useRef<{ unsubscribe: () => void } | null>(null);
  const readReceiptSubRef = useRef<{ unsubscribe: () => void } | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectRoomRef = useRef<(room: ChatRoom) => void>(() => {});

  // ── Load rooms ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const targetContractId = (locationState as { contractId?: string } | null)?.contractId;

    const load = async () => {
      try {
        const [allRooms, targetRoom] = await Promise.all([
          chatApi.getMyRooms(),
          targetContractId ? chatApi.getRoomForContract(targetContractId).catch(() => null) : null,
        ]);

        setRooms(allRooms);

        const initial = new Set<number>();
        const initialLastSeen: Record<number, string> = {};
        allRooms.forEach(r => {
          if (r.clientOnline) initial.add(r.clientId);
          if (r.freelancerOnline) initial.add(r.freelancerId);
          if (r.clientLastSeen) initialLastSeen[r.clientId] = r.clientLastSeen;
          if (r.freelancerLastSeen) initialLastSeen[r.freelancerId] = r.freelancerLastSeen;
        });
        setOnlineUsers(initial);
        setLastSeenMap(initialLastSeen);

        if (targetRoom) {
          // Ensure the target room appears in the sidebar list
          if (!allRooms.some(r => r.roomId === targetRoom.roomId)) {
            setRooms(prev => [targetRoom, ...prev]);
          }
          selectRoomRef.current(targetRoom);
        } else if (allRooms.length > 0) {
          selectRoomRef.current(allRooms[0]);
        }
      } finally {
        setLoadingRooms(false);
      }
    };

    load();
  }, []);

  // ── WebSocket connection ────────────────────────────────────────────────────
  useEffect(() => {
    const token = sessionStorage.getItem('accessToken');
    if (!token) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL, null, { transports: ['websocket'] }),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true);
        // Subscribe to per-room unread count updates
        if (user?.id) {
          client.subscribe(`/topic/notifications/${user.id}`, (frame) => {
            const data = JSON.parse(frame.body);
            if (data.roomId !== undefined && data.unreadCount !== undefined) {
              setUnreadCounts(prev => ({ ...prev, [data.roomId]: data.unreadCount }));
            } else if (data.unreadCounts) {
              setUnreadCounts(data.unreadCounts);
            }
          });
        }
        // Subscribe to global online presence
        client.subscribe('/topic/online', (frame) => {
          const data: { userId: number; username: string; online: boolean; lastSeen?: string } = JSON.parse(frame.body);
          setOnlineUsers(prev => {
            const next = new Set(prev);
            if (data.online) next.add(data.userId);
            else next.delete(data.userId);
            return next;
          });
          if (!data.online && data.lastSeen) {
            setLastSeenMap(prev => ({ ...prev, [data.userId]: data.lastSeen! }));
          }
        });
      },
      onDisconnect: () => setConnected(false),
      onStompError: () => setConnected(false),
    });

    client.activate();
    stompRef.current = client;

    return () => { client.deactivate(); };
  }, []);

  // ── Subscribe to room topic ─────────────────────────────────────────────────
  const subscribeToRoom = useCallback((roomId: string) => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
    if (typingSubRef.current) {
      typingSubRef.current.unsubscribe();
      typingSubRef.current = null;
    }
    if (readReceiptSubRef.current) {
      readReceiptSubRef.current.unsubscribe();
      readReceiptSubRef.current = null;
    }
    setTypingUser(null);
    const client = stompRef.current;
    if (!client?.connected) return;

    subscriptionRef.current = client.subscribe(`/topic/chat/${roomId}`, (frame) => {
      const msg: ChatMessage = JSON.parse(frame.body);
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      // If room is currently open and message is from someone else → mark read immediately
      setSelectedRoom(current => {
        if (current?.roomId === roomId) {
          if (msg.senderId !== user?.id) {
            chatApi.markRead(roomId).catch(() => {});
          }
        } else {
          // Room not open → increment unread badge
          if (msg.senderId !== user?.id) {
            setUnreadCounts(prev => ({ ...prev, [roomId]: (prev[roomId] ?? 0) + 1 }));
          }
        }
        return current;
      });
    });

    // Subscribe to typing events for this room
    typingSubRef.current = client.subscribe(`/topic/typing/${roomId}`, (frame) => {
      const data: { userId: number; userName: string; typing: boolean } = JSON.parse(frame.body);
      if (data.userId !== user?.id) {
        setTypingUser(data.typing ? data.userName : null);
      }
    });

    // Subscribe to read receipts — when the other person reads, mark my sent messages as read
    readReceiptSubRef.current = client.subscribe(`/topic/read/${roomId}`, (frame) => {
      const data: { roomId: string; readByUserId: number } = JSON.parse(frame.body);
      if (data.readByUserId !== user?.id) {
        setMessages(prev => prev.map(m =>
          m.senderId === user?.id ? { ...m, isRead: true } : m
        ));
      }
    });
  }, [user?.id]);

  // Re-subscribe when connected state changes and a room is selected
  useEffect(() => {
    if (connected && selectedRoom) subscribeToRoom(selectedRoom.roomId);
  }, [connected, selectedRoom, subscribeToRoom]);

  // ── Scroll to bottom ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!feedRef.current) return;
    const el = feedRef.current;
    requestAnimationFrame(() => { el.scrollTop = el.scrollHeight; });
  }, [messages]);

  // ── Outside click for profile ───────────────────────────────────────────────
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  // ── Select room ─────────────────────────────────────────────────────────────
  const selectRoom = useCallback(async (room: ChatRoom) => {
    setSelectedRoom(room);
    setMobileView('chat');
    setLoadingMessages(true);
    // Mark messages as read
    chatApi.markRead(room.roomId).catch(() => {});
    setUnreadCounts(prev => ({ ...prev, [room.roomId]: 0 }));
    try {
      const msgs = await chatApi.getMessages(room.roomId);
      setMessages(msgs);
    } catch {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
    subscribeToRoom(room.roomId);
  }, [subscribeToRoom]);

  // Keep ref in sync so the load effect can always call the latest selectRoom
  useEffect(() => { selectRoomRef.current = selectRoom; }, [selectRoom]);

  // ── Send message ────────────────────────────────────────────────────────────
  const handleSend = () => {
    if ((!draft.trim() && !pendingFile) || !selectedRoom || !stompRef.current?.connected) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    stompRef.current.publish({
      destination: '/app/chat.typing',
      body: JSON.stringify({ roomId: selectedRoom.roomId, typing: false }),
    });
    stompRef.current.publish({
      destination: '/app/chat.send',
      body: JSON.stringify({
        roomId: selectedRoom.roomId,
        content: draft.trim() || null,
        ...(pendingFile ?? {}),
      }),
    });
    setDraft('');
    setPendingFile(null);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setUploading(true);
    try {
      const result = await chatApi.uploadFile(file);
      setPendingFile(result);
    } catch {
      // silently ignore — user can retry
    } finally {
      setUploading(false);
    }
  };

  const handleTyping = (roomId: string) => {
    if (!stompRef.current?.connected) return;
    stompRef.current.publish({
      destination: '/app/chat.typing',
      body: JSON.stringify({ roomId, typing: true }),
    });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      stompRef.current?.publish({
        destination: '/app/chat.typing',
        body: JSON.stringify({ roomId, typing: false }),
      });
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraft(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
    if (selectedRoom) handleTyping(selectedRoom.roomId);
  };

  const handleLogout = async () => { await logout(); navigate('/login', { replace: true }); };
  const initials = user ? getInitials(user.name) : '?';

  const filteredRooms = rooms.filter(r =>
    (r.clientName ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (r.freelancerName ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (r.jobTitle ?? '').toLowerCase().includes(search.toLowerCase())
  );

  function getOtherName(room: ChatRoom) {
    return user?.id === room.clientId ? room.freelancerName : room.clientName;
  }

  function getOtherId(room: ChatRoom) {
    return user?.id === room.clientId ? room.freelancerId : room.clientId;
  }

  const navRight = (
    <div className="flex items-center gap-1">
      <NotificationBell />
      <div className="relative" ref={profileRef}>
        <button onClick={() => setProfileOpen(o => !o)} aria-expanded={profileOpen} aria-label="Profile menu"
          className="flex items-center gap-1 pl-1 pr-2 py-1 rounded-lg hover:bg-white/10 transition-colors">
          {user?.profileImageUrl ? (
            <img src={user.profileImageUrl} className="w-8 h-8 rounded-full object-cover border-2 border-white/20" alt={user.name} />
          ) : (
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white text-sm font-bold select-none">{initials}</div>
          )}
          <span className="material-symbols-outlined text-white/60 text-base leading-none">expand_more</span>
        </button>
        {profileOpen && user && <ProfileDropdown user={user} onUpdated={refreshUser} onLogout={handleLogout} />}
      </div>
    </div>
  );

  // ── Conversation list ───────────────────────────────────────────────────────
  const ConversationList = (
    <div className={`${mobileView === 'chat' ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-[320px] lg:w-[360px] flex-shrink-0 border-r border-slate-200 bg-white`}>
      <div className="p-4 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900">Messages</h2>
          <div className={`flex items-center gap-1.5 text-xs font-semibold ${connected ? 'text-green-600' : 'text-slate-400'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-500' : 'bg-slate-300'}`} />
            {connected ? 'Live' : 'Connecting…'}
          </div>
        </div>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search conversations…"
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary/10 focus:border-secondary transition-all" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loadingRooms ? (
          <div className="flex items-center justify-center py-12 gap-2 text-slate-400 text-sm">
            <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
            Loading…
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center px-4">
            <span className="material-symbols-outlined text-4xl text-slate-300">chat</span>
            <p className="text-sm text-slate-500">No conversations yet</p>
            <p className="text-xs text-slate-400">Conversations appear once a contract is created.</p>
          </div>
        ) : filteredRooms.map(room => {
          const color = roomColor(room.roomId);
          const name = getOtherName(room);
          const isSelected = selectedRoom?.roomId === room.roomId;
          return (
            <button key={room.roomId} onClick={() => selectRoom(room)}
              className={`w-full px-4 py-4 flex items-start gap-3 transition-colors text-left border-b border-slate-50 ${isSelected ? 'bg-secondary/5 border-r-4 border-r-secondary' : 'hover:bg-slate-50'}`}>
              <div className="relative flex-shrink-0">
                <div className={`w-11 h-11 rounded-full ${color} flex items-center justify-center text-white text-sm font-bold select-none`}>
                  {getInitials(name)}
                </div>
                <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${onlineUsers.has(getOtherId(room)) ? 'bg-green-500' : 'bg-slate-300'}`} />
                {(unreadCounts[room.roomId] ?? 0) > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-secondary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCounts[room.roomId] > 99 ? '99+' : unreadCounts[room.roomId]}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-0.5">
                  <h4 className={`text-sm truncate ${(unreadCounts[room.roomId] ?? 0) > 0 ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>{name}</h4>
                </div>
                <p className={`text-xs truncate ${(unreadCounts[room.roomId] ?? 0) > 0 ? 'font-semibold text-slate-700' : 'text-slate-500'}`}>
                  {room.jobTitle ?? `Contract #${room.contractId.slice(-6).toUpperCase()}`}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  // ── Chat window ─────────────────────────────────────────────────────────────
  const ChatWindow = selectedRoom ? (
    <div className={`${mobileView === 'list' ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-slate-50/30 min-w-0 min-h-0`}>
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileView('list')} className="md:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-800 transition-colors">
              <span className="material-symbols-outlined text-[22px]">arrow_back</span>
            </button>
            <div className={`w-10 h-10 rounded-full ${roomColor(selectedRoom.roomId)} flex items-center justify-center text-white text-sm font-bold select-none flex-shrink-0`}>
              {getInitials(getOtherName(selectedRoom))}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{getOtherName(selectedRoom)}</h3>
              <div className="flex items-center gap-1.5 text-xs font-medium">
                {onlineUsers.has(getOtherId(selectedRoom)) ? (
                  <><span className="w-1.5 h-1.5 rounded-full bg-green-500" /><span className="text-green-600">Online</span></>
                ) : lastSeenMap[getOtherId(selectedRoom)] ? (
                  <span className="text-slate-400">{formatLastSeen(lastSeenMap[getOtherId(selectedRoom)])}</span>
                ) : (
                  <span className="text-slate-400">Offline</span>
                )}
              </div>
            </div>
          </div>
          <button onClick={() => navigate(`/contracts/${selectedRoom.contractId}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-outline-variant rounded-lg text-xs font-semibold text-secondary hover:bg-secondary/5 transition-colors">
            <span className="material-symbols-outlined text-[14px]">description</span>
            View Contract
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={feedRef} className="flex-1 min-h-0 overflow-y-auto p-5 space-y-3">
        {loadingMessages ? (
          <div className="flex items-center justify-center py-12 gap-2 text-slate-400 text-sm">
            <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
            Loading messages…
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-300">chat_bubble</span>
            <p className="text-sm text-slate-500">No messages yet. Say hello!</p>
          </div>
        ) : messages.map((msg, i) => {
          const isMe = msg.senderId === user?.id;
          const prev = messages[i - 1];
          const grouped = prev && (prev.senderId === msg.senderId);

          if (!isMe) {
            return (
              <div key={msg.id} className={`flex max-w-[75%] ${grouped ? 'mt-0.5' : 'mt-3'}`}>
                <div>
                  {msg.fileType === 'image' && (
                    <img src={msg.fileUrl} alt={msg.fileName}
                      className="max-w-[240px] rounded-2xl rounded-tl-none mb-1 cursor-pointer object-cover shadow-sm"
                      onClick={() => setLightboxUrl(msg.fileUrl!)} />
                  )}
                  {msg.fileType === 'file' && (
                    <button onClick={() => downloadFile(msg.fileUrl!, msg.fileName!)}
                      className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-2.5 rounded-2xl rounded-tl-none shadow-sm text-secondary text-sm font-medium mb-1 hover:bg-slate-50 transition-colors">
                      <span className="material-symbols-outlined text-[20px] flex-shrink-0">attach_file</span>
                      <span className="truncate max-w-[160px]">{msg.fileName}</span>
                      <span className="material-symbols-outlined text-[16px] flex-shrink-0 text-slate-400">download</span>
                    </button>
                  )}
                  {msg.content && (
                    <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-2xl rounded-tl-none shadow-sm text-slate-700 text-sm leading-relaxed">
                      {msg.content}
                    </div>
                  )}
                  {!grouped && <span className="text-[10px] text-slate-400 mt-0.5 block px-1">{formatTime(msg.sentAt)}</span>}
                </div>
              </div>
            );
          }

          return (
            <div key={msg.id} className={`flex justify-end max-w-[75%] ml-auto ${grouped ? 'mt-0.5' : 'mt-3'}`}>
              <div className="flex flex-col items-end">
                {msg.fileType === 'image' && (
                  <img src={msg.fileUrl} alt={msg.fileName}
                    className="max-w-[240px] rounded-2xl rounded-tr-none mb-1 cursor-pointer object-cover shadow-md"
                    onClick={() => setLightboxUrl(msg.fileUrl!)} />
                )}
                {msg.fileType === 'file' && (
                  <button onClick={() => downloadFile(msg.fileUrl!, msg.fileName!)}
                    className="flex items-center gap-2 bg-secondary/90 px-3 py-2.5 rounded-2xl rounded-tr-none shadow-md text-white text-sm font-medium mb-1 hover:brightness-110 transition-all">
                    <span className="material-symbols-outlined text-[20px] flex-shrink-0">attach_file</span>
                    <span className="truncate max-w-[160px]">{msg.fileName}</span>
                    <span className="material-symbols-outlined text-[16px] flex-shrink-0 text-white/70">download</span>
                  </button>
                )}
                {msg.content && (
                  <div className="bg-secondary px-4 py-2.5 rounded-2xl rounded-tr-none shadow-md text-white text-sm leading-relaxed">
                    {msg.content}
                  </div>
                )}
                <div className="flex items-center gap-0.5 mt-0.5 px-1">
                  {!grouped && <span className="text-[10px] text-slate-400">{formatTime(msg.sentAt)}</span>}
                  <span
                    className={`material-symbols-outlined text-[15px] leading-none ${msg.isRead ? 'text-blue-500' : 'text-slate-400'}`}
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {msg.isRead ? 'done_all' : 'done'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Typing indicator */}
      {typingUser && (
        <div className="px-5 pb-1 flex items-center gap-2">
          <div className="bg-white border border-slate-200 px-3 py-2 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-[11px] text-slate-400">typing…</span>
        </div>
      )}

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-200 flex-shrink-0">
        {!connected && (
          <p className="text-xs text-amber-600 text-center mb-2 flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[14px]">wifi_off</span>
            Reconnecting to chat…
          </p>
        )}
        {/* Pending file preview */}
        {pendingFile && (
          <div className="mb-2 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            {pendingFile.fileType === 'image' ? (
              <img src={pendingFile.fileUrl} alt={pendingFile.fileName} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <span className="material-symbols-outlined text-secondary text-[22px] flex-shrink-0">attach_file</span>
            )}
            <span className="text-xs text-slate-600 truncate flex-1">{pendingFile.fileName}</span>
            <button onClick={() => setPendingFile(null)} className="text-slate-400 hover:text-slate-700 flex-shrink-0">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          {/* Hidden file input */}
          <input ref={fileInputRef} type="file" accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
            className="hidden" onChange={handleFileChange} />
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-secondary hover:bg-secondary/5 rounded-xl transition-colors flex-shrink-0 disabled:opacity-40">
            {uploading
              ? <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
              : <span className="material-symbols-outlined text-[20px]">attach_file</span>
            }
          </button>
          <div className="flex-1 relative">
            <textarea ref={textareaRef} value={draft} onChange={handleTextareaChange} onKeyDown={handleKeyDown}
              placeholder="Type a message…" rows={1}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/10 focus:border-secondary transition-all resize-none overflow-hidden leading-relaxed"
              style={{ maxHeight: '120px' }} />
          </div>
          <button onClick={handleSend} disabled={(!draft.trim() && !pendingFile) || !connected || uploading}
            className="w-11 h-11 bg-secondary text-white rounded-xl flex items-center justify-center hover:brightness-110 active:scale-[0.95] transition-all shadow-lg shadow-secondary/20 disabled:opacity-40 flex-shrink-0">
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
          </button>
        </div>
      </div>
    </div>
  ) : (
    <div className="hidden md:flex flex-1 flex-col items-center justify-center p-8 text-center bg-slate-50/30">
      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-slate-400 text-4xl">chat</span>
      </div>
      <h3 className="text-base font-bold text-slate-900 mb-2">Select a Conversation</h3>
      <p className="text-sm text-slate-500 max-w-xs">Choose a chat from the list to start messaging.</p>
    </div>
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Navbar variant="app" authRight={navRight} />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* App sidebar */}
        <aside
          className={[user ? 'hidden lg:flex' : 'hidden', 'flex-col sticky top-16 h-[calc(100vh-4rem)] border-r border-white/10 transition-[width] duration-300 ease-in-out overflow-hidden flex-shrink-0', sidebarOpen ? 'w-64' : 'w-16'].join(' ')}
          style={{ backgroundColor: SIDEBAR_BG }}
        >
          <div className={`flex items-center h-14 border-b border-white/10 px-3 flex-shrink-0 ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
            {sidebarOpen && <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 select-none">Menu</span>}
            <button onClick={() => setSidebarOpen(o => !o)} className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
              <span className="material-symbols-outlined text-xl">{sidebarOpen ? 'menu_open' : 'menu'}</span>
            </button>
          </div>
          <nav className="flex-1 min-h-0 py-2 px-2 space-y-0.5 overflow-y-auto">
            {sidebarLinks.map(({ icon, label, active, path }) => (
              <button key={label} onClick={() => path && navigate(path)} title={!sidebarOpen ? label : undefined}
                className={['w-full flex items-center gap-3 rounded-lg py-2.5 transition-all duration-150 font-medium', sidebarOpen ? 'px-3' : 'justify-center px-2', active ? 'bg-white/10 text-white font-bold border-l-4 border-secondary' : path ? 'text-white/60 hover:bg-white/10 hover:text-white' : 'text-white/30 cursor-default'].join(' ')}>
                <span className="material-symbols-outlined text-[20px] flex-shrink-0">{icon}</span>
                {sidebarOpen && <span className="text-sm truncate">{label}</span>}
              </button>
            ))}
          </nav>
          <div className="mt-auto p-3 space-y-2 border-t border-white/10 flex-shrink-0">
            {sidebarOpen && (
              <div className="bg-white/5 border border-white/10 text-white rounded-xl p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1">PRO PLAN</p>
                <p className="text-xs font-semibold leading-relaxed mb-3 text-white/80">Unlimited active contracts and priority support.</p>
                <button className="w-full py-2 bg-secondary rounded-lg text-xs font-bold hover:brightness-110 transition-all">Upgrade Now</button>
              </div>
            )}
            <button onClick={handleLogout} title={!sidebarOpen ? 'Sign Out' : undefined}
              className={['w-full flex items-center gap-3 rounded-lg py-2.5 text-white/60 hover:bg-red-500/20 hover:text-red-400 transition-colors', sidebarOpen ? 'px-3' : 'justify-center px-2'].join(' ')}>
              <span className="material-symbols-outlined text-[20px] flex-shrink-0">logout</span>
              {sidebarOpen && <span className="text-sm font-medium">Sign Out</span>}
            </button>
          </div>
        </aside>

        <main className="flex flex-1 min-h-0 overflow-hidden bg-surface">
          {ConversationList}
          {ChatWindow}
        </main>
      </div>

      {user && mobileView !== 'chat' && (
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-white/10 flex flex-col" style={{ backgroundColor: '#0A192F' }}>
          {[sidebarLinks.slice(0, 4), sidebarLinks.slice(4)].map((row, ri) => (
            <div key={ri} className={`flex items-stretch ${ri === 0 ? 'border-b border-white/10' : ''}`}>
              {row.map(({ icon, short, active, path }) => (
                <button key={short} onClick={() => path && navigate(path)}
                  className={['flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors', active ? 'text-secondary' : path ? 'text-white/50 hover:text-white' : 'text-white/30 cursor-default'].join(' ')}>
                  <span className="material-symbols-outlined text-[20px]">{icon}</span>
                  <span className="text-[9px] font-semibold leading-none">{short}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>
      )}

      {lightboxUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setLightboxUrl(null)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white"
            onClick={() => setLightboxUrl(null)}>
            <span className="material-symbols-outlined text-[32px]">close</span>
          </button>
          <img src={lightboxUrl} alt="Preview"
            className="max-w-[90vw] max-h-[90vh] rounded-xl shadow-2xl object-contain"
            onClick={e => e.stopPropagation()} />
          <button
            className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg transition-colors"
            onClick={e => { e.stopPropagation(); downloadFile(lightboxUrl, lightboxUrl.split('/').pop() ?? 'image'); }}>
            <span className="material-symbols-outlined text-[18px]">download</span>
            Download
          </button>
        </div>
      )}
    </div>
  );
}
