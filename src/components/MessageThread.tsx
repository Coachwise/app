import { useState, useRef } from 'react';
import { ArrowLeft, Send, Image as ImageIcon, X, Video, Play, Hash, ExternalLink, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface MessageThreadProps {
  conversationId: string | null;
  onBack: () => void;
  onJoinChannel?: (channelId: string) => void;
}

interface Message {
  id: string;
  text: string;
  timestamp: string;
  isSent: boolean;
  isRead: boolean;
  mediaType?: 'image' | 'video' | 'channel-invite';
  mediaUrl?: string;
  videoThumbnail?: string;
  channelInvite?: {
    channelId: string;
    channelName: string;
    channelDescription: string;
    coachName: string;
    memberCount: number;
  };
}

interface Contact {
  id: string;
  name: string;
  username: string;
  avatar: string;
  isCoach: boolean;
  isOnline: boolean;
}

export function MessageThread({ conversationId, onBack, onJoinChannel }: MessageThreadProps) {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [messageText, setMessageText] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<{ type: 'image' | 'video', url: string } | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // Mock contact data - in real app, this would be fetched based on conversationId
  const [contact] = useState<Contact>({
    id: 'coach-sarah',
    name: 'Sarah Martinez',
    username: '@sarahmartinez',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    isCoach: true,
    isOnline: true,
  });

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hey! How are you feeling about the new workout plan?',
      timestamp: '10:30 AM',
      isSent: false,
      isRead: true,
    },
    {
      id: '2',
      text: 'I\'m feeling great! The exercises are challenging but doable.',
      timestamp: '10:32 AM',
      isSent: true,
      isRead: true,
    },
    {
      id: '3',
      text: 'That\'s what I like to hear! Remember to focus on form over weight.',
      timestamp: '10:35 AM',
      isSent: false,
      isRead: true,
    },
    {
      id: '4',
      text: 'I\'d like to invite you to my channel for daily tips!',
      timestamp: '10:36 AM',
      isSent: false,
      isRead: true,
      mediaType: 'channel-invite',
      channelInvite: {
        channelId: 'channel-1',
        channelName: 'Strength Training Tips',
        channelDescription: 'Daily tips and motivation for strength training',
        coachName: 'Sarah Martinez',
        memberCount: 24,
      },
    },
    {
      id: '5',
      text: 'Check out this video on proper deadlift form',
      timestamp: '10:40 AM',
      isSent: false,
      isRead: true,
      mediaType: 'video',
      mediaUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=400&fit=crop',
      videoThumbnail: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=400&fit=crop',
    },
    {
      id: '6',
      text: 'Thanks! This is super helpful 💪',
      timestamp: '2:15 PM',
      isSent: true,
      isRead: true,
    },
    {
      id: '7',
      text: 'Here\'s my progress photo from today!',
      timestamp: '2:20 PM',
      isSent: true,
      isRead: true,
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&h=400&fit=crop',
    },
    {
      id: '8',
      text: 'Great progress on your deadlifts! Keep it up! 💪',
      timestamp: '2:25 PM',
      isSent: false,
      isRead: false,
    },
  ]);

  const handleSendMessage = () => {
    if (!messageText.trim() && !selectedMedia) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      isSent: true,
      isRead: false,
      ...(selectedMedia && {
        mediaType: selectedMedia.type,
        mediaUrl: selectedMedia.url,
        ...(selectedMedia.type === 'video' && { videoThumbnail: selectedMedia.url }),
      }),
    };

    setMessages([...messages, newMessage]);
    setMessageText('');
    setSelectedMedia(null);
  };

  const handleMediaSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileType = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : null;
    if (!fileType) return;

    // Create a preview URL
    const previewUrl = URL.createObjectURL(file);
    setSelectedMedia({ type: fileType, url: previewUrl });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSelectMessage = (messageId: string) => {
    setSelectedMessageId(messageId);
  };

  const handleEditMessage = (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (message) {
      setEditingMessageId(messageId);
      setEditText(message.text);
    }
  };

  const handleSaveEdit = () => {
    if (!editingMessageId || !editText.trim()) return;

    const updatedMessages = messages.map(m => {
      if (m.id === editingMessageId) {
        return {
          ...m,
          text: editText,
          isRead: false,
        };
      }
      return m;
    });

    setMessages(updatedMessages);
    setEditingMessageId(null);
    setEditText('');
  };

  const handleDeleteMessage = (messageId: string) => {
    const updatedMessages = messages.filter(m => m.id !== messageId);
    setMessages(updatedMessages);
    setSelectedMessageId(null);
  };

  return (
    <div className="fixed inset-0 bg-gray-100 flex flex-col z-50 max-w-md mx-auto">
      {/* Header */}
      <div className="bg-[#0E0E55] px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 -ml-2 hover:bg-[#1A1A6E] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          
          <img 
            src={contact.avatar} 
            alt={contact.name}
            className="w-10 h-10 rounded-full object-cover"
          />
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-white">{contact.name}</h2>
              {contact.isCoach && (
                <span className="px-2 py-0.5 bg-yellow-500 text-[#0E0E55] rounded text-xs">
                  Coach
                </span>
              )}
            </div>
            <p className="text-gray-300 text-xs">
              {contact.isOnline ? 'Active now' : 'Offline'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {messages.map((message, index) => {
          const showTimestamp = index === 0 || messages[index - 1].timestamp !== message.timestamp;
          
          return (
            <div key={message.id}>
              {/* Timestamp Divider */}
              {showTimestamp && (
                <div className="flex items-center justify-center my-4">
                  <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                    {message.timestamp}
                  </span>
                </div>
              )}

              {/* Message Bubble */}
              <div className={`flex ${message.isSent ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] ${message.isSent ? 'order-2' : 'order-1'} relative group`}>
                  {!message.isSent && (
                    <div className="flex items-center gap-2 mb-1">
                      <img 
                        src={contact.avatar} 
                        alt={contact.name}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <span className="text-xs text-gray-600">{contact.name}</span>
                    </div>
                  )}
                  
                  {/* Edit/Delete Menu Button (for sent messages only) */}
                  {message.isSent && editingMessageId !== message.id && (
                    <button
                      onClick={() => setSelectedMessageId(selectedMessageId === message.id ? null : message.id)}
                      className="absolute -left-8 top-1 p-1.5 bg-gray-200 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-600" />
                    </button>
                  )}
                  
                  {/* Edit/Delete Options Menu */}
                  {selectedMessageId === message.id && message.isSent && (
                    <div className="absolute right-0 -top-20 bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-20">
                      <button
                        onClick={() => {
                          handleEditMessage(message.id);
                          setSelectedMessageId(null);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors text-left"
                      >
                        <Edit2 className="w-4 h-4 text-[#0E0E55]" />
                        <span className="text-sm text-gray-900">Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteMessage(message.id)}
                        className="flex items-center gap-2 w-full px-3 py-2 hover:bg-red-50 rounded-lg transition-colors text-left"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-red-500">Delete</span>
                      </button>
                    </div>
                  )}
                  
                  {editingMessageId === message.id ? (
                    /* Edit Mode */
                    <div className="bg-white rounded-2xl p-3 border-2 border-yellow-500">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
                        rows={3}
                        autoFocus
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={handleSaveEdit}
                          disabled={!editText.trim()}
                          className="flex-1 py-1.5 bg-[#0E0E55] text-white rounded-lg hover:bg-[#1A1A6E] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingMessageId(null);
                            setEditText('');
                          }}
                          className="flex-1 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Normal Message Display */
                    <div className={`rounded-2xl p-3 ${
                      message.isSent 
                        ? 'bg-[#0E0E55] text-white rounded-br-sm' 
                        : 'bg-white text-gray-900 rounded-bl-sm'
                    }`}>
                      {/* Media Content */}
                      {message.mediaType === 'image' && message.mediaUrl && (
                        <div className="mb-2">
                          <img 
                            src={message.mediaUrl} 
                            alt="Shared media"
                            className="rounded-lg max-w-full h-auto"
                          />
                        </div>
                      )}
                      
                      {message.mediaType === 'video' && message.videoThumbnail && (
                        <div className="mb-2 relative">
                          <img 
                            src={message.videoThumbnail} 
                            alt="Video thumbnail"
                            className="rounded-lg max-w-full h-auto"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                              <Play className="w-6 h-6 text-[#0E0E55] ml-1" />
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {message.mediaType === 'channel-invite' && message.channelInvite && (
                        <div className="mb-2">
                          <div className="flex items-center gap-2">
                            <Hash className="w-4 h-4 text-[#0E0E55]" />
                            <span className="text-sm text-[#0E0E55] font-bold">
                              {message.channelInvite.channelName}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600">
                            {message.channelInvite.channelDescription}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-600">
                              {message.channelInvite.coachName}
                            </span>
                            <span className="text-xs text-gray-600">
                              ({message.channelInvite.memberCount} members)
                            </span>
                          </div>
                          <button
                            onClick={() => onJoinChannel?.(message.channelInvite.channelId)}
                            className="mt-2 px-3 py-1 bg-yellow-500 text-[#0E0E55] rounded-full hover:bg-yellow-400 transition-colors"
                          >
                            Join Channel
                          </button>
                        </div>
                      )}
                      
                      {/* Text Content */}
                      {message.text && (
                        <p className="whitespace-pre-wrap break-words">{message.text}</p>
                      )}
                    </div>
                  )}
                  
                  {message.isSent && (
                    <div className="flex items-center justify-end gap-1 mt-1 px-2">
                      <span className="text-xs text-gray-500">
                        {message.isRead ? 'Read' : 'Sent'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Media Preview */}
      {selectedMedia && (
        <div className="fixed bottom-20 left-0 right-0 bg-white border-t border-gray-200 p-4 max-w-md mx-auto">
          <div className="relative">
            <button
              onClick={() => setSelectedMedia(null)}
              className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            {selectedMedia.type === 'image' ? (
              <img 
                src={selectedMedia.url} 
                alt="Preview"
                className="w-full h-32 object-cover rounded-lg"
              />
            ) : (
              <div className="relative">
                <img 
                  src={selectedMedia.url} 
                  alt="Video preview"
                  className="w-full h-32 object-cover rounded-lg"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Video className="w-8 h-8 text-white" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 max-w-md mx-auto">
        <div className="flex items-end gap-2">
          {/* Media Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-gray-600 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
          >
            <ImageIcon className="w-6 h-6" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleMediaSelect}
            className="hidden"
          />

          {/* Text Input */}
          <div className="flex-1 relative">
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              rows={1}
              className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-full focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
              style={{ maxHeight: '120px' }}
            />
          </div>

          {/* Send Button */}
          <button
            onClick={handleSendMessage}
            disabled={!messageText.trim() && !selectedMedia}
            className="p-3 bg-yellow-500 text-[#0E0E55] rounded-full hover:bg-yellow-400 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            <Send className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}