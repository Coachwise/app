import { useState, useRef } from 'react';
import { ArrowLeft, Send, Image as ImageIcon, X, Video, Play, Users, Link as LinkIcon, UserPlus, Hash, Copy, Check, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import type { UserRole } from '../App';

interface ChannelViewProps {
  channelId: string | null;
  userRole: UserRole;
  onBack: () => void;
}

interface ChannelMessage {
  id: string;
  text: string;
  timestamp: string;
  mediaType?: 'image' | 'video';
  mediaUrl?: string;
  videoThumbnail?: string;
}

interface ChannelMember {
  id: string;
  name: string;
  avatar: string;
  joinedDate: string;
}

interface ChannelInfo {
  id: string;
  name: string;
  description: string;
  coachId: string;
  coachName: string;
  coachAvatar: string;
  memberCount: number;
  isOwner: boolean;
}

export function ChannelView({ channelId, userRole, onBack }: ChannelViewProps) {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [messageText, setMessageText] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<{ type: 'image' | 'video', url: string } | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const [showInviteLink, setShowInviteLink] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // Mock channel data
  const [channelInfo] = useState<ChannelInfo>({
    id: channelId || 'channel-1',
    name: 'Strength Training Tips',
    description: 'Daily tips and motivation for strength training',
    coachId: 'coach-sarah',
    coachName: 'Sarah Martinez',
    coachAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    memberCount: 24,
    isOwner: userRole === 'coach',
  });

  const [messages, setMessages] = useState<ChannelMessage[]>([
    {
      id: '1',
      text: 'Welcome to the Strength Training Tips channel! 💪',
      timestamp: '2 days ago',
    },
    {
      id: '2',
      text: 'Tip #1: Always warm up before heavy lifting. 5-10 minutes of light cardio and dynamic stretching can prevent injuries.',
      timestamp: '1 day ago',
    },
    {
      id: '3',
      text: 'Check out this perfect squat form tutorial',
      timestamp: '12h ago',
      mediaType: 'video',
      mediaUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=400&fit=crop',
      videoThumbnail: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=400&fit=crop',
    },
    {
      id: '4',
      text: 'Remember: Progressive overload is key to muscle growth! Increase weight, reps, or sets gradually over time.',
      timestamp: '1h ago',
    },
  ]);

  const [members] = useState<ChannelMember[]>([
    {
      id: '1',
      name: 'Mike Chen',
      avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=100&h=100&fit=crop',
      joinedDate: '2 weeks ago',
    },
    {
      id: '2',
      name: 'Emma Wilson',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      joinedDate: '1 week ago',
    },
    {
      id: '3',
      name: 'John Davis',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
      joinedDate: '5 days ago',
    },
  ]);

  const inviteLink = `coachwise://join-channel/${channelInfo.id}`;

  const handleSendMessage = () => {
    if (!channelInfo.isOwner) return; // Only coach can send
    if (!messageText.trim() && !selectedMedia) return;

    const newMessage: ChannelMessage = {
      id: Date.now().toString(),
      text: messageText,
      timestamp: 'Just now',
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

    const previewUrl = URL.createObjectURL(file);
    setSelectedMedia({ type: fileType, url: previewUrl });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && channelInfo.isOwner) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleSendInviteToClient = (clientId: string) => {
    // This would send the invite link as a DM to the selected client
    alert(`Invite link sent to client's DM!`);
    setShowInviteLink(false);
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessages(messages.filter(msg => msg.id !== messageId));
  };

  const handleEditMessage = (messageId: string) => {
    const message = messages.find(msg => msg.id === messageId);
    if (message) {
      setEditingMessageId(messageId);
      setEditText(message.text);
    }
  };

  const handleSaveEdit = () => {
    if (!editingMessageId) return;
    setMessages(messages.map(msg => msg.id === editingMessageId ? { ...msg, text: editText } : msg));
    setEditingMessageId(null);
    setEditText('');
  };

  return (
    <div className="fixed inset-0 bg-gray-100 flex flex-col z-50 max-w-md mx-auto">
      {/* Header */}
      <div className="bg-[#0E0E55] px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-2">
          <button 
            onClick={onBack}
            className="p-2 -ml-2 hover:bg-[#1A1A6E] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          
          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
            <Hash className="w-6 h-6 text-yellow-600" />
          </div>
          
          <div className="flex-1">
            <h2 className="text-white">{channelInfo.name}</h2>
            <p className="text-gray-300 text-xs flex items-center gap-2">
              <Users className="w-3 h-3" />
              {t('membersCount', { count: channelInfo.memberCount })}
            </p>
          </div>

          {/* Members & Invite Buttons */}
          <div className="flex gap-2">
            {channelInfo.isOwner && (
              <button
                onClick={() => setShowInviteLink(!showInviteLink)}
                className="p-2 bg-yellow-500 text-[#0E0E55] rounded-lg hover:bg-yellow-400 transition-colors"
              >
                <UserPlus className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => setShowMembers(!showMembers)}
              className="p-2 bg-[#1A1A6E] text-white rounded-lg hover:bg-[#2A2A8E] transition-colors"
            >
              <Users className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Channel Description */}
        <div className="bg-[#1A1A6E] rounded-lg px-3 py-2 mb-2">
          <p className="text-gray-300 text-sm">{channelInfo.description}</p>
        </div>

        {/* Channel Info Banner */}
        <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg px-3 py-2">
          <p className="text-yellow-100 text-xs">
            {t('onlyCanPost', { coach: channelInfo.coachName })}
          </p>
        </div>
      </div>

      {/* Invite Link Modal */}
      {showInviteLink && (
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[#0E0E55]">{t('inviteMembers')}</h3>
            <button
              onClick={() => setShowInviteLink(false)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-700 mb-2">{t('inviteLink')}</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inviteLink}
                  readOnly
                  className="flex-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm"
                />
                <button
                  onClick={handleCopyInviteLink}
                  className="px-4 py-2 bg-[#0E0E55] text-white rounded-lg hover:bg-[#1A1A6E] transition-colors flex items-center gap-2"
                >
                  {linkCopied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span className="text-sm">{t('copied')}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span className="text-sm">{t('copy')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-3">
              <p className="text-sm text-gray-700 mb-2">{t('sendInviteToClients')}</p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {['Mike Chen', 'Emma Wilson', 'John Davis'].map((client, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendInviteToClient(`client-${idx}`)}
                    className="w-full flex items-center justify-between p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <span className="text-sm text-gray-900">{client}</span>
                    <Send className="w-4 h-4 text-yellow-600" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Members List Modal */}
      {showMembers && (
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[#0E0E55]">{t('channelMembers', { count: members.length })}</h3>
            <button
              onClick={() => setShowMembers(false)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Coach */}
          <div className="mb-3 pb-3 border-b border-gray-200">
            <div className="flex items-center gap-3 p-2">
              <img 
                src={channelInfo.coachAvatar} 
                alt={channelInfo.coachName}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1">
                <p className="text-gray-900">{channelInfo.coachName}</p>
                <p className="text-xs text-gray-500">{t('channelOwnerCoach')}</p>
              </div>
              <span className="px-2 py-1 bg-yellow-500 text-[#0E0E55] rounded text-xs">
                {t('owner')}
              </span>
            </div>
          </div>

          {/* Members */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                <img 
                  src={member.avatar} 
                  alt={member.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <p className="text-gray-900">{member.name}</p>
                  <p className="text-xs text-gray-500">{t('joinedDate', { date: member.joinedDate })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {messages.map((message) => (
          <div key={message.id} className="flex gap-3 group relative">
            <img 
              src={channelInfo.coachAvatar} 
              alt={channelInfo.coachName}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-[#0E0E55]">{channelInfo.coachName}</span>
                <span className="px-2 py-0.5 bg-yellow-500 text-[#0E0E55] rounded text-xs">
                  {t('coachBadge')}
                </span>
                <span className="text-xs text-gray-500">{message.timestamp}</span>
                
                {/* Edit/Delete Menu for Channel Owner */}
                {channelInfo.isOwner && editingMessageId !== message.id && (
                  <>
                    <button
                      onClick={() => setSelectedMessageId(selectedMessageId === message.id ? null : message.id)}
                      className="ml-auto p-1.5 bg-gray-200 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-600" />
                    </button>
                    
                    {/* Options Menu */}
                    {selectedMessageId === message.id && (
                      <div className="absolute right-0 top-0 bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-20">
                        <button
                          onClick={() => {
                            handleEditMessage(message.id);
                            setSelectedMessageId(null);
                          }}
                          className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors text-left"
                        >
                          <Edit2 className="w-4 h-4 text-[#0E0E55]" />
                          <span className="text-sm text-gray-900">{t('edit')}</span>
                        </button>
                        <button
                          onClick={() => {
                            handleDeleteMessage(message.id);
                            setSelectedMessageId(null);
                          }}
                          className="flex items-center gap-2 w-full px-3 py-2 hover:bg-red-50 rounded-lg transition-colors text-left"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                          <span className="text-sm text-red-500">{t('delete')}</span>
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
              
              {editingMessageId === message.id ? (
                /* Edit Mode */
                <div className="bg-white rounded-lg p-3 border-2 border-yellow-500">
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
                      {t('save')}
                    </button>
                    <button
                      onClick={() => {
                        setEditingMessageId(null);
                        setEditText('');
                      }}
                      className="flex-1 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                    >
                      {t('cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                /* Normal Message Display */
                <div className="bg-white rounded-lg rounded-tl-sm p-3 shadow-sm">
                  {/* Media Content */}
                  {message.mediaType === 'image' && message.mediaUrl && (
                    <div className="mb-2">
                      <img 
                        src={message.mediaUrl} 
                        alt={t('sharedMedia')}
                        className="rounded-lg max-w-full h-auto"
                      />
                    </div>
                  )}
                  
                  {message.mediaType === 'video' && message.videoThumbnail && (
                    <div className="mb-2 relative">
                      <img 
                        src={message.videoThumbnail} 
                        alt={t('videoThumbnailAlt')}
                        className="rounded-lg max-w-full h-auto"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                          <Play className="w-6 h-6 text-[#0E0E55] ml-1" />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Text Content */}
                  {message.text && (
                    <p className="text-gray-900 whitespace-pre-wrap break-words">{message.text}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Media Preview */}
      {selectedMedia && channelInfo.isOwner && (
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
                alt={t('previewAlt')}
                className="w-full h-32 object-cover rounded-lg"
              />
            ) : (
              <div className="relative">
                <img 
                  src={selectedMedia.url} 
                  alt={t('videoPreviewAlt')}
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

      {/* Input Area - Only for Coach */}
      {channelInfo.isOwner && (
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
                placeholder={t('broadcastPlaceholder')}
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
      )}

      {/* Read-Only Notice for Non-Owners */}
      {!channelInfo.isOwner && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#0E0E55] p-4 max-w-md mx-auto">
          <p className="text-white text-center text-sm">
            {t('onlyCanPost', { coach: channelInfo.coachName })}
          </p>
        </div>
      )}
    </div>
  );
}