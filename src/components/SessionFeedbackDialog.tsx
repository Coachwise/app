import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/button';
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
        <div className="bg-card rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-card border-b border-border rounded-t-lg">
            <h2 className="text-lg font-semibold text-foreground">
              {t('sessionFeedback')}
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-tint-2 rounded-lg transition-colors"
              disabled={loading}
            >
              <X className="w-5 h-5 text-foreground" />
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
            <Button variant="outline" disabled={loading} onClick={handleSkip} className="flex-1 h-12">
              {t('skip')}
            </Button>
            <Button variant="brand" loading={loading} onClick={handleSubmit} className="flex-1 h-12 font-bold">
              {t('finishSession')}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
