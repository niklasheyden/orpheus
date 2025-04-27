import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSubscription } from '../hooks/useSubscription';
import { useAuth } from '../hooks/useAuth';
import { ArrowRightCircleIcon } from '@heroicons/react/24/outline';
import { SparklesIcon } from '@heroicons/react/24/solid';

const SubscriptionSuccess = () => {
  const [searchParams] = useSearchParams();
  const { verifyCheckoutSession } = useSubscription();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifySession = async () => {
      try {
        const sessionId = searchParams.get('session_id');
        if (!sessionId) {
          throw new Error('No session ID found');
        }

        await verifyCheckoutSession(sessionId);
        setLoading(false);
      } catch (err) {
        console.error('Error verifying session:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    };

    verifySession();
  }, [searchParams, verifyCheckoutSession]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-slate-300">Verifying your subscription...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="text-red-500 text-2xl">⚠️</div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Verification Failed</h1>
          <p className="text-slate-300 mb-6">{error}</p>
          <button
            onClick={() => navigate('/pricing')}
            className="inline-flex items-center gap-2 rounded-full bg-blue-500 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-400"
          >
            Return to Pricing
            <ArrowRightCircleIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="relative">
        {/* Background decoration */}
        <div className="absolute inset-0 -m-16 flex items-center justify-center opacity-20">
          <div className="h-96 w-96 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 blur-3xl" />
        </div>

        {/* Floating sparkles */}
        <div className="absolute -top-8 left-0 animate-bounce delay-100">
          <SparklesIcon className="h-6 w-6 text-yellow-400 opacity-50" />
        </div>
        <div className="absolute -top-4 right-0 animate-bounce delay-200">
          <SparklesIcon className="h-4 w-4 text-yellow-400 opacity-50" />
        </div>
        <div className="absolute bottom-0 right-4 animate-bounce delay-300">
          <SparklesIcon className="h-5 w-5 text-yellow-400 opacity-50" />
        </div>

        {/* Main content */}
        <div className="relative text-center max-w-md mx-auto">
          <div className="mb-8">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-2 animate-[bounce_1s_ease-in-out_1]">
              <svg
                className="w-10 h-10 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                  className="animate-[dash_1s_ease-in-out_forwards]"
                  style={{
                    strokeDasharray: 100,
                    strokeDashoffset: 100,
                  }}
                />
              </svg>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white mb-4">Welcome to Orpheus Pro!</h1>
          <p className="text-slate-300 mb-8">
            Your subscription has been activated successfully. Get ready to unlock the full potential of Orpheus!
          </p>

          <button
            onClick={() => navigate(`/user/${user?.id}`)}
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-400/80 to-indigo-500/80 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:from-sky-400 hover:to-indigo-500 hover:shadow-sky-400/20"
          >
            <span className="mr-3">Go to Profile</span>
            <SparklesIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default SubscriptionSuccess; 