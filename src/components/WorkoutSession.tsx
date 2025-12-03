import { useState, useEffect } from 'react';
import { ArrowLeft, Play, Pause, StopCircle, Plus, Dumbbell, Mountain, Clock } from 'lucide-react';

interface WorkoutSessionProps {
  onBack: () => void;
  onEndSession: () => void;
}

interface SessionLog {
  id: string;
  timestamp: number;
  type: 'strength' | 'climbing';
  exercise: string;
  details: string;
}

export function WorkoutSession({ onBack, onEndSession }: WorkoutSessionProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [logs, setLogs] = useState<SessionLog[]>([]);
  const [showAddLog, setShowAddLog] = useState(false);
  const [logType, setLogType] = useState<'strength' | 'climbing'>('strength');
  const [exercise, setExercise] = useState('');
  const [details, setDetails] = useState('');

  useEffect(() => {
    let interval: number | undefined;
    if (isRunning) {
      interval = window.setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAddLog = () => {
    if (exercise.trim() && details.trim()) {
      const newLog: SessionLog = {
        id: Date.now().toString(),
        timestamp: elapsedTime,
        type: logType,
        exercise,
        details,
      };
      setLogs([...logs, newLog]);
      setExercise('');
      setDetails('');
      setShowAddLog(false);
    }
  };

  const handleEndSession = () => {
    if (window.confirm('Are you sure you want to end this session?')) {
      setIsRunning(false);
      onEndSession();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-[#0E0E55] px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-[#1A1A6E] rounded-lg transition-colors">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h2 className="text-white">Freestyle Session</h2>
          <button
            onClick={handleEndSession}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            End
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Timer Display */}
        <div className="bg-[#0E0E55] rounded-lg p-8 text-center shadow-lg">
          <div className="text-gray-300 mb-2 flex items-center justify-center gap-2">
            <Clock className="w-6 h-6" />
            <span>Session Duration</span>
          </div>
          <div className="text-white text-6xl mb-6 font-mono">
            {formatTime(elapsedTime)}
          </div>
          
          {/* Timer Controls */}
          <div className="flex gap-3 justify-center">
            {!isRunning ? (
              <button
                onClick={() => setIsRunning(true)}
                className="flex items-center gap-2 px-8 py-4 bg-yellow-500 text-[#0E0E55] rounded-lg hover:bg-yellow-400 transition-all"
              >
                <Play className="w-6 h-6" />
                <span>{elapsedTime === 0 ? 'Start' : 'Resume'}</span>
              </button>
            ) : (
              <button
                onClick={() => setIsRunning(false)}
                className="flex items-center gap-2 px-8 py-4 bg-yellow-500 text-[#0E0E55] rounded-lg hover:bg-yellow-400 transition-all"
              >
                <Pause className="w-6 h-6" />
                <span>Pause</span>
              </button>
            )}
          </div>
        </div>

        {/* Heart Rate Integration Notice */}
        <div className="bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-purple-300 rounded-2xl p-4 shadow-lg">
          <p className="text-purple-900 text-sm mb-1">💡 Coming Soon</p>
          <p className="text-purple-800 text-xs">
            Heart rate band integration will be available in a future update
          </p>
        </div>

        {/* Add Log Button */}
        {!showAddLog && (
          <button
            onClick={() => setShowAddLog(true)}
            className="w-full flex items-center justify-center gap-2 py-4 bg-yellow-500 text-[#0E0E55] rounded-lg hover:bg-yellow-400 transition-colors shadow-md"
          >
            <Plus className="w-5 h-5" />
            <span>Add Exercise Log</span>
          </button>
        )}

        {/* Add Log Form */}
        {showAddLog && (
          <div className="bg-white border-2 border-yellow-500 rounded-lg p-5 space-y-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[#0E0E55]">Add Exercise</h3>
              <button
                onClick={() => {
                  setShowAddLog(false);
                  setExercise('');
                  setDetails('');
                }}
                className="text-gray-600 hover:text-[#0E0E55]"
              >
                Cancel
              </button>
            </div>

            {/* Log Type Selection */}
            <div>
              <label className="text-[#546373] mb-2 block">Exercise Type</label>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={() => setLogType('strength')}
                  className={`flex items-center justify-center gap-2 p-3 border-2 rounded-lg transition-colors ${
                    logType === 'strength'
                      ? 'border-yellow-500 bg-yellow-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <Dumbbell className={`w-4 h-4 ${logType === 'strength' ? 'text-yellow-600' : 'text-gray-600'}`} />
                  <span className={logType === 'strength' ? 'text-[#546373]' : 'text-gray-900'}>Strength</span>
                </button>
                <button
                  onClick={() => setLogType('climbing')}
                  className={`flex items-center justify-center gap-2 p-3 border-2 rounded-lg transition-colors ${
                    logType === 'climbing'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <Mountain className={`w-4 h-4 ${logType === 'climbing' ? 'text-green-600' : 'text-gray-600'}`} />
                  <span className={logType === 'climbing' ? 'text-green-900' : 'text-gray-900'}>Climbing</span>
                </button>
              </div>
            </div>

            {/* Exercise Name */}
            <div>
              <label className="block mb-2 text-gray-900 text-sm">Exercise/Route</label>
              <input
                type="text"
                value={exercise}
                onChange={(e) => setExercise(e.target.value)}
                placeholder={logType === 'strength' ? 'e.g., Deadlift' : 'e.g., Red Corner Route'}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Details */}
            <div>
              <label className="block mb-2 text-gray-900 text-sm">Details</label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder={
                  logType === 'strength'
                    ? 'e.g., 3x10 @ 100kg, RPE 8'
                    : 'e.g., V7, sent on 3rd attempt'
                }
                rows={3}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <button
              onClick={handleAddLog}
              disabled={!exercise.trim() || !details.trim()}
              className="w-full py-3 bg-yellow-500 text-[#0E0E55] rounded-lg hover:bg-yellow-400 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Add to Session
            </button>
          </div>
        )}

        {/* Session Logs */}
        {logs.length > 0 && (
          <div>
            <h3 className="text-[#546373] mb-3">Session Log ({logs.length})</h3>
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-md">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      log.type === 'strength' ? 'bg-yellow-100' : 'bg-yellow-100'
                    }`}>
                      {log.type === 'strength' ? (
                        <Dumbbell className={`w-5 h-5 ${log.type === 'strength' ? 'text-yellow-600' : 'text-yellow-600'}`} />
                      ) : (
                        <Mountain className={`w-5 h-5 text-yellow-600`} />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-900">{log.exercise}</span>
                        <span className="text-gray-500 text-xs font-mono">
                          {formatTime(log.timestamp)}
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm">{log.details}</p>
                      <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs ${
                        log.type === 'strength'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {log.type === 'strength' ? 'Strength' : 'Climbing'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {logs.length === 0 && !showAddLog && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">💪</span>
            </div>
            <p className="text-[#0E0E55] mb-1">No exercises logged yet</p>
            <p className="text-gray-600 text-sm">Add exercises as you complete them during your session</p>
          </div>
        )}
      </div>
    </div>
  );
}