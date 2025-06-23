import React, { useState, useEffect } from 'react';
import { ChatSidebar } from './components/ChatSidebar';
import { ChatHeader } from './components/ChatHeader';
import { ChatArea } from './components/ChatArea';
import { MessageInput } from './components/MessageInput';
import { mockContacts, mockMessages } from './data/mockData';
import ApiService from './services/api';
import WebSocketService from './services/websocket';

const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL || 'wss://bwb2b4elcb.execute-api.us-east-1.amazonaws.com/dev';
const USER_ID = 'user-' + Math.random().toString(36).substr(2, 9); // Generate random user ID

console.log('WebSocket URL:', WEBSOCKET_URL);
console.log('User ID:', USER_ID);

interface ChatMessage {
  id: string;
  text: string;
  timestamp: string;
  sent: boolean;
  delivered: boolean;
  read: boolean;
  reactions?: string[];
}

export default function App() {
  const [activeChat, setActiveChat] = useState('1');
  const [messages, setMessages] = useState<{ [key: string]: ChatMessage[] }>(mockMessages);
  const [isTyping, setIsTyping] = useState(false);
  const [wsService, setWsService] = useState<WebSocketService | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);

  const activeContact = mockContacts.find(contact => contact.id === activeChat);
  const currentMessages = messages[activeChat] || [];

  const handleSendMessage = (text: string) => {
    if (wsService && isConnected) {
      // Send via WebSocket to real backend
      wsService.sendMessage(activeChat, text);
      
      // Also add to local state immediately for better UX
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sent: true,
        delivered: false,
        read: false
      };

      setMessages(prev => ({
        ...prev,
        [activeChat]: [...(prev[activeChat] || []), newMessage]
      }));
    } else {
      // Fallback to mock behavior
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sent: true,
        delivered: true,
        read: false
      };

      setMessages(prev => ({
        ...prev,
        [activeChat]: [...(prev[activeChat] || []), newMessage]
      }));
    }
  };

  const handleTyping = (typing: boolean) => {
    setIsTyping(typing);
    if (typing) {
      setTimeout(() => setIsTyping(false), 3000);
    }
  };

  const handleReply = (messageId: string) => {
    console.log('Reply to message:', messageId);
  };

  const handleReact = (messageId: string, emoji: string) => {
    setMessages(prev => ({
      ...prev,
      [activeChat]: prev[activeChat].map(msg => 
        msg.id === messageId 
          ? { ...msg, reactions: [...(msg.reactions || []), emoji] }
          : msg
      )
    }));
  };

  useEffect(() => {
    // Initialize WebSocket connection
    const ws = new WebSocketService(WEBSOCKET_URL, USER_ID);
    setWsService(ws);

    ws.connect()
      .then(() => {
        console.log('Connected to WebSocket');
        setIsConnected(true);
        ws.joinChat(activeChat);
      })
      .catch(error => {
        console.error('Failed to connect to WebSocket:', error);
        setIsConnected(false);
      });

    // Handle incoming messages
    ws.onMessage('newMessage', (data) => {
      const newMessage: ChatMessage = {
        id: data.messageId,
        text: data.message,
        timestamp: new Date(data.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sent: data.userId === USER_ID,
        delivered: true,
        read: false
      };

      setMessages(prev => ({
        ...prev,
        [data.chatId]: [...(prev[data.chatId] || []), newMessage]
      }));
    });

    return () => {
      ws.disconnect();
    };
  }, []);

  useEffect(() => {
    // Join new chat when activeChat changes
    if (wsService && isConnected) {
      wsService.joinChat(activeChat);
    }
  }, [activeChat, wsService, isConnected]);

  const handleNewChat = async () => {
    const otherUserId = prompt('Enter user ID to chat with:');
    if (!otherUserId) return;

    try {
      const response = await ApiService.createChat([USER_ID, otherUserId], `Chat with ${otherUserId}`);
      const newChatId = response.chatId;
      
      // Switch to new chat
      setActiveChat(newChatId);
      
      // Join the new chat via WebSocket
      if (wsService && isConnected) {
        wsService.joinChat(newChatId);
      }
      
      console.log('Created new chat:', newChatId);
    } catch (error) {
      console.error('Failed to create chat:', error);
      console.error('API URL:', import.meta.env.VITE_API_URL);
      alert(`Failed to create chat: ${error.message}`);
    }
  };

  return (
    <div className="h-screen flex bg-gray-100">
      <div className="p-2 bg-blue-100 text-sm">
        Status: {isConnected ? '🟢 Connected to AWS' : '🔴 Using Mock Data'}
      <button 
        onClick={() => {
          if (wsService) {
            wsService.connect().then(() => {
              setIsConnected(true);
              wsService.joinChat(activeChat);
            }).catch(console.error);
          }
        }}
        className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded"
      >
        Reconnect
      </button>
      </div>
      <ChatSidebar
        contacts={mockContacts}
        activeChat={activeChat}
        onChatSelect={setActiveChat}
        onNewChat={handleNewChat}
      />
      
      <div className="flex-1 flex flex-col">
        {activeContact && (
          <>
            <ChatHeader contact={activeContact} />
            <ChatArea
              messages={currentMessages}
              isTyping={isTyping}
              onReply={handleReply}
              onReact={handleReact}
            />
            <MessageInput
              onSendMessage={handleSendMessage}
              onTyping={handleTyping}
            />
          </>
        )}
      </div>
    </div>
  );
}