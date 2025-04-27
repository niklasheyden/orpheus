import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import { useAuth } from '../hooks/useAuth';
import { SubscriptionPlan } from '../types/subscription';

const Pricing: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { plans, isLoadingPlans, createCheckoutSession, hasTier } = useSubscription();
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!user) {
      // Redirect to login if user is not authenticated
      navigate('/login', { state: { from: '/pricing' } });
      return;
    }

    // Create checkout session with just the priceId
    createCheckoutSession({
      priceId: plan.stripe_price_id,
    });
  };

  const filteredPlans = plans?.filter(plan => plan.interval === billingInterval) || [];

  return (
    <div className="min-h-screen bg-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Simple, Transparent Pricing
          </h1>
          <p className="mt-4 text-xl text-slate-400 max-w-3xl mx-auto">
            Choose the plan that works best for you. All plans include a 14-day free trial.
          </p>
        </div>

        {/* Billing interval toggle */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex rounded-lg bg-slate-800 p-1">
            <button
              onClick={() => setBillingInterval('month')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                billingInterval === 'month'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('year')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                billingInterval === 'year'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Yearly <span className="text-emerald-400 ml-1">(Save 20%)</span>
            </button>
          </div>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
          {isLoadingPlans ? (
            // Loading skeleton
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="bg-slate-800 rounded-lg p-8 animate-pulse">
                <div className="h-8 bg-slate-700 rounded w-1/2 mb-4"></div>
                <div className="h-12 bg-slate-700 rounded w-1/3 mb-6"></div>
                <div className="space-y-3">
                  {Array(5).fill(0).map((_, j) => (
                    <div key={j} className="h-4 bg-slate-700 rounded w-full"></div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            // Actual pricing cards
            filteredPlans.map((plan) => (
              <div
                key={plan.id}
                className={`bg-slate-800 rounded-lg p-8 flex flex-col ${
                  plan.tier === 'pro' ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <h2 className="text-2xl font-bold text-white">{plan.name}</h2>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-extrabold text-white">${plan.price}</span>
                  <span className="ml-1 text-xl font-medium text-slate-400">
                    /{billingInterval}
                  </span>
                </div>
                <p className="mt-5 text-slate-400">{plan.description}</p>
                <ul className="mt-6 space-y-4 flex-grow">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-5 w-5 text-emerald-500 mr-2 flex-shrink-0" />
                      <span className="text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleSubscribe(plan)}
                  className={`mt-8 w-full py-3 px-4 rounded-md font-medium ${
                    hasTier(plan.tier)
                      ? 'bg-slate-700 text-slate-300 cursor-not-allowed'
                      : plan.tier === 'pro'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-slate-700 hover:bg-slate-600 text-white'
                  }`}
                  disabled={hasTier(plan.tier)}
                >
                  {hasTier(plan.tier) ? 'Current Plan' : 'Subscribe'}
                </button>
              </div>
            ))
          )}
        </div>

        {/* FAQ section */}
        <div className="mt-24 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-medium text-white mb-2">Can I change my plan later?</h3>
              <p className="text-slate-400">
                Yes, you can upgrade or downgrade your plan at any time. Changes will be applied at the start of your next billing cycle.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-medium text-white mb-2">What happens after my trial ends?</h3>
              <p className="text-slate-400">
                After your 14-day trial, you'll be automatically charged for the plan you selected. You can cancel anytime before the trial ends to avoid being charged.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-medium text-white mb-2">Do you offer refunds?</h3>
              <p className="text-slate-400">
                We offer a 30-day money-back guarantee for all paid plans. If you're not satisfied, contact our support team for a full refund.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing; 