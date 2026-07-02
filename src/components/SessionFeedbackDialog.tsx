import { useState } from 'react';
import { X } from 'lucide-react';
import { HeatSlider, StarRating } from './ui';
import { useLanguage } from '../contexts/LanguageContext';

interface SessionFeedbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: SessionFeedback) => void;
  loading?: boolean;
}

export interface SessionFeedback {
  intensity: number;
  quality: number;
  notes: string;
}

export function SessionFeedbackDialog({
  isOpen,
  onClose,
  onSubmit,
  loading = false
}: SessionFeedbackDialogProps) {
  const { t } = useLanguage();
  const [intensity, setIntensity] = useState(5);
  const [quality, setQuality] = useState(3); // Default to 3 out of 5
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    onSubmit({
      intensity,
      quality,
      notes: notes.trim()
    });
  };

  const handleSkip = () => {
    // Submit with default values
    onSubmit({
      intensity: 5,
      quality: 3, // Middle rating out of 5
      notes: ''
    });
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        style={{ zIndex: 9998 }}
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-[#0E0E55] rounded-t-lg">
            <h2 className="text-lg font-semibold text-white">
              {t('sessionFeedback')}
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-[#1A1A6E] rounded-lg transition-colors"
              disabled={loading}
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Intensity */}
            <div>
              <HeatSlider
                value={intensity}
                onChange={setIntensity}
                label={t('howIntenseSession')}
                min={1}
                max={10}
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('rateEffortDifficulty')}
              </p>
            </div>

            {/* Quality */}
            <div>
              <StarRating
                value={quality}
                onChange={setQuality}
                label={t('howRateSession')}
                max={5}
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('overallSatisfaction')}
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-medium text-gray-700 mb-2 block">
                {t('sessionNotesOptional')}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('howDidYouFeel')}
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none text-sm"
                disabled={loading}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 p-4 bg-gray-50 rounded-b-lg">
            <button
              onClick={handleSkip}
              disabled={loading}
              className="flex-1 px-4 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {t('skip')}
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-yellow-500 text-[#0E0E55] rounded-lg hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold"
            >
              {loading ? t('saving') : t('finishSession')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
