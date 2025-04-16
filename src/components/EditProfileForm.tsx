import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User, Building2, BookOpen, Image as ImageIcon } from 'lucide-react';
import type { Profile } from '../lib/types';

const BANNER_OPTIONS = [
  {
    id: 'neurons',
    name: 'Neural Networks',
    background: 'bg-[url("/images/banners/neurons.jpg")]'
  },
  {
    id: 'dna',
    name: 'DNA Structure',
    background: 'bg-[url("/images/banners/dna.jpg")]'
  },
  {
    id: 'space',
    name: 'Deep Space',
    background: 'bg-[url("/images/banners/space.jpg")]'
  },
  {
    id: 'molecules',
    name: 'Molecular Structure',
    background: 'bg-[url("/images/banners/molecules.jpg")]'
  }
];

interface EditProfileFormProps {
  profile: Profile;
  onClose: () => void;
  isPublicProfile?: boolean;
}

const EditProfileForm = ({ profile, onClose, isPublicProfile = false }: EditProfileFormProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: profile.name || '',
    affiliation: profile.affiliation || '',
    research_interests: profile.research_interests || '',
    banner_background: profile.banner_background || BANNER_OPTIONS[0].background
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !event.target.files || event.target.files.length === 0) return;

    try {
      setIsUploading(true);
      setError(null);

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setError(error instanceof Error ? error.message : 'Error uploading avatar');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsSaving(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          affiliation: formData.affiliation,
          research_interests: formData.research_interests,
          banner_background: formData.banner_background
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
      queryClient.invalidateQueries({ queryKey: ['public-profile', user.id] });
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error instanceof Error ? error.message : 'Error updating profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar Upload */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Profile Photo</label>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-700/50">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-slate-400 m-auto mt-5" />
            )}
          </div>
          <label className="cursor-pointer">
            <span className="px-4 py-2 rounded-xl bg-slate-700/50 hover:bg-slate-600/50 text-slate-200 font-medium flex items-center gap-2 transition-colors">
              <ImageIcon className="w-4 h-4" />
              Choose Photo
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              disabled={isUploading}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Banner Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Profile Banner</label>
        <div className="grid grid-cols-2 gap-4">
          {BANNER_OPTIONS.map(banner => (
            <button
              key={banner.id}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, banner_background: banner.background }))}
              className={`
                relative h-24 rounded-xl overflow-hidden border-2 transition-all
                ${formData.banner_background === banner.background 
                  ? 'border-fuchsia-500 ring-2 ring-fuchsia-500/20' 
                  : 'border-transparent hover:border-slate-600'
                }
              `}
            >
              <div className={`absolute inset-0 ${banner.background} bg-cover bg-center`} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <span className="absolute bottom-2 left-2 text-sm text-white font-medium">
                {banner.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Basic Info */}
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500"
            placeholder="Your full name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Affiliation</label>
          <input
            type="text"
            name="affiliation"
            value={formData.affiliation}
            onChange={handleInputChange}
            className="w-full px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500"
            placeholder="Your institution or organization"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Research Interests</label>
          <input
            type="text"
            name="research_interests"
            value={formData.research_interests}
            onChange={handleInputChange}
            className="w-full px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500"
            placeholder="e.g. Machine Learning, Quantum Computing, Neuroscience"
          />
          <p className="mt-1 text-sm text-slate-400">Separate multiple interests with commas</p>
        </div>
      </div>

      {error && (
        <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl bg-slate-700/50 hover:bg-slate-600/50 text-slate-200 font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="px-4 py-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSaving && (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" />
          )}
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

export default EditProfileForm; 