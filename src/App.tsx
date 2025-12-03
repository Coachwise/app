import { useState } from 'react';
import { Navigation } from './components/Navigation';
import { SportSelection } from './components/SportSelection';
import { WorkoutLogging } from './components/WorkoutLogging';
import { Feed } from './components/Feed';
import { Profile } from './components/Profile';
import { CoachDashboard } from './components/CoachDashboard';
import { PostCreation } from './components/PostCreation';
import { ExerciseBuilder } from './components/ExerciseBuilder';
import { PlanBuilder } from './components/PlanBuilder';
import { CoachApplication } from './components/CoachApplication';
import { CoachMarketplace } from './components/CoachMarketplace';
import { SubscriptionTierBuilder } from './components/SubscriptionTierBuilder';
import { TierComparison } from './components/TierComparison';
import { WorkoutsHome } from './components/WorkoutsHome';
import { WorkoutSession } from './components/WorkoutSession';

export type SportType = 'fitness' | 'climbing';
export type UserRole = 'athlete' | 'coach';
export type UserTier = 'free' | 'premium';
export type ViewType = 'sport-selection' | 'logging' | 'feed' | 'profile' | 'coach-dashboard' | 'post-creation' | 'exercise-builder' | 'plan-builder' | 'coach-application' | 'coach-marketplace' | 'tier-builder' | 'tier-comparison' | 'workouts-home' | 'workout-session';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('feed');
  const [selectedSport, setSelectedSport] = useState<SportType>('fitness');
  const [userRole, setUserRole] = useState<UserRole>('athlete');
  const [userTier, setUserTier] = useState<UserTier>('free');

  const handleSportSelect = (sport: SportType) => {
    setSelectedSport(sport);
    setCurrentView('logging');
  };

  const handlePostCreated = () => {
    setCurrentView('feed');
  };

  const handleExerciseSaved = () => {
    setCurrentView('plan-builder');
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
    setCurrentView('workouts-home');
    alert('Session saved! Great work! 💪');
  };

  const renderView = () => {
    switch (currentView) {
      case 'sport-selection':
        return <SportSelection onSelectSport={handleSportSelect} />;
      case 'logging':
        return <WorkoutLogging sport={selectedSport} onBack={() => setCurrentView('feed')} />;
      case 'feed':
        return <Feed 
          onCreatePost={() => setCurrentView('post-creation')} 
          userRole={userRole}
          onNavigate={(view) => setCurrentView(view as ViewType)}
        />; 
      case 'profile':
        return <Profile 
          userRole={userRole} 
          onNavigate={(view) => setCurrentView(view as ViewType)}
        />; 
      case 'coach-dashboard':
        return <CoachDashboard 
          onBack={() => setCurrentView('profile')} 
          onNavigate={(view) => setCurrentView(view as ViewType)}
          userRole={userRole}
        />; 
      case 'post-creation':
        return <PostCreation onCancel={() => setCurrentView('feed')} onPost={handlePostCreated} />;
      case 'exercise-builder':
        return <ExerciseBuilder 
          onCancel={() => setCurrentView('plan-builder')} 
          onSave={handleExerciseSaved} 
        />; 
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
        return <CoachMarketplace onBack={() => setCurrentView('profile')} />;
      case 'tier-builder':
        return <SubscriptionTierBuilder onCancel={() => setCurrentView('coach-dashboard')} onSave={handleTierSaved} />;
      case 'tier-comparison':
        return <TierComparison onCancel={() => setCurrentView('coach-marketplace')} coachName="Sarah Martinez" />;
      case 'workouts-home':
        return <WorkoutsHome 
          onStartSession={() => setCurrentView('workout-session')} 
          onCreatePlan={() => setCurrentView('plan-builder')}
          userRole={userRole}
          onNavigate={(view) => setCurrentView(view as ViewType)}
        />; 
      case 'workout-session':
        return <WorkoutSession onBack={() => setCurrentView('workouts-home')} onEndSession={handleSessionEnd} />;
      default:
        return <Feed onCreatePost={() => setCurrentView('post-creation')} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col max-w-md mx-auto">
      {/* Quick Access Menu - For Demo Purposes */}
      <div className="bg-[#0E0E55] p-2">
        <details className="cursor-pointer">
          <summary className="text-xs text-gray-300 font-medium">🚀 Demo Menu</summary>
          <div className="mt-2 grid grid-cols-2 gap-1">
            <button onClick={() => setCurrentView('feed')} className="text-xs bg-[#1A1A6E] text-gray-200 p-1.5 rounded hover:bg-[#1A1A6E]/80">Feed</button>
            <button onClick={() => setCurrentView('workouts-home')} className="text-xs bg-[#1A1A6E] text-gray-200 p-1.5 rounded hover:bg-[#1A1A6E]/80">Workouts</button>
            <button onClick={() => setCurrentView('plan-builder')} className="text-xs bg-[#1A1A6E] text-gray-200 p-1.5 rounded hover:bg-[#1A1A6E]/80">Plan Builder</button>
            <button onClick={() => setCurrentView('exercise-builder')} className="text-xs bg-[#1A1A6E] text-gray-200 p-1.5 rounded hover:bg-[#1A1A6E]/80">Exercise Builder</button>
            <button onClick={() => setCurrentView('coach-marketplace')} className="text-xs bg-[#1A1A6E] text-gray-200 p-1.5 rounded hover:bg-[#1A1A6E]/80">Find Coach</button>
            <button onClick={() => setCurrentView('tier-comparison')} className="text-xs bg-[#1A1A6E] text-gray-200 p-1.5 rounded hover:bg-[#1A1A6E]/80">Compare Tiers</button>
            <button onClick={() => setCurrentView('coach-application')} className="text-xs bg-[#1A1A6E] text-gray-200 p-1.5 rounded hover:bg-[#1A1A6E]/80">Apply as Coach</button>
            <button onClick={() => setCurrentView('tier-builder')} className="text-xs bg-[#1A1A6E] text-gray-200 p-1.5 rounded hover:bg-[#1A1A6E]/80">Create Tier</button>
            <button onClick={() => { setUserRole('athlete'); setCurrentView('profile'); }} className="text-xs bg-[#1A1A6E] text-gray-200 p-1.5 rounded hover:bg-[#1A1A6E]/80">User Profile</button>
            <button onClick={() => { setUserRole('coach'); setCurrentView('profile'); }} className="text-xs bg-[#1A1A6E] text-gray-200 p-1.5 rounded hover:bg-[#1A1A6E]/80">Coach Profile</button>
            <button onClick={() => { setUserRole('coach'); setCurrentView('coach-dashboard'); }} className="text-xs bg-[#1A1A6E] text-gray-200 p-1.5 rounded hover:bg-[#1A1A6E]/80">Coach Dashboard</button>
            <button onClick={() => setUserTier(userTier === 'free' ? 'premium' : 'free')} className="text-xs bg-yellow-500 text-[#0E0E55] p-1.5 rounded hover:bg-yellow-400">
              {userTier === 'free' ? '🆓 Free' : '⭐ Premium'}
            </button>
          </div>
        </details>
      </div>

      <div className="flex-1 overflow-auto pb-16">
        {renderView()}
      </div>
      <Navigation 
        currentView={currentView} 
        setCurrentView={setCurrentView}
        userRole={userRole}
      />
    </div>
  );
}