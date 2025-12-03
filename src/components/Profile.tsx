import { useState } from 'react';
import { CheckCircle2, Star, Trophy, Users, DollarSign, Menu, X, Bell, Shield, LogOut, Settings, Globe } from 'lucide-react';
import type { UserRole } from '../App';
import { useLanguage } from '../contexts/LanguageContext';
import type { Language } from '../translations';

interface ProfileProps {
  userRole: UserRole;
  onNavigate: (view: string) => void;
}

type TabType = 'posts' | 'records' | 'testimonials';

export function Profile({ userRole, onNavigate }: ProfileProps) {
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t, language, setLanguage, isRTL } = useLanguage();
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  const mockUser = {
    name: 'Jordan Smith',
    username: '@jordansmith',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
    cover: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=300&fit=crop',
    bio: userRole === 'coach' 
      ? 'Certified Strength & Climbing Coach | 10+ years experience | Helping athletes reach their peak performance 🎯'
      : 'Strength athlete & climber | Chasing PRs and new heights 💪🧗',
    stats: {
      followers: 1243,
      following: 456,
      posts: 89,
    },
    isVerified: userRole === 'coach',
    rating: userRole === 'coach' ? 4.8 : undefined,
    reviewCount: userRole === 'coach' ? 127 : undefined,
    certifications: userRole === 'coach' ? ['NSCA-CSCS', 'USAPL Coach', 'USAC Level 2'] : undefined,
    clientCount: userRole === 'coach' ? 45 : undefined,
  };

  const mockPosts = [
    { id: '1', type: 'text', content: 'Great training session today! Hit new PR on squats 🎯' },
    { id: '2', type: 'text', content: 'Remember to prioritize recovery as much as training' },
    { id: '3', type: 'text', content: 'Sent my project route today after 3 weeks!' },
  ];

  const mockRecords = [
    { id: '1', exercise: 'Deadlift', value: '200kg', date: 'Dec 1, 2024' },
    { id: '2', exercise: 'Squat', value: '180kg', date: 'Nov 28, 2024' },
    { id: '3', exercise: 'Bench Press', value: '140kg', date: 'Nov 25, 2024' },
    { id: '4', exercise: 'Boulder', value: 'V7', date: 'Nov 20, 2024' },
    { id: '5', exercise: '5K Run', value: '19:30', date: 'Nov 15, 2024' },
  ];

  const mockTestimonials = [
    { 
      id: '1', 
      client: 'Alex Chen',
      clientAvatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=100&h=100&fit=crop',
      text: 'Best coach I\'ve worked with! Improved my deadlift by 40kg in 6 months.',
      rating: 5,
      date: 'Nov 15, 2024',
      status: 'approved',
      response: 'Thanks Alex! Your dedication made all the difference 💪',
    },
    { 
      id: '2', 
      client: 'Sarah Martinez',
      clientAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
      text: 'Jordan helped me break through my climbing plateau. Highly recommend!',
      rating: 5,
      date: 'Oct 22, 2024',
      status: 'approved',
    },
    {
      id: '3',
      client: 'Mike Johnson',
      clientAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
      text: 'Great programming and communication. Seeing consistent progress!',
      rating: 4,
      date: 'Oct 10, 2024',
      status: 'pending',
    },
  ];

  const coachClients = [
    {
      id: '1',
      name: 'Alice Johnson',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
      plan: 'Monthly',
      nextSession: 'Dec 5, 2024',
    },
    {
      id: '2',
      name: 'Bob Smith',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
      plan: 'Quarterly',
      nextSession: 'Dec 10, 2024',
    },
    {
      id: '3',
      name: 'Charlie Brown',
      avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=100&h=100&fit=crop',
      plan: 'Monthly',
      nextSession: 'Dec 15, 2024',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Hamburger Menu Overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Slide-out Menu */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ${
        isMenuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Menu Header */}
          <div className="bg-[#0E0E55] px-4 py-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white text-lg">{t('menu')}</h2>
              <button 
                onClick={() => setIsMenuOpen(false)}
                className="p-2 hover:bg-[#1A1A6E] rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
            {/* User Info in Menu */}
            <div className="flex items-center gap-3">
              <img 
                src={mockUser.avatar} 
                alt={mockUser.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-white"
              />
              <div>
                <p className="text-white font-medium">{mockUser.name}</p>
                <p className="text-gray-300 text-sm">{mockUser.username}</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {/* Coach-specific actions */}
              {userRole === 'coach' && (
                <>
                  <button 
                    onClick={() => {
                      onNavigate('coach-dashboard');
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 bg-yellow-500 text-[#0E0E55] rounded-lg hover:bg-yellow-400 transition-colors"
                  >
                    <Users className="w-5 h-5" />
                    <span>{t('dashboard')}</span>
                  </button>
                  <button 
                    onClick={() => {
                      onNavigate('tier-builder');
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <DollarSign className="w-5 h-5 text-gray-600" />
                    <span className="text-[#0E0E55]">{t('createSubscriptionTier')}</span>
                  </button>
                  <div className="border-t border-gray-200 my-2"></div>
                </>
              )}

              {/* Athlete-specific action */}
              {userRole !== 'coach' && (
                <>
                  <button 
                    onClick={() => {
                      onNavigate('coach-application');
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 bg-yellow-500 text-[#0E0E55] rounded-lg hover:bg-yellow-400 transition-colors"
                  >
                    <Users className="w-5 h-5" />
                    <span>{t('becomeACoach')}</span>
                  </button>
                  <div className="border-t border-gray-200 my-2"></div>
                </>
              )}

              {/* Common actions */}
              <button 
                onClick={() => {
                  onNavigate('coach-marketplace');
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Users className="w-5 h-5 text-gray-600" />
                <span className="text-[#0E0E55]">{t('findACoach')}</span>
              </button>

              <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="text-[#0E0E55]">{t('notifications')}</span>
              </button>

              <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <Settings className="w-5 h-5 text-gray-600" />
                <span className="text-[#0E0E55]">{t('settings')}</span>
              </button>

              <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <Shield className="w-5 h-5 text-gray-600" />
                <span className="text-[#0E0E55]">{t('privacySecurity')}</span>
              </button>

              {/* Language Selector */}
              <button 
                onClick={() => setShowLanguageSelector(!showLanguageSelector)}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Globe className="w-5 h-5 text-gray-600" />
                <span className="text-[#0E0E55] flex-1">{t('language')}</span>
                <span className="text-gray-500 text-sm">{language === 'en' ? 'EN' : 'فا'}</span>
              </button>

              {showLanguageSelector && (
                <div className="bg-gray-50 rounded-lg p-2 space-y-1">
                  <button
                    onClick={() => {
                      setLanguage('en');
                      setShowLanguageSelector(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded transition-colors ${
                      language === 'en' ? 'bg-yellow-500 text-[#0E0E55]' : 'hover:bg-gray-200 text-[#0E0E55]'
                    }`}
                  >
                    {t('english')}
                  </button>
                  <button
                    onClick={() => {
                      setLanguage('fa');
                      setShowLanguageSelector(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded transition-colors ${
                      language === 'fa' ? 'bg-yellow-500 text-[#0E0E55]' : 'hover:bg-gray-200 text-[#0E0E55]'
                    }`}
                  >
                    {t('persian')}
                  </button>
                </div>
              )}

              <div className="border-t border-gray-200 my-2"></div>

              <button className="w-full flex items-center gap-3 p-3 hover:bg-red-50 rounded-lg transition-colors text-red-600">
                <LogOut className="w-5 h-5" />
                <span>{t('logOut')}</span>
              </button>
            </div>
          </div>

          {/* Menu Footer */}
          <div className="p-4 border-t border-gray-200">
            <p className="text-gray-600 text-xs text-center">Coachwise v1.0.0</p>
          </div>
        </div>
      </div>

      {/* Cover Photo */}
      <div className="relative">
        <img 
          src={mockUser.cover} 
          alt="Cover"
          className="w-full h-32 object-cover"
        />
        <button 
          onClick={() => setIsMenuOpen(true)}
          className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur rounded-full hover:bg-white transition-colors shadow-lg"
        >
          <Menu className="w-5 h-5 text-[#0E0E55]" />
        </button>
      </div>

      {/* Profile Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 pt-0 pb-4">
          {/* Avatar */}
          <div className="relative -mt-12 mb-3">
            <img 
              src={mockUser.avatar} 
              alt={mockUser.name}
              className="w-24 h-24 rounded-full object-cover border-4 border-white"
            />
            {mockUser.isVerified && (
              <div className="absolute bottom-0 right-0 bg-yellow-500 rounded-full p-1 border-2 border-white">
                <CheckCircle2 className="w-5 h-5 text-[#0E0E55]" />
              </div>
            )}
          </div>

          {/* Name & Bio */}
          <div className="mb-4">
            <h2 className="text-[#0E0E55] mb-1">{mockUser.name}</h2>
            <p className="text-gray-600 mb-2">{mockUser.username}</p>
            
            {/* Coach Rating */}
            {userRole === 'coach' && mockUser.rating && (
              <div className="flex items-center gap-4 mb-2">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <span className="text-[#0E0E55]">{mockUser.rating}</span>
                  <span className="text-gray-600 text-sm">({mockUser.reviewCount} reviews)</span>
                </div>
                <span className="text-gray-600 text-sm">{mockUser.clientCount} clients</span>
              </div>
            )}

            <p className="text-gray-700 mb-3">{mockUser.bio}</p>

            {/* Certifications */}
            {userRole === 'coach' && mockUser.certifications && (
              <div className="flex flex-wrap gap-2 mb-3">
                {mockUser.certifications.map((cert, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs"
                  >
                    {cert}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="bg-white rounded-lg p-4 text-center shadow-md border border-gray-200">
              <div className="text-2xl text-[#0E0E55]">42</div>
              <div className="text-gray-600 text-xs">{t('workouts')}</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center shadow-md border border-gray-200">
              <div className="text-2xl text-[#0E0E55]">156</div>
              <div className="text-gray-600 text-xs">{t('hours')}</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center shadow-md border border-gray-200">
              <div className="text-2xl text-[#0E0E55]">8</div>
              <div className="text-gray-600 text-xs">{t('prs')}</div>
            </div>
          </div>

          {/* Action Button */}
          <button className="w-full bg-yellow-500 text-[#0E0E55] py-3 rounded-lg hover:bg-yellow-400 transition-colors">
            {t('editProfile')}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-gray-200">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 py-3 text-center transition-colors ${
              activeTab === 'posts' 
                ? 'text-yellow-600 border-b-2 border-yellow-500' 
                : 'text-gray-600'
            }`}
          >
            {t('posts')}
          </button>
          {userRole === 'athlete' && (
            <button
              onClick={() => setActiveTab('records')}
              className={`flex-1 py-3 text-center transition-colors ${
                activeTab === 'records' 
                  ? 'text-yellow-600 border-b-2 border-yellow-500' 
                  : 'text-gray-600'
              }`}
            >
              {t('records')}
            </button>
          )}
          {userRole === 'coach' && (
            <button
              onClick={() => setActiveTab('testimonials')}
              className={`flex-1 py-3 text-center transition-colors ${
                activeTab === 'testimonials' 
                  ? 'text-yellow-600 border-b-2 border-yellow-500' 
                  : 'text-gray-600'
              }`}
            >
              {t('testimonials')}
            </button>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4 space-y-4">
        {activeTab === 'posts' && (
          <div className="space-y-3">
            {mockPosts.map(post => (
              <div key={post.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-gray-800">{post.content}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'records' && (
          <div className="bg-white rounded-lg shadow-md p-5 border border-gray-200">
            <h3 className="text-[#0E0E55] mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-600" />
              <span>Personal Records</span>
            </h3>
            <div className="space-y-3">
              {mockRecords.map((pr) => (
                <div key={pr.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-[#0E0E55]">{pr.exercise}</div>
                    <div className="text-gray-600 text-sm">{pr.date}</div>
                  </div>
                  <div className="text-yellow-600">{pr.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'testimonials' && (
          <div className="space-y-3">
            {mockTestimonials.map(testimonial => (
              <div key={testimonial.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-3">
                  <img
                    src={testimonial.clientAvatar}
                    alt={testimonial.client}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[#0E0E55]">{testimonial.client}</span>
                      {testimonial.status === 'pending' && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">
                          Pending
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < testimonial.rating
                              ? 'text-yellow-500 fill-yellow-500'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-gray-700 mb-2">{testimonial.text}</p>
                    
                    {/* Coach Response */}
                    {testimonial.response && (
                      <div className="mt-3 pl-4 border-l-2 border-yellow-500 bg-yellow-50 p-3 rounded">
                        <p className="text-[#0E0E55] text-sm mb-1">Your response:</p>
                        <p className="text-gray-700 text-sm">{testimonial.response}</p>
                      </div>
                    )}

                    {/* Pending Actions */}
                    {testimonial.status === 'pending' && (
                      <div className="mt-3 flex gap-2">
                        <button className="flex-1 py-2 bg-yellow-500 text-[#0E0E55] rounded-lg hover:bg-yellow-400 transition-colors text-sm">
                          Approve
                        </button>
                        <button className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm">
                          Reject
                        </button>
                      </div>
                    )}

                    {/* Response Button */}
                    {testimonial.status === 'approved' && !testimonial.response && (
                      <button className="mt-3 text-yellow-600 hover:text-yellow-700 text-sm">
                        Respond publicly
                      </button>
                    )}

                    <div className="text-gray-500 text-xs mt-2">{testimonial.date}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Coach-specific sections */}
        {userRole === 'coach' && (
          <>
            {/* Active Clients */}
            <div className="bg-white rounded-lg shadow-md p-5 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[#0E0E55] flex items-center gap-2">
                  <Users className="w-5 h-5 text-yellow-600" />
                  <span>Active Clients</span>
                </h3>
                <span className="px-3 py-1 bg-yellow-500 text-[#0E0E55] rounded-lg text-sm">
                  {coachClients.length}
                </span>
              </div>
              <div className="space-y-3">
                {coachClients.map((client) => (
                  <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <img
                        src={client.avatar}
                        alt={client.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <div className="text-[#0E0E55]">{client.name}</div>
                        <div className="text-gray-600 text-sm">{client.plan}</div>
                      </div>
                    </div>
                    <span className="text-gray-600 text-sm">{client.nextSession}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue Stats */}
            <div className="bg-yellow-500 rounded-lg shadow-lg p-5">
              <h3 className="text-[#0E0E55] mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#0E0E55]" />
                <span>Monthly Revenue</span>
              </h3>
              <div className="text-4xl text-[#0E0E55] mb-2">$2,840</div>
              <p className="text-[#0E0E55]/80 text-sm">From {coachClients.length} active subscriptions</p>
              <div className="mt-4 pt-4 border-t border-[#0E0E55]/20">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#0E0E55]/80">Avg. per client</span>
                  <span className="text-[#0E0E55]">$473</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}