import React, { useState } from 'react';
import { ShieldCheck, Lock, Bell, MapPin, CheckCircle, Cookie, Info, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import type { ConsentPreferences } from '../types/index.js';

interface PrivacyConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyConsentModal: React.FC<PrivacyConsentModalProps> = ({ isOpen, onClose }) => {
  const { saveConsent } = useAuth();
  const [showCustomizer, setShowCustomizer] = useState(false);

  const [preferences, setPreferences] = useState<ConsentPreferences>({
    acceptedAll: true,
    personalHealthData: true,
    appointmentNotifications: true,
    locationAccess: true,
    analyticsCookies: true,
    acceptedAt: new Date().toISOString(),
  });

  if (!isOpen) return null;

  const handleAcceptAll = () => {
    const allAccepted: ConsentPreferences = {
      acceptedAll: true,
      personalHealthData: true,
      appointmentNotifications: true,
      locationAccess: true,
      analyticsCookies: true,
      acceptedAt: new Date().toISOString(),
    };
    saveConsent(allAccepted);
    onClose();
  };

  const handleRejectOptional = () => {
    const minimal: ConsentPreferences = {
      acceptedAll: false,
      personalHealthData: true, // required for core triage/records
      appointmentNotifications: true,
      locationAccess: false,
      analyticsCookies: false,
      acceptedAt: new Date().toISOString(),
    };
    saveConsent(minimal);
    onClose();
  };

  const handleSaveCustom = () => {
    saveConsent({
      ...preferences,
      acceptedAll: preferences.locationAccess && preferences.analyticsCookies,
      acceptedAt: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0284c7] to-[#1e40af] p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">Welcome to CareBridge</h2>
              <p className="text-sky-100 text-xs font-medium">Privacy, Security & Cookie Consent</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-600">
          <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100 flex items-start gap-3">
            <Info className="w-5 h-5 text-[#0284c7] shrink-0 mt-0.5" />
            <p className="text-xs text-sky-900 leading-relaxed">
              Your health data security is our top priority. CareBridge adheres to clinical privacy guidelines,
              end-to-end data encryption, and transparent consent management. Please review how we manage your information.
            </p>
          </div>

          {!showCustomizer ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl mt-0.5">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Personal Health Information (PHI) Protection</h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Your medical history, vital readings, appointment records, and uploaded lab documents are securely stored and accessible strictly by you and authorized hospital clinicians for consultation.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="p-2 bg-sky-100 text-[#0284c7] rounded-xl mt-0.5">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Appointment & Clinical Notifications</h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    We send critical real-time alerts when your appointment is approved, rescheduled, or cancelled by the hospital, plus reminders for scheduled consultations.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-xl mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Location Services for Nearby Hospitals & SOS</h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Location permission is used strictly to locate nearby emergency care facilities and provide accurate coordinates to the ambulance dispatch dispatch team during emergencies.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="p-2 bg-purple-100 text-purple-700 rounded-xl mt-0.5">
                  <Cookie className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Essential & Analytics Cookies</h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Essential cookies maintain your secure authenticated session. Optional performance analytics help improve clinical scheduling without tracking third-party advertising profiles.
                  </p>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-slate-400">
                By clicking <strong>Accept All</strong>, you agree to the CareBridge Privacy Policy, Terms & Conditions, and HIPAA-compliant health data standards.
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 text-sm">Customize Your Data Permissions</h3>

              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <p className="font-bold text-xs text-slate-800">Essential Clinical Health Records</p>
                  <p className="text-[11px] text-slate-500">Required for doctor consultation & appointment booking</p>
                </div>
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                  Always Active
                </span>
              </div>

              <label className="p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-50">
                <div>
                  <p className="font-bold text-xs text-slate-800">Real-Time Appointment Notifications</p>
                  <p className="text-[11px] text-slate-500">Alerts for doctor status updates and booking approvals</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.appointmentNotifications}
                  onChange={(e) =>
                    setPreferences({ ...preferences, appointmentNotifications: e.target.checked })
                  }
                  className="w-4 h-4 text-[#0284c7] rounded accent-[#0284c7]"
                />
              </label>

              <label className="p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-50">
                <div>
                  <p className="font-bold text-xs text-slate-800">Device Location for Hospital Finder & Ambulance</p>
                  <p className="text-[11px] text-slate-500">Calculate distance to nearby hospitals and dispatch emergency ALS ambulances</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.locationAccess}
                  onChange={(e) =>
                    setPreferences({ ...preferences, locationAccess: e.target.checked })
                  }
                  className="w-4 h-4 text-[#0284c7] rounded accent-[#0284c7]"
                />
              </label>

              <label className="p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-50">
                <div>
                  <p className="font-bold text-xs text-slate-800">Anonymous Platform Analytics</p>
                  <p className="text-[11px] text-slate-500">Help optimize application response time and interface usability</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.analyticsCookies}
                  onChange={(e) =>
                    setPreferences({ ...preferences, analyticsCookies: e.target.checked })
                  }
                  className="w-4 h-4 text-[#0284c7] rounded accent-[#0284c7]"
                />
              </label>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="p-5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          {!showCustomizer ? (
            <>
              <button
                onClick={() => setShowCustomizer(true)}
                className="w-full sm:w-auto text-xs font-semibold text-slate-600 hover:text-slate-900 underline py-2 sm:py-0"
              >
                Customize Preferences
              </button>
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  onClick={handleRejectOptional}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Reject Optional Cookies
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#1e40af] text-xs font-bold text-white shadow-md shadow-sky-600/30 hover:opacity-95 transition-opacity"
                >
                  Accept All
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => setShowCustomizer(false)}
                className="w-full sm:w-auto text-xs font-semibold text-slate-600 hover:text-slate-900 py-2 sm:py-0"
              >
                Back
              </button>
              <button
                onClick={handleSaveCustom}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#0284c7] text-xs font-bold text-white shadow-md shadow-sky-600/30 hover:bg-sky-700 transition-colors"
              >
                Save My Preferences
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
