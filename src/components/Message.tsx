import React, { useState } from 'react';
import { Check, CheckCheck, Heart, Smile, Reply } from 'lucide-react';

interface MessageProps {
  message: {
    id: string;
    text: string;
    timestamp: string;
    sent: boolean;
    delivered: boolean;
    read: boolean;
    reactions?: string[];
  };
  onReply?: (messageId: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
}

export const Message: React.FC<MessageProps> = ({ message, onReply, onReact }) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className={`flex ${message.sent ? 'justify-end' : 'justify-start'} mb-4 group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={`max-w-xs lg:max-w-md ${message.sent ? 'order-2' : 'order-1'}`}>
        <div
          className={`px-4 py-2 rounded-2xl ${
            message.sent
              ? 'bg-blue-500 text-white rounded-br-md'
              : 'bg-gray-100 text-gray-900 rounded-bl-md'
          } shadow-sm`}
        >
          <p className="text-sm leading-relaxed">{message.text}</p>
          
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex items-center space-x-1 mt-2">
              {message.reactions.map((reaction, index) => (
                <span key={index} className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">
                  {reaction}
                </span>
              ))}
            </div>
          )}
        </div>
        
        <div className={`flex items-center mt-1 space-x-1 ${message.sent ? 'justify-end' : 'justify-start'}`}>
          <span className="text-xs text-gray-500">{message.timestamp}</span>
          {message.sent && (
            <div className="flex items-center">
              {message.read ? (
                <CheckCheck size={14} className="text-blue-500" />
              ) : message.delivered ? (
                <CheckCheck size={14} className="text-gray-400" />
              ) : (
                <Check size={14} className="text-gray-400" />
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Message Actions */}
      {showActions && (
        <div className={`flex items-center space-x-1 ${message.sent ? 'order-1 mr-2' : 'order-2 ml-2'}`}>
          <button
            onClick={() => onReact?.(message.id, '❤️')}
            className="p-1 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded-full transition-colors opacity-0 group-hover:opacity-100"
          >
            <Heart size={14} />
          </button>
          <button
            onClick={() => onReact?.(message.id, '😊')}
            className="p-1 text-gray-400 hover:text-yellow-500 hover:bg-gray-100 rounded-full transition-colors opacity-0 group-hover:opacity-100"
          >
            <Smile size={14} />
          </button>
          <button
            onClick={() => onReply?.(message.id)}
            className="p-1 text-gray-400 hover:text-blue-500 hover:bg-gray-100 rounded-full transition-colors opacity-0 group-hover:opacity-100"
          >
            <Reply size={14} />
          </button>
        </div>
      )}
    </div>
  );
};