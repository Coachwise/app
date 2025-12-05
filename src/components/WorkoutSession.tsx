import { useState, useEffect } from 'react';
import { ArrowLeft, Play, Pause, Clock, Check, ChevronRight, ChevronLeft, Dumbbell, Mountain } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface WorkoutSessionProps {
  onBack: () => void;
  onEndSession: () => void;
}

interface Exercise {
  id: string;
  name: string;
  type: 'strength' | 'climbing';
  sets?: number;
  reps?: number;
  weight?: string;
  notes?: string;
}

interface ExerciseLog {
  exerciseId: string;
  sets: SetLog[];
  completed: boolean;
  startTime?: number;
  endTime?: number;
}

interface SetLog {
  setNumber: number;
  reps: number;
  weight: string;
  rpe?: number;
  notes?: string;
}

type ExerciseStatus = 'not-started' | 'in-progress' | 'logging' | 'completed';

export function WorkoutSession({ onBack, onEndSession }: WorkoutSessionProps) {
  const { t } = useLanguage();
  
  // Mock workout plan with exercises
  const [exercises] = useState<Exercise[]>([
    {
      id: '1',
      name: 'Bench Press',
      type: 'strength',
      sets: 3,
      reps: 10,
      weight: '80kg',
      notes: 'Keep elbows at 45 degrees'
    },
    {
      id: '2',
      name: 'Overhead Press',
      type: 'strength',
      sets: 3,
      reps: 8,
      weight: '50kg',
    },
    {
      id: '3',
      name: 'Incline Dumbbell Press',
      type: 'strength',
      sets: 3,
      reps: 12,
      weight: '25kg each',
    },
    {
      id: '4',
      name: 'Tricep Dips',
      type: 'strength',
      sets: 3,
      reps: 12,
    },
    {
      id: '5',
      name: 'Cable Flyes',
      type: 'strength',
      sets: 3,
      reps: 15,
      weight: '15kg',
    },
  ]);

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [exerciseStatus, setExerciseStatus] = useState<ExerciseStatus>('not-started');
  const [sessionTime, setSessionTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [exerciseLogs, setExerciseLogs] = useState<Map<string, ExerciseLog>>(new Map());
  
  // Current exercise logging state
  const [currentSetLogs, setCurrentSetLogs] = useState<SetLog[]>([]);
  const [currentSet, setCurrentSet] = useState(1);
  const [repsInput, setRepsInput] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [rpeInput, setRpeInput] = useState('');
  const [notesInput, setNotesInput] = useState('');

  const currentExercise = exercises[currentExerciseIndex];
  const totalExercises = exercises.length;
  const isLastExercise = currentExerciseIndex === totalExercises - 1;
  const isFirstExercise = currentExerciseIndex === 0;

  // Timer effect
  useEffect(() => {
    let interval: number | undefined;
    if (isTimerRunning) {
      interval = window.setInterval(() => {
        setSessionTime((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartExercise = () => {
    setExerciseStatus('in-progress');
    setIsTimerRunning(true);
    const currentLog = exerciseLogs.get(currentExercise.id) || {
      exerciseId: currentExercise.id,
      sets: [],
      completed: false,
      startTime: sessionTime,
    };
    exerciseLogs.set(currentExercise.id, currentLog);
    setExerciseLogs(new Map(exerciseLogs));
    
    // Pre-fill weight from plan
    if (currentExercise.weight) {
      setWeightInput(currentExercise.weight);
    }
    if (currentExercise.reps) {
      setRepsInput(currentExercise.reps.toString());
    }
  };

  const handleFinishSet = () => {
    if (!repsInput || !weightInput) return;

    const newSet: SetLog = {
      setNumber: currentSet,
      reps: parseInt(repsInput),
      weight: weightInput,
      rpe: rpeInput ? parseInt(rpeInput) : undefined,
      notes: notesInput || undefined,
    };

    const updatedSetLogs = [...currentSetLogs, newSet];
    setCurrentSetLogs(updatedSetLogs);

    // Check if this was the last set
    if (currentSet >= (currentExercise.sets || 3)) {
      setExerciseStatus('logging');
    } else {
      setCurrentSet(currentSet + 1);
      setNotesInput('');
      setRpeInput('');
      // Keep weight and reps for next set
    }
  };

  const handleCompleteExercise = () => {
    const log: ExerciseLog = {
      exerciseId: currentExercise.id,
      sets: currentSetLogs,
      completed: true,
      startTime: exerciseLogs.get(currentExercise.id)?.startTime || sessionTime,
      endTime: sessionTime,
    };
    
    exerciseLogs.set(currentExercise.id, log);
    setExerciseLogs(new Map(exerciseLogs));
    
    if (isLastExercise) {
      // Show completion screen
      setExerciseStatus('completed');
    } else {
      // Move to next exercise
      handleNextExercise();
    }
  };

  const handleNextExercise = () => {
    if (currentExerciseIndex < totalExercises - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setExerciseStatus('not-started');
      setCurrentSetLogs([]);
      setCurrentSet(1);
      setRepsInput('');
      setWeightInput('');
      setRpeInput('');
      setNotesInput('');
    }
  };

  const handlePreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
      setExerciseStatus('not-started');
      setCurrentSetLogs([]);
      setCurrentSet(1);
      setRepsInput('');
      setWeightInput('');
      setRpeInput('');
      setNotesInput('');
    }
  };

  const handleEndSession = () => {
    if (window.confirm('Are you sure you want to end this session?')) {
      setIsTimerRunning(false);
      onEndSession();
    }
  };

  const completedCount = Array.from(exerciseLogs.values()).filter(log => log.completed).length;

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <div className="bg-[#0E0E55] px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-[#1A1A6E] rounded-lg transition-colors">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h2 className="text-white">Upper Body Push</h2>
          <button
            onClick={handleEndSession}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            End
          </button>
        </div>

        {/* Session Timer */}
        <div className="bg-[#1A1A6E] rounded-lg px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-500" />
            <span className="text-gray-300 text-sm">Session Time</span>
          </div>
          <span className="text-white font-mono text-lg">{formatTime(sessionTime)}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">
            Exercise {currentExerciseIndex + 1} of {totalExercises}
          </span>
          <span className="text-sm text-gray-600">
            {completedCount} completed
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentExerciseIndex + (exerciseStatus === 'completed' ? 1 : 0)) / totalExercises) * 100}%` }}
          />
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Current Exercise Card */}
        <div className="bg-white rounded-lg p-6 shadow-lg border-2 border-yellow-500">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
              {currentExercise.type === 'strength' ? (
                <Dumbbell className="w-6 h-6 text-yellow-600" />
              ) : (
                <Mountain className="w-6 h-6 text-yellow-600" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-[#0E0E55] text-xl mb-1">{currentExercise.name}</h3>
              <p className="text-gray-600 text-sm">
                {currentExercise.sets} sets × {currentExercise.reps} reps
                {currentExercise.weight && ` @ ${currentExercise.weight}`}
              </p>
              {currentExercise.notes && (
                <p className="text-gray-500 text-sm mt-2 italic">💡 {currentExercise.notes}</p>
              )}
            </div>
          </div>

          {/* Exercise Status */}
          {exerciseStatus === 'not-started' && (
            <div className="text-center py-6">
              <p className="text-gray-600 mb-4">Ready to start this exercise?</p>
              <button
                onClick={handleStartExercise}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-yellow-500 text-[#0E0E55] rounded-lg hover:bg-yellow-400 transition-all mx-auto"
              >
                <Play className="w-6 h-6" />
                <span className="text-lg">Start Exercise</span>
              </button>
            </div>
          )}

          {/* In Progress - Logging Sets */}
          {exerciseStatus === 'in-progress' && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[#0E0E55]">
                    Set {currentSet} of {currentExercise.sets || 3}
                  </span>
                  {isTimerRunning ? (
                    <button
                      onClick={() => setIsTimerRunning(false)}
                      className="flex items-center gap-2 px-3 py-1 bg-[#0E0E55] text-white rounded-lg hover:bg-[#1A1A6E] transition-colors text-sm"
                    >
                      <Pause className="w-4 h-4" />
                      Pause Timer
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsTimerRunning(true)}
                      className="flex items-center gap-2 px-3 py-1 bg-yellow-500 text-[#0E0E55] rounded-lg hover:bg-yellow-400 transition-colors text-sm"
                    >
                      <Play className="w-4 h-4" />
                      Resume Timer
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Reps</label>
                    <input
                      type="number"
                      value={repsInput}
                      onChange={(e) => setRepsInput(e.target.value)}
                      placeholder="12"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Weight</label>
                    <input
                      type="text"
                      value={weightInput}
                      onChange={(e) => setWeightInput(e.target.value)}
                      placeholder="80kg"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="block text-sm text-gray-700 mb-1">RPE (1-10) - Optional</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={rpeInput}
                    onChange={(e) => setRpeInput(e.target.value)}
                    placeholder="8"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>

                <div className="mb-3">
                  <label className="block text-sm text-gray-700 mb-1">Notes - Optional</label>
                  <input
                    type="text"
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    placeholder="Felt strong, good form"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>

                <button
                  onClick={handleFinishSet}
                  disabled={!repsInput || !weightInput}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#0E0E55] text-white rounded-lg hover:bg-[#1A1A6E] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <Check className="w-5 h-5" />
                  <span>Complete Set {currentSet}</span>
                </button>
              </div>

              {/* Completed Sets */}
              {currentSetLogs.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm text-gray-600">Completed Sets:</h4>
                  {currentSetLogs.map((set) => (
                    <div key={set.setNumber} className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-green-600" />
                        <div>
                          <span className="text-[#0E0E55]">Set {set.setNumber}</span>
                          <p className="text-sm text-gray-600">
                            {set.reps} reps @ {set.weight}
                            {set.rpe && ` • RPE ${set.rpe}`}
                          </p>
                          {set.notes && (
                            <p className="text-xs text-gray-500 italic">{set.notes}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Review and Complete */}
          {exerciseStatus === 'logging' && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="text-[#0E0E55] mb-3 flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  All Sets Completed!
                </h4>
                <div className="space-y-2 mb-4">
                  {currentSetLogs.map((set) => (
                    <div key={set.setNumber} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">Set {set.setNumber}</span>
                      <span className="text-gray-900">
                        {set.reps} reps @ {set.weight}
                        {set.rpe && ` • RPE ${set.rpe}`}
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleCompleteExercise}
                  className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  {isLastExercise ? 'Complete Workout' : 'Next Exercise'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handlePreviousExercise}
            disabled={isFirstExercise}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Previous</span>
          </button>
          <button
            onClick={handleNextExercise}
            disabled={isLastExercise || exerciseStatus !== 'not-started'}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span>Skip</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Exercise List Overview */}
        <div className="bg-white rounded-lg p-4">
          <h4 className="text-[#0E0E55] mb-3">Workout Overview</h4>
          <div className="space-y-2">
            {exercises.map((exercise, index) => {
              const log = exerciseLogs.get(exercise.id);
              const isCompleted = log?.completed || false;
              const isCurrent = index === currentExerciseIndex;
              
              return (
                <div
                  key={exercise.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    isCurrent
                      ? 'border-yellow-500 bg-yellow-50'
                      : isCompleted
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isCompleted
                      ? 'bg-green-500'
                      : isCurrent
                      ? 'bg-yellow-500'
                      : 'bg-gray-200'
                  }`}>
                    {isCompleted ? (
                      <Check className="w-4 h-4 text-white" />
                    ) : (
                      <span className="text-white text-xs">{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm ${isCurrent ? 'text-[#0E0E55]' : 'text-gray-700'}`}>
                      {exercise.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {exercise.sets} × {exercise.reps} {exercise.weight && `@ ${exercise.weight}`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
