import { useEffect, useState } from 'react';
import { Auth } from './components/Auth';
import { SportSelection } from './components/SportSelection';
import { WorkoutLogging } from './components/WorkoutLogging';
import { Feed } from './components/Feed';
import { Profile } from './components/Profile';
import { PostCreation } from './components/PostCreation';
import { Exercises } from './components/Exercises';
import { PlanBuilder } from './components/PlanBuilder';
import { CoachApplication } from './components/CoachApplication';
import { CoachMarketplace } from './components/CoachMarketplace';
import { SubscriptionTierBuilder } from './components/SubscriptionTierBuilder';
import { TierComparison } from './components/TierComparison';
import { Navigation } from './components/Navigation';
import { CoachDashboard } from './components/CoachDashboard';
import { WorkoutsHome } from './components/WorkoutsHome';
import { WorkoutSession } from './components/WorkoutSession';
import { AthleteSearch } from './components/AthleteSearch';
import { MessagesWithChannels } from './components/MessagesWithChannels';
import { MessageThread } from './components/MessageThread';
import { ChannelView } from './components/ChannelView';
import { MessagingDemo } from './components/MessagingDemo';
import { PrivacySettings } from './components/PrivacySettings';
import { ProfileSettings } from './components/ProfileSettings';
import { LanguageProvider } from './contexts/LanguageContext';
import { useAuth } from './contexts/AuthContext';
import * as SessionsAPI from './api/sessions';

const SESSION_KEY = 'coachwise-active-session';

export type SportType = 'fitness' | 'climbing';
export type UserRole = 'athlete' | 'coach';
export type UserTier = 'free' | 'pro';
export type ViewType = 'sport-selection' | 'logging' | 'feed' | 'profile' | 'coach-dashboard' | 'post-creation' | 'exercise-builder' | 'plan-builder' | 'coach-application' | 'coach-marketplace' | 'tier-builder' | 'tier-comparison' | 'workouts-home' | 'workout-session' | 'athlete-search' | 'athletes-coaches' | 'messages' | 'message-thread' | 'channel-view' | 'messaging-demo' | 'privacy-settings' | 'profile-settings';

