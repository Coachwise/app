import { useState } from 'react';
import { ArrowLeft, Users, Calendar, TrendingUp, DollarSign, Search, Globe, Lock, CheckCircle } from 'lucide-react';
import { HamburgerMenu } from './HamburgerMenu';
import type { UserRole } from '../App';

interface CoachDashboardProps {
  onBack: () => void;
  onNavigate?: (view: string) => void;
  userRole?: UserRole;
}

interface Client {
  id: string;
  name: string;
  avatar: string;
  tier: string;
  lastActive: string;
  assignedPlan?: {
    planId: string;
    planName: string;
    completedDays: number;
    totalDays: number;
  };
}

interface WorkoutPlan {
  id: string;
  name: string;
  exercises: number;
  duration: string;
  isPublic: boolean;
  createdBy: string;
  tags: string[];
  usedBy?: number;
}

export function CoachDashboard({ onBack, onNavigate, userRole = 'coach' }: CoachDashboardProps) {
  const [activeSection, setActiveSection] = useState<'clients' | 'plans' | 'analytics'>('clients');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [planFilter, setPlanFilter] = useState<'my' | 'public'>('my');

  const clients: Client[] = [
    {
      id: '1',
      name: 'Alice Johnson',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
      tier: 'Premium Monthly',
      lastActive: '2 hours ago',
      assignedPlan: {
        planId: '1',
        planName: 'Upper Body Push',
        completedDays: 3,
        totalDays: 5,
      },
    },
    {
      id: '2',
      name: 'Bob Smith',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
      tier: 'Basic Monthly',
      lastActive: '1 day ago',
      assignedPlan: {
        planId: '2',
        planName: 'Boulder Power Session',
        completedDays: 1,
        totalDays: 3,
      },
    },
    {
      id: '3',
      name: 'Charlie Brown',
      avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=100&h=100&fit=crop',
      tier: 'Premium Monthly',
      lastActive: '5 hours ago',
    },
    {
      id: '4',
      name: 'Diana Martinez',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop',
      tier: 'Basic Monthly',
      lastActive: '3 hours ago',
      assignedPlan: {
        planId: '3',
        planName: 'Core & Stability',
        completedDays: 2,
        totalDays: 4,
      },
    },
  ];

  const myPlans: WorkoutPlan[] = [
    {
      id: '1',
      name: 'Upper Body Push',
      exercises: 5,
      duration: '45 min',
      isPublic: true,
      createdBy: 'You',
      tags: ['strength', 'upper'],
      usedBy: 12,
    },
    {
      id: '2',
      name: 'Boulder Power Session',
      exercises: 6,
      duration: '60 min',
      isPublic: false,
      createdBy: 'You',
      tags: ['climbing', 'power'],
    },
    {
      id: '3',
      name: 'Core & Stability',
      exercises: 8,
      duration: '30 min',
      isPublic: true,
      createdBy: 'You',
      tags: ['core', 'stability'],
      usedBy: 8,
    },
  ];

  const publicPlans: WorkoutPlan[] = [
    {
      id: '4',
      name: 'Beginner Full Body',
      exercises: 6,
      duration: '40 min',
      isPublic: true,
      createdBy: 'Sarah Martinez',
      tags: ['beginner', 'full-body'],
      usedBy: 45,
    },
    {
      id: '5',
      name: 'Advanced Fingerboard',
      exercises: 10,
      duration: '50 min',
      isPublic: true,
      createdBy: 'Mike Chen',
      tags: ['climbing', 'fingers'],
      usedBy: 23,
    },
  ];

  const stats = {
    activeClients: clients.length,
    totalPlans: myPlans.length,
    monthlyRevenue: 2840,
    avgProgress: 68,
  };

  const filteredPlans = planFilter === 'my' ? myPlans : publicPlans;
  const searchedPlans = filteredPlans.filter(plan =>
    plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plan.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAssignPlan = (planId: string, clientId: string) => {
    alert(`Plan assigned to client!`);
    setSelectedClient(null);
  };

  const getProgressPercentage = (completed: number, total: number) => {
    return Math.round((completed / total) * 100);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-[#0E0E55] px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-[#1A1A6E] rounded-lg transition-colors">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-white text-xl">Coach Dashboard</h1>
          {onNavigate ? (
            <HamburgerMenu 
              userRole={userRole}
              onNavigate={onNavigate}
            />
          ) : (
            <div className="w-10"></div>
          )}
        </div>

        {/* Section Selector */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setActiveSection('clients')}
            className={`py-2 px-3 rounded-lg transition-all text-sm flex items-center justify-center gap-2 ${
              activeSection === 'clients'
                ? 'bg-yellow-500 text-[#0E0E55]'
                : 'bg-[#1A1A6E] text-gray-300 hover:bg-[#1A1A6E]/80'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Clients</span>
          </button>
          <button
            onClick={() => setActiveSection('plans')}
            className={`py-2 px-3 rounded-lg transition-all text-sm flex items-center justify-center gap-2 ${
              activeSection === 'plans'
                ? 'bg-yellow-500 text-[#0E0E55]'
                : 'bg-[#1A1A6E] text-gray-300 hover:bg-[#1A1A6E]/80'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Plans</span>
          </button>
          <button
            onClick={() => setActiveSection('analytics')}
            className={`py-2 px-3 rounded-lg transition-all text-sm flex items-center justify-center gap-2 ${
              activeSection === 'analytics'
                ? 'bg-yellow-500 text-[#0E0E55]'
                : 'bg-[#1A1A6E] text-gray-300 hover:bg-[#1A1A6E]/80'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Analytics</span>
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* CLIENTS SECTION */}
        {activeSection === 'clients' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-yellow-500 rounded-lg p-5 shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-[#0E0E55]" />
                  <span className="text-[#0E0E55]/80 text-sm">Active Clients</span>
                </div>
                <div className="text-4xl text-[#0E0E55]">{stats.activeClients}</div>
              </div>
              <div className="bg-white rounded-lg p-5 shadow-md border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-yellow-600" />
                  <span className="text-gray-600 text-sm">Monthly Revenue</span>
                </div>
                <div className="text-4xl text-[#0E0E55]">${stats.monthlyRevenue}</div>
              </div>
            </div>

            {/* Clients List */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200">
              <div className="p-5 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-[#0E0E55]">Your Clients</h3>
                <button className="px-4 py-2 bg-yellow-500 text-[#0E0E55] rounded-lg hover:bg-yellow-400 transition-colors text-sm">
                  + Add Client
                </button>
              </div>
              
              <div className="divide-y divide-gray-200">
                {clients.map((client) => (
                  <div key={client.id} className="p-5 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <img
                        src={client.avatar}
                        alt={client.name}
                        className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="flex-1">
                        <h4 className="text-[#0E0E55] mb-1">{client.name}</h4>
                        <p className="text-gray-600 text-sm">{client.tier}</p>
                        <p className="text-gray-500 text-xs mt-1">Active {client.lastActive}</p>
                      </div>
                      <button
                        onClick={() => setSelectedClient(selectedClient === client.id ? null : client.id)}
                        className="px-4 py-2 bg-[#0E0E55] text-white rounded-lg hover:bg-[#1A1A6E] transition-colors text-sm"
                      >
                        {selectedClient === client.id ? 'Cancel' : 'Assign Plan'}
                      </button>
                    </div>

                    {/* Current Assignment */}
                    {client.assignedPlan && (
                      <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <CheckCircle className="w-4 h-4 text-yellow-600" />
                              <p className="text-[#0E0E55] text-sm font-medium">
                                Current: {client.assignedPlan.planName}
                              </p>
                            </div>
                            <p className="text-gray-600 text-xs">
                              Progress: {client.assignedPlan.completedDays} of {client.assignedPlan.totalDays} days completed
                            </p>
                          </div>
                          <span className="px-3 py-1 bg-yellow-500 text-[#0E0E55] rounded-lg text-xs font-medium">
                            {getProgressPercentage(client.assignedPlan.completedDays, client.assignedPlan.totalDays)}%
                          </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-500 h-2 rounded-full transition-all"
                            style={{
                              width: `${getProgressPercentage(
                                client.assignedPlan.completedDays,
                                client.assignedPlan.totalDays
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Assign Plan Dropdown */}
                    {selectedClient === client.id && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h4 className="text-[#0E0E55] mb-3 text-sm">Select a plan to assign:</h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {myPlans.map((plan) => (
                            <button
                              key={plan.id}
                              onClick={() => handleAssignPlan(plan.id, client.id)}
                              className="w-full text-left p-3 bg-white rounded-lg hover:bg-yellow-50 border border-gray-200 hover:border-yellow-500 transition-colors"
                            >
                              <div className="text-[#0E0E55] text-sm mb-1">{plan.name}</div>
                              <div className="text-gray-600 text-xs">
                                {plan.exercises} exercises • {plan.duration}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* PLANS SECTION */}
        {activeSection === 'plans' && (
          <>
            {/* Search & Filter */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search plans by name or tags..."
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-[#0E0E55]"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setPlanFilter('my')}
                  className={`flex-1 py-3 rounded-lg transition-all ${
                    planFilter === 'my'
                      ? 'bg-yellow-500 text-[#0E0E55]'
                      : 'bg-white text-gray-600 border border-gray-300'
                  }`}
                >
                  My Plans ({myPlans.length})
                </button>
                <button
                  onClick={() => setPlanFilter('public')}
                  className={`flex-1 py-3 rounded-lg transition-all ${
                    planFilter === 'public'
                      ? 'bg-yellow-500 text-[#0E0E55]'
                      : 'bg-white text-gray-600 border border-gray-300'
                  }`}
                >
                  Public Plans
                </button>
              </div>
            </div>

            {/* Create Plan Button */}
            <button
              onClick={() => alert('Create new plan')}
              className="w-full bg-yellow-500 text-[#0E0E55] py-4 rounded-lg hover:bg-yellow-400 transition-colors shadow-lg flex items-center justify-center gap-3"
            >
              <span className="text-xl">+</span>
              <span>Create New Plan</span>
            </button>

            {/* Plans List */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200">
              <div className="p-5 border-b border-gray-200">
                <h3 className="text-[#0E0E55]">
                  {planFilter === 'my' ? 'Your Plans' : 'Public Plans Library'}
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  {searchedPlans.length} plan{searchedPlans.length !== 1 ? 's' : ''} found
                </p>
              </div>

              <div className="divide-y divide-gray-200">
                {searchedPlans.map((plan) => (
                  <div key={plan.id} className="p-5 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-[#0E0E55]">{plan.name}</h4>
                          {plan.isPublic ? (
                            <Globe className="w-4 h-4 text-yellow-600" />
                          ) : (
                            <Lock className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          <span>{plan.exercises} exercises</span>
                          <span>•</span>
                          <span>{plan.duration}</span>
                          <span>•</span>
                          <span className="text-gray-500">by {plan.createdBy}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {plan.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        {plan.usedBy && (
                          <p className="text-gray-500 text-xs mt-2">
                            Used by {plan.usedBy} coaches
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button className="flex-1 py-2 bg-[#0E0E55] text-white rounded-lg hover:bg-[#1A1A6E] transition-colors text-sm">
                        View Details
                      </button>
                      {planFilter === 'my' ? (
                        <button className="flex-1 py-2 border-2 border-gray-300 text-[#0E0E55] rounded-lg hover:border-gray-400 transition-colors text-sm">
                          Edit Plan
                        </button>
                      ) : (
                        <button className="flex-1 py-2 bg-yellow-500 text-[#0E0E55] rounded-lg hover:bg-yellow-400 transition-colors text-sm">
                          Copy to My Plans
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ANALYTICS SECTION */}
        {activeSection === 'analytics' && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-5 shadow-md border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-yellow-600" />
                  <span className="text-gray-600 text-sm">Active Clients</span>
                </div>
                <div className="text-4xl text-[#0E0E55] mb-1">{stats.activeClients}</div>
                <p className="text-green-600 text-xs">+2 this month</p>
              </div>

              <div className="bg-white rounded-lg p-5 shadow-md border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-yellow-600" />
                  <span className="text-gray-600 text-sm">Total Plans</span>
                </div>
                <div className="text-4xl text-[#0E0E55] mb-1">{stats.totalPlans}</div>
                <p className="text-gray-500 text-xs">Created by you</p>
              </div>

              <div className="bg-white rounded-lg p-5 shadow-md border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-yellow-600" />
                  <span className="text-gray-600 text-sm">Revenue</span>
                </div>
                <div className="text-4xl text-[#0E0E55] mb-1">${stats.monthlyRevenue}</div>
                <p className="text-green-600 text-xs">+12% vs last month</p>
              </div>

              <div className="bg-white rounded-lg p-5 shadow-md border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-yellow-600" />
                  <span className="text-gray-600 text-sm">Avg Progress</span>
                </div>
                <div className="text-4xl text-[#0E0E55] mb-1">{stats.avgProgress}%</div>
                <p className="text-green-600 text-xs">+5% improvement</p>
              </div>
            </div>

            {/* Charts Placeholder */}
            <div className="bg-white rounded-lg shadow-md p-5 border border-gray-200">
              <h3 className="text-[#0E0E55] mb-4">Revenue Trend</h3>
              <div className="bg-yellow-50 rounded-lg p-12 text-center border-2 border-dashed border-yellow-300">
                <TrendingUp className="w-12 h-12 text-yellow-600 mx-auto mb-2" />
                <p className="text-gray-600 text-sm">Revenue trending up 23% this month</p>
                <p className="text-gray-500 text-xs mt-1">Chart visualization coming soon</p>
              </div>
            </div>

            {/* Additional Metrics */}
            <div className="bg-white rounded-lg shadow-md p-5 border border-gray-200">
              <h3 className="text-[#0E0E55] mb-4">Client Metrics</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-gray-600 text-sm mb-1">Retention Rate</div>
                  <div className="text-2xl text-[#0E0E55]">94%</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-gray-600 text-sm mb-1">Response Time</div>
                  <div className="text-2xl text-[#0E0E55]">2.4h</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-gray-600 text-sm mb-1">Session Length</div>
                  <div className="text-2xl text-[#0E0E55]">58m</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-gray-600 text-sm mb-1">Satisfaction</div>
                  <div className="text-2xl text-yellow-600">4.8⭐</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
