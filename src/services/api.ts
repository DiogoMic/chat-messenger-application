const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://your-api-gateway-url.amazonaws.com/dev';

interface ChatMessage {
  messageId: string;
  chatId: string;
  userId: string;
  message: string;
  timestamp: number;
  createdAt: string;
  delivered: boolean;
  read: boolean;
}

interface Chat {
  chatId: string;
  participants: string[];
  chatName?: string;
  chatType: 'direct' | 'group';
  createdAt: string;
  lastActivity: string;
}

class ApiService {
  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getChats(userId: string): Promise<Chat[]> {
    return this.request(`/chats?userId=${userId}`);
  }

  async getChatMessages(chatId: string, limit = 50, lastTimestamp?: number): Promise<{
    messages: ChatMessage[];
    lastEvaluatedKey?: any;
  }> {
    const params = new URLSearchParams({
      limit: limit.toString(),
    });
    
    if (lastTimestamp) {
      params.append('lastTimestamp', lastTimestamp.toString());
    }

    return this.request(`/chats/${chatId}/messages?${params}`);
  }

  async createChat(participants: string[], chatName?: string, chatType: 'direct' | 'group' = 'direct'): Promise<{ chatId: string }> {
    return this.request('/chats', {
      method: 'POST',
      body: JSON.stringify({
        participants,
        chatName,
        chatType,
      }),
    });
  }

  async getUploadUrl(fileName: string, fileType: string, chatId: string): Promise<{
    uploadUrl: string;
    downloadUrl: string;
    key: string;
  }> {
    return this.request('/upload-url', {
      method: 'POST',
      body: JSON.stringify({
        fileName,
        fileType,
        chatId,
      }),
    });
  }

  async uploadFile(file: File, uploadUrl: string): Promise<void> {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!response.ok) {
      throw new Error(`File upload failed: ${response.statusText}`);
    }
  }
}

export default new ApiService();