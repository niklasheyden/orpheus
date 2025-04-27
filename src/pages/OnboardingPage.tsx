import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { RESEARCH_FIELDS } from '../lib/constants';
import { Upload, ChevronRight, X } from 'lucide-react';

const OnboardingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [inviteCodes, setInviteCodes] = useState<string[]>([]);
  
  // Form states
  const [name, setName] = useState('');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState({
    twitter: '',
    github: '',
    linkedin: '',
    website: ''
  });

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const generateInviteCodes = async () => {
    try {
      const codes = new Set<string>();
      const generateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      };
      
      while (codes.size < 5) {
        codes.add(generateCode());
      }

      const codesArray = Array.from(codes);
      const { error } = await supabase
        .from('invite_codes')
        .insert(codesArray.map(code => ({
          code,
          created_by: user?.id,
          is_used: false
        })));

      if (error) throw error;
      setInviteCodes(codesArray);
    } catch (error) {
      console.error('Error generating invite codes:', error);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Upload banner if selected
      let bannerUrl = '';
      if (bannerFile) {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('profile-banners')
          .upload(`${user.id}/${bannerFile.name}`, bannerFile);

        if (uploadError) throw uploadError;
        bannerUrl = uploadData.path;
      }

      // Update user profile
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: name,
          banner_url: bannerUrl || null,
          research_interests: selectedInterests,
          twitter_handle: platforms.twitter,
          github_handle: platforms.github,
          linkedin_url: platforms.linkedin,
          website_url: platforms.website,
          updated_at: new Date().toISOString()
        });

      if (updateError) throw updateError;

      // Generate invite codes
      await generateInviteCodes();

      // Navigate to final step
      setStep(4);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    if (step === 3) {
      handleSubmit();
    } else {
      setStep(step + 1);
    }
  };

  const handleNext = () => {
    if (step === 3) {
      handleSubmit();
    } else {
      setStep(step + 1);
    }
  };

  const handleComplete = () => {
    navigate(`/user/${user?.id}`);
  };

  return (
    <div className="min-h-screen bg-[#0B0F15] flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full space-y-8">
        {/* Step 1: Name */}
        {step === 1 && (
          <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700/50">
            <h2 className="text-2xl font-bold text-white mb-6">What's your name?</h2>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
            <div className="flex justify-between mt-8">
              <button
                onClick={handleSkip}
                className="text-slate-400 hover:text-white transition-colors"
              >
                Skip
              </button>
              <button
                onClick={handleNext}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-sky-400 to-indigo-500 text-white rounded-lg hover:shadow-lg hover:shadow-sky-400/20 transition-all"
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Banner */}
        {step === 2 && (
          <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700/50">
            <h2 className="text-2xl font-bold text-white mb-6">Add a banner image</h2>
            <div className="relative">
              {bannerPreview ? (
                <div className="relative">
                  <img
                    src={bannerPreview}
                    alt="Banner preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => {
                      setBannerFile(null);
                      setBannerPreview('');
                    }}
                    className="absolute top-2 right-2 p-1 bg-slate-900/80 rounded-full text-slate-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-700/50 rounded-lg cursor-pointer hover:border-sky-400/50 transition-colors">
                  <Upload className="h-8 w-8 text-slate-400" />
                  <span className="mt-2 text-sm text-slate-400">Upload banner image</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleBannerChange}
                  />
                </label>
              )}
            </div>
            <div className="flex justify-between mt-8">
              <button
                onClick={handleSkip}
                className="text-slate-400 hover:text-white transition-colors"
              >
                Skip
              </button>
              <button
                onClick={handleNext}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-sky-400 to-indigo-500 text-white rounded-lg hover:shadow-lg hover:shadow-sky-400/20 transition-all"
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Research Interests & Platforms */}
        {step === 3 && (
          <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700/50">
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Select your research interests</h2>
                <div className="flex flex-wrap gap-2">
                  {RESEARCH_FIELDS.map((field) => (
                    <button
                      key={field.id}
                      onClick={() => {
                        setSelectedInterests(prev =>
                          prev.includes(field.name)
                            ? prev.filter(i => i !== field.name)
                            : [...prev, field.name]
                        );
                      }}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        selectedInterests.includes(field.name)
                          ? 'bg-sky-400 text-white'
                          : 'bg-slate-900/50 text-slate-400 border border-slate-700/50 hover:text-white'
                      }`}
                    >
                      {field.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Add your platforms</h2>
                <div className="space-y-4">
                  <input
                    type="text"
                    value={platforms.twitter}
                    onChange={(e) => setPlatforms(prev => ({ ...prev, twitter: e.target.value }))}
                    placeholder="Twitter handle"
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                  <input
                    type="text"
                    value={platforms.github}
                    onChange={(e) => setPlatforms(prev => ({ ...prev, github: e.target.value }))}
                    placeholder="GitHub handle"
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                  <input
                    type="text"
                    value={platforms.linkedin}
                    onChange={(e) => setPlatforms(prev => ({ ...prev, linkedin: e.target.value }))}
                    placeholder="LinkedIn URL"
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                  <input
                    type="text"
                    value={platforms.website}
                    onChange={(e) => setPlatforms(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="Personal website URL"
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={handleSkip}
                className="text-slate-400 hover:text-white transition-colors"
              >
                Skip
              </button>
              <button
                onClick={handleNext}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-sky-400 to-indigo-500 text-white rounded-lg hover:shadow-lg hover:shadow-sky-400/20 transition-all disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Next'}
                <ChevronRight className="ml-2 h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Invite Codes */}
        {step === 4 && (
          <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700/50">
            <h2 className="text-2xl font-bold text-white mb-2">Your Invite Codes</h2>
            <p className="text-slate-400 mb-6">Share these codes with your peers to invite them to Orpheus</p>
            
            <div className="space-y-3">
              {inviteCodes.map((code, index) => (
                <div
                  key={code}
                  className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700/50"
                >
                  <code className="text-sky-400 font-mono">{code}</code>
                  <button
                    onClick={() => navigator.clipboard.writeText(code)}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    Copy
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={handleComplete}
                className="inline-flex items-center px-6 py-2 bg-gradient-to-r from-sky-400 to-indigo-500 text-white rounded-lg hover:shadow-lg hover:shadow-sky-400/20 transition-all"
              >
                Go to Profile
                <ChevronRight className="ml-2 h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingPage; 