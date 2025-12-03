import { useState } from 'react';
import { ArrowLeft, Plus, GripVertical, Trash2, Calendar } from 'lucide-react';
import type { Exercise } from './ExerciseBuilder';

interface PlanBuilderProps {
  onCancel: () => void;
  onSave: () => void;
  userRole: 'athlete' | 'coach';
  userTier?: 'free' | 'premium';
}

interface PlanExercise extends Exercise {
  order: number;
}

export function PlanBuilder({ onCancel, onSave, userRole, userTier = 'free' }: PlanBuilderProps) {
  const [planName, setPlanName] = useState('');
  const [isTemplate, setIsTemplate] = useState(false);
  const [assignToClient, setAssignToClient] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [exercises, setExercises] = useState<PlanExercise[]>([]);
  const [description, setDescription] = useState('');
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);

  // Mock data for client dropdown (coaches only)
  const mockClients = [
    { id: '1', name: 'Alex Chen' },
    { id: '2', name: 'Emma Wilson' },
    { id: '3', name: 'Mike Rodriguez' },
  ];

  const canCreateMultiplePlans = userRole === 'coach' || userTier === 'premium';

  const handleSave = () => {
    if (planName.trim()) {
      // Mock save - would send to backend
      onSave();
    }
  };

  const removeExercise = (id: string) => {
    setExercises(exercises.filter(ex => ex.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-[#0E0E55] px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button onClick={onCancel} className="p-2 -ml-2 hover:bg-[#1A1A6E] rounded-lg transition-colors">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h2 className="text-white">Create Plan</h2>
          <button
            onClick={handleSave}
            disabled={!planName.trim() || exercises.length === 0}
            className="px-4 py-2 bg-yellow-500 text-[#0E0E55] rounded-lg hover:bg-yellow-400 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Save
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Plan Limit Warning */}
        {!canCreateMultiplePlans && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-900 mb-2">Free Tier Limitation</p>
            <p className="text-yellow-800 text-sm mb-3">
              Free users can only create 1 personal plan. Upgrade to Premium to create unlimited plans.
            </p>
            <button className="text-sm text-blue-600 hover:text-blue-700">
              Upgrade to Premium →
            </button>
          </div>
        )}

        {/* Plan Name */}
        <div>
          <label className="block mb-2 text-gray-900">Plan Name</label>
          <input
            type="text"
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            placeholder="e.g., Upper Body Strength"
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block mb-2 text-gray-900">Description (Optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief overview of this plan..."
            rows={3}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Coach-Specific Options */}
        {userRole === 'coach' && (
          <>
            {/* Template Toggle */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isTemplate}
                onChange={(e) => setIsTemplate(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <div>
                <span className="text-gray-900">Save as Template</span>
                <p className="text-gray-600 text-sm">Reuse this plan for multiple clients</p>
              </div>
            </label>

            {/* Assign to Client */}
            <div>
              <label className="block mb-2 text-gray-900">Assign to Client (Optional)</label>
              <select
                value={assignToClient}
                onChange={(e) => setAssignToClient(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a client...</option>
                {mockClients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            {assignToClient && (
              <div>
                <label className="block mb-2 text-gray-900">Due Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            )}
          </>
        )}

        {/* Exercises List */}
        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#3D3D3D]">Exercises ({exercises.length})</h3>
            <button
              onClick={() => setShowExerciseSelector(!showExerciseSelector)}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-[#3D3D3D] rounded-lg hover:bg-yellow-400 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm">Add</span>
            </button>
          </div>

          {exercises.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <p className="text-gray-600 mb-2">No exercises added yet</p>
              <p className="text-gray-500 text-sm">Tap "Add Exercise" to start building your plan</p>
            </div>
          ) : (
            <div className="space-y-2">
              {exercises.map((exercise, index) => (
                <div key={exercise.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <button className="mt-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing">
                      <GripVertical className="w-5 h-5" />
                    </button>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <span className="text-gray-900">{exercise.name}</span>
                          <div className="text-gray-600 text-sm">
                            {exercise.sets} sets × {exercise.repsOrDuration} {exercise.type === 'reps' ? 'reps' : 'sec'}
                            {' • '}
                            {exercise.restInterval}s rest
                          </div>
                        </div>
                        <button
                          onClick={() => removeExercise(exercise.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}