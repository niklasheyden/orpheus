import React from 'react';
import { ScrollText } from 'lucide-react';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-sky-500/10 mb-6">
              <ScrollText className="w-8 h-8 text-sky-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Terms of Service</h1>
            <p className="text-slate-400">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          {/* Content */}
          <div className="prose prose-invert max-w-none">
            <section className="space-y-6">
              <h2 className="text-xl font-semibold text-white">1. Agreement to Terms</h2>
              <p className="text-slate-300">
                By accessing or using Orpheus, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-xl font-semibold text-white">2. Description of Service</h2>
              <p className="text-slate-300">
                Orpheus is a platform that converts research papers into engaging podcast content. Our service includes:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2">
                <li>Research paper to podcast conversion</li>
                <li>Audio content generation</li>
                <li>Content sharing and discovery</li>
                <li>Community features</li>
              </ul>
            </section>

            <section className="space-y-6">
              <h2 className="text-xl font-semibold text-white">3. User Accounts</h2>
              <p className="text-slate-300">
                When you create an account with us, you must provide accurate and complete information. You are responsible for:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2">
                <li>Maintaining the security of your account</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use</li>
              </ul>
            </section>

            <section className="space-y-6">
              <h2 className="text-xl font-semibold text-white">4. Content Guidelines</h2>
              <p className="text-slate-300">
                Users are responsible for the content they upload and generate. Content must:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2">
                <li>Not violate any intellectual property rights</li>
                <li>Not contain harmful or malicious content</li>
                <li>Comply with all applicable laws and regulations</li>
                <li>Be accurate and not misleading</li>
              </ul>
            </section>

            <section className="space-y-6">
              <h2 className="text-xl font-semibold text-white">5. Intellectual Property</h2>
              <p className="text-slate-300">
                The service and its original content, features, and functionality are owned by Orpheus and are protected by international copyright, trademark, and other intellectual property laws.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-xl font-semibold text-white">6. Termination</h2>
              <p className="text-slate-300">
                We may terminate or suspend your account and access to the service immediately, without prior notice or liability, for any reason, including breach of these Terms.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-xl font-semibold text-white">7. Limitation of Liability</h2>
              <p className="text-slate-300">
                In no event shall Orpheus be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-xl font-semibold text-white">8. Changes to Terms</h2>
              <p className="text-slate-300">
                We reserve the right to modify or replace these Terms at any time. We will provide notice of any changes by posting the new Terms on this page.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-xl font-semibold text-white">9. Contact Us</h2>
              <p className="text-slate-300">
                If you have any questions about these Terms, please contact us at:
              </p>
              <p className="text-slate-300">
                Email: legal@orpheus.ai
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService; 