import { useState } from 'react';
import { Camera, MapPin, Calendar, Trophy, Star, CheckCircle2, UserPlus, UserCheck, Edit2, DollarSign, Users, Check } from 'lucide-react';
import type { UserRole } from '../App';
import { useLanguage } from '../contexts/LanguageContext';
import { FollowersModal } from './FollowersModal';
import { HamburgerMenu } from './HamburgerMenu';

interface ProfileProps {
  userRole: UserRole;
  onNavigate: (view: string) => void;
  viewingUserId?: string | null;
  onViewProfile?: (userId: string) => void;
}

type TabType = 'posts' | 'records' | 'testimonials' | 'subscription';
type FollowModalMode = 'followers' | 'following' | null;

export function Profile({ userRole, onNavigate, viewingUserId = null, onViewProfile }: ProfileProps) {
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const { t, language, setLanguage, isRTL } = useLanguage();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followModalMode, setFollowModalMode] = useState<FollowModalMode>(null);
  const [followersCount, setFollowersCount] = useState(1243);
  
  // Determine if viewing own profile
  const isOwnProfile = viewingUserId === null;

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
      {/* Cover Photo */}
      <div className="relative">
        <img 
          src={mockUser.cover} 
          alt="Cover"
          className="w-full h-32 object-cover"
        />
        <div className="absolute top-4 right-4">
          <HamburgerMenu 
            userRole={userRole}
            onNavigate={onNavigate}
            userName={mockUser.name}
            userAvatar={mockUser.avatar}
            userUsername={mockUser.username}
          />
        </div>
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
            <button
              onClick={() => setFollowModalMode('followers')}
              className="bg-white rounded-lg p-4 text-center shadow-md border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="text-2xl text-[#0E0E55]">{followersCount.toLocaleString()}</div>
              <div className="text-gray-600 text-xs">{t('followers')}</div>
            </button>
            <button
              onClick={() => setFollowModalMode('following')}
              className="bg-white rounded-lg p-4 text-center shadow-md border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="text-2xl text-[#0E0E55]">{mockUser.stats.following}</div>
              <div className="text-gray-600 text-xs">{t('following')}</div>
            </button>
            <div className="bg-white rounded-lg p-4 text-center shadow-md border border-gray-200">
              <div className="text-2xl text-[#0E0E55]">{mockUser.stats.posts}</div>
              <div className="text-gray-600 text-xs">{t('posts')}</div>
            </div>
          </div>

          {/* Action Button */}
          {isOwnProfile ? (
            <button 
              onClick={() => onNavigate?.('profile-settings')}
              className="w-full bg-yellow-500 text-[#0E0E55] py-3 rounded-lg hover:bg-yellow-400 transition-colors"
            >
              {t('editProfile')}
            </button>
          ) : (
            <button 
              onClick={() => {
                setIsFollowing(!isFollowing);
                setFollowersCount(prev => isFollowing ? prev - 1 : prev + 1);
              }}
              className={`w-full py-3 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                isFollowing
                  ? 'bg-gray-200 text-[#0E0E55] hover:bg-gray-300'
                  : 'bg-yellow-500 text-[#0E0E55] hover:bg-yellow-400'
              }`}
            >
              {isFollowing ? (
                <>
                  <UserCheck className="w-5 h-5" />
                  <span>{t('following')}</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  <span>{t('follow')}</span>
                </>
              )}
            </button>
          )}
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
          {/* Only show subscription tab for coaches when viewing someone else's profile */}
          {userRole === 'coach' && !isOwnProfile && (
            <button
              onClick={() => setActiveTab('subscription')}
              className={`flex-1 py-3 text-center transition-colors ${
                activeTab === 'subscription' 
                  ? 'text-yellow-600 border-b-2 border-yellow-500' 
                  : 'text-gray-600'
              }`}
            >
              {t('subscription')}
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

        {/* Subscription Plans Tab */}
        {activeTab === 'subscription' && (
          <div className="space-y-4">
            {/* Header */}
            <div className="bg-[#0E0E55] rounded-lg p-6 text-center">
              <h3 className="text-white text-xl mb-2">Subscription Plans</h3>
              <p className="text-gray-300 text-sm">Choose the perfect plan for your fitness journey</p>
            </div>

            {/* Subscription Tiers */}
            <div className="space-y-4">
              {/* Basic Tier */}
              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-[#0E0E55] text-xl mb-1">Basic</h4>
                    <p className="text-gray-600 text-sm">Perfect for beginners</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl text-[#0E0E55]">$30</div>
                    <div className="text-gray-600 text-sm">/month</div>
                  </div>
                </div>

                <ul className="space-y-2 mb-4">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">1 workout plan per month</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Monthly check-ins</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Email support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Basic progress tracking</span>
                  </li>
                </ul>

                {!isOwnProfile && (
                  <button 
                    onClick={() => onNavigate?.('tier-comparison')}
                    className="w-full bg-yellow-500 text-[#0E0E55] py-3 rounded-lg hover:bg-yellow-400 transition-colors"
                  >
                    Subscribe
                  </button>
                )}
              </div>

              {/* Pro Tier - Most Popular */}
              <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-yellow-500 relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-yellow-500 text-[#0E0E55] px-4 py-1 rounded-full text-sm">
                    Most Popular
                  </span>
                </div>

                <div className="flex items-start justify-between mb-4 mt-2">
                  <div>
                    <h4 className="text-[#0E0E55] text-xl mb-1">Pro</h4>
                    <p className="text-gray-600 text-sm">For serious athletes</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl text-[#0E0E55]">$60</div>
                    <div className="text-gray-600 text-sm">/month</div>
                  </div>
                </div>

                <ul className="space-y-2 mb-4">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">3 workout plans per month</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Weekly check-ins</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Video form analysis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Nutrition guides</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Priority support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Custom programming</span>
                  </li>
                </ul>

                {!isOwnProfile && (
                  <button 
                    onClick={() => onNavigate?.('tier-comparison')}
                    className="w-full bg-yellow-500 text-[#0E0E55] py-3 rounded-lg hover:bg-yellow-400 transition-colors"
                  >
                    Subscribe
                  </button>
                )}
              </div>

              {/* Elite Tier */}
              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-[#0E0E55] text-xl mb-1">Elite</h4>
                    <p className="text-gray-600 text-sm">Maximum support</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl text-[#0E0E55]">$100</div>
                    <div className="text-gray-600 text-sm">/month</div>
                  </div>
                </div>

                <ul className="space-y-2 mb-4">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Unlimited workout plans</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Daily check-ins</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">1-on-1 video calls (2x/month)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Competition prep planning</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Nutrition macro tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Everything in Pro</span>
                  </li>
                </ul>

                {!isOwnProfile && (
                  <button 
                    onClick={() => onNavigate?.('tier-comparison')}
                    className="w-full bg-yellow-500 text-[#0E0E55] py-3 rounded-lg hover:bg-yellow-400 transition-colors"
                  >
                    Subscribe
                  </button>
                )}
              </div>
            </div>

            {/* Trial Info */}
            {!isOwnProfile && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-[#0E0E55] text-center text-sm">
                  ✨ All plans include a 7-day free trial!
                </p>
              </div>
            )}
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

      {/* Followers/Following Modal */}
      <FollowersModal
        isOpen={followModalMode !== null}
        onClose={() => setFollowModalMode(null)}
        mode={followModalMode || 'followers'}
        userId={viewingUserId || 'current'}
        onViewProfile={onViewProfile}
      />
    </div>
  );
}