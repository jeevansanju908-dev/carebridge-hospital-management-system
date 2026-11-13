import React from 'react';
import {
  HeartPulse,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Clock,
  Sparkles,
  Stethoscope,
  Building2,
  Ambulance,
  Lock,
  User,
  CheckCircle,
  Activity,
  Hospital,
} from 'lucide-react';

interface WelcomeViewProps {
  onSelectPatientLogin: () => void;
  onSelectHospitalLogin: () => void;
  onSelectPatientRegister: () => void;
  onSelectHospitalRegister: () => void;
  onGetStarted: () => void;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({
  onSelectPatientLogin,
  onSelectHospitalLogin,
  onSelectPatientRegister,
  onSelectHospitalRegister,
  onGetStarted,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-sky-500 selection:text-white">
      {/* Top Header */}
      <header className="px-6 lg:px-12 py-4 flex items-center justify-between border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#0284c7] to-[#1e40af] flex items-center justify-center text-white shadow-lg shadow-sky-600/25">
            <HeartPulse className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="font-extrabold text-2xl tracking-tight text-slate-900">
              Care<span className="text-[#0284c7]">Bridge</span>
            </span>
            <p className="text-[11px] font-semibold text-slate-500 tracking-wide">
              Your Health, Our Priority
            </p>
          </div>
        </div>

        {/* Dedicated Separate Portal Login Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onSelectPatientLogin}
            className="px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold text-[#0284c7] hover:bg-sky-50 rounded-xl transition-all border border-sky-200 flex items-center gap-1.5"
          >
            <User className="w-3.5 h-3.5" />
            <span>Patient Login</span>
          </button>
          <button
            onClick={onSelectHospitalLogin}
            className="px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold text-white bg-[#1e40af] hover:bg-blue-900 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Hospital Login</span>
          </button>
        </div>
      </header>

      {/* Main Hero Section: Left Copy & Right High-Quality Photograph */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 lg:px-12 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Side: Branding, Tagline, Heading, Description */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-100/80 border border-sky-200 text-[#0284c7] text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Unified Clinical Healthcare Network</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
                Better Care For A{' '}
                <span className="bg-gradient-to-r from-[#0284c7] via-sky-600 to-[#1e40af] bg-clip-text text-transparent">
                  Healthier Tomorrow
                </span>
              </h1>
              <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed pt-1">
                Connect with trusted doctors, manage appointments, and access healthcare services easily.
                Select your dedicated portal below to access the Patient Portal or Hospital Management System.
              </p>
            </div>

            {/* TWO COMPLETELY SEPARATE PORTAL LAUNCH CARDS */}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card 1: Patient Login Portal */}
              <div className="bg-white rounded-2xl p-5 border-2 border-sky-200 hover:border-[#0284c7] shadow-lg hover:shadow-xl transition-all group flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-sky-100 text-[#0284c7] flex items-center justify-center mb-3">
                    <User className="w-5 h-5" />
                  </div>
                  <h3 className="font-black text-lg text-slate-900 group-hover:text-[#0284c7] transition-colors">
                    Patient Portal
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Book appointments with top specialists, track vitals, check symptoms, and find nearby hospitals.
                  </p>
                </div>
                <div className="pt-4 space-y-2">
                  <button
                    onClick={onSelectPatientLogin}
                    className="w-full py-3 rounded-xl bg-[#0284c7] hover:bg-sky-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-sky-600/25 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <span>Patient Login</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={onSelectPatientRegister}
                    className="w-full py-2 text-center text-xs font-bold text-slate-600 hover:text-[#0284c7]"
                  >
                    Create Patient Account →
                  </button>
                </div>
              </div>

              {/* Card 2: Hospital Login Portal */}
              <div className="bg-white rounded-2xl p-5 border-2 border-blue-200 hover:border-[#1e40af] shadow-lg hover:shadow-xl transition-all group flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#1e40af] flex items-center justify-center mb-3">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <h3 className="font-black text-lg text-slate-900 group-hover:text-[#1e40af] transition-colors">
                    Hospital Portal
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    OPD schedule control, doctor rosters, patient records, bed allocation, emergency unit, and billing.
                  </p>
                </div>
                <div className="pt-4 space-y-2">
                  <button
                    onClick={onSelectHospitalLogin}
                    className="w-full py-3 rounded-xl bg-[#1e40af] hover:bg-blue-900 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-800/25 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <span>Hospital Login</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={onSelectHospitalRegister}
                    className="w-full py-2 text-center text-xs font-bold text-slate-600 hover:text-[#1e40af]"
                  >
                    Register New Hospital →
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="pt-4 grid grid-cols-3 gap-3 border-t border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-extrabold text-xs text-slate-900">20 Doctors</p>
                  <p className="text-[10px] text-slate-500">15 Active OPD</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-[#0284c7] flex items-center justify-center shrink-0">
                  <Hospital className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-extrabold text-xs text-slate-900">20 Hospitals</p>
                  <p className="text-[10px] text-slate-500">Karnataka Wide</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <Ambulance className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-extrabold text-xs text-slate-900">24/7 SOS</p>
                  <p className="text-[10px] text-slate-500">GPS Ambulance</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Professional Doctor Caring for Patient Photograph */}
          <div className="lg:col-span-6 relative">
            <div className="relative mx-auto max-w-lg lg:max-w-none">
              <div className="absolute -inset-4 bg-gradient-to-tr from-sky-400/20 via-blue-500/20 to-indigo-500/10 rounded-3xl blur-2xl -z-10" />

              <div className="rounded-3xl overflow-hidden border-4 border-white shadow-2xl relative group">
                <img
                  src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=1200&q=85"
                  alt="Compassionate doctor examining patient with stethoscope in hospital"
                  className="w-full h-[400px] sm:h-[460px] lg:h-[500px] object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent flex flex-col justify-end p-6 sm:p-8 text-white">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold w-max mb-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Accredited Healthcare Network</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    Compassionate, Quality Healthcare
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-md">
                    Direct appointment booking, live queue updates, verified hospital departments, and 1–100 km nearby medical search.
                  </p>
                </div>
              </div>

              {/* Floating Badge 1 */}
              <div className="absolute -bottom-5 -left-4 sm:-left-6 bg-white p-3.5 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3 max-w-xs">
                <div className="w-10 h-10 rounded-xl bg-sky-100 text-[#0284c7] flex items-center justify-center shrink-0">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Live Real-Time Sync</p>
                  <p className="text-[10px] text-slate-500">Shared Patient & Hospital System</p>
                </div>
              </div>

              {/* Floating Badge 2 */}
              <div className="absolute -top-4 -right-4 sm:-right-6 bg-white p-3 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <Ambulance className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Emergency 112 Ready</p>
                  <p className="text-[10px] text-slate-500">Instant Dispatch Hotline</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-6 lg:px-12 text-center sm:flex sm:items-center sm:justify-between text-xs text-slate-500">
        <p>© 2026 CareBridge Healthcare Systems. All rights reserved.</p>
        <div className="mt-2 sm:mt-0 flex items-center justify-center gap-4">
          <span className="flex items-center gap-1 text-slate-600">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            256-Bit Encrypted
          </span>
          <span>•</span>
          <span>Privacy & Cookie Consent Protected</span>
          <span>•</span>
          <span>Digital Health Standards</span>
        </div>
      </footer>
    </div>
  );
};
