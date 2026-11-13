import React from 'react';
import { User, Building2, ArrowRight, ArrowLeft, HeartPulse, ShieldCheck, CheckCircle } from 'lucide-react';

interface RoleSelectionViewProps {
  onSelectPatient: () => void;
  onSelectHospital: () => void;
  onBack: () => void;
}

export const RoleSelectionView: React.FC<RoleSelectionViewProps> = ({
  onSelectPatient,
  onSelectHospital,
  onBack,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-8 px-6 lg:px-12">
      {/* Top Header */}
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
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

      {/* Main Selection Area */}
      <div className="max-w-5xl mx-auto w-full py-10">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-[#0284c7] text-xs font-bold uppercase tracking-wider">
            Step 2: Choose Your Role
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            How would you like to use CareBridge?
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            Select your account type to proceed to your dedicated portal.
            Both portals are integrated into our live shared healthcare system.
          </p>
        </div>

        {/* Two Large Cards Side-by-Side as required in Section 4 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* CARD 1: PATIENT */}
          <div
            onClick={onSelectPatient}
            className="group cursor-pointer bg-white rounded-3xl p-8 border-2 border-slate-200/80 hover:border-[#0284c7] shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
          >
            {/* Ambient accent top bar */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-sky-400 to-[#0284c7]" />

            <div>
              {/* Photo / Illustration Container */}
              <div className="w-full h-52 rounded-2xl overflow-hidden mb-6 relative group-hover:scale-[1.02] transition-transform duration-500">
                <img
                  src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80"
                  alt="Doctor consulting with smiling patient"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex items-end p-4">
                  <span className="px-3 py-1 rounded-full bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md">
                    <User className="w-3.5 h-3.5" />
                    Individual & Family Healthcare
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-2xl font-black text-slate-900 group-hover:text-[#0284c7] transition-colors">
                  I&apos;m a Patient
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Find doctors, book appointments, and manage your health. Access your medical records, check symptoms with AI, and track vital statistics.
                </p>

                <div className="space-y-2 pt-3 text-xs text-slate-500 font-medium">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Search 20+ specialized doctors & top hospitals</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Instant booking with real-time status updates</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Secure medical records, vitals & emergency 112 SOS</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPatient();
                }}
                className="w-full py-4 rounded-2xl bg-[#0284c7] group-hover:bg-sky-700 text-white font-bold text-sm shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 transition-all"
              >
                <span>Continue as Patient</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* CARD 2: HOSPITAL */}
          <div
            onClick={onSelectHospital}
            className="group cursor-pointer bg-white rounded-3xl p-8 border-2 border-slate-200/80 hover:border-[#1e40af] shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
          >
            {/* Ambient accent top bar */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-700 to-[#1e40af]" />

            <div>
              {/* Photo / Illustration Container */}
              <div className="w-full h-52 rounded-2xl overflow-hidden mb-6 relative group-hover:scale-[1.02] transition-transform duration-500">
                <img
                  src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80"
                  alt="Modern hospital reception and clinical administration"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex items-end p-4">
                  <span className="px-3 py-1 rounded-full bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md">
                    <Building2 className="w-3.5 h-3.5" />
                    Clinical Administration & OPD
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-2xl font-black text-slate-900 group-hover:text-[#1e40af] transition-colors">
                  I&apos;m a Hospital
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Manage doctors, patients and hospital appointments. Approve patient bookings, assign specialists, control ICU beds, and oversee emergency ambulance admissions.
                </p>

                <div className="space-y-2 pt-3 text-xs text-slate-500 font-medium">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Real-time OPD appointment management (Approve/Reject)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Doctor roster control (15 Available, 5 On Leave)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>ICU bed occupancy, billing invoices & activity logs</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectHospital();
                }}
                className="w-full py-4 rounded-2xl bg-[#1e40af] group-hover:bg-blue-900 text-white font-bold text-sm shadow-lg shadow-blue-800/30 flex items-center justify-center gap-2 transition-all"
              >
                <span>Continue as Hospital</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-xs text-slate-400 max-w-xl mx-auto">
        <p>CareBridge connects patients and hospital administrators to the exact same live database.</p>
      </div>
    </div>
  );
};
