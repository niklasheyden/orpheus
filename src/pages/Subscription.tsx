import { useSubscription } from '../hooks/useSubscription';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const SubscriptionPage = () => {
  const { createCheckoutSession, plans } = useSubscription();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubscribe = async (priceId: string) => {
    if (!user) {
      // Store the return URL before redirecting
      sessionStorage.setItem('returnUrl', window.location.pathname);
      navigate('/auth');
      return;
    }

    // Get the current URL without any query parameters
    const baseUrl = window.location.origin;
    const successUrl = `${baseUrl}/user/${user.id}?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/subscription`;
    
    try {
      await createCheckoutSession({ 
        priceId, 
        successUrl, 
        cancelUrl 
      });
    } catch (error) {
      console.error('Error creating checkout session:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Choose Your Plan
          </h1>
          <p className="mt-4 text-xl text-slate-400">
            Select the subscription that best fits your needs
          </p>
        </div>

        {/* Subscription Plans */}
        <div className="mt-16 grid gap-8 lg:grid-cols-3 lg:gap-x-8">
          {plans?.map((plan) => (
            <div
              key={plan.id}
              className="relative p-8 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-xl flex flex-col"
            >
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
                <p className="mt-4 flex items-baseline text-slate-200">
                  <span className="text-5xl font-bold tracking-tight">${plan.price}</span>
                  <span className="ml-1 text-2xl font-medium text-slate-400">/month</span>
                </p>
                <p className="mt-6 text-slate-400">{plan.description}</p>

                {/* Features */}
                <ul role="list" className="mt-6 space-y-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex">
                      <svg
                        className="flex-shrink-0 w-6 h-6 text-indigo-500"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="ml-3 text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleSubscribe(plan.stripe_price_id)}
                className="mt-8 block w-full bg-indigo-600 hover:bg-indigo-700 py-3 px-6 border border-transparent rounded-md text-center font-medium text-white transition-colors"
              >
                Subscribe to {plan.name}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage; 