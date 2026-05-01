import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CLIENT_SIDEBAR, FREELANCER_SIDEBAR, withActive } from '@/constants/sidebar';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import { ProfileDropdown } from '@/components/ui/ProfileDropdown';

const SIDEBAR_BG = '#0A192F';

// ── Mock data ─────────────────────────────────────────────────────────────────

interface Msg {
  id: string;
  fromOther: boolean;
  content: string;
  time: string;
  file?: { name: string; size: string };
}

interface Conversation {
  id: string;
  name: string;
  initials: string;
  color: string;
  online: boolean;
  lastMessage: string;
  time: string;
  unread: number;
  contractTitle: string;
  contractId: string;
  contractAmount: string;
  messages: Msg[];
}

const SEED: Conversation[] = [
  {
    id: '1',
    name: 'Aria Vance',
    initials: 'AV',
    color: 'bg-purple-500',
    online: true,
    lastMessage: 'The mockups look great! Just one thing...',
    time: '10:42 AM',
    unread: 2,
    contractTitle: 'Fintech Dashboard UI/UX Design',
    contractId: 'BF-882',
    contractAmount: '$4,500 Fixed',
    messages: [
      { id: 'm1', fromOther: true,  content: "Hi! I've just reviewed the high-fidelity mockups for the wallet module. The dark mode integration is looking incredibly sharp.", time: '10:15 AM' },
      { id: 'm2', fromOther: true,  content: "I love the micro-interactions you've proposed for the transaction history. Very intuitive.", time: '10:16 AM' },
      { id: 'm3', fromOther: false, content: "Thanks! Glad you like them. I spent extra time refining the bezier curves on the charts to make sure they feel premium and responsive.", time: '10:30 AM' },
      { id: 'm4', fromOther: false, content: "Here's the updated spec sheet for the dev team.", time: '10:32 AM', file: { name: 'Wallet_Interactions_V2.pdf', size: '2.4 MB' } },
      { id: 'm5', fromOther: true,  content: "The mockups look great! Just one thing—can we try a slightly brighter accent color for the 'Send' button? It might need more contrast against the dark background.", time: '10:42 AM' },
    ],
  },
  {
    id: '2',
    name: 'Marcus Chen',
    initials: 'MC',
    color: 'bg-blue-600',
    online: false,
    lastMessage: "I've released the milestone payment for the API integration.",
    time: 'Yesterday',
    unread: 0,
    contractTitle: 'Backend API Integration',
    contractId: 'BF-771',
    contractAmount: '$3,200 Fixed',
    messages: [
      { id: 'm1', fromOther: true,  content: "The API documentation you shared was really well structured. Made integration much easier.", time: 'Yesterday, 2:30 PM' },
      { id: 'm2', fromOther: false, content: "Glad it helped! Let me know if you need any clarification on the webhook setup.", time: 'Yesterday, 3:15 PM' },
      { id: 'm3', fromOther: true,  content: "I've released the milestone payment for the API integration.", time: 'Yesterday, 4:00 PM' },
    ],
  },
  {
    id: '3',
    name: 'Sarah Miller',
    initials: 'SM',
    color: 'bg-emerald-500',
    online: false,
    lastMessage: 'Can we schedule a quick sync for Monday morning?',
    time: 'Aug 22',
    unread: 0,
    contractTitle: 'Mobile App Development',
    contractId: 'BF-654',
    contractAmount: '$8,000 Fixed',
    messages: [
      { id: 'm1', fromOther: false, content: "I've completed the onboarding screens. Ready for your review!", time: 'Aug 22, 9:00 AM' },
      { id: 'm2', fromOther: true,  content: "Can we schedule a quick sync for Monday morning?", time: 'Aug 22, 11:30 AM' },
    ],
  },
  {
    id: '4',
    name: 'Devin Patel',
    initials: 'DP',
    color: 'bg-amber-500',
    online: false,
    lastMessage: 'The documentation you sent was very helpful, thanks!',
    time: 'Aug 20',
    unread: 0,
    contractTitle: 'Data Pipeline Automation',
    contractId: 'BF-530',
    contractAmount: '$5,500 Fixed',
    messages: [
      { id: 'm1', fromOther: false, content: "Here's the technical documentation for the data pipeline architecture.", time: 'Aug 20, 1:00 PM' },
      { id: 'm2', fromOther: true,  content: "The documentation you sent was very helpful, thanks!", time: 'Aug 20, 3:45 PM' },
    ],
  },
];

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Messages() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const sidebarLinks = withActive(
    user?.role === 'FREELANCER' ? FREELANCER_SIDEBAR : CLIENT_SIDEBAR,
    pathname
  );

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>(SEED);
  const [selectedId, setSelectedId] = useState<string | null>('1');
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  const profileRef = useRef<HTMLDivElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const selected = conversations.find(c => c.id === selectedId) ?? null;
  const filtered = conversations.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [selectedId, conversations]);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setMobileView('chat');
    setConversations(prev => prev.map(c => c.id === id ? { ...c, unread: 0 } : c));
  };

  const handleSend = () => {
    if (!draft.trim() || !selectedId) return;
    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const msg: Msg = { id: `m${Date.now()}`, fromOther: false, content: draft.trim(), time: now };
    setConversations(prev => prev.map(c =>
      c.id === selectedId
        ? { ...c, messages: [...c.messages, msg], lastMessage: draft.trim(), time: now }
        : c
    ));
    setDraft('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraft(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const handleLogout = async () => { await logout(); navigate('/login', { replace: true }); };
  const initials = user ? getInitials(user.name) : '?';

  const navRight = (
    <div className="flex items-center gap-1">
      <button className="relative p-2 text-white/70 hover:text-white transition-colors" aria-label="Notifications">
        <span className="material-symbols-outlined">notifications</span>
      </button>
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

  // ── Conversation list panel ──────────────────────────────────────────────────
  const ConversationList = (
    <div className={`${mobileView === 'chat' ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-[340px] lg:w-[380px] flex-shrink-0 border-r border-slate-200 bg-white`}>
      {/* Search */}
      <div className="p-4 border-b border-slate-100 flex-shrink-0">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search messages…"
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary/10 focus:border-secondary transition-all"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center px-4">
            <span className="material-symbols-outlined text-4xl text-slate-300">search_off</span>
            <p className="text-sm text-slate-500">No conversations found</p>
          </div>
        ) : filtered.map(c => (
          <button
            key={c.id}
            onClick={() => handleSelect(c.id)}
            className={`w-full px-4 py-4 flex items-start gap-3 transition-colors text-left border-b border-slate-50 ${
              c.id === selectedId
                ? 'bg-secondary/5 border-r-4 border-r-secondary'
                : 'hover:bg-slate-50'
            }`}
          >
            <div className="relative flex-shrink-0">
              <div className={`w-12 h-12 rounded-full ${c.color} flex items-center justify-center text-white text-sm font-bold select-none`}>
                {c.initials}
              </div>
              <div className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${c.online ? 'bg-green-500' : 'bg-slate-300'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-0.5">
                <h4 className={`text-sm truncate ${c.unread ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'}`}>{c.name}</h4>
                <span className="text-[11px] text-slate-400 font-medium flex-shrink-0 ml-2">{c.time}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className={`text-xs truncate ${c.unread ? 'font-semibold text-slate-700' : 'text-slate-500'}`}>{c.lastMessage}</p>
                {c.unread > 0 && (
                  <span className="flex-shrink-0 w-5 h-5 bg-secondary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {c.unread}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  // ── Chat window ──────────────────────────────────────────────────────────────
  const ChatWindow = selected ? (
    <div className={`${mobileView === 'list' ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-slate-50/30 min-w-0`}>
      {/* Chat header */}
      <div className="bg-white border-b border-slate-200 p-4 flex-shrink-0">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileView('list')} className="md:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-800 transition-colors">
              <span className="material-symbols-outlined text-[22px]">arrow_back</span>
            </button>
            <div className={`w-10 h-10 rounded-full ${selected.color} flex items-center justify-center text-white text-sm font-bold select-none flex-shrink-0`}>
              {selected.initials}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{selected.name}</h3>
              <div className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider ${selected.online ? 'text-green-600' : 'text-slate-400'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${selected.online ? 'bg-green-500' : 'bg-slate-300'}`} />
                {selected.online ? 'Online' : 'Offline'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
              <span className="material-symbols-outlined text-[22px]">call</span>
            </button>
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
              <span className="material-symbols-outlined text-[22px]">videocam</span>
            </button>
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
              <span className="material-symbols-outlined text-[22px]">more_vert</span>
            </button>
          </div>
        </div>

        {/* Contract context card */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-[0px_4px_12px_rgba(10,25,47,0.05)] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-secondary/10 text-secondary rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
            </div>
            <div className="min-w-0">
              <h5 className="text-sm font-bold text-slate-900 truncate">{selected.contractTitle}</h5>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-slate-500 font-medium">Contract #{selected.contractId}</span>
                <span className="text-xs px-2 py-0.5 bg-secondary/10 text-secondary rounded-full font-semibold">{selected.contractAmount}</span>
              </div>
            </div>
          </div>
          <button className="px-3 py-1.5 bg-primary-container text-white text-xs font-semibold rounded-lg hover:brightness-110 transition-all flex-shrink-0">
            View Details
          </button>
        </div>
      </div>

      {/* Message feed */}
      <div ref={feedRef} className="flex-1 overflow-y-auto p-6 space-y-4">
        {selected.messages.map((msg, i) => {
          const prevMsg = selected.messages[i - 1];
          const groupWithPrev = prevMsg && prevMsg.fromOther === msg.fromOther;

          if (msg.fromOther) {
            return (
              <div key={msg.id} className={`flex items-end gap-2.5 max-w-[78%] ${groupWithPrev ? 'mt-1' : 'mt-4'}`}>
                <div className={`w-8 h-8 rounded-full ${selected.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${groupWithPrev ? 'invisible' : ''}`}>
                  {selected.initials}
                </div>
                <div>
                  <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm text-slate-700 text-sm leading-relaxed">
                    {msg.content}
                  </div>
                  {!groupWithPrev && <span className="text-[10px] text-slate-400 mt-1 block px-1">{msg.time}</span>}
                </div>
              </div>
            );
          }

          return (
            <div key={msg.id} className={`flex flex-row-reverse items-end gap-2.5 max-w-[78%] ml-auto ${groupWithPrev ? 'mt-1' : 'mt-4'}`}>
              <div className={`w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${groupWithPrev ? 'invisible' : ''}`}>
                {initials}
              </div>
              <div className="flex flex-col items-end">
                {msg.file && (
                  <div className="bg-secondary px-4 py-3 rounded-2xl rounded-tr-none shadow-md text-white text-sm mb-0.5">
                    <div className="flex items-center gap-3 bg-white/10 px-3 py-2.5 rounded-xl border border-white/20 mb-2">
                      <span className="material-symbols-outlined text-white text-[22px]">picture_as_pdf</span>
                      <div>
                        <p className="font-bold text-xs">{msg.file.name}</p>
                        <p className="text-[10px] opacity-70">{msg.file.size}</p>
                      </div>
                      <span className="material-symbols-outlined text-white text-[18px] ml-auto">download</span>
                    </div>
                    {msg.content}
                  </div>
                )}
                {!msg.file && (
                  <div className="bg-secondary px-4 py-3 rounded-2xl rounded-tr-none shadow-md text-white text-sm leading-relaxed">
                    {msg.content}
                  </div>
                )}
                {!groupWithPrev && <span className="text-[10px] text-slate-400 mt-1 block px-1">{msg.time} · Delivered</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input bar */}
      <div className="p-4 bg-white border-t border-slate-200 flex-shrink-0">
        <div className="flex items-end gap-3">
          <div className="flex gap-1 mb-1 flex-shrink-0">
            <button className="p-2 text-slate-400 hover:text-secondary transition-colors rounded-lg hover:bg-secondary/5">
              <span className="material-symbols-outlined text-[22px]">attach_file</span>
            </button>
            <button className="p-2 text-slate-400 hover:text-secondary transition-colors rounded-lg hover:bg-secondary/5">
              <span className="material-symbols-outlined text-[22px]">mood</span>
            </button>
          </div>
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message…"
              rows={1}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/10 focus:border-secondary transition-all resize-none overflow-hidden leading-relaxed"
              style={{ maxHeight: '120px' }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!draft.trim()}
            className="w-12 h-12 bg-secondary text-white rounded-xl flex items-center justify-center hover:brightness-110 active:scale-[0.95] transition-all shadow-lg shadow-secondary/20 disabled:opacity-40 flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
          </button>
        </div>
      </div>
    </div>
  ) : (
    /* Empty state (desktop) */
    <div className="hidden md:flex flex-1 flex-col items-center justify-center p-8 text-center bg-slate-50/30">
      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-slate-400 text-4xl">chat</span>
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">Select a Conversation</h3>
      <p className="text-sm text-slate-500 max-w-xs">Choose a chat from the list to start messaging.</p>
    </div>
  );

  return (
    <div className="bg-surface min-h-screen flex flex-col">
      <Navbar variant="app" authRight={navRight} />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* BidForge sidebar */}
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
          <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
            {sidebarLinks.map(({ icon, label, active, path }) => (
              <button key={label} onClick={() => path && navigate(path)} title={!sidebarOpen ? label : undefined}
                className={['w-full flex items-center gap-3 rounded-lg py-2.5 transition-all duration-150 font-medium', sidebarOpen ? 'px-3' : 'justify-center px-2', active ? 'bg-white/10 text-white font-bold border-l-4 border-secondary' : path ? 'text-white/60 hover:bg-white/10 hover:text-white' : 'text-white/30 cursor-default'].join(' ')}>
                <span className="material-symbols-outlined text-[20px] flex-shrink-0">{icon}</span>
                {sidebarOpen && <span className="text-sm truncate">{label}</span>}
              </button>
            ))}
          </nav>
          <div className="p-3 space-y-2 border-t border-white/10 flex-shrink-0">
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

        {/* Chat area (full-height, no scroll at this level) */}
        <main className="flex flex-1 overflow-hidden">
          {ConversationList}
          {ChatWindow}
        </main>
      </div>

      {/* Mobile bottom nav */}
      {user && (
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-white/10 flex items-stretch" style={{ backgroundColor: '#0A192F' }}>
          {sidebarLinks.map(({ icon, short, active, path }) => (
            <button key={short} onClick={() => path && navigate(path)}
              className={['flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors', active ? 'text-secondary' : path ? 'text-white/50 hover:text-white' : 'text-white/30 cursor-default'].join(' ')}>
              <span className="material-symbols-outlined text-[22px]">{icon}</span>
              <span className="text-[10px] font-semibold leading-none">{short}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
