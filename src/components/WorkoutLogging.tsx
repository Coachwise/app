import { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Play, Pause, RotateCcw } from 'lucide-react';
import type { SportType } from '../App';

interface WorkoutLoggingProps {
  sport: SportType;
  onBack: () => void;
}

interface FitnessSet {
  weight: string;
  reps: string;
  rpe: string;
}

interface ClimbingAttempt {
  grade: string;
  sendType: string;
}

export function WorkoutLogging({ sport, onBack }: WorkoutLoggingProps) {
  const [exercise, setExercise] = useState('');
  const [sets, setSets] = useState<FitnessSet[]>([{ weight: '', reps: '', rpe: '' }]);
  const [climbingAttempts, setClimbingAttempts] = useState<ClimbingAttempt[]>([{ grade: '', sendType: '' }]);
  const [notes, setNotes] = useState('');
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const addSet = () => {
    setSets([...sets, { weight: '', reps: '', rpe: '' }]);
  };

  const removeSet = (index: number) => {
    setSets(sets.filter((_, i) => i !== index));
  };

  const updateSet = (index: number, field: keyof FitnessSet, value: string) => {
    const newSets = [...sets];
    newSets[index][field] = value;
    setSets(newSets);
  };

  const addClimb = () => {
    setClimbingAttempts([...climbingAttempts, { grade: '', sendType: '' }]);
  };

  const removeClimb = (index: number) => {
    setClimbingAttempts(climbingAttempts.filter((_, i) => i !== index));
  };

  const updateClimb = (index: number, field: keyof ClimbingAttempt, value: string) => {
    const newAttempts = [...climbingAttempts];
    newAttempts[index][field] = value;
    setClimbingAttempts(newAttempts);
  };

  const handleSave = () => {
    // Mock save - in real app would send to backend
    alert('Workout logged successfully!');
    onBack();
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-[#0E0E55] px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-[#1A1A6E] rounded-lg transition-colors">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h2 className="text-white capitalize">{sport} Workout</h2>
          <button className="px-4 py-2 bg-yellow-500 text-[#0E0E55] rounded-lg hover:bg-yellow-400 transition-colors">
            Save
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Timer Card */}
        <div className="bg-[#0E0E55] rounded-lg shadow-lg p-6 text-center">
          <div className="text-6xl text-white mb-4 font-mono">{formatTime(timer)}</div>
          <div className="flex gap-3 justify-center">
            {!isRunning ? (
              <button
                onClick={() => setIsRunning(true)}
                className="flex items-center gap-2 px-6 py-3 bg-yellow-500 text-[#0E0E55] rounded-lg hover:bg-yellow-400 transition-colors"
              >
                <Play className="w-5 h-5" />
                <span>{timer === 0 ? 'Start' : 'Resume'}</span>
              </button>
            ) : (
              <button
                onClick={() => setIsRunning(false)}
                className="flex items-center gap-2 px-6 py-3 bg-yellow-500 text-[#0E0E55] rounded-lg hover:bg-yellow-400 transition-colors"
              >
                <Pause className="w-5 h-5" />
                <span>Pause</span>
              </button>
            )}
            {timer > 0 && (
              <button
                onClick={() => {
                  setTimer(0);
                  setIsRunning(false);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-white text-[#0E0E55] rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
              >
                <RotateCcw className="w-5 h-5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Exercise/Activity Name */}
        <div>
          <label className="block mb-2 text-gray-900">
            {sport === 'fitness' ? 'Exercise' : 'Activity'}
          </label>
          <input
            type="text"
            value={exercise}
            onChange={(e) => setExercise(e.target.value)}
            placeholder={sport === 'fitness' ? 'e.g., Deadlift' : 'e.g., Boulder Problem'}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Fitness Sets */}
        {sport === 'fitness' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-gray-900">Sets</label>
              <button
                onClick={addSet}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">Add Set</span>
              </button>
            </div>
            
            <div className="space-y-3">
              {sets.map((set, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-600">Set {index + 1}</span>
                    {sets.length > 1 && (
                      <button
                        onClick={() => removeSet(index)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Weight (kg)</label>
                      <input
                        type="number"
                        value={set.weight}
                        onChange={(e) => updateSet(index, 'weight', e.target.value)}
                        placeholder="100"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Reps</label>
                      <input
                        type="number"
                        value={set.reps}
                        onChange={(e) => updateSet(index, 'reps', e.target.value)}
                        placeholder="8"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">RPE</label>
                      <input
                        type="number"
                        value={set.rpe}
                        onChange={(e) => updateSet(index, 'rpe', e.target.value)}
                        placeholder="7"
                        min="1"
                        max="10"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Climbing Attempts */}
        {sport === 'climbing' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-gray-900">Attempts</label>
              <button
                onClick={addClimb}
                className="flex items-center gap-1 text-green-600 hover:text-green-700"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">Add Attempt</span>
              </button>
            </div>
            
            <div className="space-y-3">
              {climbingAttempts.map((attempt, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-600">Attempt {index + 1}</span>
                    {climbingAttempts.length > 1 && (
                      <button
                        onClick={() => removeClimb(index)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Grade</label>
                      <select
                        value={attempt.grade}
                        onChange={(e) => updateClimb(index, 'grade', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="">Select...</option>
                        <option value="V0">V0</option>
                        <option value="V1">V1</option>
                        <option value="V2">V2</option>
                        <option value="V3">V3</option>
                        <option value="V4">V4</option>
                        <option value="V5">V5</option>
                        <option value="V6">V6</option>
                        <option value="V7">V7</option>
                        <option value="V8">V8</option>
                        <option value="V9">V9</option>
                        <option value="V10+">V10+</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Send Type</label>
                      <select
                        value={attempt.sendType}
                        onChange={(e) => updateClimb(index, 'sendType', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="">Select...</option>
                        <option value="Flash">Flash</option>
                        <option value="Send">Send</option>
                        <option value="Project">Project</option>
                        <option value="Attempt">Attempt</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block mb-2 text-gray-900">Notes (Optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How did it feel? Any observations?"
            rows={4}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors active:scale-95"
        >
          Save Workout
        </button>
      </div>
    </div>
  );
}