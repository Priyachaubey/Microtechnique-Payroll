import React from 'react';
import { ArrowRight, ShieldCheck, Clock, CheckCircle2, User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';

// High quality modern dashboard image
const screenshotDashboard = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1000&auto=format&fit=crop&q=80';

export default function Hero({ onOpenDemo, onNavigate, theme }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const isLoggedIn = !!user;
  const loggedInUser = user;

  const getDashboardPath = (role) => {
    if (role === 'SuperAdmin') return '/superadmin';
    if (role === 'Admin') return '/admin';
    return '/employee';
  };

  const isDark = theme === 'dark';

  return (
    <section
      id="hero"
      className={`relative min-h-screen pt-32 pb-20 flex items-center overflow-hidden transition-colors duration-300 ${
        isDark ? "bg-[#020617] text-white mesh-bg" : "bg-slate-50 text-slate-900"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10 w-full animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Hero Left Content Text Panel */}
          <div className="lg:col-span-6 flex flex-col space-y-8 text-left">
            {/* Elegant Chip Badge - Focused on Trust */}
            <div className={`inline-flex items-center gap-2 border px-4 py-2 rounded-full w-fit backdrop-blur-md ${
              isDark ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-700"
            }`}>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold tracking-wider font-mono">
                Safe, Accurate & On-Time Payroll Systems
              </span>
            </div>

            {/* Display Heading with Simplified Trust message */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight font-display">
              The Payroll Software <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 bg-clip-text text-transparent">
                Your Team Will Trust.
              </span>
            </h1>

            {/* Supporting paragraph description */}
            <p className={`text-sm sm:text-base leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              Microtechnique Payroll combines transparent shift tracking, instant salary previews, and biometric verification. Get reliable payroll processing with zero downtime, built for secure and growing organizations.
            </p>

            {/* Dynamic UI based on Authentication state */}
            {!isLoggedIn ? (
              <div className="space-y-4 pt-2">
                {/* Primary Action Buttons: Get Free Trial and Take a Tour */}
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <button
                    onClick={onOpenDemo}
                    className="w-full sm:w-auto px-8 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all shadow-lg hover:shadow-emerald-500/20 hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer border border-emerald-450/10"
                  >
                    <span>Get Free Trial</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => navigate('/demo')}
                    className={`w-full sm:w-auto px-8 py-4 rounded-xl border font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer bg-transparent ${
                      isDark ? "border-white/10 hover:bg-white/[0.08] hover:border-white/20 text-slate-100" : "border-slate-300 hover:bg-slate-100 hover:border-slate-400 text-slate-700"
                    }`}
                  >
                    <span>Take a Tour</span>
                  </button>
                </div>

                {/* Secondary navigation to Simulator */}
                <div className="text-left">
                  <button
                    onClick={() => onNavigate("roi")}
                    className={`text-xs underline transition-colors cursor-pointer border-none bg-transparent ${
                      isDark ? "text-slate-400 hover:text-blue-400" : "text-slate-500 hover:text-blue-600"
                    }`}
                  >
                    Estimate your monthly savings in Rupees &rarr;
                  </button>
                </div>
              </div>
            ) : (
              /* Logged In Workspace States */
              <div className={`border rounded-2xl p-6 text-left max-w-lg space-y-4 ${
                isDark ? "glass bg-white/[0.03] border-emerald-500/20" : "bg-emerald-50/50 border-emerald-200"
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className={`font-bold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>{loggedInUser.name}</h4>
                      <p className="text-slate-500 text-[10px] uppercase font-mono">Role: {loggedInUser.role}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(getDashboardPath(loggedInUser.role))}
                      className="flex items-center space-x-1 text-xs text-blue-500 hover:text-blue-600 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg border border-blue-500/10 transition cursor-pointer"
                    >
                      <span>Dashboard</span>
                    </button>
                    <button
                      onClick={logout}
                      className="flex items-center space-x-1 text-xs text-rose-500 hover:text-rose-600 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 rounded-lg border border-rose-500/10 transition cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>

                <div className={`h-px ${isDark ? "bg-white/5" : "bg-slate-200"}`} />

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-slate-500 block">Personal Privacy Key:</span>
                    <span className="text-emerald-500 font-bold font-mono">STATUS_ENCRYPTED</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-slate-500 block">Active Attendance:</span>
                    <span className="text-blue-500 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                      Roster Up-To-Date
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Simplistic trust points */}
            <div className={`grid grid-cols-3 gap-4 pt-8 border-t font-sans ${isDark ? "border-white/5" : "border-slate-200"}`}>
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className={`text-xs font-bold font-sans ${isDark ? "text-white" : "text-slate-900"}`}>100% Secure</span>
                  <span className="text-slate-500 text-[10px] mt-0.5 font-sans">Strict Privacy Safeguard</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className={`text-xs font-bold font-sans ${isDark ? "text-white" : "text-slate-900"}`}>No Delayed Pay</span>
                  <span className="text-slate-500 text-[10px] mt-0.5 font-sans">On-Time Deposits</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className={`text-xs font-bold font-sans ${isDark ? "text-white" : "text-slate-900"}`}>Transparent Logs</span>
                  <span className="text-slate-500 text-[10px] mt-0.5 font-sans">Verify Every Shift</span>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Right Platform Screenshot Mockup Panel */}
          <div className="lg:col-span-6 relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-lg md:max-w-xl lg:max-w-none group">
              {/* Backlit Blue/Indigo Glow Ring */}
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-indigo-600 rounded-2xl blur-2xl opacity-10 group-hover:opacity-20 transition duration-700 pointer-events-none" />

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
                    microtechnique.co/portal/...
                  </div>
                  <div className="w-12 text-right">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  </div>
                </div>

                {/* Inside Dashboard Image */}
                <div className="relative aspect-[16/10] w-full bg-slate-950 overflow-hidden">
                  <img
                    src={screenshotDashboard}
                    alt="Workforce Registry Staff Area"
                    className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.01]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none" />
                </div>
              </div>

              {/* Simple Live Clock and Safety Status indicator */}
              <div className={`absolute -bottom-6 -left-4 border px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 max-w-xs select-none ${
                isDark ? "bg-slate-900/90 border-white/10" : "bg-white border-slate-200"
              }`}>
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-slate-500 text-[9px] tracking-wider uppercase font-semibold">Privacy Policy Verified</span>
                  <span className={`text-xs font-bold font-mono ${isDark ? "text-white" : "text-slate-900"}`}>100% Secure Storage</span>
                </div>
              </div>

              {/* Floating trust status badge */}
              <div className={`absolute -top-6 -right-4 border px-4 py-2.5 rounded-xl shadow-2xl flex flex-col gap-0.5 text-left pointer-events-none select-none ${
                isDark ? "glass border-white/10" : "bg-white border-slate-200"
              }`}>
                <span className="text-slate-500 text-[9px] tracking-wider uppercase">Active Staff Session</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className={`text-xs font-semibold font-mono ${isDark ? "text-white" : "text-slate-900"}`}>Protected Privacy</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
