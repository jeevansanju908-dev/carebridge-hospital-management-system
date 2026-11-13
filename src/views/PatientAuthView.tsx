import React, { useEffect, useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Lock,
  ArrowRight,
  ArrowLeft,
  HeartPulse,
  Droplet,
  MapPin,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
} from 'lucide-react';
import { useAuth, type GooglePendingProfile } from '../context/AuthContext.js';
import { GoogleSignInButton } from '../components/GoogleSignInButton.js';

interface PatientAuthViewProps {
  initialMode?: 'login' | 'register';
  onSuccess: () => void;
  onBack: () => void;
  onSwitchToHospital: () => void;
}

export const PatientAuthView: React.FC<PatientAuthViewProps> = ({
  initialMode = 'login',
  onSuccess,
  onBack,
  onSwitchToHospital,
}) => {
  const {
    loginPatient,
    registerPatient,
    loginWithGoogle,
    completeGooglePatientRegistration,
  } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [googleConfigured, setGoogleConfigured] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetch('/api/auth/google/config')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (mounted && data?.configured && data?.clientId) {
          setGoogleConfigured(true);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  // Pending Google Registration State (for brand-new Google accounts)
  const [pendingGoogle, setPendingGoogle] = useState<{
    registrationToken: string;
    profile: GooglePendingProfile;
  } | null>(null);
  const [googleMobile, setGoogleMobile] = useState('');
  const [googleDob, setGoogleDob] = useState('');
  const [googleGender, setGoogleGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [googleBloodGroup, setGoogleBloodGroup] = useState('O+');
  const [googleAddress, setGoogleAddress] = useState('');

  // Login form state
  const [identifier, setIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Register form state
  const [regData, setRegData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    dob: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    bloodGroup: 'O+',
    address: '',
    password: '',
    confirmPassword: '',
  });

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!identifier.trim() || !loginPassword.trim()) {
      setError('Please provide your email/mobile and password.');
      return;
    }

    setIsLoading(true);
    const result = await loginPatient(identifier, loginPassword);
    setIsLoading(false);

    if (result.success) {
      onSuccess();
    } else {
      setError(result.error || 'Login failed. Please check your credentials.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!regData.fullName || !regData.email || !regData.mobile || !regData.password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (regData.password !== regData.confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    if (regData.password.length < 6) {
      setError('Password should be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    const result = await registerPatient(regData);
    setIsLoading(false);

    if (result.success) {
      onSuccess();
    } else {
      setError(result.error || 'Registration failed.');
    }
  };

  const handleGoogleSuccess = async (authData: {
    credential?: string;
    accessToken?: string;
    token?: string;
  }) => {
    setError(null);
    setIsLoading(true);
    const result = await loginWithGoogle(authData, 'patient');
    setIsLoading(false);

    if (!result.success) {
      setError(result.error || 'Google authentication failed. Please try again.');
      return;
    }

    if (result.needsRegistration && result.registrationToken && result.googleProfile) {
      setPendingGoogle({
        registrationToken: result.registrationToken,
        profile: result.googleProfile,
      });
      return;
    }

    onSuccess();
  };

  const handleCompleteGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingGoogle) return;
    setError(null);

    if (!googleMobile.trim()) {
      setError('Please enter your mobile contact number to complete your patient profile.');
      return;
    }

    setIsLoading(true);
    const res = await completeGooglePatientRegistration({
      registrationToken: pendingGoogle.registrationToken,
      mobile: googleMobile.trim(),
      dob: googleDob || undefined,
      gender: googleGender,
      bloodGroup: googleBloodGroup,
      address: googleAddress.trim(),
    });
    setIsLoading(false);

    if (res.success) {
      onSuccess();
    } else {
      setError(res.error || 'Unable to complete registration. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-12">
      {/* Header */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between mb-6">
        <button
          onClick={() => {
            if (pendingGoogle) {
              setPendingGoogle(null);
              setError(null);
            } else {
              onBack();
            }
          }}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0284c7] to-[#1e40af] flex items-center justify-center text-white shadow-xs">
            <HeartPulse className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-slate-900">
            Care<span className="text-[#0284c7]">Bridge</span>
          </span>
        </div>
      </div>

      {/* Auth Card */}
      <div className="max-w-xl mx-auto w-full">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 p-6 sm:p-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-sky-500 to-[#0284c7]" />

          {pendingGoogle ? (
            /* ================= GOOGLE NEW PATIENT REGISTRATION STEP ================= */
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Google Account Verified
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Complete Your Patient Profile
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Your verified Google name and Gmail address are pre-filled below. Add your clinical contact details to create your account.
                </p>
              </div>

              {/* Verified Google Identity Card */}
              <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200 flex items-center gap-3.5">
                {pendingGoogle.profile.avatar ? (
                  <img
                    src={pendingGoogle.profile.avatar}
                    alt={pendingGoogle.profile.fullName}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#0284c7] text-white font-black flex items-center justify-center text-sm shrink-0">
                    {pendingGoogle.profile.fullName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="font-extrabold text-sm text-slate-900 truncate">
                      {pendingGoogle.profile.fullName}
                    </p>
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  </div>
                  <p className="text-xs font-medium text-slate-600 truncate">
                    {pendingGoogle.profile.email}
                  </p>
                </div>
              </div>

              {error && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleCompleteGoogleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mobile Number *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="tel"
                        required
                        value={googleMobile}
                        onChange={(e) => setGoogleMobile(e.target.value)}
                        placeholder="Enter 10-digit mobile number"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Date of Birth
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="date"
                        value={googleDob}
                        onChange={(e) => setGoogleDob(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                    <select
                      value={googleGender}
                      onChange={(e) => setGoogleGender(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-sky-500 outline-none bg-white"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Blood Group</label>
                    <div className="relative">
                      <Droplet className="w-4 h-4 text-red-500 absolute left-3 top-3" />
                      <select
                        value={googleBloodGroup}
                        onChange={(e) => setGoogleBloodGroup(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-sky-500 outline-none bg-white"
                      >
                        <option value="O+">O Positive (O+)</option>
                        <option value="O-">O Negative (O-)</option>
                        <option value="A+">A Positive (A+)</option>
                        <option value="A-">A Negative (A-)</option>
                        <option value="B+">B Positive (B+)</option>
                        <option value="B-">B Negative (B-)</option>
                        <option value="AB+">AB Positive (AB+)</option>
                        <option value="AB-">AB Negative (AB-)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Residential Address
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={googleAddress}
                      onChange={(e) => setGoogleAddress(e.target.value)}
                      placeholder="Street, City, State (Optional)"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-2xl bg-[#0284c7] hover:bg-sky-700 text-white font-bold text-sm shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <span>{isLoading ? 'Creating Account...' : 'Complete Registration & Enter Portal'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : (
            <>
              {/* Title & Mode Switch */}
              <div className="text-center space-y-2 mb-8">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-[#0284c7] text-xs font-bold uppercase tracking-wider">
                  <User className="w-3.5 h-3.5" />
                  Patient Portal Access
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {mode === 'login' ? 'Welcome Back, Patient' : 'Create Patient Account'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  {mode === 'login'
                    ? 'Sign in to access your appointments, doctor consultations, and health history.'
                    : 'Join CareBridge for seamless doctor consultations and medical record keeping.'}
                </p>
              </div>

              {/* OFFICIAL GOOGLE SIGN IN BUTTON (Only displayed when Google OAuth is configured) */}
              {googleConfigured && (
                <div className="mb-6">
                  <GoogleSignInButton
                    role="patient"
                    onSuccess={handleGoogleSuccess}
                    onError={(errMsg) => setError(errMsg)}
                    disabled={isLoading}
                  />

                  <div className="relative flex py-4 items-center">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="shrink-0 mx-3 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                      or continue with credentials
                    </span>
                    <div className="flex-grow border-t border-slate-200"></div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {mode === 'login' ? (
                /* ================= LOGIN FORM ================= */
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Email or Mobile Number
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="Enter your registered email address or mobile number"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Password
                      </label>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter your account password"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 text-[#0284c7] rounded accent-[#0284c7]"
                      />
                      <span>Remember Me</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-2xl bg-[#0284c7] hover:bg-sky-700 text-white font-bold text-sm shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4"
                  >
                    <span>{isLoading ? 'Signing In...' : 'Login to Patient Portal'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                /* ================= REGISTRATION FORM ================= */
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          required
                          value={regData.fullName}
                          onChange={(e) => setRegData({ ...regData, fullName: e.target.value })}
                          placeholder="Enter your full legal name"
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="email"
                          required
                          value={regData.email}
                          onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                          placeholder="Enter your email address"
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number *</label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="tel"
                          required
                          value={regData.mobile}
                          onChange={(e) => setRegData({ ...regData, mobile: e.target.value })}
                          placeholder="Enter 10-digit mobile number"
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth</label>
                      <div className="relative">
                        <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="date"
                          value={regData.dob}
                          onChange={(e) => setRegData({ ...regData, dob: e.target.value })}
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                      <select
                        value={regData.gender}
                        onChange={(e) => setRegData({ ...regData, gender: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none bg-white"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Blood Group</label>
                      <div className="relative">
                        <Droplet className="w-4 h-4 text-red-500 absolute left-3 top-3" />
                        <select
                          value={regData.bloodGroup}
                          onChange={(e) => setRegData({ ...regData, bloodGroup: e.target.value })}
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none bg-white"
                        >
                          <option value="O+">O Positive (O+)</option>
                          <option value="O-">O Negative (O-)</option>
                          <option value="A+">A Positive (A+)</option>
                          <option value="A-">A Negative (A-)</option>
                          <option value="B+">B Positive (B+)</option>
                          <option value="B-">B Negative (B-)</option>
                          <option value="AB+">AB Positive (AB+)</option>
                          <option value="AB-">AB Negative (AB-)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Residential Address</label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={regData.address}
                        onChange={(e) => setRegData({ ...regData, address: e.target.value })}
                        placeholder="Street, Area, City, State (PIN Code)"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Password *</label>
                      <input
                        type="password"
                        required
                        value={regData.password}
                        onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                        placeholder="Min 6 characters"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Password *</label>
                      <input
                        type="password"
                        required
                        value={regData.confirmPassword}
                        onChange={(e) => setRegData({ ...regData, confirmPassword: e.target.value })}
                        placeholder="Re-enter password"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-2xl bg-[#0284c7] hover:bg-sky-700 text-white font-bold text-sm shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4"
                  >
                    <span>{isLoading ? 'Creating Account...' : 'Register as Patient'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* Switch Mode */}
              <div className="mt-6 pt-6 border-t border-slate-100 text-center space-y-3">
                <p className="text-xs text-slate-600">
                  {mode === 'login' ? "Don't have a patient account?" : 'Already registered?'}
                  <button
                    type="button"
                    onClick={() => {
                      setMode(mode === 'login' ? 'register' : 'login');
                      setError(null);
                    }}
                    className="ml-1.5 font-bold text-[#0284c7] hover:underline"
                  >
                    {mode === 'login' ? 'Create Account' : 'Login'}
                  </button>
                </p>

                <div>
                  <button
                    type="button"
                    onClick={onSwitchToHospital}
                    className="text-xs text-slate-500 hover:text-slate-900 font-medium hover:underline"
                  >
                    Are you a Hospital Administrator? Sign in here →
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-400 py-4">
        <p>CareBridge Healthcare Systems • Secure SSL Encryption</p>
      </div>
    </div>
  );
};
