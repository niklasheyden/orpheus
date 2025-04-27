import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Share2, ChevronRight, CheckCircle2, User, Building2, GraduationCap, Image, BookOpen, Microscope } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { RESEARCH_FIELDS, RESEARCH_FIELD_CATEGORIES } from '../lib/constants';

const BANNER_BACKGROUNDS = [
  'neurons',
  'dna',
  'space',
  'molecules',
];

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    affiliation: '',
    status: 'PhD Student',
    bio: '',
    research_interests: [] as string[],
    banner_background: 'neurons',
    custom_banner_url: null as string | null,
    notifications: true
  });

  const statusOptions = [
    'PhD Student',
    "Master's Student",
    'Postdoctoral Researcher',
    'Assistant Professor',
    'Associate Professor',
    'Professor',
    'Research Scientist',
    'Industry Professional',
    'Data Scientist',
    'Software Engineer',
    'Independent Researcher',
    'Science Communicator',
    'Science Educator',
    'Retired Researcher'
  ];

  const handleInterestToggle = (fieldId: string) => {
    setFormData(prev => ({
      ...prev,
      research_interests: prev.research_interests.includes(fieldId)
        ? prev.research_interests.filter(id => id !== fieldId)
        : [...prev.research_interests, fieldId]
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBannerSelect = (banner: string) => {
    setFormData(prev => ({
      ...prev,
      banner_background: banner,
      custom_banner_url: null
    }));
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setFormData(prev => ({
          ...prev,
          banner_background: base64
        }));
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error handling banner:', error);
    }
  };

  const handleComplete = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Save all user information to profile
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          affiliation: formData.affiliation,
          status: formData.status,
          bio: formData.bio,
          research_interests: formData.research_interests,
          banner_background: formData.banner_background,
          notifications_enabled: formData.notifications,
          onboarding_completed: true
        })
        .eq('id', user.id);

      if (error) throw error;

      // Redirect to user's specific profile page
      navigate(`/user/${user.id}`);
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  const steps = [
    {
      title: "Welcome to Orpheus",
      description: "Let's personalize your experience in a few quick steps",
      icon: <Sparkles className="w-8 h-8 text-sky-400" />
    },
    {
      title: "Tell Us About Yourself",
      description: "Help us personalize your experience",
      icon: <User className="w-8 h-8 text-indigo-400" />
    },
    {
      title: "Research Interests",
      description: "Select the research topics that interest you most",
      icon: <Microscope className="w-8 h-8 text-emerald-400" />
    },
    {
      title: "Choose Your Banner",
      description: "Select a banner image for your profile",
      icon: <Image className="w-8 h-8 text-purple-400" />
    },
    {
      title: "You're All Set!",
      description: "Your profile is ready! Start by uploading your first podcast.",
      icon: <Share2 className="w-8 h-8 text-emerald-400" />
    }
  ];

  const canProceed = () => {
    switch (step) {
      case 1:
        return true;
      case 2:
        return formData.name && formData.affiliation && formData.status;
      case 3:
        return formData.research_interests.length > 0;
      case 4:
        return formData.banner_background || formData.custom_banner_url;
      default:
        return true;
    }
  };

  // Scroll to top when step changes
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  return (
    <div className="min-h-screen bg-slate-950 text-white py-12">
      {/* Progress bar */}
      <div className="max-w-4xl mx-auto px-4 mb-12">
        <div className="h-1 bg-slate-800 rounded-full">
          <motion.div
            className="h-full bg-sky-400 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${(step / steps.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* Step header */}
            <div className="text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="w-16 h-16 mx-auto rounded-full bg-slate-800/50 flex items-center justify-center"
              >
                {steps[step - 1].icon}
              </motion.div>
              <h1 className="text-3xl font-bold">{steps[step - 1].title}</h1>
              <p className="text-slate-400">{steps[step - 1].description}</p>
            </div>

            {/* Step content */}
            <div className="mt-12">
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center space-y-6"
                >
                  <p className="text-lg text-slate-300">
                    Welcome to Orpheus, where research meets audio. We'll help you set up your profile and customize your experience.
                  </p>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6 max-w-lg mx-auto"
                >
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                      placeholder="Enter your name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Affiliation</label>
                    <input
                      type="text"
                      name="affiliation"
                      value={formData.affiliation}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                      placeholder="University or Institution"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Current Role</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      {statusOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Bio (optional)</label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 h-32"
                      placeholder="Tell us about yourself and your research interests"
                    />
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    {RESEARCH_FIELD_CATEGORIES.map(category => (
                      <div key={category} className="space-y-2">
                        <h3 className="text-sm font-medium text-slate-400">{category}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {RESEARCH_FIELDS
                            .filter(field => field.category === category)
                            .map(field => {
                              const Icon = field.icon;
                              return (
                                <button
                                  key={field.id}
                                  onClick={() => handleInterestToggle(field.id)}
                                  className={`flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer group ${
                                    formData.research_interests.includes(field.id)
                                      ? 'bg-sky-500/10 border border-sky-500/50 text-sky-400'
                                      : 'bg-slate-800/50 border border-slate-700 hover:border-sky-500/50 text-slate-300'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <Icon className="w-5 h-5" />
                                    <span className="text-sm">{field.name}</span>
                                  </div>
                                  {formData.research_interests.includes(field.id) && (
                                    <CheckCircle2 className="w-4 h-4 ml-auto" />
                                  )}
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {BANNER_BACKGROUNDS.map(banner => (
                      <button
                        key={banner}
                        onClick={() => handleBannerSelect(banner)}
                        className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                          formData.banner_background === banner
                            ? 'border-sky-500 ring-2 ring-sky-500/20'
                            : 'border-slate-700/50 hover:border-sky-500/50'
                        }`}
                      >
                        <img
                          src={`/images/banners/${banner}.jpg`}
                          alt={banner}
                          className="w-full h-full object-cover"
                        />
                        {formData.banner_background === banner && (
                          <div className="absolute inset-0 bg-sky-500/10 flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6 text-sky-400" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="text-center">
                    <p className="text-slate-400 mb-4">Or upload your own banner</p>
                    <label className="inline-flex items-center px-4 py-2 bg-slate-800/80 border border-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors">
                      <Image className="w-4 h-4 mr-2 text-slate-400" />
                      <span className="text-sm text-slate-300">Choose Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBannerUpload}
                        className="hidden"
                      />
                    </label>
                    {formData.banner_background && !BANNER_BACKGROUNDS.includes(formData.banner_background) && (
                      <div className="mt-4">
                        <img
                          src={formData.banner_background}
                          alt="Custom banner"
                          className="max-w-md mx-auto rounded-lg border-2 border-sky-500"
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* {step === 5 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center space-y-6"
                >
                  <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </div>
                  <p className="text-lg text-slate-300">
                    Your profile is ready! Let's start exploring research podcasts.
                  </p>
                </motion.div>
              )} */}
            </div>

            {/* Navigation */}
            <div className="flex flex-col items-center pt-8 space-y-4">
              <div className="w-full flex justify-between items-center">
                {step > 1 && step < steps.length && (
                  <button
                    onClick={() => setStep(step - 1)}
                    className="px-6 py-2 text-slate-400 hover:text-white transition-colors"
                  >
                    Back
                  </button>
                )}
                <div className="flex-1"></div>
                {step < steps.length && (
                  <button
                    onClick={() => setStep(step + 1)}
                    disabled={!canProceed()}
                    className={`inline-flex items-center px-6 py-2 rounded-lg ${
                      canProceed()
                        ? 'bg-sky-500 text-white hover:bg-sky-400'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    } transition-colors`}
                  >
                    Continue
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </button>
                )}
              </div>
              {step === steps.length && (
                <button
                  onClick={handleComplete}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-400 to-indigo-500 text-white rounded-full px-8 py-3 font-medium hover:shadow-lg hover:shadow-sky-400/20 transition-all"
                >
                  Get Started
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Onboarding;