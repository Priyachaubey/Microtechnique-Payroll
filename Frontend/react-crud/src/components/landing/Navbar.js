import { useState, useEffect } from 'react';
import React from 'react';
import { Menu, X, ArrowRight, LogOut, Sun, Moon } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import logoMicrotechnique from '../../logo.png';

export default function Navbar({ onOpenDemo, activeSection, onNavigate, theme, onToggleTheme }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  
  const isLoggedIn = !!user;
  const loggedInUser = user;

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: "Features", id: "solutions", type: "scroll" },
    { label: "Salary Portal", id: "payroll", type: "scroll" },
    { label: "Savings Estimator", id: "roi", type: "scroll" },
    { label: "Take a Tour", path: "/demo", type: "route" },
    { label: "Pricing", path: "/pricing", type: "route" },
    { label: "Contact Us", path: "/contact", type: "route" },
  ];

  const handleLinkClick = (item) => {
    if (item.type === 'scroll') {
      if (location.pathname !== '/') {
        navigate('/');
        setTimeout(() => {
          const el = document.getElementById(item.id);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        onNavigate(item.id);
      }
    } else {
      navigate(item.path);
    }
    setMobileMenuOpen(false);
  };

  const getDashboardPath = (role) => {
    if (role === 'SuperAdmin') return '/superadmin';
    if (role === 'Admin') return '/admin';
    return '/employee';
  };

  const isDark = theme === 'dark';

  return (
    <nav
      id="top-navigation"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? isDark
            ? "bg-slate-950/70 backdrop-blur-xl border-b border-white/5 shadow-2xl py-3"
            : "bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-md py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between">
          {/* Logo Brand Panel */}
          <div
            id="brand-logo"
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => {
              if (location.pathname !== '/') navigate('/');
              else onNavigate('hero');
            }}
          >
            <div className="w-10 h-10 flex items-center justify-center select-none group-hover:scale-105 transition-transform duration-300">
              <img
                src={logoMicrotechnique}
                alt="Logo"
                className="w-full h-full object-contain filter brightness-110 drop-shadow"
              />
            </div>
            <span className={`text-xl font-bold tracking-tight font-display select-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
              MICROTECHNIQUE<span className="font-light text-blue-500">PAYROLL</span>
            </span>
          </div>

          {/* Desktop Navigation */}
          <div id="desktop-links" className="hidden lg:flex items-center gap-6 text-sm font-medium">
            {navItems.map((item, idx) => {
              const isScrollActive = item.type === 'scroll' && activeSection === item.id && location.pathname === '/';
              const isRouteActive = item.type === 'route' && location.pathname === item.path;
              const isActive = isScrollActive || isRouteActive;

              return (
                <button
                  key={idx}
                  onClick={() => handleLinkClick(item)}
                  className={`transition-colors cursor-pointer text-sm font-medium border-none bg-transparent ${
                    isActive
                      ? "text-blue-550 font-bold"
                      : isDark
                        ? "text-slate-400 hover:text-blue-400"
                        : "text-slate-600 hover:text-blue-600"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Action CTA Buttons */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Theme Toggle Button */}
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  isDark
                    ? "border-white/10 text-yellow-400 hover:bg-white/5"
                    : "border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
                title="Toggle Theme"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}

            {!isLoggedIn ? (
              <>
                <button
                  id="navbar-login-btn"
                  onClick={() => navigate('/login')}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer border-none bg-transparent ${
                    isDark ? "text-slate-300 hover:text-white hover:bg-white/5" : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  Login
                </button>
                <button
                  id="navbar-register-btn"
                  onClick={onOpenDemo}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-all shadow-md hover:shadow-emerald-500/20 cursor-pointer flex items-center gap-1.5 border border-emerald-555/10"
                >
                  <span>Get Free Trial</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <div className={`flex items-center gap-3 rounded-xl border px-3 py-1.5 ${
                isDark ? "bg-emerald-500/5 border-emerald-500/20" : "bg-emerald-500/10 border-emerald-500/30"
              }`}>
                <button
                  onClick={() => navigate(getDashboardPath(loggedInUser.role))}
                  className={`flex items-center gap-2 border-none bg-transparent cursor-pointer ${
                    isDark ? "text-slate-300 hover:text-white" : "text-slate-800 hover:text-slate-950"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs">Dashboard: <strong>{loggedInUser.name}</strong></span>
                </button>
                <button
                  onClick={logout}
                  className="text-slate-400 hover:text-rose-500 p-1 rounded-lg transition border-none bg-transparent cursor-pointer"
                  title="Logout Session"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu and Theme Toggle */}
          <div className="lg:hidden flex items-center gap-2">
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  isDark
                    ? "border-white/10 text-yellow-400 hover:bg-white/5"
                    : "border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {isDark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
              </button>
            )}
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 rounded-full transition-all focus:outline-none border-none bg-transparent ${
                isDark ? "text-slate-400 hover:text-white hover:bg-white/5" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div
          id="mobile-nav-panel"
          className={`absolute top-full left-0 right-0 px-6 pt-4 pb-8 shadow-2xl transition-all ${
            isDark ? "bg-slate-950/95 backdrop-blur-2xl border-b border-white/5" : "bg-white/95 backdrop-blur-2xl border-b border-slate-200"
          }`}
        >
          <div className="space-y-1">
            {navItems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleLinkClick(item)}
                className={`w-full text-left block px-4 py-3 rounded-xl text-base font-medium transition-all border-none bg-transparent ${
                  isDark
                    ? "text-slate-300 hover:bg-white/5 hover:text-white"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className={`pt-4 border-t space-y-3 ${isDark ? "border-white/5" : "border-slate-100"}`}>
            {!isLoggedIn ? (
              <>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/login');
                  }}
                  className={`w-full text-center py-3 rounded-xl font-semibold text-sm transition-all block cursor-pointer border-none bg-transparent ${
                    isDark ? "text-slate-300 hover:text-white hover:bg-white/5" : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenDemo();
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm text-center py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-lg cursor-pointer border border-emerald-450/10"
                >
                  <span>Get Free Trial</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate(getDashboardPath(loggedInUser.role));
                  }}
                  className={`flex items-center justify-center gap-2 border py-2.5 rounded-xl text-xs cursor-pointer ${
                    isDark ? "bg-emerald-500/10 border-emerald-500/20 text-white" : "bg-emerald-500/15 border-emerald-500/30 text-emerald-950"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Dashboard: <strong>{loggedInUser.name}</strong></span>
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-center py-3 text-rose-400 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/15 rounded-xl font-bold text-sm transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out Securely</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
