import api from './axiosInstance';

export interface ChatRoom {
  roomId: string;
  contractId: string;
  clientId: number;
  clientName: string;
  clientOnline: boolean;
  clientLastSeen?: string;
  freelancerId: number;
  freelancerName: string;
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
    api.get<ChatRoom>(`/contracts/${contractId}/chat`).then(r => r.data),

  getMyRooms: () =>
    api.get<ChatRoom[]>('/contracts/chat/my-rooms').then(r => r.data),

  getMessages: (roomId: string) =>
    api.get<ChatMessage[]>(`/contracts/chat/${roomId}/messages`).then(r => r.data),

  markRead: (roomId: string) =>
    api.post(`/contracts/chat/${roomId}/mark-read`).then(r => r.data),

  uploadFile: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<{ fileUrl: string; fileName: string; fileType: 'image' | 'file' }>(
      '/files/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } }
    ).then(r => r.data);
  },
};
