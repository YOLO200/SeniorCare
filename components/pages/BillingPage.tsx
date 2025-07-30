"use client";

import { useState } from "react";
import { Check, CreditCard, Calendar, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function BillingPage() {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const features = [
    "Unlimited care recipients",
    "Unlimited reminders",
    "AI-powered call assistance",
    "Text message reminders",
    "24/7 support",
    "Detailed activity reports",
    "Family member access",
    "Emergency contacts"
  ];

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      // TODO: Integrate with payment provider (Stripe/PayPal)
      toast({
        title: "Coming Soon",
        description: "Payment integration will be available soon.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const monthlyPrice = 22;
  const yearlyPrice = 220;
  const yearlySavings = (monthlyPrice * 12) - yearlyPrice;
  const yearlySavingsPercent = Math.round((yearlySavings / (monthlyPrice * 12)) * 100);

  return (
    <>
      {/* Header */}
      <div className="mb-8 mt-16 lg:mt-0">
        <h1 className="text-3xl font-bold text-slate-800">Billing & Subscription</h1>
        <p className="text-slate-600 mt-2">Choose the plan that works best for you</p>
      </div>

      {/* Pricing Cards */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Simple, Transparent Pricing</h2>
          <p className="text-slate-600">No hidden fees. Cancel anytime.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Monthly Plan */}
          <div 
            onClick={() => setSelectedPlan('monthly')}
            className={`relative rounded-2xl p-6 cursor-pointer transition-all ${
              selectedPlan === 'monthly' 
                ? 'border-2 border-violet-500 bg-violet-50/50' 
                : 'border-2 border-slate-200 hover:border-slate-300'
            }`}
          >
            {selectedPlan === 'monthly' && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-violet-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                  Selected
                </span>
              </div>
            )}
            
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Monthly</h3>
                <p className="text-sm text-slate-600">Pay as you go</p>
              </div>
              <Calendar className="h-8 w-8 text-violet-500" />
            </div>

            <div className="mb-6">
              <span className="text-4xl font-bold text-slate-800">${monthlyPrice}</span>
              <span className="text-slate-600">/month</span>
            </div>

            <ul className="space-y-3 mb-6">
              {features.slice(0, 5).map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">{feature}</span>
                </li>
              ))}
            </ul>

            <Button 
              className={`w-full ${
                selectedPlan === 'monthly' 
                  ? 'bg-violet-500 hover:bg-violet-600' 
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPlan('monthly');
                handleSubscribe();
              }}
              disabled={isLoading}
            >
              {selectedPlan === 'monthly' ? 'Subscribe Monthly' : 'Select Monthly'}
            </Button>
          </div>

          {/* Yearly Plan */}
          <div 
            onClick={() => setSelectedPlan('yearly')}
            className={`relative rounded-2xl p-6 cursor-pointer transition-all ${
              selectedPlan === 'yearly' 
                ? 'border-2 border-violet-500 bg-violet-50/50' 
                : 'border-2 border-slate-200 hover:border-slate-300'
            }`}
          >
            {/* Best Value Badge */}
            <div className="absolute -top-3 -right-3">
              <div className="bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Save {yearlySavingsPercent}%
              </div>
            </div>

            {selectedPlan === 'yearly' && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-violet-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                  Selected
                </span>
              </div>
            )}
            
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Yearly</h3>
                <p className="text-sm text-slate-600">Best value</p>
              </div>
              <CreditCard className="h-8 w-8 text-violet-500" />
            </div>

            <div className="mb-6">
              <span className="text-4xl font-bold text-slate-800">${yearlyPrice}</span>
              <span className="text-slate-600">/year</span>
              <div className="mt-2">
                <span className="text-sm text-green-600 font-medium">
                  Save ${yearlySavings} per year
                </span>
              </div>
            </div>

            <ul className="space-y-3 mb-6">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">{feature}</span>
                </li>
              ))}
            </ul>

            <Button 
              className={`w-full ${
                selectedPlan === 'yearly' 
                  ? 'bg-violet-500 hover:bg-violet-600' 
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPlan('yearly');
                handleSubscribe();
              }}
              disabled={isLoading}
            >
              {selectedPlan === 'yearly' ? 'Subscribe Yearly' : 'Select Yearly'}
            </Button>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center text-sm text-slate-600">
          <p className="mb-2">
            <span className="font-medium">100% Satisfaction Guarantee</span> • Cancel anytime
          </p>
          <p>
            All plans include automatic renewal. You can change or cancel your plan at any time.
          </p>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Accepted Payment Methods</h3>
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 border border-slate-200 rounded-lg">
            <span className="text-sm font-medium text-slate-600">Visa</span>
          </div>
          <div className="px-4 py-2 border border-slate-200 rounded-lg">
            <span className="text-sm font-medium text-slate-600">Mastercard</span>
          </div>
          <div className="px-4 py-2 border border-slate-200 rounded-lg">
            <span className="text-sm font-medium text-slate-600">American Express</span>
          </div>
          <div className="px-4 py-2 border border-slate-200 rounded-lg">
            <span className="text-sm font-medium text-slate-600">PayPal</span>
          </div>
        </div>
      </div>
    </>
  );
}