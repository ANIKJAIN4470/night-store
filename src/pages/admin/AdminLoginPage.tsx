import React, { useState, useEffect } from 'react';
import { UtensilsCrossed, Lock, User, AlertCircle, ArrowLeft, Loader2, KeyRound, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, login, verifyOTP } = useAuth();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [adminId, setAdminId] = useState('');
  const [developmentOtp, setDevelopmentOtp] = useState('');
  const [rememberDevice, setRememberDevice] = useState(false);

  useEffect(() => {
    if (user) navigate('/admin/dashboard');
  }, [user, navigate]);

  const handleCredentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('Username and password required');
      return;
    }

    setLoading(true);
    try {
      console.log('📝 Sending credentials:', { username });
      const result = await login({ username, password });
      console.log('✅ Login response:', result);
      if (result.requiresOTP && result.adminId) {
        console.log('🔐 Moving to OTP step with adminId:', result.adminId);
        setAdminId(result.adminId);
        setDevelopmentOtp(result.developmentOtp || '');
        setStep('otp');
        setUsername('');
        setPassword('');
      } else {
        console.log('⚠️ Unexpected response:', result);
        setError('Unexpected response. Please try again.');
      }
    } catch (err: any) {
      console.error('❌ Login error:', err);
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!otp) {
      setError('OTP required');
      return;
    }

    setLoading(true);
    try {
      await verifyOTP(adminId, otp, rememberDevice);
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'otp') {
    return (
      <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 py-12 bg-gradient-to-br from-[#FFFDF9] to-[#F9F4EC]">
        <div className="w-full max-w-md space-y-6">
          <div className="bg-white rounded-3xl p-8 border border-[#EFE8DF] shadow-xl space-y-6">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#EA580C] bg-[#FFF2E8] px-3 py-2 rounded-lg w-fit mx-auto">
              <Shield className="w-3.5 h-3.5" />
              2FA Verification
            </div>
            
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-black text-[#291D15]">Verify Your Identity</h1>
              <p className="text-xs text-[#786455]">Enter 6-digit OTP code</p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-900 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {developmentOtp && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs">
                Development OTP: <strong className="tracking-widest">{developmentOtp}</strong>
                <span className="block mt-1 text-amber-700">This hint is shown only in local development.</span>
              </div>
            )}

            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#4A3B32] mb-2">OTP Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 rounded-xl border border-[#EFE8DF] text-center tracking-widest text-2xl font-bold text-[#291D15] bg-[#FFFDF9] focus:outline-none focus:border-[#EA580C]"
                  placeholder="000000"
                  disabled={loading}
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-[#786455]">
                <input type="checkbox" checked={rememberDevice} onChange={(e) => setRememberDevice(e.target.checked)} />
                Trust this device for 30 days
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-[#EA580C] hover:bg-[#C2410C] disabled:bg-neutral-300 text-white font-bold text-sm py-3 rounded-xl"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    Verify & Login
                  </>
                )}
              </button>
            </form>

            <button
              onClick={() => { setStep('credentials'); setOtp(''); setError(''); setDevelopmentOtp(''); }}
              className="w-full text-xs font-bold text-[#EA580C] py-2"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 py-12 bg-gradient-to-br from-[#FFFDF9] to-[#F9F4EC]">
      <div className="w-full max-w-md space-y-6">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#786455] hover:text-[#EA580C]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Papi's Kitchen
        </button>

        <div className="bg-white rounded-3xl p-8 border border-[#EFE8DF] shadow-xl space-y-6">
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#EA580C] bg-[#FFF2E8] px-3 py-2 rounded-lg w-fit mx-auto">
            <Shield className="w-3.5 h-3.5" />
            Secure Access (2FA)
          </div>

          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-[#EA580C] flex items-center justify-center text-white mx-auto shadow-md">
              <UtensilsCrossed className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-[#291D15]">Owner Admin Portal</h1>
            <p className="text-xs text-[#786455]">Two-Factor Authentication Required</p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-900 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleCredentialSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#4A3B32] mb-1">Username</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C7A6D]" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#EFE8DF] text-sm text-[#291D15] bg-[#FFFDF9] focus:outline-none focus:border-[#EA580C]"
                  placeholder="Enter username"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A3B32] mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C7A6D]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#EFE8DF] text-sm text-[#291D15] bg-[#FFFDF9] focus:outline-none focus:border-[#EA580C]"
                  placeholder="Enter password"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#EA580C] hover:bg-[#C2410C] disabled:bg-neutral-300 text-white font-bold text-sm py-3 rounded-xl"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  Continue to 2FA
                </>
              )}
            </button>
          </form>

          <div className="p-4 bg-[#F5F1EA] border border-[#EBE0D2] rounded-xl text-xs text-[#6B5A4E] space-y-2">
            <p className="font-bold text-[#4A3B32]">🔐 Security Features</p>
            <ul className="space-y-1 pl-5 text-[10px]">
              <li>✓ 2FA OTP verification</li>
              <li>✓ Device fingerprinting</li>
              <li>✓ Rate limiting</li>
              <li>✓ Session timeout</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
