import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { RESEARCH_FIELDS, RESEARCH_FIELD_CATEGORIES } from '../lib/constants';

interface SurveyData {
  role: string;
  researchField: string;
  experience: string;
  interests: string[];
  challenges: string[];
  useCase: string;
  email: string;
}

const Survey = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [surveyData, setSurveyData] = useState<SurveyData>({
    role: '',
    researchField: '',
    experience: '',
    interests: [],
    challenges: [],
    useCase: '',
    email: '',
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');

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
    'Retired Researcher',
    'Other'
  ];

  const interests = [
    'Staying updated with latest research',
    'Sharing my research findings',
    'Connecting with other researchers',
    'Making research more accessible',
    'Building a research audience',
    'Learning from other researchers',
  ];

  const challenges = [
    'Finding time to read papers',
    'Understanding complex research',
    'Sharing research with non-experts',
    'Keeping track of latest developments',
    'Networking with other researchers',
    'Making research more engaging',
  ];

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const userEmail = params.get('email');
    if (userEmail) {
      setSurveyData(prev => ({ ...prev, email: userEmail }));
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Debug: Check table structure with explicit columns
      const { data: tableInfo, error: tableError } = await supabase
        .from('survey_responses')
        .select('id, email, role, research_field, experience, interests, challenges, use_case')
        .limit(1);
      
      console.log('Table structure check:', {
        error: tableError,
        data: tableInfo,
        requestData: {
          email: surveyData.email,
          role: surveyData.role,
          research_field: surveyData.researchField,
          experience: surveyData.experience,
          interests: surveyData.interests,
          challenges: surveyData.challenges,
          use_case: surveyData.useCase,
          type: 'early_access'
        }
      });

      // Then, try the insert without the type field first
      const { error: surveyError } = await supabase
        .from('survey_responses')
        .insert([{
          email: surveyData.email,
          role: surveyData.role,
          research_field: surveyData.researchField,
          experience: surveyData.experience,
          interests: surveyData.interests,
          challenges: surveyData.challenges,
          use_case: surveyData.useCase,
          type: 'early_access',
          submitted_at: new Date().toISOString()
        }]);

      if (surveyError) {
        console.error('Survey insert error:', surveyError);
        throw surveyError;
      }

      // Generate an invite code for the user
      const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();

      // Insert invite code for the user
      const { error: inviteError } = await supabase
        .from('invite_codes')
        .insert([{
          code: inviteCode,
          email: surveyData.email,
          is_used: false,
          created_at: new Date().toISOString(),
          type: 'survey'
        }]);
      if (inviteError) throw inviteError;

      // Show success message and redirect
      setShowSuccess(true);
      setTimeout(() => {
        navigate(`/auth?invite=${inviteCode}&email=${encodeURIComponent(surveyData.email)}`);
      }, 2000);
    } catch (error: any) {
      console.error('Error:', error);
      setError(error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateSurveyData = (field: keyof SurveyData, value: any) => {
    setSurveyData(prev => ({ ...prev, [field]: value }));
  };

  const handleJoinWaitlist = () => {
    navigate('/survey');
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">What's your role?</label>
              <select
                value={surveyData.role}
                onChange={(e) => updateSurveyData('role', e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-400/50"
                required
              >
                <option value="">Select your role</option>
                {statusOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">What's your research field?</label>
              <select
                value={surveyData.researchField}
                onChange={(e) => updateSurveyData('researchField', e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-400/50"
                required
              >
                <option value="">Select your field</option>
                {RESEARCH_FIELD_CATEGORIES.map(category => (
                  <optgroup key={category} label={category}>
                    {RESEARCH_FIELDS
                      .filter(field => field.category === category)
                      .map(field => (
                        <option key={field.id} value={field.id}>
                          {field.name}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Years of research experience</label>
              <select
                value={surveyData.experience}
                onChange={(e) => updateSurveyData('experience', e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-400/50"
                required
              >
                <option value="">Select experience</option>
                <option value="0-2">0-2 years</option>
                <option value="3-5">3-5 years</option>
                <option value="6-10">6-10 years</option>
                <option value="10+">10+ years</option>
              </select>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">What interests you most about Orpheus? (Select all that apply)</label>
              <div className="space-y-3">
                {interests.map(interest => (
                  <label key={interest} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer group">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={surveyData.interests.includes(interest)}
                        onChange={(e) => {
                          const newInterests = e.target.checked
                            ? [...surveyData.interests, interest]
                            : surveyData.interests.filter(i => i !== interest);
                          updateSurveyData('interests', newInterests);
                        }}
                        className="peer sr-only"
                      />
                      <div className="w-5 h-5 border-2 border-slate-600 rounded transition-colors peer-checked:border-sky-400 peer-checked:bg-sky-400/10 group-hover:border-slate-500" />
                      <CheckCircle className="absolute w-4 h-4 text-sky-400 opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-slate-300 group-hover:text-white transition-colors">{interest}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">What challenges do you face in research communication? (Select all that apply)</label>
              <div className="space-y-3">
                {challenges.map(challenge => (
                  <label key={challenge} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer group">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={surveyData.challenges.includes(challenge)}
                        onChange={(e) => {
                          const newChallenges = e.target.checked
                            ? [...surveyData.challenges, challenge]
                            : surveyData.challenges.filter(c => c !== challenge);
                          updateSurveyData('challenges', newChallenges);
                        }}
                        className="peer sr-only"
                      />
                      <div className="w-5 h-5 border-2 border-slate-600 rounded transition-colors peer-checked:border-sky-400 peer-checked:bg-sky-400/10 group-hover:border-slate-500" />
                      <CheckCircle className="absolute w-4 h-4 text-sky-400 opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-slate-300 group-hover:text-white transition-colors">{challenge}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">How would you use Orpheus in your research workflow?</label>
              <textarea
                value={surveyData.useCase}
                onChange={(e) => updateSurveyData('useCase', e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-400/50 min-h-[120px]"
                placeholder="Tell us about your ideal use case..."
                required
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return surveyData.role && surveyData.researchField && surveyData.experience;
      case 2:
        return surveyData.interests.length > 0 && surveyData.challenges.length > 0;
      case 3:
        return surveyData.useCase && surveyData.email;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-medium mb-3">Research Communication Survey</h1>
          <p className="text-slate-400">
            Help us understand your needs and get priority access to Orpheus.
          </p>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-2xl p-8 max-w-md mx-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-emerald-400/10 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-xl font-medium">Thank You!</h3>
              </div>
              <p className="text-slate-400 mb-6">
                Your survey has been submitted. We're redirecting you to create your account...
              </p>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-slate-700/50">
          <div className="flex items-center gap-4 mb-8">
            {[1, 2, 3].map((number) => (
              <div
                key={number}
                className={`flex-1 h-2 rounded-full ${
                  number <= step ? 'bg-sky-400' : 'bg-slate-700'
                }`}
              />
            ))}
          </div>

          {renderStep()}

          <div className="mt-8 flex justify-between">
            {step > 1 && (
              <button
                onClick={(e) => { e.preventDefault(); setStep(step - 1); }}
                className="px-6 py-3 text-slate-300 hover:text-white transition-colors"
              >
                Previous
              </button>
            )}
            <div className="ml-auto">
              {step < 3 ? (
                <button
                  onClick={(e) => { e.preventDefault(); setStep(step + 1); }}
                  disabled={!canProceed()}
                  className="bg-gradient-to-r from-sky-400 to-indigo-500 text-white rounded-lg px-6 py-3 font-medium hover:shadow-lg hover:shadow-sky-400/20 transition-all disabled:opacity-50"
                >
                  Continue
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !canProceed()}
                  className="bg-gradient-to-r from-sky-400 to-indigo-500 text-white rounded-lg px-6 py-3 font-medium hover:shadow-lg hover:shadow-sky-400/20 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>Get Access</span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Survey; 