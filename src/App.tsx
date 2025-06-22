import React, { useState, useEffect } from 'react';
import { ChatSidebar } from './components/ChatSidebar';
import { ChatHeader } from './components/ChatHeader';
import { ChatArea } from './components/ChatArea';
import { MessageInput } from './components/MessageInput';
import { mockContacts, mockMessages } from './data/mockData';

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

  const activeContact = mockContacts.find(contact => contact.id === activeChat);
  const currentMessages = messages[activeChat] || [];

  const handleSendMessage = (text: string) => {
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

    // Simulate delivery and read status updates
    setTimeout(() => {
      setMessages(prev => ({
        ...prev,
        [activeChat]: prev[activeChat].map(msg => 
          msg.id === newMessage.id ? { ...msg, read: true } : msg
        )
      }));
    }, 1000);
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
    // Simulate typing indicator from other users occasionally
    const interval = setInterval(() => {
      if (Math.random() > 0.9 && !isTyping) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 2000);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isTyping]);

  return (
    <div className="h-screen flex bg-gray-100">
      <ChatSidebar
        contacts={mockContacts}
        activeChat={activeChat}
        onChatSelect={setActiveChat}
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