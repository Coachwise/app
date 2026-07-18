import { useEffect, useRef, useState } from 'react';
import { Auth } from './components/Auth';
import { Onboarding } from './components/Onboarding';
import { Wallet } from './components/Wallet';
import { ProSubscription } from './components/ProSubscription';
import { ClaimENT } from './components/ClaimENT';
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
import { TestBuilder } from './components/TestBuilder';
import { AthleteTests } from './components/AthleteTests';
import { RunAssessment } from './components/RunAssessment';
import { AssessmentHistory } from './components/AssessmentHistory';
import { Notifications } from './components/Notifications';
import { WorkoutsHome } from './components/WorkoutsHome';
import { WorkoutSession } from './components/WorkoutSession';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { AthleteSearch } from './components/AthleteSearch';
import { MessagesWithChannels } from './components/MessagesWithChannels';
import { MessageThread } from './components/MessageThread';
import { ChannelView } from './components/ChannelView';
import { PrivacySettings } from './components/PrivacySettings';
import { ProfileSettings } from './components/ProfileSettings';
import { About } from './components/About';
import { Support } from './components/Support';
import { LanguageProvider } from './contexts/LanguageContext';
import { useAuth } from './contexts/AuthContext';
import * as SessionsAPI from './api/sessions';
import { FEATURES } from './config';
import { setReportView } from './lib/report';
import { initAudio } from './lib/sound';

const SESSION_KEY = 'coachwise-active-session';
// Where the app lands after login / when returning "home". Feed can be hidden
// for a release via FEATURES.feed — fall back to the workouts screen then.
const DEFAULT_VIEW: ViewType = FEATURES.feed ? 'feed' : 'workouts-home';

export type SportType = 'fitness' | 'climbing';
export type UserRole = 'athlete' | 'coach';
export type UserTier = 'free' | 'pro';
export type ViewType = 'sport-selection' | 'logging' | 'feed' | 'profile' | 'coach-dashboard' | 'post-creation' | 'exercise-builder' | 'plan-builder' | 'coach-application' | 'coach-marketplace' | 'tier-builder' | 'tier-comparison' | 'test-builder' | 'athlete-tests' | 'assessment-run' | 'assessment-history' | 'workouts-home' | 'workout-session' | 'analytics' | 'athlete-search' | 'athletes-coaches' | 'messages' | 'message-thread' | 'channel-view' | 'privacy-settings' | 'profile-settings' | 'notifications' | 'wallet' | 'about' | 'support';

