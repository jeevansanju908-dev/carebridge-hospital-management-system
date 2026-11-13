import React, { useEffect, useState } from 'react';
import {
  Building2,
  Mail,
  Phone,
  Lock,
  ArrowRight,
  ArrowLeft,
  HeartPulse,
  MapPin,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

interface HospitalAuthViewProps {
  initialMode?: 'login' | 'register';
  onSuccess: () => void;
  onBack: () => void;
  onSwitchToPatient: () => void;
}

interface HospitalDirectoryEntry {
  id: string;
  hospitalName: string;
  email: string;
  district?: string;
  defaultPassword?: string;
}

const SAVED_HOSPITALS_KEY = 'carebridge_saved_hospitals';

function getSavedHospitals(): Record<string, { hospitalName: string; email: string; password: string }> {
  try {
    const raw = localStorage.getItem(SAVED_HOSPITALS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveHospitalCredentials(hospitalName: string, email: string, password: string) {
  try {
    const existing = getSavedHospitals();
    existing[email.trim().toLowerCase()] = {
      hospitalName: hospitalName.trim(),
      email: email.trim().toLowerCase(),
      password,
    };
    localStorage.setItem(SAVED_HOSPITALS_KEY, JSON.stringify(existing));
  } catch {
    // Ignore storage quota errors
  }
}

export const HospitalAuthView: React.FC<HospitalAuthViewProps> = ({
  initialMode = 'login',
  onSuccess,
  onBack,
  onSwitchToPatient,
}) => {
  const { loginHospital, registerHospital } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateNotice, setDuplicateNotice] = useState<{
    email: string;
    hospitalName: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Hospital directory with pre-filled credentials
  const [directory, setDirectory] = useState<HospitalDirectoryEntry[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('');

  // Login form state (Hospital Name, Hospital Email, Password automatically available)
  const [hospitalName, setHospitalName] = useState('');
  const [email, setEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Streamlined Register form state
  const [regData, setRegData] = useState({
    hospitalName: '',
    email: '',
    contactNumber: '',
    district: 'Bengaluru Urban',
    address: '',
    password: '',
  });

  // Load registered hospitals & auto-fill the login fields cleanly
  useEffect(() => {
    let mounted = true;
    const loadDirectory = async () => {
      try {
        const res = await fetch('/api/hospitals/login-directory');
        if (!res.ok) return;
        const list: HospitalDirectoryEntry[] = await res.json();
        if (!mounted || !Array.isArray(list) || list.length === 0) return;

        const saved = getSavedHospitals();
        const enriched = list.map((h) => {
          const savedCred = saved[h.email.toLowerCase()];
          return {
            ...h,
            defaultPassword: savedCred?.password || h.defaultPassword,
          };
        });

        setDirectory(enriched);

        // Prefer a user-created saved hospital if present, otherwise first hospital
        const savedKeys = Object.keys(saved);
        const preferred =
          (savedKeys.length > 0 &&
            enriched.find((h) => savedKeys.includes(h.email.toLowerCase()))) ||
          enriched[0];

        if (preferred) {
          setSelectedHospitalId(preferred.id);
          setHospitalName(preferred.hospitalName);
          setEmail(preferred.email);
          if (preferred.defaultPassword) {
            setLoginPassword(preferred.defaultPassword);
          }
        }
      } catch (err) {
        console.warn('Unable to load hospital login directory:', err);
      }
    };
    loadDirectory();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSelectHospital = (hospId: string) => {
    setSelectedHospitalId(hospId);
    setError(null);
    const chosen = directory.find((h) => h.id === hospId);
    if (!chosen) return;
    setHospitalName(chosen.hospitalName);
    setEmail(chosen.email);
    const saved = getSavedHospitals()[chosen.email.toLowerCase()];
    setLoginPassword(saved?.password || chosen.defaultPassword || 'hospital123');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDuplicateNotice(null);

    if ((!email.trim() && !hospitalName.trim()) || !loginPassword) {
      setError('Please enter your hospital email or name and password.');
      return;
    }

    setIsLoading(true);
    const result = await loginHospital(email.trim() || hospitalName.trim(), loginPassword, hospitalName.trim());
    setIsLoading(false);

    if (result.success) {
      saveHospitalCredentials(hospitalName || email, email || hospitalName, loginPassword);
      onSuccess();
    } else {
      setError(result.error || 'Hospital login failed. Please verify your credentials.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDuplicateNotice(null);

    if (!regData.hospitalName.trim() || !regData.email.trim() || !regData.password) {
      setError('Please enter your Hospital Name, Email Address, and Password.');
      return;
    }

    setIsLoading(true);
    const result = await registerHospital(regData);
    setIsLoading(false);

    if (result.success) {
      saveHospitalCredentials(regData.hospitalName, regData.email, regData.password);
      onSuccess();
    } else {
      setError(result.error || 'Hospital registration failed.');
      if (result.alreadyExists && result.existingEmail) {
        setDuplicateNotice({
          email: result.existingEmail,
          hospitalName: result.existingHospitalName || regData.hospitalName,
        });
      }
    }
  };

  const switchToLoginWithDetails = (targetEmail: string, targetHospitalName: string) => {
    const matched = directory.find(
      (h) => h.email.toLowerCase() === targetEmail.toLowerCase()
    );
    const saved = getSavedHospitals()[targetEmail.toLowerCase()];

    setMode('login');
    setError(null);
    setDuplicateNotice(null);
    if (matched) setSelectedHospitalId(matched.id);
    setHospitalName(matched?.hospitalName || targetHospitalName);
    setEmail(matched?.email || targetEmail);
    setLoginPassword(
      saved?.password || matched?.defaultPassword || regData.password || 'hospital123'
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-12">
      {/* Header */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between mb-6">
        <button
          onClick={onBack}
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
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-700 to-[#1e40af]" />

          {/* Title */}
          <div className="text-center space-y-2 mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#1e40af] text-xs font-bold uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5" />
              Hospital Management Portal
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {mode === 'login' ? 'Hospital Direct Login' : 'Create Hospital Account'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              {mode === 'login'
                ? 'Select your hospital or enter your hospital credentials to open the dashboard and view all patient bookings.'
                : 'Register your hospital directly in one step and immediately access the Hospital Dashboard.'}
            </p>
          </div>

          {/* Direct Mode Tabs: Login | Create Account */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setDuplicateNotice(null);
              }}
              className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                mode === 'login'
                  ? 'bg-white text-[#1e40af] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
                setDuplicateNotice(null);
              }}
              className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                mode === 'register'
                  ? 'bg-white text-[#1e40af] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Account</span>
            </button>
          </div>

          {/* Error & Duplicate Recovery Banner */}
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-2xl space-y-2.5 text-xs text-red-700">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
              {duplicateNotice && (
                <button
                  type="button"
                  onClick={() =>
                    switchToLoginWithDetails(duplicateNotice.email, duplicateNotice.hospitalName)
                  }
                  className="w-full py-2 px-3 rounded-xl bg-[#1e40af] hover:bg-blue-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Auto-Fill & Sign In as {duplicateNotice.hospitalName}</span>
                </button>
              )}
            </div>
          )}

          {mode === 'login' ? (
            /* ================= HOSPITAL DIRECT LOGIN ================= */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {directory.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-[#1e40af] uppercase tracking-wider">
                      Select Registered Hospital (Auto-Fills Credentials)
                    </label>
                    <span className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Ready for Login
                    </span>
                  </div>
                  <select
                    value={selectedHospitalId}
                    onChange={(e) => handleSelectHospital(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-blue-200 bg-white text-xs sm:text-sm font-semibold text-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                  >
                    {directory.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.hospitalName} ({h.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Hospital Name
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={hospitalName}
                    onChange={(e) => setHospitalName(e.target.value)}
                    placeholder="Enter hospital name"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Hospital Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter hospital email address"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter hospital password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                    aria-label="Toggle password visibility"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-2xl bg-[#1e40af] hover:bg-blue-900 text-white font-bold text-sm shadow-lg shadow-blue-800/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
              >
                <span>{isLoading ? 'Signing In...' : 'Enter Hospital Dashboard'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* ================= HOSPITAL DIRECT REGISTRATION ================= */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Hospital Name *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={regData.hospitalName}
                    onChange={(e) => setRegData({ ...regData, hospitalName: e.target.value })}
                    placeholder="Enter your hospital name"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Hospital Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={regData.email}
                    onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                    placeholder="Enter hospital email address"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regData.password}
                    onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                    placeholder="Create a login password"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    aria-label="Toggle password visibility"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contact Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      value={regData.contactNumber}
                      onChange={(e) => setRegData({ ...regData, contactNumber: e.target.value })}
                      placeholder="Optional helpline"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">District</label>
                  <select
                    value={regData.district}
                    onChange={(e) => setRegData({ ...regData, district: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none bg-white"
                  >
                    <option value="Bengaluru Urban">Bengaluru Urban</option>
                    <option value="Bengaluru Rural">Bengaluru Rural</option>
                    <option value="Mysuru">Mysuru</option>
                    <option value="Dakshina Kannada">Dakshina Kannada (Mangaluru)</option>
                    <option value="Dharwad">Dharwad (Hubballi)</option>
                    <option value="Belagavi">Belagavi</option>
                    <option value="Kalaburagi">Kalaburagi</option>
                    <option value="Shimoga">Shimoga</option>
                    <option value="Udupi">Udupi</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Hospital Address
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={regData.address}
                    onChange={(e) => setRegData({ ...regData, address: e.target.value })}
                    placeholder="Optional campus address"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-2xl bg-[#1e40af] hover:bg-blue-900 text-white font-bold text-sm shadow-lg shadow-blue-800/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
              >
                <span>{isLoading ? 'Creating Account...' : 'Create Hospital Account & Enter'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Patient Portal redirect */}
          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={onSwitchToPatient}
              className="text-xs text-slate-500 hover:text-slate-900 font-medium hover:underline"
            >
              Are you a Patient? Switch to Patient Portal →
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-400 py-4">
        <p>CareBridge Clinical Health Systems • Authorized Administrative Access</p>
      </div>
    </div>
  );
};
