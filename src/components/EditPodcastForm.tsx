import React, { useState } from 'react';
import { X, Globe, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from './Toast';
import { RESEARCH_FIELDS } from '../lib/constants';
import type { Podcast } from '../lib/types';

interface EditPodcastFormProps {
  podcast: Podcast;
  onClose: () => void;
}

const EditPodcastForm = ({ podcast, onClose }: EditPodcastFormProps) => {
  const { showToast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: podcast.title,
    abstract: podcast.abstract,
    authors: podcast.authors,
    publishing_year: podcast.publishing_year,
    field_of_research: podcast.field_of_research,
    keywords: podcast.keywords,
    doi: podcast.doi || '',
    is_public: podcast.is_public
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const { error: updateError } = await supabase
        .from('podcasts')
        .update({
          title: formData.title,
          abstract: formData.abstract,
          authors: formData.authors,
          publishing_year: parseInt(formData.publishing_year.toString()),
          field_of_research: formData.field_of_research,
          keywords: formData.keywords,
          doi: formData.doi || null,
          is_public: formData.is_public
        })
        .eq('id', podcast.id);

      if (updateError) throw updateError;

      showToast('Podcast updated successfully');
      onClose();
    } catch (err) {
      console.error('Error updating podcast:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while updating the podcast');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 51 }, (_, i) => currentYear - i);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900/90 rounded-2xl border border-slate-700/50 p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-medium text-white">Edit Podcast</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-slate-300">Basic Information</h4>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-transparent"
                  placeholder="Enter the title of your research"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Abstract
                </label>
                <textarea
                  name="abstract"
                  value={formData.abstract}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-transparent"
                  placeholder="Enter the abstract of your research"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Authors
                </label>
                <input
                  type="text"
                  name="authors"
                  value={formData.authors}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-transparent"
                  placeholder="Enter the authors' names"
                  required
                />
              </div>
            </div>
          </div>

          {/* Research Details */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-slate-300">Research Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Publishing Year
                </label>
                <select
                  name="publishing_year"
                  value={formData.publishing_year}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-transparent"
                  required
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Research Field
                </label>
                <select
                  name="field_of_research"
                  value={formData.field_of_research}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-transparent"
                  required
                >
                  {RESEARCH_FIELDS.map((field) => (
                    <option key={field.id} value={field.name}>
                      {field.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Keywords
              </label>
              <input
                type="text"
                name="keywords"
                value={formData.keywords}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-transparent"
                placeholder="Enter keywords separated by commas"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                DOI (Optional)
              </label>
              <input
                type="text"
                name="doi"
                value={formData.doi}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-transparent"
                placeholder="Enter the DOI of your research"
              />
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-slate-300">Privacy Settings</h4>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, is_public: true }))}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl border transition-colors ${
                  formData.is_public
                    ? 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20'
                    : 'bg-slate-800/50 text-slate-400 border-slate-700/50 hover:bg-slate-700/50'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>Public</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, is_public: false }))}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl border transition-colors ${
                  !formData.is_public
                    ? 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20'
                    : 'bg-slate-800/50 text-slate-400 border-slate-700/50 hover:bg-slate-700/50'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>Private</span>
              </button>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-fuchsia-500 text-white text-sm font-medium rounded-xl hover:bg-fuchsia-600 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPodcastForm;