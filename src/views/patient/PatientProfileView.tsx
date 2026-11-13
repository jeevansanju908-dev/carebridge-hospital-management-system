import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Droplet,
  Save,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  HeartPulse,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

export const PatientProfileView: React.FC = () => {
  const { currentUser, updatePatientProfile } = useAuth();
  const patient = currentUser as any;

  const [fullName, setFullName] = useState(patient?.fullName || '');
  const [email, setEmail] = useState(patient?.email || '');
  const [mobile, setMobile] = useState(patient?.mobile || '');
  const [dob, setDob] = useState(patient?.dob || '');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>(patient?.gender || 'Male');
  const [bloodGroup, setBloodGroup] = useState(patient?.bloodGroup || 'O+');
  const [address, setAddress] = useState(patient?.address || '');
  const [emergencyName, setEmergencyName] = useState(patient?.emergencyContact?.name || '');
  const [emergencyPhone, setEmergencyPhone] = useState(patient?.emergencyContact?.phone || '');
  const [emergencyRel, setEmergencyRel] = useState(patient?.emergencyContact?.relationship || '');

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!patient) return;
    setFullName(patient.fullName || '');
    setEmail(patient.email || '');
    setMobile(patient.mobile || '');
    setDob(patient.dob || '');
    setGender(patient.gender || 'Male');
    setBloodGroup(patient.bloodGroup || 'O+');
    setAddress(patient.address || '');
    setEmergencyName(patient.emergencyContact?.name || '');
    setEmergencyPhone(patient.emergencyContact?.phone || '');
    setEmergencyRel(patient.emergencyContact?.relationship || '');
  }, [patient]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    await updatePatientProfile({
      fullName,
      email,
      mobile,
      dob,
      gender,
      bloodGroup,
      address,
      emergencyContact: {
        name: emergencyName,
        phone: emergencyPhone,
        relationship: emergencyRel,
      },
    });

    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Patient Profile & Health Identity
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage your personal details, emergency contacts, and clinical demographic information.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800 font-bold animate-fadeIn">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Patient profile updated successfully. Synchronized across clinical systems.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl space-y-6">
        {/* Avatar & Summary */}
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          {patient?.avatar ? (
            <img
              src={patient.avatar}
              alt="Profile Avatar"
              className="w-20 h-20 rounded-2xl object-cover border-4 border-sky-100 shadow-md"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-sky-100 text-[#0284c7] font-black text-2xl flex items-center justify-center border-4 border-sky-50 shadow-md">
              {(fullName || email || 'P').slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-xl text-slate-900">{fullName || 'Patient Profile'}</h3>
              {patient?.isGoogleVerified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3 h-3" />
                  Google Verified
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-[#0284c7]">
              CareBridge Health ID: {patient?.id || 'Pending'}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Verified Blood Profile: {bloodGroup}</p>
          </div>
        </div>

        {/* Demographic Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-sky-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              readOnly={Boolean(patient?.isGoogleVerified)}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm outline-none ${
                patient?.isGoogleVerified ? 'bg-slate-50 text-slate-600' : 'focus:border-sky-500'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Contact</label>
            <input
              type="tel"
              required
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-sky-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth</label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-sky-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-sky-500 outline-none bg-white font-medium"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Blood Group</label>
            <select
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-sky-500 outline-none bg-white font-medium"
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

        {/* Address */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Residential Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-sky-500 outline-none"
          />
        </div>

        {/* Emergency Contact */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-red-600" />
            <span>Emergency Kin Contact</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Contact Name</label>
              <input
                type="text"
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-sky-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Relationship</label>
              <input
                type="text"
                value={emergencyRel}
                onChange={(e) => setEmergencyRel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-sky-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Contact Phone</label>
              <input
                type="tel"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-sky-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 rounded-2xl bg-[#0284c7] hover:bg-sky-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-sky-600/25 flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Changes...' : 'Save Profile Information'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