export default function App() {
  const { isAuthenticated, user, tokens, refreshUser } = useAuth();
  // A freshly signed-up (typically phone) account has no name yet — gate the app
  // behind a one-time profile step until they've set one.
  const needsOnboarding = Boolean(user && !user.first_name);
  const [currentView, setCurrentView] = useState<ViewType>(DEFAULT_VIEW);
  const [selectedSport, setSelectedSport] = useState<SportType>('fitness');
  const [userRole, setUserRole] = useState<UserRole>('athlete');
  const [userTier, setUserTier] = useState<UserTier>('free');
  const [isPro, setIsPro] = useState(false); // Track pro status
  const [viewingUserId, setViewingUserId] = useState<string | null>(null); // Track which user profile we're viewing
  const [profileReturnView, setProfileReturnView] = useState<ViewType>(DEFAULT_VIEW); // Where "back" returns from a viewed profile
  const [discoveryTab, setDiscoveryTab] = useState<'discover' | 'network' | 'requests'>('discover'); // Persist Discovery tab across profile visits
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null); // Track current message thread
  const [currentChannelId, setCurrentChannelId] = useState<string | null>(null); // Track current channel
  const [messagesActiveTab, setMessagesActiveTab] = useState<'dms' | 'channels'>('dms'); // Track active tab in Messages
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null); // Track active workout session
  const [activePlanId, setActivePlanId] = useState<string | null>(null); // Track active plan
  const [builderPlanId, setBuilderPlanId] = useState<string | null>(null); // Plan opened in the builder for view/edit (null = create)
  const [builderPackageId, setBuilderPackageId] = useState<string | null>(null); // Package opened in the tier builder for edit (null = create)
  const [builderTestId, setBuilderTestId] = useState<string | null>(null); // Test opened in the test builder for edit (null = create)
  const [builderReturnView, setBuilderReturnView] = useState<ViewType>('coach-dashboard'); // where the test builder returns on save/cancel
  const [protocolId, setProtocolId] = useState<string | null>(null); // protocol being run / viewed in history
  const [historyAthleteId, setHistoryAthleteId] = useState<string | null>(null); // when a coach views a client's run history
  const [historyClientName, setHistoryClientName] = useState<string | null>(null);
  const [historyReturnView, setHistoryReturnView] = useState<ViewType>('athlete-tests'); // where assessment history returns
  const [analyticsAthleteId, setAnalyticsAthleteId] = useState<string | null>(null); // when a coach views a client's analytics
  const [analyticsClientName, setAnalyticsClientName] = useState<string | null>(null);
  const [coachSection, setCoachSection] = useState('clients'); // coach dashboard active tab (persists across navigation)
  const [notifReturnView, setNotifReturnView] = useState<ViewType>(DEFAULT_VIEW); // where notifications returns on back
  const [supportTicketId, setSupportTicketId] = useState<string | null>(null); // set when a notification deep-links into a ticket
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
        // Don't force back into the session — WorkoutsHome shows a resume banner.
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }
  }, []);

  const landedRef = useRef(false);
  useEffect(() => {
    if (user) {
      const coach = Boolean(user.is_coach);
      setUserRole(coach ? 'coach' : 'athlete');
      // Coaches are Pro by default (the backend also reports pro=true for them).
      const pro = Boolean(user.pro) || coach;
      setIsPro(pro);
      setUserTier(pro ? 'pro' : 'free');
      // Landing (once): coaches start on their dashboard, athletes on trainings
      // (the DEFAULT_VIEW). Skip if a view is already set (e.g. session restore).
      if (!landedRef.current) {
        landedRef.current = true;
        if (coach) setCurrentView((prev) => (prev === DEFAULT_VIEW ? 'coach-dashboard' : prev));
      }
    }
  }, [user]);

  // Start each page at the top — otherwise scroll carried over from a long list
  // (e.g. Discovery) clips the top of the next view (cover/avatar on profiles).
  useEffect(() => {
    window.scrollTo(0, 0);
    const scroller = document.querySelector('.overflow-auto');
    if (scroller) scroller.scrollTop = 0;
    // Tell the crash reporter which screen we're on, so an alert can name it.
    setReportView(currentView);
  }, [currentView, viewingUserId]);

  // Unlock audio on the first interaction so the guided-workout countdown beeps
  // can play later (even hands-off), since browsers gate audio behind a gesture.
  useEffect(() => {
    const unlock = () => initAudio();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  const handleLogin = () => {
    if (user?.pro) {
      setIsPro(true);
    }
  };

  const handleViewProfile = (userId: string) => {
    // Remember where we came from so the profile's back button can return there.
    setCurrentView((prev) => {
      if (prev !== 'profile') setProfileReturnView(prev);
      return 'profile';
    });
    setViewingUserId(userId);
  };

  const handleViewOwnProfile = () => {
    setViewingUserId(null);
    setCurrentView('profile');
  };

  const handleNavigate = (view: string) => {
    if (view === 'profile') {
      setViewingUserId(null);
    }
    // Opening support from the menu means the ticket list, not whatever thread a
    // notification deep-linked to earlier.
    if (view === 'support') {
      setSupportTicketId(null);
    }
    // The Analytics bottom-nav tab always shows the user's own analytics, not a
    // client a coach was last looking at.
    if (view === 'analytics') {
      setAnalyticsAthleteId(null);
      setAnalyticsClientName(null);
    }
    // Remember where we opened notifications from, so "back" returns there.
    if (view === 'notifications') {
      setCurrentView((prev) => { if (prev !== 'notifications') setNotifReturnView(prev); return 'notifications'; });
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
    setCurrentView(DEFAULT_VIEW);
  };

  const handlePlanSaved = () => {
    setCurrentView(DEFAULT_VIEW);
    alert('Plan saved successfully!');
  };

  const handleCoachApplicationSubmit = () => {
    // The application is submitted as PENDING — the CoachApplication screen shows
    // its status. Coach access is granted later when it's approved (via the
    // Discord capability link), reflected by the user's is_coach flag.
  };

  const handleTierSaved = () => {
    setBuilderPackageId(null);
    setCurrentView('coach-dashboard');
  };

  const handleSessionEnd = () => {
    localStorage.removeItem(SESSION_KEY);
    setActivePlanId(null);
    setActiveScheduleId(null);
    setCurrentView('workouts-home');
  };

  // Re-enter an in-progress session WITHOUT rewriting SESSION_KEY (keeps its
  // sessionId so WorkoutSession resumes rather than creating a new session).
  const handleResumeSession = () => {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return;
    try {
      const { planId, scheduleId } = JSON.parse(raw);
      setActivePlanId(planId || null);
      setActiveScheduleId(scheduleId || null);
      setCurrentView('workout-session');
    } catch {
      localStorage.removeItem(SESSION_KEY);
    }
  };

  // Abandon the in-progress session and clear it.
  const handleDiscardSession = async () => {
    const raw = localStorage.getItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
    setActivePlanId(null);
    setActiveScheduleId(null);
    setWorkoutsRefreshTrigger(Date.now());
    if (raw && tokens?.access_token) {
      try {
        const { sessionId } = JSON.parse(raw);
        if (sessionId) await SessionsAPI.updateSession(tokens.access_token, sessionId, { status: 'ABANDONED' });
      } catch {
        /* best-effort */
      }
    }
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
              setCurrentView(DEFAULT_VIEW);
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
          onBack={() => {
            setViewingUserId(null);
            setCurrentView(profileReturnView);
          }}
          onMessage={(peerId: string) => {
            setCurrentConversationId(peerId);
            setCurrentView('message-thread');
          }}
          viewingUserId={viewingUserId}
          onViewProfile={handleViewProfile}
          onPackagePurchased={() => { setDiscoveryTab('network'); setCurrentView('athlete-search'); }}
          isPro={isPro}
        />;
      case 'coach-dashboard':
        return <CoachDashboard
          onBack={() => setCurrentView('profile')}
          onNavigate={handleNavigate}
          userRole={userRole}
          isPro={isPro}
          onCreatePackage={() => { setBuilderPackageId(null); setCurrentView('tier-builder'); }}
          onEditPackage={(id: string) => { setBuilderPackageId(id); setCurrentView('tier-builder'); }}
          onCreatePlan={() => { setBuilderPlanId(null); setCurrentView('plan-builder'); }}
          onCreateTest={() => { setBuilderTestId(null); setBuilderReturnView('coach-dashboard'); setCurrentView('test-builder'); }}
          onEditTest={(id: string) => { setBuilderTestId(id); setBuilderReturnView('coach-dashboard'); setCurrentView('test-builder'); }}
          onViewClient={(clientId: string, clientName: string) => {
            setAnalyticsAthleteId(clientId); setAnalyticsClientName(clientName); setCurrentView('analytics');
          }}
          onViewClientHistory={(testId: string, athleteId: string, clientName: string) => {
            setProtocolId(testId);
            setHistoryAthleteId(athleteId); setHistoryClientName(clientName); setHistoryReturnView('coach-dashboard');
            setCurrentView('assessment-history');
          }}
          section={coachSection}
          onSectionChange={setCoachSection}
        />;
      case 'test-builder':
        return <TestBuilder
          token={tokens?.access_token || ''}
          testId={builderTestId || undefined}
          onCancel={() => { setBuilderTestId(null); setCurrentView(builderReturnView); }}
          onSave={() => { setBuilderTestId(null); setCurrentView(builderReturnView); }}
        />;
      case 'athlete-tests':
        return <AthleteTests
          onBack={() => setCurrentView(DEFAULT_VIEW)}
          onNavigate={handleNavigate}
          onNewProtocol={() => { setBuilderTestId(null); setBuilderReturnView('athlete-tests'); setCurrentView('test-builder'); }}
          onEditProtocol={(id: string) => { setBuilderTestId(id); setBuilderReturnView('athlete-tests'); setCurrentView('test-builder'); }}
          onRunProtocol={(id: string) => { setProtocolId(id); setCurrentView('assessment-run'); }}
          onViewHistory={(id: string) => {
            setProtocolId(id);
            setHistoryAthleteId(null); setHistoryClientName(null); setHistoryReturnView('athlete-tests');
            setCurrentView('assessment-history');
          }}
          userRole={userRole}
          isPro={isPro}
        />;
      case 'assessment-run':
        return <RunAssessment
          token={tokens?.access_token || ''}
          protocolId={protocolId || ''}
          onCancel={() => setCurrentView('athlete-tests')}
          onSaved={() => { setHistoryAthleteId(null); setHistoryClientName(null); setHistoryReturnView('athlete-tests'); setCurrentView('assessment-history'); }}
        />;
      case 'assessment-history':
        return <AssessmentHistory
          token={tokens?.access_token || ''}
          protocolId={protocolId || ''}
          athleteId={historyAthleteId || undefined}
          clientName={historyClientName || undefined}
          onBack={() => setCurrentView(historyReturnView)}
          onRun={historyAthleteId ? undefined : () => setCurrentView('assessment-run')}
        />;
      case 'notifications':
        return <Notifications
          onBack={() => setCurrentView(notifReturnView)}
          onNavigate={handleNavigate}
          onViewProfile={handleViewProfile}
          onOpenSupport={(ticketId) => { setSupportTicketId(ticketId); setCurrentView('support'); }}
        />;
      case 'post-creation':
        return <PostCreation onCancel={() => setCurrentView(DEFAULT_VIEW)} onPost={handlePostCreated} />;
      case 'exercise-builder':
        return <Exercises onBack={() => setCurrentView('plan-builder')} />;
      case 'plan-builder':
        return <PlanBuilder
          onCancel={() => setCurrentView('workouts-home')}
          onSave={handlePlanSaved}
          userRole={userRole}
          userTier={userTier}
          planId={builderPlanId || undefined}
        />;
      case 'coach-application':
        return <CoachApplication 
          onCancel={() => setCurrentView('profile')} 
          onSubmit={handleCoachApplicationSubmit} 
        />; 
      case 'coach-marketplace':
        return <CoachMarketplace onBack={() => setCurrentView('profile')} onViewProfile={handleViewProfile} />;
      case 'tier-builder':
        return <SubscriptionTierBuilder
          token={tokens?.access_token || ''}
          packageId={builderPackageId || undefined}
          onCancel={() => { setBuilderPackageId(null); setCurrentView('coach-dashboard'); }}
          onSave={handleTierSaved}
        />;
      case 'tier-comparison':
        return <TierComparison onCancel={() => setCurrentView('coach-marketplace')} coachName="Sarah Martinez" />;
      case 'analytics':
        return <AnalyticsDashboard
          token={tokens?.access_token || ''}
          selfId={user?.id || ''}
          athleteId={analyticsAthleteId || undefined}
          clientName={analyticsClientName || undefined}
          onBack={() => {
            if (analyticsAthleteId) {
              setAnalyticsAthleteId(null);
              setAnalyticsClientName(null);
              setCurrentView('coach-dashboard');
            } else {
              setCurrentView('workouts-home');
            }
          }}
          onViewAssessments={analyticsAthleteId ? undefined : () => setCurrentView('athlete-tests')}
        />;
      case 'workouts-home':
        return <WorkoutsHome
          onStartSession={(planId?: string, scheduleId?: string) => {
            setActivePlanId(planId || null);
            setActiveScheduleId(scheduleId || null);
            // Persist so the session survives refresh
            localStorage.setItem(SESSION_KEY, JSON.stringify({ planId: planId || null, scheduleId: scheduleId || null }));
            setCurrentView('workout-session');
          }}
          onCreatePlan={() => { setBuilderPlanId(null); setCurrentView('plan-builder'); }}
          onViewPlan={(planId: string) => { setBuilderPlanId(planId); setCurrentView('plan-builder'); }}
          onResumeSession={handleResumeSession}
          onDiscardSession={handleDiscardSession}
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
          activeTab={discoveryTab}
          onTabChange={setDiscoveryTab}
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
      case 'privacy-settings':
        return <PrivacySettings onBack={() => setCurrentView('profile')} />;
      case 'about':
        return <About onBack={() => setCurrentView(DEFAULT_VIEW)} />;
      case 'support':
        return <Support
          initialTicketId={supportTicketId}
          onBack={() => { setSupportTicketId(null); setCurrentView(DEFAULT_VIEW); }}
        />;
      case 'profile-settings':
        return <ProfileSettings userRole={userRole} onBack={() => setCurrentView('profile')} />;
      case 'pro-subscription':
        return <ProSubscription onBack={() => setCurrentView('profile')} />;
      case 'wallet':
        return <Wallet onBack={() => setCurrentView(userRole === 'coach' ? 'coach-dashboard' : 'profile')} />;
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
      ) : needsOnboarding ? (
        <Onboarding onDone={refreshUser} />
      ) : (
        <>
          <div className="h-dvh bg-gray-100 flex flex-col max-w-md mx-auto">
            <div className="flex-1 overflow-auto pb-16">
              {renderView()}
            </div>
            {currentView !== 'workout-session' && currentView !== 'logging' && (
              <Navigation
                currentView={currentView}
                onNavigate={handleNavigate}
                userRole={userRole}
              />
            )}
          </div>

          {/* Render MessageThread and ChannelView as overlays */}
          {currentView === 'message-thread' && (
            <MessageThread
              conversationId={currentConversationId}
              onBack={() => setCurrentView('messages')}
              onViewProfile={handleViewProfile}
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
