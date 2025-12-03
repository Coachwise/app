import { useState } from 'react';
import { ArrowLeft, Upload, CheckCircle2 } from 'lucide-react';

interface CoachApplicationProps {
  onCancel: () => void;
  onSubmit: () => void;
}

export function CoachApplication({ onCancel, onSubmit }: CoachApplicationProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    specialty: '',
    experience: '',
    certifications: '',
    bio: '',
    website: '',
    instagram: '',
  });
  const [documents, setDocuments] = useState<string[]>([]);

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

  const handleSubmit = () => {
    // Mock submit - would send to backend for Coachwise approval
    onSubmit();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Mock file upload
    if (e.target.files && e.target.files.length > 0) {
      setDocuments([...documents, e.target.files[0].name]);
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
          <h2 className="text-white">Become a Coach</h2>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-900 mb-2">Become a Coachwise Coach</p>
          <p className="text-blue-800 text-sm">
            Applications are reviewed within 48 hours. We'll verify your credentials and notify you via email.
          </p>
        </div>

        {/* Application Form */}
        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
          <h3 className="text-[#3D3D3D] mb-4">Application Details</h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-[#3D3D3D] mb-2 block">Full Name</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-[#3D3D3D]"
                placeholder="Your full name"
              />
            </div>

            {/* Specialty */}
            <div>
              <label className="block mb-2 text-gray-900">Primary Specialty *</label>
              <select
                value={formData.specialty}
                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select specialty...</option>
                {specialties.map(specialty => (
                  <option key={specialty} value={specialty}>{specialty}</option>
                ))}
              </select>
            </div>

            {/* Experience */}
            <div>
              <label className="block mb-2 text-gray-900">Years of Coaching Experience *</label>
              <input
                type="number"
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                placeholder="e.g., 5"
                min="0"
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Certifications */}
            <div>
              <label className="block mb-2 text-gray-900">Certifications *</label>
              <textarea
                value={formData.certifications}
                onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                placeholder="List your certifications (e.g., NSCA-CSCS, USAC Level 2, etc.)"
                rows={3}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <p className="text-gray-600 text-sm mt-1">
                Include certification name, issuing organization, and year obtained
              </p>
            </div>

            {/* Bio */}
            <div>
              <label className="block mb-2 text-gray-900">Professional Bio *</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us about your coaching philosophy and experience..."
                rows={5}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Document Upload */}
            <div>
              <label className="block mb-2 text-gray-900">Upload Credentials</label>
              <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-6">
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
                  <span className="text-gray-900 mb-1">Upload Documents</span>
                  <span className="text-gray-600 text-sm">PDF, JPG, or PNG (Max 10MB)</span>
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
              <label className="block mb-2 text-gray-900">Website (Optional)</label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://yourwebsite.com"
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block mb-2 text-gray-900">Instagram (Optional)</label>
              <input
                type="text"
                value={formData.instagram}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                placeholder="@yourusername"
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Platform Fee Notice */}
            <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
              <p className="text-gray-900 mb-2">Platform Fee Structure</p>
              <p className="text-gray-700 text-sm mb-2">
                Coachwise charges a 5% platform fee plus payment processing fees on all earnings.
              </p>
              <p className="text-gray-600 text-sm">
                Example: If you charge $100/month, you receive $93 after fees.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}