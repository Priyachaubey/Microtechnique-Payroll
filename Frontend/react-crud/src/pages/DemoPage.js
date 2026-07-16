import React, { useState } from 'react';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import DemoModal from '../components/landing/DemoModal';
import { ArrowRight, ChevronRight, Monitor, UserCheck, ShieldCheck, CreditCard, Sparkles, CheckCircle2 } from 'lucide-react';
export default function DemoPage() {
  const [theme, setTheme] = useState('dark');
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const toggleTheme = () => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  };

  const isDark = theme === 'dark';

  const tourSteps = [
    {
      title: "Governance & Operations Dashboard",
      tagline: "Total control over workforce operations.",
      desc: "Get clear transparency. Admin and HR Dashboards provide aggregated statistics of total headcount, active department directories, active spaces, salary disbursements, and pending registration approvals.",
      features: [
        "Real-time payroll analytics",
        "Active staff roster tracking",
        "Direct Department (Spaces) controls",
        "Action lists for outstanding approvals"
      ],
      icon: Monitor,
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1000&auto=format&fit=crop&q=80",
    },
    {
      title: "Biometric Attendance & Scanner",
      tagline: "Fast, accurate face check-in verification.",
      desc: "Stop buddy punching and manual entry errors. Microtechnique uses a highly optimized face recognition scanner to instantly verify identity, cross-reference against employee profile pictures, and log shifts.",
      features: [
        "Instant face biometric match",
        "No GPS tracking required (Privacy focus)",
        "Automated clock-in/out logs sync",
        "Break logs with automatic penalty rules"
      ],
      icon: UserCheck,
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1000&auto=format&fit=crop&q=80",
    },
    {
      title: "Automated Salary Processing Engine",
      tagline: "Rule-based payroll processed in seconds.",
      desc: "Set allowances and deductions once per department. Handled automatically: PF, ESI, TDS calculations, late log penalties, and break time deductions. Run salary checks with instant draft updates.",
      features: [
        "Flexible department-level salary models",
        "One-click bank transfer spreadsheet files",
        "Automated compliant tax deductions",
        "Downloadable payslips for all staff"
      ],
      icon: CreditCard,
      image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1000&auto=format&fit=crop&q=80",
    },
    {
      title: "Employee Portal & Self-Service",
      tagline: "Transparency for every member of your team.",
      desc: "Build genuine employee confidence. Staff can view their personal profiles, historical log records, holiday calendars, apply for leave, submit reimbursements, and query incorrect entries directly.",
      features: [
        "Secure personal profile credentials",
        "Full transparent historical log sheets",
        "Direct leave submission and balance check",
        "Direct ticket desk for payroll queries"
      ],
      icon: ShieldCheck,
      image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1000&auto=format&fit=crop&q=80",
    }
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
          <span className="text-blue-555 font-mono tracking-widest text-xs uppercase font-semibold block">
            Product Tour
          </span>
          <h1 className={`text-4xl sm:text-5xl font-extrabold tracking-tight font-display ${isDark ? "text-white" : "text-slate-900"}`}>
            Take a Tour of Microtechnique Payroll
          </h1>
          <p className={`text-sm sm:text-base leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            Explore the core features that help businesses automate shift verification and process payroll instantly.
          </p>
        </div>

        {/* Step Navigation Tabs */}
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 border-b pb-6 ${isDark ? "border-white/5" : "border-slate-200"}`}>
          {tourSteps.map((step, idx) => {
            const isActive = idx === activeStep;
            const StepIcon = step.icon;
            return (
              <button
                key={idx}
                onClick={() => setActiveStep(idx)}
                className={`flex items-center gap-3 p-4 rounded-xl text-left transition-all duration-300 cursor-pointer border ${
                  isActive
                    ? "bg-blue-650 text-white border-blue-500 shadow-lg"
                    : isDark
                      ? "bg-white/[0.02] border-white/10 text-slate-400 hover:bg-white/5 hover:text-white"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <StepIcon className="w-5 h-5 flex-shrink-0" />
                <span className="text-xs font-bold font-sans tracking-wide leading-tight hidden sm:inline">
                  {step.title.split(" & ")[0].split(" / ")[0]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tour Segment Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-20">
          {/* Details Left */}
          <div className="lg:col-span-5 flex flex-col space-y-6 text-left">
            <div className={`inline-flex items-center gap-2 border px-3 py-1 rounded-full w-fit ${
              isDark ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-blue-50 border-blue-200 text-blue-600"
            }`}>
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-[10px] font-mono tracking-wider font-semibold uppercase">Step {activeStep + 1} of {tourSteps.length}</span>
            </div>

            <h2 className={`text-3xl font-extrabold tracking-tight font-display leading-tight ${isDark ? "text-white" : "text-slate-900"}`}>
              {tourSteps[activeStep].title}
            </h2>
            <h4 className="text-blue-550 font-bold text-sm leading-normal">
              {tourSteps[activeStep].tagline}
            </h4>

            <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              {tourSteps[activeStep].desc}
            </p>

            <div className="space-y-3">
              {tourSteps[activeStep].features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 flex-shrink-0" />
                  <span className={`text-xs ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    {feat}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-6 flex gap-4">
              {activeStep < tourSteps.length - 1 ? (
                <button
                  onClick={() => setActiveStep((s) => s + 1)}
                  className="px-6 py-3 rounded-xl bg-blue-650 hover:bg-blue-550 text-white font-bold text-xs transition duration-300 flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <span>Next Feature</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setDemoModalOpen(true)}
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition duration-300 flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <span>Start Free Trial</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Screenshot Representation Right */}
          <div className="lg:col-span-7 relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-lg md:max-w-xl lg:max-w-none group">
              {/* Glow backlighting */}
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl blur-xl opacity-10 pointer-events-none" />

              {/* High-fidelity browser shell frame */}
              <div className={`relative rounded-2xl shadow-2xl overflow-hidden border ${
                isDark ? "glass border-white/10" : "bg-white border-slate-200"
              }`}>
                {/* Browser top-bar */}
                <div className={`px-4 py-3 flex items-center justify-between border-b ${
                  isDark ? "bg-white/[0.02] border-white/10" : "bg-slate-50 border-slate-200"
                }`}>
                  <div className="flex items-center space-x-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#fbbf24]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                  </div>
                  {/* Fake location bar */}
                  <div className={`border px-4 py-1 rounded text-[10px] font-mono tracking-wide w-1/2 text-center select-none truncate ${
                    isDark ? "bg-slate-950/40 border-white/5 text-slate-400" : "bg-slate-200/50 border-slate-300 text-slate-600"
                  }`}>
                    microtechnique.co/portal/tour/...
                  </div>
                  <div className="w-12 text-right">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  </div>
                </div>

                {/* Dashboard Image */}
                <div className="relative aspect-[16/10] w-full bg-slate-950 overflow-hidden">
                  <img
                    src={tourSteps[activeStep].image}
                    alt={tourSteps[activeStep].title}
                    className="w-full h-full object-cover object-top transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none" />
                </div>
              </div>
            </div>
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
