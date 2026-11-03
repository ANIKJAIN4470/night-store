import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useCustomerAuth } from '../context/CustomerAuthContext.js';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, isAuthenticated } = useCustomerAuth();

  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Password validation feedback
  const passwordStrength = getPasswordStrength(formData.password);

  function getPasswordStrength(pwd: string): { score: number; label: string; color: string } {
    if (!pwd) return { score: 0, label: '', color: '' };
    if (pwd.length < 8) return { score: 1, label: 'Weak', color: 'text-red-600' };
    if (pwd.match(/[a-z]/) && pwd.match(/[A-Z]/) && pwd.match(/\d/)) return { score: 3, label: 'Strong', color: 'text-green-600' };
    return { score: 2, label: 'Medium', color: 'text-yellow-600' };
  }

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/account');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await register(formData.name, formData.email, formData.phone, formData.password, formData.confirmPassword);
      const returnTo = searchParams.get('returnTo') || '/account';
      navigate(returnTo);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
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
            <div className="text-4xl">🎉</div>
            <h1 className="text-2xl font-black text-[#291D15] tracking-tight">Create Your Account</h1>
            <p className="text-sm text-[#786455]">Join us for faster checkouts, order history, and exclusive offers!</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-900 text-sm">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-bold text-[#4A3B32] mb-2">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your name"
                required
                className="w-full px-4 py-3 rounded-xl border border-[#EFE8DF] text-sm text-[#291D15] bg-[#FFFDF9] focus:outline-none focus:border-[#EA580C] transition-colors"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-[#4A3B32] mb-2">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-[#EFE8DF] text-sm text-[#291D15] bg-[#FFFDF9] focus:outline-none focus:border-[#EA580C] transition-colors"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-bold text-[#4A3B32] mb-2">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
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
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="At least 8 characters"
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
              {formData.password && (
                <p className={`text-xs mt-1 font-semibold ${passwordStrength.color}`}>
                  Password strength: {passwordStrength.label}
                </p>
              )}
              <p className="text-xs text-[#786455] mt-1">Must be at least 8 characters</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-bold text-[#4A3B32] mb-2">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  required
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-[#EFE8DF] text-sm text-[#291D15] bg-[#FFFDF9] focus:outline-none focus:border-[#EA580C] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#786455] hover:text-[#291D15]"
                >
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Passwords match
                </p>
              )}
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !formData.name || !formData.email || !formData.phone || formData.password.length < 8 || formData.password !== formData.confirmPassword}
              className="w-full flex items-center justify-center gap-2 bg-[#EA580C] hover:bg-[#C2410C] disabled:bg-neutral-300 text-white font-bold text-sm py-3.5 rounded-xl shadow-md transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="border-t border-[#EFE8DF] pt-4 text-center text-sm text-[#786455]">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="font-bold text-[#EA580C] hover:underline"
            >
              Log in here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
