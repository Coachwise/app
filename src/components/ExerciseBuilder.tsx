import { useState } from 'react';
import { ArrowLeft, Clock, Hash, Copy } from 'lucide-react';

interface ExerciseBuilderProps {
  onCancel: () => void;
  onSave: () => void;
  existingExercise?: Exercise;
}

export interface Exercise {
  id: string;
  name: string;
  type: 'reps' | 'time';
  sets: number;
  repsOrDuration: number;
  restInterval: number;
  notes?: string;
}

export function ExerciseBuilder({ onCancel, onSave, existingExercise }: ExerciseBuilderProps) {
  const [exerciseName, setExerciseName] = useState(existingExercise?.name || '');
  const [exerciseType, setExerciseType] = useState<'reps' | 'time'>(existingExercise?.type || 'reps');
  const [sets, setSets] = useState(existingExercise?.sets.toString() || '3');
  const [repsOrDuration, setRepsOrDuration] = useState(existingExercise?.repsOrDuration.toString() || '10');
  const [restInterval, setRestInterval] = useState(existingExercise?.restInterval.toString() || '60');
  const [notes, setNotes] = useState(existingExercise?.notes || '');

  const handleSave = () => {
    if (exerciseName.trim() && sets && repsOrDuration) {
      // Mock save - would send to backend
      onSave();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-[#0E0E55] px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button onClick={onCancel} className="p-2 -ml-2 hover:bg-[#1A1A6E] rounded-lg transition-colors">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h2 className="text-white">
            {existingExercise ? 'Edit Exercise' : 'New Exercise'}
          </h2>
          <button
            onClick={handleSave}
            disabled={!exerciseName.trim()}
            className="px-4 py-2 bg-yellow-500 text-[#0E0E55] rounded-lg hover:bg-yellow-400 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Save
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Exercise Name */}
        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
          <label className="text-[#3D3D3D] mb-2 block">Exercise Name</label>
          <input
            type="text"
            value={exerciseName}
            onChange={(e) => setExerciseName(e.target.value)}
            placeholder="e.g., Bench Press"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-[#3D3D3D]"
          />
        </div>

        {/* Exercise Type */}
        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
          <label className="text-[#3D3D3D] mb-3 block">Type</label>
          <div className="grid grid-cols-2 gap-3">
            {['Reps', 'Time'].map((type) => (
              <button
                key={type}
                onClick={() => setExerciseType(type.toLowerCase() as 'reps' | 'time')}
                className={`py-3 px-4 rounded-lg transition-all ${
                  exerciseType === type.toLowerCase()
                    ? 'bg-yellow-500 text-[#3D3D3D]'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Sets and Reps/Duration */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-2 text-gray-900">Sets</label>
            <input
              type="number"
              value={sets}
              onChange={(e) => setSets(e.target.value)}
              min="1"
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block mb-2 text-gray-900">
              {exerciseType === 'reps' ? 'Reps per Set' : 'Duration (seconds)'}
            </label>
            <input
              type="number"
              value={repsOrDuration}
              onChange={(e) => setRepsOrDuration(e.target.value)}
              min="1"
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Rest Interval */}
        <div>
          <label className="block mb-2 text-gray-900">Rest Between Sets (seconds)</label>
          <div className="relative">
            <input
              type="number"
              value={restInterval}
              onChange={(e) => setRestInterval(e.target.value)}
              min="0"
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
              {Math.floor(Number(restInterval) / 60)}:{(Number(restInterval) % 60).toString().padStart(2, '0')}
            </div>
          </div>
          <div className="mt-2 flex gap-2">
            {[30, 60, 90, 120, 180].map(seconds => (
              <button
                key={seconds}
                onClick={() => setRestInterval(seconds.toString())}
                className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
              >
                {seconds}s
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-blue-900 mb-2">Preview</div>
          <div className="text-blue-800">
            {sets || '0'} sets × {repsOrDuration || '0'} {exerciseType === 'reps' ? 'reps' : 'seconds'}
            {' • '}
            {restInterval || '0'}s rest
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block mb-2 text-gray-900">Notes (Optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Focus on form, use tempo 3-1-1"
            rows={3}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Clone Button (if editing) */}
        {existingExercise && (
          <button className="w-full flex items-center justify-center gap-2 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <Copy className="w-5 h-5" />
            Clone Exercise
          </button>
        )}
      </div>
    </div>
  );
}