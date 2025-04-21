import React from 'react';
import { Cookie } from 'lucide-react';

const CookiePolicy = () => {
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-sky-500/10 mb-6">
              <Cookie className="w-8 h-8 text-sky-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Cookie Policy</h1>
            <p className="text-slate-400">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          {/* Content */}
          <div className="prose prose-invert max-w-none">
            <section className="space-y-6">
              <h2 className="text-xl font-semibold text-white">1. Introduction</h2>
              <p className="text-slate-300">
                This Cookie Policy explains how Orpheus ("we", "us", or "our") uses cookies and similar technologies to recognize you when you visit our website. It explains what these technologies are and why we use them, as well as your rights to control our use of them.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-xl font-semibold text-white">2. What are Cookies?</h2>
              <p className="text-slate-300">
                Cookies are small data files that are placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners to make their websites work, or to work more efficiently, as well as to provide reporting information.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-xl font-semibold text-white">3. Why Do We Use Cookies?</h2>
              <p className="text-slate-300">
                We use cookies for several reasons. Some cookies are required for technical reasons in order for our website to operate, and we refer to these as "essential" or "strictly necessary" cookies. Other cookies enable us to track and target the interests of our users to enhance the experience on our website. Third parties serve cookies through our website for analytics and other purposes.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-xl font-semibold text-white">4. Types of Cookies We Use</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-white">Essential Cookies</h3>
                  <p className="text-slate-300">
                    These cookies are strictly necessary for the website to function and cannot be switched off in our systems. They are usually only set in response to actions made by you which amount to a request for services, such as setting your privacy preferences, logging in, or filling in forms.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white">Performance Cookies</h3>
                  <p className="text-slate-300">
                    These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us to know which pages are the most and least popular and see how visitors move around the site.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white">Functionality Cookies</h3>
                  <p className="text-slate-300">
                    These cookies enable the website to provide enhanced functionality and personalization. They may be set by us or by third-party providers whose services we have added to our pages.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white">Targeting Cookies</h3>
                  <p className="text-slate-300">
                    These cookies may be set through our site by our advertising partners. They may be used by those companies to build a profile of your interests and show you relevant advertisements on other sites.
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-xl font-semibold text-white">5. How Can You Control Cookies?</h2>
              <p className="text-slate-300">
                You can set your browser to refuse all or some browser cookies, or to alert you when websites set or access cookies. If you disable or refuse cookies, please note that some parts of this website may become inaccessible or not function properly.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-xl font-semibold text-white">6. How Often Will We Update This Cookie Policy?</h2>
              <p className="text-slate-300">
                We may update this Cookie Policy from time to time in order to reflect, for example, changes to the cookies we use or for other operational, legal, or regulatory reasons. Please therefore revisit this Cookie Policy regularly to stay informed about our use of cookies and related technologies.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-xl font-semibold text-white">7. Contact Us</h2>
              <p className="text-slate-300">
                If you have any questions about our use of cookies or other technologies, please contact us at:
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

export default CookiePolicy; 