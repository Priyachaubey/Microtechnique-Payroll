import React, { useState } from 'react';
import { SERVICES } from './data';
import * as Icons from 'lucide-react';

const iconMapping = {
  Network: 'Network',
  CloudLightning: 'CloudLightning',
  ShieldCheck: 'ShieldCheck',
  Cpu: 'Cpu'
};

export default function Services({ onOpenDemo, theme }) {
  const [selectedServiceId, setSelectedServiceId] = useState(SERVICES[0].id);

  const activeService = SERVICES.find((s) => s.id === selectedServiceId) || SERVICES[0];

  const renderIcon = (iconName, className) => {
    const key = iconMapping[iconName] || 'Cpu';
    const IconComponent = Icons[key];
    if (IconComponent) {
      return <IconComponent className={className} />;
    }
    return <Icons.Cpu className={className} />;
  };

  const isDark = theme === 'dark';

  return (
    <section
      id="solutions"
      className={`py-24 border-y transition-colors duration-300 relative overflow-hidden ${
        isDark ? "bg-[#020617] border-white/5" : "bg-white border-slate-200"
      }`}
    >
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10 animate-fade-in">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16 flex flex-col space-y-4">
          <span className="text-blue-550 font-mono tracking-widest text-xs uppercase font-semibold">
            Enterprise Offerings
          </span>
          <h2 className={`text-3xl sm:text-4xl font-extrabold tracking-tight font-display ${isDark ? "text-white" : "text-slate-900"}`}>
            High-Scale Enterprise Solutions
          </h2>
          <p className={`text-sm sm:text-base leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            Microtechnique IT serves complex industries with high-performance frameworks, automated workforce systems, robust cloud infrastructure, and complete financial records security.
          </p>
        </div>

        {/* Interactive Service Selector Board */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left: Services Cards Selection List */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            {SERVICES.map((srv) => {
              const isSelected = srv.id === selectedServiceId;
              return (
                <button
                  key={srv.id}
                  id={`service-tab-${srv.id}`}
                  onClick={() => setSelectedServiceId(srv.id)}
                  className={`flex items-start text-left p-5 rounded-2xl transition-all duration-300 relative cursor-pointer border ${
                    isSelected
                      ? isDark
                        ? "bg-blue-500/15 border-blue-500/50 shadow-lg shadow-blue-500/10"
                        : "bg-blue-50 border-blue-500 shadow-md"
                      : isDark
                        ? "bg-white/[0.01] border-white/5 hover:bg-white/[0.04]"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {/* Left border active highlight indicator */}
                  {isSelected && (
                    <div className="absolute left-[-1px] top-6 bottom-6 w-1 accent-gradient rounded-r" />
                  )}

                  {/* Icon wrap */}
                  <div className={`p-3 rounded-xl mr-4 flex-shrink-0 border ${
                    isSelected
                      ? "bg-blue-500/10 border-blue-500/30 text-blue-550"
                      : isDark
                        ? "bg-white/[0.02] border-white/5 text-slate-400"
                        : "bg-white border-slate-200 text-slate-500"
                  }`}>
                    {renderIcon(srv.iconName, "w-6 h-6")}
                  </div>

                  <div className="flex flex-col">
                    <span className={`font-bold text-base tracking-wide flex items-center ${isDark ? "text-white" : "text-slate-900"}`}>
                      {srv.title}
                    </span>
                    <span className="text-slate-500 text-xs mt-0.5">{srv.subtitle}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: Service Detail Full Specifications Panel */}
          <div className="lg:col-span-7">
            <div className={`h-full rounded-2xl p-6 sm:p-8 flex flex-col justify-between relative shadow-2xl border ${
              isDark ? "glass bg-white/[0.03] border-white/10" : "bg-white border-slate-200"
            }`}>
              {/* Backlight halo effect */}
              <div className="absolute top-5 right-5 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

              <div className="flex flex-col space-y-6">
                {/* Selected Service Info Title & Summary */}
                <div className={`flex items-center justify-between border-b pb-5 ${isDark ? "border-white/5" : "border-slate-100"}`}>
                  <div className="flex flex-col text-left">
                    <span className="text-slate-500 text-[10px] tracking-widest font-mono uppercase">Selected Application Service</span>
                    <h3 className={`text-2xl font-bold tracking-tight mt-1 ${isDark ? "text-white" : "text-slate-900"}`}>{activeService.title}</h3>
                  </div>
                  <div className={`p-3 rounded-xl border ${
                    isDark ? "bg-white/[0.02] border-white/5 text-blue-400" : "bg-slate-50 border-slate-200 text-blue-600"
                  }`}>
                    {renderIcon(activeService.iconName, "w-8 h-8")}
                  </div>
                </div>

                {/* Main description details */}
                <p className={`text-sm leading-relaxed text-left ${isDark ? "text-slate-350" : "text-slate-700"}`}>
                  {activeService.description}
                </p>

                {/* Bullets feature list */}
                <div className="flex flex-col space-y-2.5 text-left">
                  <span className={`text-xs font-bold tracking-wider uppercase mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>Key Features Overview:</span>
                  {activeService.features.map((feat, index) => (
                    <div key={index} className={`flex items-start space-x-2 text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                      <Icons.Check className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                {/* Tech specifications indicators */}
                <div className="pt-4 mt-2">
                  <span className={`text-xs font-bold tracking-wider uppercase block text-left mb-3 ${isDark ? "text-white" : "text-slate-900"}`}>Service Level SLA Specs:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {activeService.specs.uptime && (
                      <div className={`border p-3.5 rounded-xl flex flex-col text-center ${
                        isDark ? "glass bg-white/[0.02] border-white/5" : "bg-slate-55/50 border-slate-200"
                      }`}>
                        <span className="text-slate-500 text-[9px] font-mono tracking-wider uppercase">Runtime Uptime</span>
                        <span className="text-blue-600 text-sm font-bold font-mono mt-1">{activeService.specs.uptime}</span>
                      </div>
                    )}
                    {activeService.specs.latency && (
                      <div className={`border p-3.5 rounded-xl flex flex-col text-center ${
                        isDark ? "glass bg-white/[0.02] border-white/5" : "bg-slate-55/50 border-slate-200"
                      }`}>
                        <span className="text-slate-500 text-[9px] font-mono tracking-wider uppercase">Edge Latency</span>
                        <span className="text-indigo-600 text-sm font-bold font-mono mt-1">{activeService.specs.latency}</span>
                      </div>
                    )}
                    {activeService.specs.compliance && (
                      <div className={`border p-3.5 rounded-xl flex flex-col text-center ${
                        isDark ? "glass bg-white/[0.02] border-white/5" : "bg-slate-55/50 border-slate-200"
                      }`}>
                        <span className="text-slate-500 text-[9px] font-mono tracking-wider uppercase">Compliance Standard</span>
                        <span className={`text-[11px] font-bold font-mono mt-1 w-full overflow-hidden text-ellipsis whitespace-nowrap ${isDark ? "text-blue-400" : "text-blue-600"}`}>{activeService.specs.compliance}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Button inside detail */}
              <div className={`pt-8 border-t mt-6 ${isDark ? "border-white/5" : "border-slate-100"}`}>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center space-x-2 text-slate-500 text-xs text-left w-full sm:w-auto">
                    <Icons.Lock className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    <span>Auditable logs and encrypted configurations.</span>
                  </div>
                  <button
                    onClick={onOpenDemo}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all cursor-pointer border border-emerald-555/15"
                  >
                    Get Free Trial
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