export default function App() {
  const { isAuthenticated, logout, user, tokens } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>('feed');
  const [selectedSport, setSelectedSport] = useState<SportType>('fitness');
  const [userRole, setUserRole] = useState<UserRole>('athlete');
  const [userTier, setUserTier] = useState<UserTier>('free');
  const [isPro, setIsPro] = useState(false); // Track pro status
  const [viewingUserId, setViewingUserId] = useState<string | null>(null); // Track which user profile we're viewing
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null); // Track current message thread
  const [currentChannelId, setCurrentChannelId] = useState<string | null>(null); // Track current channel
  const [messagesActiveTab, setMessagesActiveTab] = useState<'dms' | 'channels'>('dms'); // Track active tab in Messages
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null); // Track active workout session
  const [activePlanId, setActivePlanId] = useState<string | null>(null); // Track active plan
  const [activeScheduleId, setActiveScheduleId] = useState<string | null>(null); // Track active schedule
  const [workoutsRefreshTrigger, setWorkoutsRefreshTrigger] = useState(0); // Trigger refresh after workout

  // Restore active session on mount (survives page refresh)
  useEffect(() => {
    const storedRaw = localStorage.getItem(SESSION_KEY);
    if (storedRaw) {
      try {
        const { planId, scheduleId: storedScheduleId } = JSON.parse(storedRaw);
        setActivePlanId(planId || null);
        setActiveScheduleId(storedScheduleId || null);
        setCurrentView('workout-session');
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      setIsPro(Boolean(user.pro));
    }
  }, [user]);

  const handleLogin = () => {
    if (user?.pro) {
      setIsPro(true);
    }
  };

  const handleViewProfile = (userId: string) => {
    setViewingUserId(userId);
    setCurrentView('profile');
  };

  const handleViewOwnProfile = () => {
    setViewingUserId(null);
    setCurrentView('profile');
  };

  const handleNavigate = (view: string) => {
    if (view === 'profile') {
      setViewingUserId(null);
    }
    // If navigating to workouts while a session is active, resume it
    if (view === 'workouts-home' && localStorage.getItem(SESSION_KEY)) {
      setCurrentView('workout-session');
      return;
    }
    setCurrentView(view as ViewType);
  };

  const handleSportSelect = async (sport: SportType) => {
    setSelectedSport(sport);

    // Create a session for this workout
    if (tokens?.access_token) {
      try {
        const session = await SessionsAPI.createSession(tokens.access_token, {
          session_type: sport === 'fitness' ? 'STRENGTH' : 'CLIMBING',
        });
        setActiveSessionId(session.id);
      } catch (err) {
        console.error('Failed to create session:', err);
      }
    }

    setCurrentView('logging');
  };

  const handlePostCreated = () => {
    setCurrentView('feed');
  };

  const handlePlanSaved = () => {
    setCurrentView('feed');
    alert('Plan saved successfully!');
  };

  const handleCoachApplicationSubmit = () => {
    setCurrentView('profile');
    setUserRole('coach'); // Auto-approve for demo
    alert('Application submitted! You are now a coach! 🎉');
  };

  const handleTierSaved = () => {
    setCurrentView('coach-dashboard');
    alert('Subscription tier saved!');
  };

  const handleSessionEnd = () => {
    localStorage.removeItem(SESSION_KEY);
    setActivePlanId(null);
    setActiveScheduleId(null);
    setCurrentView('workouts-home');
  };

  const renderView = () => {
    switch (currentView) {
      case 'sport-selection':
        return <SportSelection onSelectSport={handleSportSelect} />;
      case 'logging':
        return activeSessionId ? (
          <WorkoutLogging
            sport={selectedSport}
            sessionId={activeSessionId}
            onBack={() => {
              setActiveSessionId(null);
              setCurrentView('feed');
            }}
          />
        ) : (
          <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <p className="text-gray-600">Starting workout session...</p>
          </div>
        );
      case 'feed':
        return <Feed 
          onCreatePost={() => setCurrentView('post-creation')} 
          userRole={userRole}
          onNavigate={handleNavigate}
          onViewProfile={handleViewProfile}
          isPro={isPro}
        />; 
      case 'profile':
        return <Profile 
          userRole={userRole} 
          onNavigate={handleNavigate}
          viewingUserId={viewingUserId}
          onViewProfile={handleViewProfile}
          isPro={isPro}
        />; 
      case 'coach-dashboard':
        return <CoachDashboard 
          onBack={() => setCurrentView('profile')} 
          onNavigate={handleNavigate}
          userRole={userRole}
        />; 
      case 'post-creation':
        return <PostCreation onCancel={() => setCurrentView('feed')} onPost={handlePostCreated} />;
      case 'exercise-builder':
        return <Exercises onBack={() => setCurrentView('plan-builder')} />;
      case 'plan-builder':
        return <PlanBuilder 
          onCancel={() => setCurrentView('workouts-home')} 
          onSave={handlePlanSaved} 
          userRole={userRole} 
          userTier={userTier} 
        />; 
      case 'coach-application':
        return <CoachApplication 
          onCancel={() => setCurrentView('profile')} 
          onSubmit={handleCoachApplicationSubmit} 
        />; 
      case 'coach-marketplace':
        return <CoachMarketplace onBack={() => setCurrentView('profile')} onViewProfile={handleViewProfile} />;
      case 'tier-builder':
        return <SubscriptionTierBuilder onCancel={() => setCurrentView('coach-dashboard')} onSave={handleTierSaved} />;
      case 'tier-comparison':
        return <TierComparison onCancel={() => setCurrentView('coach-marketplace')} coachName="Sarah Martinez" />;
      case 'workouts-home':
        return <WorkoutsHome
          onStartSession={(planId?: string, scheduleId?: string) => {
            setActivePlanId(planId || null);
            setActiveScheduleId(scheduleId || null);
            // Persist so the session survives refresh
            localStorage.setItem(SESSION_KEY, JSON.stringify({ planId: planId || null, scheduleId: scheduleId || null }));
            setCurrentView('workout-session');
          }}
          onCreatePlan={() => setCurrentView('plan-builder')}
          userRole={userRole}
          onNavigate={handleNavigate}
          isPro={isPro}
          refreshTrigger={workoutsRefreshTrigger}
        />;
      case 'workout-session':
        return <WorkoutSession
          planId={activePlanId || undefined}
          scheduleId={activeScheduleId || undefined}
          onBack={() => {
            // Keep activePlanId/activeScheduleId — session is still in progress
            setWorkoutsRefreshTrigger(Date.now());
            setCurrentView('workouts-home');
          }}
          onEndSession={() => {
            handleSessionEnd();
            setWorkoutsRefreshTrigger(Date.now()); // Trigger refresh
          }}
          isPro={isPro}
          onNavigate={handleNavigate}
        />; 
      case 'athlete-search':
        return <AthleteSearch 
          userRole={userRole}
          onNavigate={handleNavigate}
          onViewProfile={handleViewProfile}
        />; 
      case 'messages':
        return <MessagesWithChannels 
          userRole={userRole}
          onNavigate={handleNavigate}
          onViewProfile={handleViewProfile}
          setCurrentConversationId={setCurrentConversationId}
          setCurrentChannelId={setCurrentChannelId}
          activeTab={messagesActiveTab}
          setActiveTab={setMessagesActiveTab}
        />; 
      case 'message-thread':
        // Rendered as overlay below
        return null;
      case 'channel-view':
        // Rendered as overlay below
        return null;
      case 'messaging-demo':
        return <MessagingDemo />;
      case 'privacy-settings':
        return <PrivacySettings onBack={() => setCurrentView('profile')} />;
      case 'profile-settings':
        return <ProfileSettings userRole={userRole} onBack={() => setCurrentView('profile')} />;
      case 'pro-subscription':
        return <ProSubscription onBack={() => setCurrentView('profile')} />;
      case 'claim-ent':
        return <ClaimENT 
          onBack={() => setCurrentView('profile')} 
          onNavigate={handleNavigate}
          userRole={userRole}
          isPro={isPro}
        />;
      default:
        return <Feed onCreatePost={() => setCurrentView('post-creation')} />;
    }
  };

  return (
    <LanguageProvider>
      {!isAuthenticated ? (
        <Auth onLogin={handleLogin} />
      ) : (
        <>
          <div className="min-h-screen bg-gray-100 flex flex-col max-w-md mx-auto">
            {/* Quick Access Menu - For Demo Purposes */}
            <div className="bg-[#0E0E55] p-2">
              <details className="cursor-pointer">
                <summary className="text-xs text-gray-300 font-medium">🚀 Demo Menu</summary>
                <div className="mt-2 grid grid-cols-2 gap-1">
                  <button onClick={() => setCurrentView('messaging-demo')} className="col-span-2 text-xs bg-yellow-500 text-[#0E0E55] p-2 rounded hover:bg-yellow-400 font-bold">
                    💬 See Messaging Inputs Demo
                  </button>
                  <button onClick={() => setCurrentView('feed')} className="text-xs bg-[#1A1A6E] text-gray-200 p-1.5 rounded hover:bg-[#1A1A6E]/80">Feed</button>
                  <button onClick={() => setCurrentView('workouts-home')} className="text-xs bg-[#1A1A6E] text-gray-200 p-1.5 rounded hover:bg-[#1A1A6E]/80">Workouts</button>
                  <button onClick={() => setCurrentView('messages')} className="text-xs bg-[#1A1A6E] text-gray-200 p-1.5 rounded hover:bg-[#1A1A6E]/80">Messages</button>
                  <button onClick={() => setCurrentView('plan-builder')} className="text-xs bg-[#1A1A6E] text-gray-200 p-1.5 rounded hover:bg-[#1A1A6E]/80">Plan Builder</button>
                  <button onClick={() => setCurrentView('exercise-builder')} className="text-xs bg-[#1A1A6E] text-gray-200 p-1.5 rounded hover:bg-[#1A1A6E]/80">Exercise Builder</button>
                  <button onClick={() => setCurrentView('coach-marketplace')} className="text-xs bg-[#1A1A6E] text-gray-200 p-1.5 rounded hover:bg-[#1A1A6E]/80">Find Coach</button>
                  <button onClick={() => setCurrentView('tier-comparison')} className="text-xs bg-[#1A1A6E] text-gray-200 p-1.5 rounded hover:bg-[#1A1A6E]/80">Compare Tiers</button>
                  <button onClick={() => setCurrentView('coach-application')} className="text-xs bg-[#1A1A6E] text-gray-200 p-1.5 rounded hover:bg-[#1A1A6E]/80">Apply as Coach</button>
                  <button onClick={() => setCurrentView('tier-builder')} className="text-xs bg-[#1A1A6E] text-gray-200 p-1.5 rounded hover:bg-[#1A1A6E]/80">Create Tier</button>
                  <button onClick={() => { setUserRole('athlete'); setCurrentView('profile'); }} className="text-xs bg-[#1A1A6E] text-gray-200 p-1.5 rounded hover:bg-[#1A1A6E]/80">User Profile</button>
                  <button onClick={() => { setUserRole('coach'); setCurrentView('profile'); }} className="text-xs bg-[#1A1A6E] text-gray-200 p-1.5 rounded hover:bg-[#1A1A6E]/80">Coach Profile</button>
                  <button onClick={() => { setUserRole('coach'); setCurrentView('coach-dashboard'); }} className="text-xs bg-[#1A1A6E] text-gray-200 p-1.5 rounded hover:bg-[#1A1A6E]/80">Coach Dashboard</button>
                  <button onClick={() => setCurrentView('athlete-search')} className="text-xs bg-[#1A1A6E] text-gray-200 p-1.5 rounded hover:bg-[#1A1A6E]/80">Athletes Search</button>
                  <button onClick={() => setUserTier(userTier === 'free' ? 'pro' : 'free')} className="text-xs bg-yellow-500 text-[#0E0E55] p-1.5 rounded hover:bg-yellow-400">
                    {userTier === 'free' ? '🆓 Free' : '⭐ Pro'}
                  </button>
                  <button onClick={() => setIsPro(!isPro)} className="text-xs bg-yellow-500 text-[#0E0E55] p-1.5 rounded hover:bg-yellow-400">
                    {isPro ? '👑 PRO' : '🔒 FREE'}
                  </button>
                  <button onClick={logout} className="text-xs bg-red-600 text-white p-1.5 rounded hover:bg-red-700">
                    Log Out
                  </button>
                </div>
              </details>
            </div>

            <div className="flex-1 overflow-auto pb-16">
              {renderView()}
            </div>
            <Navigation
              currentView={currentView}
              onNavigate={handleNavigate}
              userRole={userRole}
            />
          </div>

          {/* Render MessageThread and ChannelView as overlays */}
          {currentView === 'message-thread' && (
            <MessageThread 
              conversationId={currentConversationId}
              onBack={() => setCurrentView('messages')}
              onJoinChannel={(channelId) => {
                setCurrentChannelId(channelId);
                setCurrentView('channel-view');
              }}
            />
          )}
          
          {currentView === 'channel-view' && (
            <ChannelView 
              channelId={currentChannelId}
              userRole={userRole}
              onBack={() => {
                setMessagesActiveTab('channels');
                setCurrentView('messages');
              }}
            />
          )}
        </>
      )}
    </LanguageProvider>
  );
}
