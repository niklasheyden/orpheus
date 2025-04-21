import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Headphones, Share2, Sparkles, Search, FileUp, AudioWaveform as Waveform, ChevronDown, Filter, Compass, Mic, Upload, TrendingUp, Lock, User, ListMusic, BookOpen, Users, PlayCircle, Plus, ArrowRight } from 'lucide-react';
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
  const [showHeroVisual, setShowHeroVisual] = useState(false);
  const [showDiscoverSection, setShowDiscoverSection] = useState(false);

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

  const { data: randomPodcast } = useQuery<Podcast>({
    queryKey: ['random-podcast'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('podcasts')
          .select('*')
          .eq('is_public', true)
          .limit(1)
          .single();
          
        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error fetching random podcast:', error);
        throw error;
      }
    }
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
      {/* Hero Section */}
      <div className="relative overflow-hidden mb-32">
        <div className="absolute inset-0 bg-grid-slate-900 bg-[center_-1px] [mask-image:linear-gradient(0deg,transparent,black)]" />
        <div className="relative flex items-center justify-center min-h-[calc(100vh-5rem)] mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            <div className="text-center lg:text-left">
              <h1 className="font-display text-4xl font-medium text-white sm:text-6xl">
                Turn Research Papers into{' '}
                <span className="relative whitespace-nowrap">
                  <span className="bg-gradient-to-r from-sky-400 to-indigo-500 bg-clip-text text-transparent">
                    Engaging Podcasts
                  </span>
                </span>
              </h1>
              <p className="mt-6 text-lg text-slate-400">
                Orpheus uses AI to turn academic papers into high-quality audio content, making research more accessible and digestible.
              </p>
              <Link
                to="/waitlist"
                className="mt-12 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-400 to-indigo-500 px-8 py-4 text-base font-semibold text-white transition-all hover:shadow-lg hover:shadow-sky-400/20"
              >
                <span className="mr-3">Generate a Podcast</span>
                <Sparkles className="h-6 w-6" />
              </Link>
            </div>

            <div className="relative flex items-center justify-center">
              {/* Background gradient circles */}
              <div className="absolute -inset-4">
                <div className="w-full h-full max-w-full">
                  <div className="absolute left-1/4 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-sky-400/30 to-indigo-500/30 opacity-50 blur-xl" />
                  <div className="absolute right-1/4 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-indigo-500/30 to-sky-400/30 opacity-50 blur-xl" />
                </div>
              </div>

              {/* Podcast card */}
              <div className="relative w-full max-w-md">
                {randomPodcast && (
                  <>
                    <PodcastCard podcast={randomPodcast} />
                    {/* Play button indicator */}
                    <div className="absolute -bottom-6 right-8 transform flex items-start gap-3">
                      <span className="text-sm text-fuchsia-400/70 mt-5">
                        Listen to a sample
                      </span>
                      {/* Curved arrow */}
                      <svg 
                        width="80" 
                        height="32" 
                        viewBox="0 0 80 32" 
                        className="text-fuchsia-400/70"
                      >
                        <path 
                          d="M0,32 C20,32 40,24 60,0" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          fill="none" 
                          strokeDasharray="4 4"
                          className="animate-pulse"
                        />
                        <path 
                          d="M52,4 L60,0 L58,10" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          fill="none"
                          className="animate-pulse"
                        />
                      </svg>
                    </div>
                  </>
                )}
              </div>
            </div>
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
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="pt-6">
                <h3 className="text-xl font-medium text-white mb-3">Generate Podcast</h3>
                <p className="text-slate-400 leading-relaxed">Upload your research paper, and our AI transforms it into an engaging podcast in just a minute.</p>
              </div>
            </div>

            <div className="relative bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 text-center">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-xl shadow-sky-500/20">
                  <Share2 className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="pt-6">
                <h3 className="text-xl font-medium text-white mb-3">Publish & Share</h3>
                <p className="text-slate-400 leading-relaxed">Easily publish your podcast and share it with your network to reach a broader audience.</p>
              </div>
            </div>

            <div className="relative bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 text-center">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-500/20">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="pt-6">
                <h3 className="text-xl font-medium text-white mb-3">Amplify Your Impact</h3>
                <p className="text-slate-400 leading-relaxed">Engage listeners beyond academia, sparking broader discussions and enhancing the visibility of your work.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      {showDiscoverSection && (
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-40">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-medium text-white">
              Discover the Latest Research Podcasts
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

          {/* Podcasts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {podcasts.slice(0, 3).map((podcast) => (
              <PodcastCard key={podcast.id} podcast={podcast} />
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              to="/discover"
              className="inline-flex items-center justify-center rounded-full bg-slate-800/50 border border-slate-700/50 px-6 py-3 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-700/50 hover:text-white"
            >
              <span className="mr-3">Discover More Podcasts</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.25 8.25L21 12m0 0L17.25 15.75M21 12H3"
                />
              </svg>
            </Link>
          </div>
        </div>
      )}

      {/* Private Research Podcasts Feature Section */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-40">
        <div className="mx-auto max-w-2xl lg:max-w-none">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-medium text-white sm:text-4xl">
              Choose Who Can Listen
            </h2>
            <p className="mt-4 text-lg text-slate-400">
              Simple privacy controls for your research podcasts
            </p>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-[2.5rem]" />
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(0deg,transparent,black)] opacity-20" />
            <div className="relative rounded-[2.5rem] p-6 sm:p-12 border border-emerald-500/20">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start">
                <div>
                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
                    <div className="p-4 sm:p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                            <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </div>
                          <div>
                            <div className="text-base sm:text-lg font-medium text-white">Privacy Settings</div>
                            <div className="text-xs sm:text-sm text-slate-400">Control visibility</div>
                          </div>
                        </div>
                        <div className="h-6 w-11 sm:h-7 sm:w-12 rounded-full bg-emerald-500/20 flex items-center justify-end p-1 cursor-pointer">
                          <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                        </div>
                      </div>
                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex items-center gap-3 p-2.5 sm:p-3 rounded-xl bg-slate-900/50">
                          <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                          <div className="text-xs sm:text-sm text-slate-300">Only visible to you</div>
                        </div>
                        <div className="flex items-center gap-3 p-2.5 sm:p-3 rounded-xl bg-slate-900/50">
                          <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                          <div className="text-xs sm:text-sm text-slate-300">Access through your account</div>
                        </div>
                        <div className="flex items-center gap-3 p-2.5 sm:p-3 rounded-xl bg-slate-900/50">
                          <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                          <div className="text-xs sm:text-sm text-slate-300">Change visibility anytime</div>
                        </div>
                      </div>
                    </div>
                    <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-700/50 bg-slate-900/50">
                      <div className="flex items-center justify-between">
                        <div className="text-xs sm:text-sm text-slate-400">Current status</div>
                        <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-emerald-400">
                          <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          Private
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4 sm:space-y-6">
                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-4 sm:p-6">
                    <div className="flex items-center gap-3 sm:gap-4 mb-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                        <Headphones className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs sm:text-sm font-medium text-white truncate">Deep Learning in Healthcare</div>
                        <div className="text-[10px] sm:text-xs text-slate-400">15 min • Generated today</div>
                      </div>
                      <div className="flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                        <span className="text-[10px] sm:text-xs font-medium text-emerald-400">Private</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-700/50 overflow-hidden">
                      <div className="h-full w-2/3 bg-gradient-to-r from-emerald-500 to-teal-600" />
                    </div>
                  </div>

                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-4 sm:p-6">
                    <div className="flex items-center gap-3 sm:gap-4 mb-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                        <Headphones className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs sm:text-sm font-medium text-white truncate">Quantum Computing Research</div>
                        <div className="text-[10px] sm:text-xs text-slate-400">18 min • Generated yesterday</div>
                      </div>
                      <div className="flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                        <span className="text-[10px] sm:text-xs font-medium text-emerald-400">Private</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-700/50 overflow-hidden">
                      <div className="h-full w-1/3 bg-gradient-to-r from-emerald-500 to-teal-600" />
                    </div>
                  </div>

                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-4 sm:p-6">
                    <div className="flex items-center gap-3 sm:gap-4 mb-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                        <Headphones className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs sm:text-sm font-medium text-white truncate">Climate Change Impact</div>
                        <div className="text-[10px] sm:text-xs text-slate-400">12 min • Published</div>
                      </div>
                      <div className="flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full bg-slate-800 border border-slate-700">
                        <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
                        <span className="text-[10px] sm:text-xs font-medium text-slate-400">Public</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-700/50 overflow-hidden">
                      <div className="h-full w-full bg-gradient-to-r from-emerald-500 to-teal-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Researcher Profiles Feature Section */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-40">
        <div className="mx-auto max-w-2xl lg:max-w-none">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-medium text-white sm:text-4xl">
              Showcase Your Curiosity
            </h2>
            <p className="mt-4 text-lg text-slate-400">
              Get your own professional profile page and connect with other researchers
            </p>
          </div>
          
          <div className="flex flex-col gap-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-fuchsia-500/20 flex items-center justify-center mb-4">
                  <User className="w-6 h-6 text-fuchsia-400" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Your Research Profile</h3>
                <p className="text-sm text-slate-400">Display your role, affiliation, and research interests to build your presence in the research community</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-fuchsia-500/20 flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-fuchsia-400" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Publication Portfolio</h3>
                <p className="text-sm text-slate-400">Showcase your research papers and their audio versions in one professional profile</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-fuchsia-500/20 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-fuchsia-400" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Research Network</h3>
                <p className="text-sm text-slate-400">Connect with other researchers in your field and grow your academic network</p>
              </div>
            </div>
            <div className="relative w-full">
              <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[rgb(2,4,15)] via-[rgb(15,23,42)]/95 to-transparent" />
              <img 
                src="images/orpheus_profile-mockup.png" 
                alt="Profile Mockup" 
                className="w-full rounded-2xl border border-slate-700/50 shadow-2xl shadow-black/50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Personal Playlists Feature Section */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-40">
        <div className="mx-auto max-w-2xl lg:max-w-none">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-medium text-white sm:text-4xl">
              Listen on the Go
            </h2>
            <p className="mt-4 text-lg text-slate-400">
              Create playlists to save and organize podcasts for later listening
            </p>
            </div>
          
          <div className="relative bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-visible">
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 mb-6">
                    <ListMusic className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-medium text-white mb-3">Manage Your Library</h3>
                  <p className="text-slate-400 leading-relaxed mb-6">
                    Build your personal collection of research podcasts. Save interesting content to listen to later and keep your research organized in one place.
                  </p>
                  <ul className="space-y-3 text-slate-300">
                    <li className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center mt-0.5">
                        <BookOpen className="w-3 h-3 text-amber-400" />
                      </div>
                      <span>Save podcasts to your library with one click</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center mt-0.5">
                        <Headphones className="w-3 h-3 text-amber-400" />
                      </div>
                      <span>Listen to saved podcasts anytime, anywhere</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center mt-0.5">
                        <Waveform className="w-3 h-3 text-amber-400" />
                      </div>
                      <span>Track your listening progress across devices</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                      <ListMusic className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <div className="text-lg font-medium text-white">My Research Playlist</div>
                      <div className="text-sm text-slate-400">8 podcasts</div>
                    </div>
                  </div>
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                        NN
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">Neural Networks in Computer Vision</div>
                        <div className="text-xs text-slate-400">Dr. Jane Doe • 12 min</div>
                      </div>
                      <PlayCircle className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
                        QC
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">Quantum Computing Advances</div>
                        <div className="text-xs text-slate-400">Dr. John Smith • 15 min</div>
                      </div>
                      <PlayCircle className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold">
                        CC
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">Climate Change Models</div>
                        <div className="text-xs text-slate-400">Dr. Sarah Johnson • 18 min</div>
                      </div>
                      <PlayCircle className="w-5 h-5 text-amber-400" />
                    </div>
                  </div>
                  <div className="text-center">
                    <button className="text-xs text-amber-400 hover:text-amber-300 transition-colors">
                      View all 8 podcasts
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
                  <Link
                    to="/waitlist"
                    className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-400/80 to-indigo-500/80 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:from-sky-400 hover:to-indigo-500 hover:shadow-sky-400/20"
                  >
                    <span className="mr-3">Generate Your First Podcast</span>
                    <Sparkles className="h-5 w-5" />
                  </Link>
                ) : (
                  <>
              <Link
                      to="/waitlist"
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-400 to-indigo-500 text-white rounded-lg px-6 py-3 font-medium hover:shadow-lg hover:shadow-sky-400/20 transition-all"
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Link>
                    <button
                      onClick={() => navigate('/discover')}
                      className="inline-flex items-center justify-center rounded-full bg-slate-800/50 border border-slate-700/50 px-6 py-3 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-700/50 hover:text-white"
                    >
                      <span className="mr-3">Discover More Podcasts</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M17.25 8.25L21 12m0 0L17.25 15.75M21 12H3"
                        />
                      </svg>
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

const styles = `
@keyframes moveDot {
  0% {
    left: -8px;
    opacity: 0;
    transform: scale(0.8);
  }
  20% {
    opacity: 1;
    transform: scale(1);
  }
  80% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    left: calc(100% + 8px);
    opacity: 0;
    transform: scale(0.8);
  }
}

.animate-move-dot {
  animation: moveDot 3s infinite ease-in-out;
}
`

const styleSheet = document.createElement("style")
styleSheet.innerText = styles
document.head.appendChild(styleSheet)

export default Home;