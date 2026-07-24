import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MessageSquare, Lock, Mail, User, Eye, EyeOff, Sparkles, ShieldCheck, Zap, Users, Loader2 } from 'lucide-react';

const AuthModal = () => {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        if (!formData.username || formData.username.trim().length < 3) {
          setError('Username must be at least 3 characters long.');
          setSubmitting(false);
          return;
        }
        await register(formData.username, formData.email, formData.password);
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.response?.data?.message || 'Authentication failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 auth-bg-mesh overflow-y-auto min-h-screen">
      {/* Dynamic Background Glow Spheres */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00a884]/15 rounded-full blur-[120px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#008069]/15 rounded-full blur-[120px] pointer-events-none animate-pulse-glow" style={{ animationDelay: '1.5s' }} />

      <div className="w-full max-w-md glass-modal rounded-3xl p-6 sm:p-8 relative overflow-hidden animate-pop-in border border-white/10 my-auto">
        {/* Ambient Top Glow Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#008069] via-[#00a884] to-[#06cf9c]" />

        {/* Header Branding */}
        <div className="text-center mb-8 relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#008069] to-[#00a884] text-white mb-4 shadow-xl shadow-[#00a884]/30 transform hover:scale-105 transition">
            <MessageSquare className="w-8 h-8 fill-current text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2 font-display">
            ChatMe <Sparkles className="w-5 h-5 text-[#00a884] animate-bounce" />
          </h1>
          <p className="text-xs sm:text-sm text-[#8696a0] mt-1.5 font-medium">
            Next-Gen Real-Time Messaging & Rooms
          </p>
        </div>

        {/* Custom Tab Switcher */}
        <div className="relative flex bg-[#111b21] p-1.5 rounded-2xl mb-6 border border-white/5 relative z-10 shadow-inner">
          <button
            type="button"
            onClick={() => {
              setIsLogin(true);
              setError('');
            }}
            className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all duration-300 ${
              isLogin
                ? 'bg-gradient-to-r from-[#008069] to-[#00a884] text-[#0b141a] shadow-lg shadow-[#00a884]/20'
                : 'text-[#8696a0] hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLogin(false);
              setError('');
            }}
            className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all duration-300 ${
              !isLogin
                ? 'bg-gradient-to-r from-[#008069] to-[#00a884] text-[#0b141a] shadow-lg shadow-[#00a884]/20'
                : 'text-[#8696a0] hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold text-center animate-fade-in relative z-10 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
            {error}
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-[#8696a0] mb-1.5 uppercase tracking-wider">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#8696a0] absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="e.g. AlexMorgan"
                  required
                  className="w-full bg-[#111b21] text-white text-sm pl-10 pr-4 py-3 rounded-xl border border-white/10 focus:border-[#00a884] focus:ring-2 focus:ring-[#00a884]/20 transition-all placeholder-[#667781]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#8696a0] mb-1.5 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#8696a0] absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@example.com"
                required
                className="w-full bg-[#111b21] text-white text-sm pl-10 pr-4 py-3 rounded-xl border border-white/10 focus:border-[#00a884] focus:ring-2 focus:ring-[#00a884]/20 transition-all placeholder-[#667781]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8696a0] mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#8696a0] absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full bg-[#111b21] text-white text-sm pl-10 pr-10 py-3 rounded-xl border border-white/10 focus:border-[#00a884] focus:ring-2 focus:ring-[#00a884]/20 transition-all placeholder-[#667781]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-[#8696a0] hover:text-white transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-[#008069] via-[#00a884] to-[#06cf9c] hover:opacity-95 text-[#0b141a] font-extrabold text-sm rounded-xl shadow-lg shadow-[#00a884]/25 transition transform active:scale-98 disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#0b141a]" />
                <span>Processing...</span>
              </>
            ) : isLogin ? (
              'Sign In to ChatMe'
            ) : (
              'Create My Account'
            )}
          </button>
        </form>

        {/* Feature Badges Footer */}
        <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-3 gap-2 text-center text-[11px] text-[#8696a0] relative z-10">
          <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white/[0.02]">
            <Zap className="w-4 h-4 text-[#00a884]" />
            <span>Fast Socket</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white/[0.02]">
            <Users className="w-4 h-4 text-[#00a884]" />
            <span>Group Rooms</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white/[0.02]">
            <ShieldCheck className="w-4 h-4 text-[#00a884]" />
            <span>Private Chat</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
