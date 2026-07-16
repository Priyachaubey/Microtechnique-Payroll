import React, { useState } from 'react';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import DemoModal from '../components/landing/DemoModal';
import { Mail, Phone, MapPin, Send, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function ContactPage() {
  const [theme, setTheme] = useState('dark');
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    employees: '1-50',
    message: ''
  });

  const toggleTheme = () => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  };

  const isDark = theme === 'dark';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.company || !formData.message) {
      toast.error("Please fill in all required fields.");
      return;
    }
    try {
      setLoading(true);
      await axios.post('/api/Auth/contact-request', formData);
      setSubmitted(true);
      toast.success("Message sent! Our team will contact you shortly.");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
            Get in touch
          </span>
          <h1 className={`text-4xl sm:text-5xl font-extrabold tracking-tight font-display ${isDark ? "text-white" : "text-slate-900"}`}>
            We're Here to Help Your Team
          </h1>
          <p className={`text-sm sm:text-base leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            Have questions about pricing, setup, or features? Send us a message or contact us directly on WhatsApp.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch mb-16">
          {/* Contact Details Panel */}
          <div className={`lg:col-span-5 border rounded-3xl p-8 flex flex-col justify-between ${
            isDark ? "glass bg-white/[0.02] border-white/10" : "bg-slate-50 border-slate-200"
          }`}>
            <div className="space-y-8">
              <h2 className={`text-2xl font-bold tracking-tight text-left ${isDark ? "text-white" : "text-slate-900"}`}>
                Contact Information
              </h2>
              <p className={`text-xs text-left leading-relaxed ${isDark ? "text-slate-400" : "text-slate-555"}`}>
                Fill out the form, start a direct WhatsApp chat, or call our customer success hotline.
              </p>

              <div className="space-y-6">
                <div className="flex items-center gap-4 text-left">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-550 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-mono block">Call Support</span>
                    <span className={`text-sm font-bold font-mono ${isDark ? "text-white" : "text-slate-900"}`}>+91 99999 99999</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-left">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-555 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-mono block">Email Team</span>
                    <span className={`text-sm font-bold font-mono ${isDark ? "text-white" : "text-slate-900"}`}>support@microtechnique.co</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-left">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-555 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-mono block">Office Location</span>
                    <span className={`text-xs font-bold leading-normal block ${isDark ? "text-white" : "text-slate-900"}`}>
                      Sector 62, Noida, Uttar Pradesh, India - 201301
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Direct WhatsApp Action */}
            <div className={`mt-8 pt-8 border-t ${isDark ? "border-white/5" : "border-slate-200"}`}>
              <a
                href="https://wa.me/916355997080?text=Hi!%20I'd%20like%20to%20speak%20with%20a%20representative%20about%20Microtechnique%20Payroll."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4.5 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-sm transition duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#25d366]/10"
              >
                <MessageSquare className="w-4.5 h-4.5" />
                <span>Chat Direct on WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Contact Form Card */}
          <div className={`lg:col-span-7 border rounded-3xl p-8 ${
            isDark ? "glass bg-white/[0.02] border-white/10" : "bg-white border-slate-200 shadow-xl"
          }`}>
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <h3 className={`text-2xl font-bold tracking-tight text-left mb-6 ${isDark ? "text-white" : "text-slate-900"}`}>
                  Send Us a Message
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col text-left space-y-2">
                    <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`px-4 py-3 rounded-xl border focus:outline-none transition placeholder-slate-500 ${
                        isDark ? "bg-slate-950 border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}
                    />
                  </div>

                  <div className="flex flex-col text-left space-y-2">
                    <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                      Work Email
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="you@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`px-4 py-3 rounded-xl border focus:outline-none transition placeholder-slate-500 ${
                        isDark ? "bg-slate-950 border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col text-left space-y-2">
                    <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                      Company Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Microtechnique Pvt Ltd"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className={`px-4 py-3 rounded-xl border focus:outline-none transition placeholder-slate-500 ${
                        isDark ? "bg-slate-950 border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}
                    />
                  </div>

                  <div className="flex flex-col text-left space-y-2">
                    <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                      Workforce Size
                    </label>
                    <select
                      required
                      value={formData.employees}
                      onChange={(e) => setFormData({ ...formData, employees: e.target.value })}
                      className={`px-4 py-3 rounded-xl border focus:outline-none transition ${
                        isDark ? "bg-slate-950 border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}
                    >
                      <option value="1-50">1 - 50 employees</option>
                      <option value="51-250">51 - 250 employees</option>
                      <option value="251-1000">251 - 1000 employees</option>
                      <option value="1000+">1000+ employees</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col text-left space-y-2">
                  <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    Your Message / Query
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe your query or migration requirements..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className={`px-4 py-3 rounded-xl border focus:outline-none transition placeholder-slate-500 ${
                      isDark ? "bg-slate-950 border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-4 rounded-xl bg-blue-650 hover:bg-blue-550 text-white font-bold text-sm transition duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                    loading ? "opacity-75 cursor-not-allowed" : ""
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>{loading ? "Sending Message..." : "Send Message"}</span>
                </button>
              </form>
            ) : (
              <div className="h-full flex flex-col items-center justify-center space-y-4 py-16">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
                  <Send className="w-8 h-8" />
                </div>
                <h4 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                  Thank you!
                </h4>
                <p className="text-slate-500 text-sm max-w-sm text-center leading-relaxed">
                  Your message has been sent successfully. An account representative will reach out to you within the next 2-4 hours.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className={`px-6 py-2.5 rounded-xl border text-xs font-bold cursor-pointer bg-transparent mt-4 ${
                    isDark ? "border-white/10 hover:bg-white/5 text-white" : "border-slate-300 hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  Send another message
                </button>
              </div>
            )}
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
