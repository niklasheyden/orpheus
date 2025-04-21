import React from 'react';
import { Shield } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-sky-500/10 mb-6">
              <Shield className="w-8 h-8 text-sky-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Privacy Policy</h1>
            <p className="text-slate-400">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          {/* Content */}
          <div className="prose prose-invert max-w-none">
            <section className="space-y-6">
              <h2 className="text-xl font-semibold text-white">1. Introduction</h2>
              <p className="text-slate-300">
                At Orpheus, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service to convert research papers into podcast content. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-xl font-semibold text-white">2. Information We Collect</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-white">Personal Information</h3>
                  <p className="text-slate-300">
                    We may collect personal information that you voluntarily provide to us when you register on the website, express interest in obtaining information about us or our products and services, or otherwise when you contact us. This may include:
                  </p>
                  <ul className="list-disc list-inside text-slate-300 ml-4">
                    <li>Name and email address</li>
                    <li>Account credentials</li>
                    <li>Profile information</li>
                    <li>Research papers and content you upload</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white">Usage Information</h3>
                  <p className="text-slate-300">
                    We automatically collect certain information when you visit, use, or navigate the website. This information may include:
                  </p>
                  <ul className="list-disc list-inside text-slate-300 ml-4">
                    <li>Device and usage information</li>
                    <li>Log and usage data</li>
                    <li>Location information</li>
                    <li>Information about how you interact with our service</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-xl font-semibold text-white">3. How We Use Your Information</h2>
              <p className="text-slate-300">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-slate-300 ml-4">
                <li>Provide and maintain our service</li>
                <li>Process and complete transactions</li>
                <li>Send you technical notices and support messages</li>
                <li>Communicate with you about products, services, and events</li>
                <li>Monitor and analyze trends and usage</li>
                <li>Detect and prevent fraud and abuse</li>
                <li>Improve our service</li>
              </ul>
            </section>

            <section className="space-y-6">
              <h2 className="text-xl font-semibold text-white">4. Sharing Your Information</h2>
              <p className="text-slate-300">
                We may share your information in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-slate-300 ml-4">
                <li>With service providers who perform services on our behalf</li>
                <li>In connection with a business transfer or acquisition</li>
                <li>To comply with legal obligations</li>
                <li>To protect our rights and prevent fraud</li>
                <li>With your consent</li>
              </ul>
            </section>

            <section className="space-y-6">
              <h2 className="text-xl font-semibold text-white">5. Data Security</h2>
              <p className="text-slate-300">
                We implement appropriate technical and organizational security measures to protect your personal information. However, please note that no method of transmission over the Internet or electronic storage is 100% secure.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-xl font-semibold text-white">6. Your Rights</h2>
              <p className="text-slate-300">
                Depending on your location, you may have certain rights regarding your personal information, including:
              </p>
              <ul className="list-disc list-inside text-slate-300 ml-4">
                <li>The right to access your personal information</li>
                <li>The right to correct inaccurate information</li>
                <li>The right to request deletion of your information</li>
                <li>The right to object to processing</li>
                <li>The right to data portability</li>
              </ul>
            </section>

            <section className="space-y-6">
              <h2 className="text-xl font-semibold text-white">7. Children's Privacy</h2>
              <p className="text-slate-300">
                Our service is not intended for use by children under the age of 13. We do not knowingly collect personal information from children under 13.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-xl font-semibold text-white">8. Changes to This Privacy Policy</h2>
              <p className="text-slate-300">
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-xl font-semibold text-white">9. Contact Us</h2>
              <p className="text-slate-300">
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <p className="text-slate-300">
                Email: privacy@orpheus.ai
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy; 