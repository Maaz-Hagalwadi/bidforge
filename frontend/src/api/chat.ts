import api from './axiosInstance';

export interface ChatRoom {
  roomId: string;
  contractId: string;
  clientId: number;
  clientName: string;
  clientProfileImageUrl?: string;
  clientOnline: boolean;
  clientLastSeen?: string;
  freelancerId: number;
  freelancerName: string;
  freelancerProfileImageUrl?: string;
  freelancerOnline: boolean;
  freelancerLastSeen?: string;
  jobTitle?: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: number;
  senderName: string;
  content: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: 'image' | 'file';
  sentAt: string;
  isRead: boolean;
}

export const chatApi = {
  getRoomForContract: (contractId: string) =>
    api.get<ChatRoom>(`/chat/contracts/${contractId}`).then(r => r.data),

  getMyRooms: () =>
    api.get<ChatRoom[]>('/chat/rooms/my').then(r => r.data),

  getMessages: (roomId: string) =>
    api.get<ChatMessage[]>(`/chat/rooms/${roomId}/messages`).then(r => r.data),

  markRead: (roomId: string) =>
    api.post(`/chat/rooms/${roomId}/mark-read`).then(r => r.data),

  uploadFile: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<{ fileUrl: string; fileName: string; fileType: 'image' | 'file' }>(
      '/files/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } }
    ).then(r => r.data);
  },
};
