import React from 'react';
import { Mail } from 'lucide-react';

const Verify = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-white py-12">
      <div className="max-w-md mx-auto px-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-sky-400/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-sky-400" />
          </div>
          <h1 className="text-3xl font-medium mb-3">Check Your Email</h1>
          <p className="text-slate-400">
            We've sent you a verification link. Please check your email and click the link to activate your account.
          </p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-slate-700/50">
          <div className="space-y-4">
            <p className="text-sm text-slate-400">
              After verifying your email, you'll be able to:
            </p>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                <span>Create your research podcasts</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                <span>Customize your researcher profile</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                <span>Connect with other researchers</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Verify; 