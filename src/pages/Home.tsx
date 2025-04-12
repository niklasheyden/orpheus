import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Headphones, Share2, Sparkles, Search, FileUp, AudioWaveform as Waveform, ChevronDown, Filter, Compass, Mic, Upload } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { useQuery } from '@tanstack/react-query';
import type { Podcast } from '../lib/types';
import PodcastCard from '../components/PodcastCard';
import { RESEARCH_FIELDS, RESEARCH_FIELD_CATEGORIES } from '../lib/constants';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const handleCtaClick = () => {
    if (user) {
      navigate('/generate');
    } else {
      navigate('/auth');
    }
  };

  const { data: podcastsData, isLoading, error } = useQuery<Podcast[]>({
    queryKey: ['podcasts', searchTerm, selectedField],
    queryFn: async () => {
      try {
        let query = supabase
          .from('podcasts')
          .select('*')
          .order('created_at', { ascending: false });

        if (searchTerm) {
          query = query.or(`title.ilike.%${searchTerm}%,abstract.ilike.%${searchTerm}%,authors.ilike.%${searchTerm}%`);
        }

        if (selectedField) {
          query = query.eq('field_of_research', selectedField);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Error fetching podcasts:', error);
        throw error;
      }
    },
    retry: 3,
    retryDelay: 1000
  });

  useEffect(() => {
    if (podcastsData) {
      setPodcasts(podcastsData);
    }
  }, [podcastsData]);

  // Get the selected field name for display
  const selectedFieldName = selectedField || 'All Fields';

  // Quick filters - most popular fields
  const quickFilters = [
    { name: 'Computer Science', category: 'Computer Science & Technology' },
    { name: 'Artificial Intelligence', category: 'Computer Science & Technology' },
    { name: 'Biology', category: 'Life Sciences' },
    { name: 'Physics', category: 'Physical Sciences' },
    { name: 'Psychology', category: 'Social Sciences' }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Discover Research Podcasts</h1>

      {/* Hero Section */}
      <div className="relative overflow-hidden mb-32">
        <div className="absolute inset-0 bg-grid-slate-900 bg-[center_-1px] [mask-image:linear-gradient(0deg,transparent,black)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center">
            <h1 className="font-display text-4xl font-medium text-white sm:text-7xl">
              Transform Research Papers into{' '}
              <span className="relative whitespace-nowrap">
                <span className="bg-gradient-to-r from-sky-400 to-indigo-500 bg-clip-text text-transparent">
                  Engaging Podcasts
                </span>
              </span>
            </h1>
            <p className="mt-6 text-lg text-slate-400 max-w-2xl mx-auto">
              Orpheus uses AI to turn academic papers into high-quality audio content, making research more accessible and digestible.
            </p>
            <button
              onClick={handleCtaClick}
              className="mt-12 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-400 to-indigo-500 px-8 py-4 text-base font-semibold text-white transition-all hover:shadow-lg hover:shadow-sky-400/20"
            >
              <span className="mr-3">Generate a Podcast</span>
              <Sparkles className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-40">
        <div className="mx-auto max-w-2xl lg:max-w-none">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-medium text-white sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-slate-400">
              Transform your research into engaging audio content in three simple steps
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 text-center">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center shadow-xl shadow-fuchsia-500/20">
                  <Mic className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="pt-6">
                <h3 className="text-xl font-medium text-white mb-3">Record</h3>
                <p className="text-slate-400 leading-relaxed">Record a concise summary of your research paper, explaining the key findings and implications.</p>
              </div>
            </div>

            <div className="relative bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 text-center">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-xl shadow-sky-500/20">
                  <Upload className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="pt-6">
                <h3 className="text-xl font-medium text-white mb-3">Upload</h3>
                <p className="text-slate-400 leading-relaxed">Upload your recording along with the paper details to share it with the research community.</p>
              </div>
            </div>

            <div className="relative bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 text-center">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-500/20">
                  <Share2 className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="pt-6">
                <h3 className="text-xl font-medium text-white mb-3">Share</h3>
                <p className="text-slate-400 leading-relaxed">Share your research podcast with colleagues and discover other interesting research summaries.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-16">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl font-medium text-white">
            Discover Research Podcasts
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            Browse through our collection of AI-generated research podcasts
          </p>
        </div>

        <div className="mb-12">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search podcasts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50"
              />
            </div>
            <div className="relative">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-300 hover:text-white transition-colors flex items-center justify-between gap-2"
              >
                <span>{selectedField || 'All Fields'}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {showFilterDropdown && (
                <div className="absolute right-0 mt-1 w-64 bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-700/50 z-10 max-h-96 overflow-y-auto">
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setSelectedField(null);
                        setShowFilterDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-full text-sm ${
                        selectedField === null ? 'bg-fuchsia-500/20 text-fuchsia-300' : 'text-slate-300 hover:bg-slate-700/50'
                      }`}
                    >
                      All Fields
                    </button>
                    
                    {RESEARCH_FIELD_CATEGORIES.map((category) => (
                      <div key={category} className="mt-2">
                        <div className="px-3 py-1 text-xs font-medium text-slate-400 uppercase">{category}</div>
                        {RESEARCH_FIELDS.filter(field => field.category === category).map((field) => {
                          const Icon = field.icon;
                          return (
                            <button
                              key={field.id}
                              onClick={() => {
                                setSelectedField(field.name);
                                setShowFilterDropdown(false);
                              }}
                              className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-full text-sm ${
                                selectedField === field.name ? 'bg-fuchsia-500/20 text-fuchsia-300' : 'text-slate-300 hover:bg-slate-700/50'
                              }`}
                            >
                              <Icon size={16} className="text-fuchsia-400" />
                              {field.name}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Quick filters */}
          <div className="flex flex-wrap gap-2 mt-6 sm:mt-2">
            <span className="text-sm text-slate-400 mr-2">Quick filters:</span>
            {quickFilters.map((filter) => (
              <button
                key={filter.name}
                onClick={() => setSelectedField(selectedField === filter.name ? null : filter.name)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors
                  ${selectedField === filter.name
                    ? 'bg-fuchsia-500 text-white'
                    : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border border-slate-700/50'
                  }`}
              >
                {filter.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Podcasts Grid */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {podcasts.map((podcast) => (
            <PodcastCard key={podcast.id} podcast={podcast} />
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-16">
        <div className="relative rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-sky-400 to-indigo-500 opacity-10" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(0deg,transparent,black)]" />
          <div className="relative px-8 py-16">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-3xl font-medium tracking-tight text-white sm:text-4xl">
                Ready to transform your research?
              </h2>
              <p className="mt-4 text-lg text-slate-300">
                Join Orpheus today and start creating engaging audio content from your research papers.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                {user ? (
                  <button
                    onClick={() => navigate('/generate')}
                    className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-400/80 to-indigo-500/80 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:from-sky-400 hover:to-indigo-500 hover:shadow-sky-400/20"
                  >
                    <span className="mr-3">Generate Your First Podcast</span>
                    <Sparkles className="h-5 w-5" />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => navigate('/auth')}
                      className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-400/80 to-indigo-500/80 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:from-sky-400 hover:to-indigo-500 hover:shadow-sky-400/20"
                    >
                      <span className="mr-3">Get Started</span>
                      <Sparkles className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => navigate('/explore')}
                      className="inline-flex items-center justify-center rounded-full bg-slate-800/50 border border-slate-700/50 px-6 py-3 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-700/50 hover:text-white"
                    >
                      <span className="mr-3">Explore Podcasts</span>
                      <Compass className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;