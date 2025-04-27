import React, { useState, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { X, User, Link, Briefcase, BookOpen, Globe2, Github, Linkedin, Instagram, GraduationCap, Upload, Image as ImageIcon } from 'lucide-react';
import type { Profile } from '../lib/types';

interface EditProfileModalProps {
  profile: Profile;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

// Banner backgrounds inspired by scientific themes
const BANNER_OPTIONS = [
  { id: 'neurons', url: '/images/banners/neurons.jpg', label: 'Neurons' },
  { id: 'dna', url: '/images/banners/dna.jpg', label: 'DNA' },
  { id: 'space', url: '/images/banners/space.jpg', label: 'Space' },
  { id: 'molecules', url: '/images/banners/molecules.jpg', label: 'Molecules' },
];

const EditProfileModal: React.FC<EditProfileModalProps> = ({ profile, isOpen, onClose, onUpdate }) => {
  const { user } = useAuth();

  // Helper function for formatting research interests
  const formatInitialResearchInterests = (interests: string): string => {
    try {
      // Check if it's a JSON string array
      if (interests.startsWith('[') && interests.endsWith(']')) {
        const parsed = JSON.parse(interests);
        if (Array.isArray(parsed)) {
          return parsed
            .map(interest => {
              // Replace hyphens with spaces and split into words
              return interest
                .replace(/-/g, ' ')
                .split(' ')
                .map((word: string) => {
                  // Preserve existing capitalization for acronyms
                  if (word.replace(/[^A-Z]/g, '').length >= 2) {
                    return word;
                  }
                  return word.charAt(0).toUpperCase() + word.slice(1);
                })
                .join(' ');
            })
            .join(', ');
        }
      }
      // If not a JSON array or parsing fails, return as is
      return interests;
    } catch {
      // If JSON parsing fails, return as is
      return interests;
    }
  };

  const [formData, setFormData] = useState({
    name: profile.name || '',
    affiliation: profile.affiliation || '',
    bio: profile.bio || '',
    research_interests: formatInitialResearchInterests(profile.research_interests || ''),
    website: profile.website || '',
    github: profile.github || '',
    linkedin: profile.linkedin || '',
    instagram: profile.instagram || '',
    research_gate: profile.research_gate || '',
    banner_background: profile.banner_background || BANNER_OPTIONS[0].id,
    custom_banner_url: profile.custom_banner_url || '',
    avatar_url: profile.avatar_url || '',
    status: profile.status || 'PhD Student',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [isCustomBanner, setIsCustomBanner] = useState(!!profile.custom_banner_url);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Special handling for research interests to clean the format
    if (name === 'research_interests') {
      // Split by comma, clean each interest, and join back
      const cleanedInterests = value
        .split(',')
        .map(interest => interest.trim())
        .filter(interest => interest.length > 0)
        .join(', ');
      setFormData(prev => ({ ...prev, [name]: cleanedInterests }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleBannerOptionChange = (optionId: string) => {
    setFormData(prev => ({ 
      ...prev, 
      banner_background: optionId,
      custom_banner_url: '' 
    }));
    setIsCustomBanner(false);
    setBannerPreview(null);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview and store as base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setAvatarPreview(base64String);
      // Store the base64 string in formData
      setFormData(prev => ({ ...prev, avatar_url: base64String }));
    };
    reader.readAsDataURL(file);
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview and store as base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setBannerPreview(base64String);
      // Store the base64 string in formData
      setFormData(prev => ({ 
        ...prev, 
        banner_background: base64String,
        custom_banner_url: '' // Clear any previous custom URL
      }));
      setIsCustomBanner(true);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Validate URLs
      const urlFields = ['website', 'linkedin', 'research_gate'];
      for (const field of urlFields) {
        const value = formData[field as keyof typeof formData];
        if (value && !validateUrl(value)) {
          throw new Error(`Please enter a valid URL for ${field}`);
        }
      }

      // Update profile in Supabase
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          affiliation: formData.affiliation,
          bio: formData.bio,
          research_interests: formData.research_interests,
          website: formData.website,
          github: formData.github,
          linkedin: formData.linkedin,
          instagram: formData.instagram,
          research_gate: formData.research_gate,
          banner_background: formData.banner_background,
          custom_banner_url: formData.custom_banner_url,
          avatar_url: formData.avatar_url,
          status: formData.status,
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      onUpdate();
      onClose();
    } catch (err: any) {
      console.error('Profile update error:', err);
      setError(err.message || 'An error occurred while updating your profile');
    } finally {
      setIsLoading(false);
    }
  };

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative w-full max-w-2xl bg-slate-900 rounded-xl border border-slate-800/50 shadow-xl">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-display font-medium text-white">Edit Profile</h2>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Image Upload */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-200">
                  Profile Image
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-slate-700/50">
                    <img
                      src={avatarPreview || profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'User')}&background=0B0F15&color=fff`}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <input
                      type="file"
                      ref={avatarInputRef}
                      onChange={handleAvatarUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="inline-flex items-center px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Image
                    </button>
                    <p className="mt-1 text-xs text-slate-400">
                      Recommended: Square image, at least 200x200px
                    </p>
                  </div>
                </div>
              </div>

              {/* Banner Image Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-200">
                  Banner Image
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {BANNER_OPTIONS.map((option) => (
                    <div
                      key={option.id}
                      className={`relative aspect-video rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                        formData.banner_background === option.id && !isCustomBanner
                          ? 'border-blue-500 ring-2 ring-blue-500/20'
                          : 'border-slate-700/50 hover:border-slate-600/50'
                      }`}
                      onClick={() => handleBannerOptionChange(option.id)}
                    >
                      <img
                        src={option.url}
                        alt={option.label}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2">
                        <span className="text-xs text-white font-medium">{option.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Custom Banner Upload */}
                <div className="mt-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      ref={bannerInputRef}
                      onChange={handleBannerUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => bannerInputRef.current?.click()}
                      className="inline-flex items-center px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Custom Banner
                    </button>
                    <span className="text-xs text-slate-400">or</span>
                    <input
                      type="text"
                      name="custom_banner_url"
                      value={formData.custom_banner_url}
                      onChange={handleChange}
                      placeholder="Enter image URL"
                      className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  {bannerPreview && (
                    <div className="mt-3 relative aspect-video rounded-lg overflow-hidden border border-slate-700/50">
                      <img
                        src={bannerPreview}
                        alt="Custom Banner Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2">
                        <span className="text-xs text-white font-medium">Custom Banner</span>
                      </div>
                    </div>
                  )}
                  <p className="mt-1 text-xs text-slate-400">
                    Recommended: 1920x1080px or similar 16:9 aspect ratio
                  </p>
                </div>
              </div>

              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white">Basic Information</h3>
                
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-200 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-slate-300">
                    Role
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="PhD Student">PhD Student</option>
                    <option value="Master's Student">Master's Student</option>
                    <option value="Postdoctoral Researcher">Postdoctoral Researcher</option>
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Professor">Professor</option>
                    <option value="Research Scientist">Research Scientist</option>
                    <option value="Industry Professional">Industry Professional</option>
                    <option value="Data Scientist">Data Scientist</option>
                    <option value="Software Engineer">Software Engineer</option>
                    <option value="Independent Researcher">Independent Researcher</option>
                    <option value="Science Communicator">Science Communicator</option>
                    <option value="Science Educator">Science Educator</option>
                    <option value="Retired Researcher">Retired Researcher</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="affiliation" className="block text-sm font-medium text-slate-200 mb-1">
                    Affiliation
                  </label>
                  <input
                    type="text"
                    id="affiliation"
                    name="affiliation"
                    value={formData.affiliation}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Bio
                  </label>
                  <div className="relative">
                    <textarea
                      name="bio"
                      value={formData.bio || ''}
                      onChange={handleChange}
                      maxLength={400}
                      rows={4}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Tell others about yourself"
                    />
                    <div className="absolute bottom-2 right-2 text-xs text-slate-400">
                      {(formData.bio?.length || 0)}/400
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    Keep it concise - this will be displayed in your profile's About section.
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">
                    Research Interests
                  </label>
                  <input
                    type="text"
                    name="research_interests"
                    value={formData.research_interests}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g. Machine Learning, Quantum Computing, Neuroscience"
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    Separate multiple interests with commas. Each interest will be displayed as a tag on your profile.
                  </p>
                </div>
              </div>

              {/* Social Links */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white">Social Links</h3>
                
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">
                    Website
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Globe2 className="w-4 h-4 text-slate-500" />
                    </div>
                    <input
                      type="text"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="https://your-website.com"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">
                    GitHub
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Github className="w-4 h-4 text-slate-500" />
                    </div>
                    <input
                      type="text"
                      name="github"
                      value={formData.github}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="username"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">
                    LinkedIn
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Linkedin className="w-4 h-4 text-slate-500" />
                    </div>
                    <input
                      type="text"
                      name="linkedin"
                      value={formData.linkedin}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">
                    Instagram
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Instagram className="w-4 h-4 text-slate-500" />
                    </div>
                    <input
                      type="text"
                      name="instagram"
                      value={formData.instagram}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="username"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">
                    Research Gate
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <GraduationCap className="w-4 h-4 text-slate-500" />
                    </div>
                    <input
                      type="text"
                      name="research_gate"
                      value={formData.research_gate}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="https://www.researchgate.net/profile/username"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="relative px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-sky-500 to-indigo-500 rounded-lg hover:from-sky-400 hover:to-indigo-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <span className="absolute inset-0 flex items-center justify-center">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      </span>
                      <span className="opacity-0">Save Changes</span>
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal; 