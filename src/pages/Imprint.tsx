import React from 'react';

const Imprint = () => {
  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Imprint</h1>
            <p className="mt-2 text-sm text-slate-400">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="prose prose-invert max-w-none">
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Company Information</h2>
              <div className="space-y-2">
                <p className="text-slate-300">
                  <strong>Company Name:</strong> Orpheus AI GmbH
                </p>
                <p className="text-slate-300">
                  <strong>Legal Form:</strong> Limited Liability Company (GmbH)
                </p>
                <p className="text-slate-300">
                  <strong>Registration Court:</strong> District Court [Your City]
                </p>
                <p className="text-slate-300">
                  <strong>Commercial Register:</strong> HRB [Number]
                </p>
                <p className="text-slate-300">
                  <strong>VAT ID:</strong> DE[Number]
                </p>
              </div>
            </section>

            <section className="space-y-4 mt-8">
              <h2 className="text-xl font-semibold text-white">Registered Office</h2>
              <div className="space-y-2">
                <p className="text-slate-300">
                  [Street Name] [Number]
                  <br />
                  [Postal Code] [City]
                  <br />
                  [Country]
                </p>
              </div>
            </section>

            <section className="space-y-4 mt-8">
              <h2 className="text-xl font-semibold text-white">Management</h2>
              <div className="space-y-2">
                <p className="text-slate-300">
                  <strong>Managing Director:</strong> [Name]
                </p>
                <p className="text-slate-300">
                  <strong>Contact:</strong>
                  <br />
                  Email: contact@orpheus.ai
                  <br />
                  Phone: +49 [Number]
                </p>
              </div>
            </section>

            <section className="space-y-4 mt-8">
              <h2 className="text-xl font-semibold text-white">Responsible for Content</h2>
              <div className="space-y-2">
                <p className="text-slate-300">
                  According to § 55 Abs. 2 RStV:
                  <br />
                  [Name]
                  <br />
                  [Position]
                  <br />
                  [Same address as company]
                </p>
              </div>
            </section>

            <section className="space-y-4 mt-8">
              <h2 className="text-xl font-semibold text-white">Dispute Resolution</h2>
              <p className="text-slate-300">
                The European Commission provides a platform for online dispute resolution (OS) which is available at https://ec.europa.eu/consumers/odr/. Our email address can be found above in the site notice.
              </p>
            </section>

            <section className="space-y-4 mt-8">
              <h2 className="text-xl font-semibold text-white">Liability for Content</h2>
              <p className="text-slate-300">
                The contents of our pages have been created with the utmost care. However, we cannot guarantee the accuracy, completeness, and timeliness of the content. As a service provider, we are responsible for our own content on these pages according to § 7 paragraph 1 TMG. According to §§ 8 to 10 TMG, however, we are not obligated to monitor transmitted or stored third-party information or to investigate circumstances that indicate illegal activity.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Imprint; 