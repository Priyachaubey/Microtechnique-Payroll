import React, { useState } from 'react';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import DemoModal from '../components/landing/DemoModal';
import { Check, Info, Sparkles, HelpCircle } from 'lucide-react';

export default function PricingPage() {
  const [theme, setTheme] = useState('dark');
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  const toggleTheme = () => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  };

  const isDark = theme === 'dark';

  const plans = [
    {
      name: "Starter",
      price: "₹49",
      period: "per employee / mo",
      desc: "Perfect for startups and small teams looking to automate baseline payroll.",
      features: [
        "Automated Salary Calculations",
        "Transparent Attendance Syncing",
        "Mobile Employee Self-Service",
        "Standard PF & ESI Calculations",
        "Email Support (24hr response)",
      ],
      cta: "Get Free Trial",
      popular: false,
    },
    {
      name: "Professional",
      price: "₹99",
      period: "per employee / mo",
      desc: "For growing businesses requiring advanced compliance and integrations.",
      features: [
        "Everything in Starter",
        "Biometric Face Recognition Check-In",
        "Custom Space (Department) Rules",
        "One-Click Bank Transfers",
        "Advanced Tax & TDS Management",
        "Priority Support (Chat & Phone)",
      ],
      cta: "Get Free Trial",
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "tailored billing options",
      desc: "For large firms requiring dedicated SLA compliance and custom setup.",
      features: [
        "Everything in Professional",
        "Dedicated Account Manager",
        "Custom API & ERP Integrations",
        "99.9% Uptime Guarantee SLA",
        "Bulk Data Import/Export Services",
        "Custom Security Auditing & Logs",
      ],
      cta: "Contact Team",
      popular: false,
    },
  ];

  return (
    <div className={`transition-colors duration-300 min-h-screen ${
      isDark ? "bg-[#020617] text-slate-100" : "bg-white text-slate-800"
    }`}>
      <Navbar
        onOpenDemo={() => setDemoModalOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-32 pb-24">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-blue-550 font-mono tracking-widest text-xs uppercase font-semibold block">
            Transparent Pricing
          </span>
          <h1 className={`text-4xl sm:text-5xl font-extrabold tracking-tight font-display ${isDark ? "text-white" : "text-slate-900"}`}>
            Fair Pricing for Every Business Size
          </h1>
          <p className={`text-sm sm:text-base leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            Choose a plan that fits your workforce. No hidden implementation charges. Start with a 14-day free trial on any plan.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mb-20">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`relative rounded-3xl p-8 border flex flex-col justify-between shadow-xl transition-all duration-300 hover:scale-[1.02] ${
                plan.popular
                  ? "border-blue-500 bg-blue-500/5 ring-2 ring-blue-500/20"
                  : isDark
                    ? "border-white/10 bg-white/[0.02]"
                    : "border-slate-200 bg-slate-50/50"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-blue-600 text-white font-mono font-semibold text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-md">
                  <Sparkles className="w-3 h-3" /> Most Popular
                </span>
              )}

              <div>
                <h3 className={`text-xl font-bold tracking-tight mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                  {plan.name}
                </h3>
                <p className={`text-xs mb-6 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  {plan.desc}
                </p>

                <div className="mb-6 flex items-baseline gap-1">
                  <span className={`text-4xl font-extrabold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                    {plan.price}
                  </span>
                  <span className="text-xs text-slate-500">
                    {plan.period}
                  </span>
                </div>

                <div className={`h-px mb-6 ${isDark ? "bg-white/5" : "bg-slate-200"}`} />

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span className={`text-xs text-left ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                        {feat}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => setDemoModalOpen(true)}
                className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-300 cursor-pointer ${
                  plan.popular
                    ? "bg-blue-650 hover:bg-blue-550 text-white shadow-lg shadow-blue-550/20"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md"
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Pricing Info Note */}
        <div className={`border rounded-2xl p-6 flex flex-col md:flex-row items-center md:items-start gap-4 mb-20 text-left ${
          isDark ? "glass bg-white/[0.01] border-white/5" : "bg-slate-55/50 border-slate-200"
        }`}>
          <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
              Looking for special pricing or non-profit discounts?
            </h4>
            <p className="text-slate-505 text-xs mt-1 leading-relaxed">
              We offer customizable volume pricing for companies with 500+ employees and customized discounts for registered non-profit educational and healthcare institutions. Reach out to our billing team directly at <a href="/contact" className="text-blue-550 hover:underline">Contact Us</a>.
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto text-left">
          <h2 className={`text-2xl font-bold tracking-tight mb-8 text-center ${isDark ? "text-white" : "text-slate-900"}`}>
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {[
              {
                q: "How does the 14-day free trial work?",
                a: "You get full, unrestricted access to the Professional plan features for 14 days. No credit card is required to sign up. After 14 days, you can choose to activate your account or let it expire without penalty."
              },
              {
                q: "Are there any setup or hidden charges?",
                a: "No. There are no setup fees, onboarding fees, or technical migration fees. You only pay the per-employee monthly rate."
              },
              {
                q: "Can I upgrade or downgrade plans later?",
                a: "Yes. You can switch between Starter and Professional plans at any time. Your billing will be adjusted dynamically pro-rata on your next billing cycle."
              },
              {
                q: "What payment methods are supported?",
                a: "We support Credit Cards, Debit Cards, Net Banking, and UPI transfers. For larger organizations, we also support bank billing invoices via custom contracts."
              }
            ].map((faq, fIdx) => (
              <div key={fIdx} className={`border-b pb-6 ${isDark ? "border-white/5" : "border-slate-100"}`}>
                <h4 className={`text-sm font-bold mb-2 flex items-center gap-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                  <HelpCircle className="w-4 h-4 text-blue-500 flex-shrink-0" /> {faq.q}
                </h4>
                <p className="text-slate-500 text-xs pl-6 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />

      <DemoModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
      />
    </div>
  );
}
