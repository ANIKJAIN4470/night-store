import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useCustomerAuth } from '../context/CustomerAuthContext.js';
import { customerGetCaptcha } from '../services/api.js';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isAuthenticated } = useCustomerAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [captchaChallenge, setCaptchaChallenge] = useState('');
  const [captchaDisplay, setCaptchaDisplay] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [loadingCaptcha, setLoadingCaptcha] = useState(false);

  const fetchCaptcha = async () => {
    setLoadingCaptcha(true);
    try {
      const data = await customerGetCaptcha();
      setCaptchaChallenge(data.challenge);
      setCaptchaDisplay(data.display);
      setCaptchaAnswer('');
    } catch (err) {
      setError('Failed to load CAPTCHA. Please refresh.');
    } finally {
      setLoadingCaptcha(false);
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  // If already logged in, redirect
  useEffect(() => {
    if (isAuthenticated) {
      const returnTo = searchParams.get('returnTo') || '/account';
      navigate(returnTo);
    }
  }, [isAuthenticated, navigate, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login(email, password, captchaChallenge, captchaAnswer);
      const returnTo = searchParams.get('returnTo') || '/account';
      navigate(returnTo);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
      fetchCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-[#FFFDF9]">
      <div className="w-full max-w-md space-y-6">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#786455] hover:text-[#EA580C] transition-colors"
        >
          <ArrowRight className="w-4 h-4 rotate-180" />
          <span>Back to Papi's Kitchen</span>
        </button>

        {/* Card */}
        <div className="bg-white rounded-3xl p-8 border border-[#EFE8DF] shadow-lg space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="text-4xl">🍔</div>
            <h1 className="text-2xl font-black text-[#291D15] tracking-tight">Welcome Back</h1>
            <p className="text-sm text-[#786455]">Log in to your Papi's Kitchen account to view your order history and place faster orders.</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-900 text-sm">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-[#4A3B32] mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-[#EFE8DF] text-sm text-[#291D15] bg-[#FFFDF9] focus:outline-none focus:border-[#EA580C] transition-colors"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-bold text-[#4A3B32] mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-[#EFE8DF] text-sm text-[#291D15] bg-[#FFFDF9] focus:outline-none focus:border-[#EA580C] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#786455] hover:text-[#291D15]"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* CAPTCHA */}
            <div>
              <label className="block text-sm font-bold text-[#4A3B32] mb-2">Security Verification</label>
              <div className="bg-[#F5F1EA] rounded-xl p-4 border border-[#EFE8DF]">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-[#291D15]">{captchaDisplay}</p>
                  <button
                    type="button"
                    onClick={fetchCaptcha}
                    disabled={loadingCaptcha}
                    className="text-[#EA580C] hover:text-[#C2410C] disabled:text-neutral-400"
                  >
                    {loadingCaptcha ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  </button>
                </div>
                <input
                  type="text"
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                  placeholder="Your answer"
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-[#EFE8DF] text-sm text-[#291D15] bg-white focus:outline-none focus:border-[#EA580C] transition-colors"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#EA580C] hover:bg-[#C2410C] disabled:bg-neutral-300 text-white font-bold text-sm py-3.5 rounded-xl shadow-md transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <span>Log In</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Signup Link */}
          <div className="border-t border-[#EFE8DF] pt-4 text-center text-sm text-[#786455]">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/register')}
              className="font-bold text-[#EA580C] hover:underline"
            >
              Sign up here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
