import { useEffect, useState } from 'react';
import { Upload, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Button } from './ui/button';
import { NumberInput } from './ui/number-input';
import { BackButton } from './ui/back-button';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import * as CoachesAPI from '../api/coaches';
import type { CoachApplication as CoachApplicationModel } from '../api/coaches';

interface CoachApplicationProps {
  onCancel: () => void;
  onSubmit: () => void;
}

export function CoachApplication({ onCancel, onSubmit }: CoachApplicationProps) {
  const { t } = useLanguage();
  const { tokens } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    specialty: '',
    experience: 0,
    certifications: '',
    bio: '',
    website: '',
    instagram: '',
  });
  const [documents, setDocuments] = useState<string[]>([]);
  const [application, setApplication] = useState<CoachApplicationModel | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load any existing application so we show its status instead of the form.
  useEffect(() => {
    const token = tokens?.access_token;
    if (!token) return;
    let cancelled = false;
    CoachesAPI.getMyApplication(token)
      .then((app) => {
        if (!cancelled) setApplication(app);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [tokens?.access_token]);

  const specialties = [
    'Powerlifting',
    'Olympic Weightlifting',
    'Bodybuilding',
    'CrossFit',
    'Rock Climbing',
    'Calisthenics',
    'General Fitness',
    'Sports Performance',
  ];

  const handleSubmit = async () => {
    const token = tokens?.access_token;
    if (!token || submitting) return;
    if (!formData.fullName.trim() || !formData.specialty || !formData.certifications.trim()) {
      setError(t('fillRequiredFields'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const created = await CoachesAPI.applyCoach(token, {
        full_name: formData.fullName.trim(),
        specialty: formData.specialty,
        experience_years: formData.experience || 0,
        certifications: formData.certifications.trim(),
        bio: formData.bio.trim() || undefined,
        website: formData.website.trim() || undefined,
        instagram: formData.instagram.trim() || undefined,
      });
      setApplication(created); // switch to the status view
      onSubmit?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setDocuments([...documents, e.target.files[0].name]);
    }
  };

  // Status view — shown once the user has an application (and it's not a
  // rejection they're re-applying from).
  if (application && application.status !== 'REJECTED') {
    const pending = application.status === 'PENDING';
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="bg-card border-b border-border px-4 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <BackButton onClick={onCancel} aria-label={t('back')} />
            <h2 className="text-foreground">{t('becomeACoach')}</h2>
            <div className="w-10" />
          </div>
        </div>
        <div className="p-4">
          <div className="bg-card rounded-lg shadow-md p-6 border border-gray-200 text-center">
            <div className={`w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center ${pending ? 'bg-yellow-100' : 'bg-green-100'}`}>
              {pending ? <Clock className="w-7 h-7 text-yellow-600" /> : <CheckCircle2 className="w-7 h-7 text-green-600" />}
            </div>
            <h3 className="text-foreground text-lg mb-2">{pending ? t('applicationPending') : t('applicationApproved')}</h3>
            <p className="text-gray-600 text-sm mb-4">{pending ? t('applicationPendingDesc') : t('applicationApprovedDesc')}</p>
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <span className="text-gray-500">{t('submissionId')}: </span>
              <span className="text-foreground font-mono break-all">{application.id}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <BackButton onClick={onCancel} aria-label={t('back')} />
          <h2 className="text-foreground">{t('becomeACoach')}</h2>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Rejection banner (re-applying) */}
        {application?.status === 'REJECTED' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-900">{t('applicationRejected')}</p>
              <p className="text-red-800 text-sm">{application.review_note || t('applicationRejectedDesc')}</p>
            </div>
          </div>
        )}

        {/* Info Banner */}
        <div className="bg-tint-soft border border-blue-200 rounded-lg p-4">
          <p className="text-blue-900 mb-2">{t('becomeCoachwiseCoach')}</p>
          <p className="text-blue-800 text-sm">
            {t('applicationsReviewed')}
          </p>
        </div>

        {/* Application Form */}
        <div className="bg-card rounded-lg shadow-md p-4 border border-gray-200">
          <h3 className="text-foreground mb-4">{t('applicationDetails')}</h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-foreground mb-2 block">{t('fullName')}</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tint focus:border-transparent text-foreground"
                placeholder={t('yourFullName')}
              />
            </div>

            {/* Specialty */}
            <div>
              <label className="block mb-2 text-gray-900">{t('primarySpecialty')}</label>
              <select
                value={formData.specialty}
                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                className="w-full px-4 py-3 bg-card border border-gray-300 rounded-lg focus:ring-2 focus:ring-tint focus:border-transparent"
              >
                <option value="">{t('selectSpecialty')}</option>
                {specialties.map(specialty => (
                  <option key={specialty} value={specialty}>{specialty}</option>
                ))}
              </select>
            </div>

            {/* Experience */}
            <div>
              <label className="block mb-2 text-gray-900">{t('yearsCoachingExp')}</label>
              <NumberInput
                min={0}
                value={formData.experience}
                onChange={(v) => setFormData({ ...formData, experience: v })}
                className="w-full"
              />
            </div>

            {/* Certifications */}
            <div>
              <label className="block mb-2 text-gray-900">{t('certifications')} *</label>
              <textarea
                value={formData.certifications}
                onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                placeholder={t('listCertifications')}
                rows={3}
                className="w-full px-4 py-3 bg-card border border-gray-300 rounded-lg focus:ring-2 focus:ring-tint focus:border-transparent resize-none"
              />
              <p className="text-gray-600 text-sm mt-1">
                {t('includeCertInfo')}
              </p>
            </div>

            {/* Bio */}
            <div>
              <label className="block mb-2 text-gray-900">{t('professionalBio')}</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder={t('coachingPhilosophy')}
                rows={5}
                className="w-full px-4 py-3 bg-card border border-gray-300 rounded-lg focus:ring-2 focus:ring-tint focus:border-transparent resize-none"
              />
            </div>

            {/* Document Upload */}
            <div>
              <label className="block mb-2 text-gray-900">{t('uploadCredentials')}</label>
              <div className="bg-card border-2 border-dashed border-gray-300 rounded-lg p-6">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                  onChange={handleFileUpload}
                />
                <label
                  htmlFor="file-upload"
                  className="flex flex-col items-center cursor-pointer"
                >
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-gray-900 mb-1">{t('uploadDocuments')}</span>
                  <span className="text-gray-600 text-sm">{t('pdfJpgPng')}</span>
                </label>
              </div>
              {documents.length > 0 && (
                <div className="mt-3 space-y-2">
                  {documents.map((doc, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-gray-700">{doc}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Social Links */}
            <div>
              <label className="block mb-2 text-gray-900">{t('websiteOptional')}</label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://yourwebsite.com"
                className="w-full px-4 py-3 bg-card border border-gray-300 rounded-lg focus:ring-2 focus:ring-tint focus:border-transparent"
              />
            </div>

            <div>
              <label className="block mb-2 text-gray-900">{t('instagramOptional')}</label>
              <input
                type="text"
                value={formData.instagram}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                placeholder="@yourusername"
                className="w-full px-4 py-3 bg-card border border-gray-300 rounded-lg focus:ring-2 focus:ring-tint focus:border-transparent"
              />
            </div>

            {/* Platform Fee Notice */}
            <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
              <p className="text-gray-900 mb-2">{t('platformFeeStructure')}</p>
              <p className="text-gray-700 text-sm mb-2">
                {t('platformFeeDesc')}
              </p>
              <p className="text-gray-600 text-sm">
                {t('platformFeeExample')}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg p-3">{error}</div>
            )}

            <Button variant="brand" size="block" loading={submitting} onClick={handleSubmit}>
              {application?.status === 'REJECTED' ? t('reapply') : t('submitApplication')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}