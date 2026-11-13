import React, { useState, useEffect } from 'react';
import {
  Ambulance,
  Phone,
  AlertTriangle,
  MapPin,
  Clock,
  ShieldAlert,
  Building2,
  CheckCircle,
  Radio,
  User,
  HeartPulse,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import type { EmergencyRequest, HospitalUser } from '../../types/index.js';

interface AmbulanceEmergencyViewProps {
  onBackToDashboard: () => void;
}

export const AmbulanceEmergencyView: React.FC<AmbulanceEmergencyViewProps> = ({ onBackToDashboard }) => {
  const { currentUser } = useAuth();
  const patient = currentUser as any;

  const [emergencyType, setEmergencyType] = useState<
    'Accident' | 'Critical Condition' | 'Medical Emergency' | 'Other'
  >('Medical Emergency');
  const [severity, setSeverity] = useState<'Critical' | 'Severe' | 'Moderate'>('Critical');
  const [address, setAddress] = useState(patient?.address || '');
  const [notes, setNotes] = useState('');
  const [selectedHospitalId, setSelectedHospitalId] = useState('');

  const [hospitals, setHospitals] = useState<HospitalUser[]>([]);
  const [activeEmergency, setActiveEmergency] = useState<EmergencyRequest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emergencyList, setEmergencyList] = useState<EmergencyRequest[]>([]);

  useEffect(() => {
    fetch('/api/hospitals')
      .then((r) => r.json())
      .then((data) => {
        setHospitals(data);
        if (data.length > 0 && !selectedHospitalId) {
          setSelectedHospitalId(data[0].id);
        }
      })
      .catch((e) => console.warn(e));

    if (patient?.id) {
      fetch(`/api/emergency/list?patientId=${patient.id}`)
        .then((r) => r.json())
        .then((data) => {
          setEmergencyList(data);
          if (data.length > 0 && data[0].status !== 'Completed') {
            setActiveEmergency(data[0]);
          }
        })
        .catch((e) => console.warn(e));
    }
  }, [patient?.id]);

  const handleDispatchAmbulance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient?.id) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/emergency/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patient.id,
          patientName: patient.fullName || patient.email || 'Patient',
          patientPhone: patient.mobile || '',
          emergencyType,
          severity,
          locationAddress: address,
          hospitalId: selectedHospitalId,
          notes: notes || 'Dispatched via emergency CareBridge patient action.',
        }),
      });

      const data = await res.json();
      setIsSubmitting(false);

      if (res.ok) {
        setActiveEmergency(data);
        setEmergencyList((prev) => [data, ...prev]);
      }
    } catch (err) {
      setIsSubmitting(false);
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Red Emergency Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 animate-pulse">
            <Ambulance className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-wider">
                Emergency 24/7 Response
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-0.5">
              Ambulance & SOS Dispatch
            </h1>
            <p className="text-red-100 text-xs">
              Immediate connection to Karnataka 112 emergency services and hospital trauma centers.
            </p>
          </div>
        </div>

        {/* Big Call 112 Button */}
        <a
          href="tel:112"
          className="px-6 py-3.5 rounded-2xl bg-white text-red-600 hover:bg-red-50 font-black text-sm sm:text-base shadow-lg flex items-center justify-center gap-2.5 transition-transform hover:scale-105 active:scale-95 shrink-0"
        >
          <Phone className="w-5 h-5 fill-red-600" />
          <span>Call 112 Now</span>
        </a>
      </div>

      {/* Active Live Emergency Dispatch Tracker if request active */}
      {activeEmergency && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-red-500 shadow-xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-red-600 animate-pulse" />
              <h3 className="font-black text-base text-slate-900">
                Active Emergency Dispatch • Ref: {activeEmergency.id}
              </h3>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 uppercase tracking-wider">
              ● Status: {activeEmergency.status}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Assigned Ambulance</span>
              <p className="font-extrabold text-slate-900">{activeEmergency.ambulanceId}</p>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Paramedic Driver</span>
              <p className="font-extrabold text-slate-900">{activeEmergency.driverName}</p>
              <a
                href={`tel:${activeEmergency.driverPhone}`}
                className="text-[11px] font-bold text-[#0284c7] hover:underline"
              >
                📞 {activeEmergency.driverPhone}
              </a>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Receiving Hospital</span>
              <p className="font-extrabold text-slate-900">{activeEmergency.assignedHospitalName}</p>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Estimated Arrival Time</span>
              <p className="font-black text-red-600 text-lg">
                ~{activeEmergency.estimatedArrivalMinutes || 8} Mins
              </p>
            </div>
          </div>

          <div className="p-3 bg-red-50 rounded-xl border border-red-100 text-xs text-red-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p>
              The ALS Ambulance crew is equipped with oxygen, cardiac defibrillator, and life support monitoring. Keep your mobile line open.
            </p>
          </div>
        </div>
      )}

      {/* Ambulance Request Form */}
      <form
        onSubmit={handleDispatchAmbulance}
        className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl space-y-6"
      >
        <div className="space-y-1">
          <h3 className="text-lg font-black text-slate-900">Request ALS Ambulance Dispatch</h3>
          <p className="text-xs text-slate-500">
            Select emergency condition type, confirm pickup location, and designate nearest hospital.
          </p>
        </div>

        {/* Emergency Type Selection (Section 13 requirement) */}
        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
            1. Select Emergency Type *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(['Accident', 'Critical Condition', 'Medical Emergency', 'Other'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setEmergencyType(type)}
                className={`py-3 px-3 rounded-2xl border-2 text-xs font-bold text-center transition-all ${
                  emergencyType === type
                    ? 'border-red-600 bg-red-50 text-red-700 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Severity */}
        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
            2. Triage Severity
          </label>
          <div className="grid grid-cols-3 gap-3 max-w-md">
            {(['Critical', 'Severe', 'Moderate'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSeverity(s)}
                className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                  severity === s
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Location Address */}
        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
            3. Patient GPS / Pickup Location *
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-red-500 absolute left-3.5 top-3.5" />
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter exact landmark, apartment name, street, area"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-red-500 outline-none"
            />
          </div>
        </div>

        {/* Target Hospital */}
        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
            4. Dispatch From Hospital Trauma Center
          </label>
          <select
            value={selectedHospitalId}
            onChange={(e) => setSelectedHospitalId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-red-500 outline-none bg-white font-medium"
          >
            {hospitals.map((h) => (
              <option key={h.id} value={h.id}>
                {h.hospitalName} ({h.district}) — Helpline: {h.emergencyHelpline}
              </option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
            5. Patient Clinical Condition Notes
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Patient conscious but experiencing acute shortness of breath and chest pain..."
            className="w-full p-3.5 rounded-xl border border-slate-200 text-xs focus:border-red-500 outline-none"
          />
        </div>

        {/* Dispatch Action */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-sm sm:text-base shadow-xl shadow-red-600/30 flex items-center justify-center gap-2.5 transition-all disabled:opacity-50"
        >
          <Ambulance className="w-5 h-5" />
          <span>{isSubmitting ? 'Contacting Trauma Center...' : 'Dispatch Advanced Life Support Ambulance'}</span>
        </button>
      </form>

      {/* Emergency Contacts & First-Aid Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-600" />
          <span>Verified Healthcare Emergency Hotlines</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-900 block">National Emergency</span>
            <p className="text-red-600 font-black text-base mt-0.5">112</p>
            <p className="text-[10px] text-slate-400">Police, Fire & Ambulance</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-900 block">Karnataka Trauma Helpline</span>
            <p className="text-slate-900 font-bold text-sm mt-0.5">108</p>
            <p className="text-[10px] text-slate-400">Govt. Medical Emergency</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-900 block">CareBridge SOS Desk</span>
            <p className="text-[#0284c7] font-bold text-sm mt-0.5">+91 80 4668 8000</p>
            <p className="text-[10px] text-slate-400">24/7 Clinical Hotline</p>
          </div>
        </div>
      </div>
    </div>
  );
};
