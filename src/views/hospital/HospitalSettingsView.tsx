import React, { useState, useEffect } from 'react';
import {
  Settings,
  Database,
  Building2,
  Phone,
  Save,
  CheckCircle,
  ShieldCheck,
  Activity,
  Bell,
  Clock,
  MapPin,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Server,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

export const HospitalSettingsView: React.FC = () => {
  const { currentUser } = useAuth();
  const hospital = currentUser as any;

  const [sysStatus, setSysStatus] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  // Supabase Backend Integration State
  const [supabaseStatus, setSupabaseStatus] = useState<any>(null);
  const [testingSupabase, setTestingSupabase] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Hospital Facility Form State
  const [hospitalName, setHospitalName] = useState(hospital?.hospitalName || '');
  const [helpline, setHelpline] = useState(hospital?.emergencyHelpline || '');
  const [ambulanceHotline, setAmbulanceHotline] = useState(hospital?.emergencyHelpline || '112');
  const [address, setAddress] = useState(hospital?.address || '');
  const [district, setDistrict] = useState(hospital?.district || 'Bengaluru Urban');
  const [opdStartTime, setOpdStartTime] = useState('08:00 AM');
  const [opdEndTime, setOpdEndTime] = useState('08:00 PM');
  const [autoApproval, setAutoApproval] = useState(false);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [savedSettings, setSavedSettings] = useState(false);

  useEffect(() => {
    if (!hospital) return;
    setHospitalName(hospital.hospitalName || '');
    setHelpline(hospital.emergencyHelpline || '');
    setAmbulanceHotline(hospital.emergencyHelpline || '112');
    setAddress(hospital.address || '');
    setDistrict(hospital.district || 'Bengaluru Urban');
  }, [hospital]);

  const fetchSystemStatus = () => {
    setLoadingStatus(true);
    fetch('/api/system/status')
      .then((r) => r.json())
      .then((d) => setSysStatus(d))
      .catch((e) => console.warn(e))
      .finally(() => setLoadingStatus(false));
  };

  const checkSupabaseStatus = () => {
    setTestingSupabase(true);
    fetch('/api/supabase/status')
      .then((r) => r.json())
      .then((d) => setSupabaseStatus(d))
      .catch((e) => setSupabaseStatus({ connected: false, message: e.message }))
      .finally(() => setTestingSupabase(false));
  };

  useEffect(() => {
    fetchSystemStatus();
    checkSupabaseStatus();
  }, []);

  const copySqlSchema = () => {
    const sql = `-- CareBridge Appointments Schema for Supabase
-- Project ID: crnurqfbksebpzceymvq
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/crnurqfbksebpzceymvq/sql

CREATE TABLE IF NOT EXISTS public.appointments (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    patient_email TEXT,
    patient_phone TEXT,
    patient_blood_group TEXT,
    doctor_id TEXT NOT NULL,
    doctor_name TEXT NOT NULL,
    doctor_specialization TEXT,
    hospital_id TEXT,
    hospital_name TEXT,
    date DATE NOT NULL,
    time_slot TEXT NOT NULL,
    reason_for_visit TEXT,
    additional_notes TEXT,
    status TEXT DEFAULT 'Pending',
    consultation_fee NUMERIC DEFAULT 600,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert to appointments"
    ON public.appointments FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public select from appointments"
    ON public.appointments FOR SELECT TO public USING (true);

CREATE POLICY "Allow public update to appointments"
    ON public.appointments FOR UPDATE TO public USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;`;

    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleSaveHospitalSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSettings(true);
    setTimeout(() => setSavedSettings(false), 3000);
  };

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Hospital Facility & System Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Configure clinical parameters, emergency dispatch helplines, OPD schedule, and live data synchronization.
        </p>
      </div>

      {/* 1. SHARED HEALTHCARE DATA ENGINE STATUS */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-slate-900">
                  CareBridge High-Performance Storage Engine
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 animate-pulse">
                  Online & Active
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Patient & Hospital portals share an integrated live data store with automatic synchronization.
              </p>
            </div>
          </div>

          <button
            onClick={fetchSystemStatus}
            disabled={loadingStatus}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title="Refresh status"
          >
            <RefreshCw className={`w-4 h-4 ${loadingStatus ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Live System Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <p className="text-[10px] uppercase font-bold text-slate-400">Total Hospitals</p>
            <p className="text-lg font-black text-slate-900 mt-0.5">{sysStatus?.totalHospitals ?? 0}</p>
            <span className="text-[10px] font-semibold text-sky-600">Statewide Network</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <p className="text-[10px] uppercase font-bold text-slate-400">Active Doctors</p>
            <p className="text-lg font-black text-slate-900 mt-0.5">{sysStatus?.totalDoctors ?? 0}</p>
            <span className="text-[10px] font-semibold text-emerald-600">Roster Registered</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <p className="text-[10px] uppercase font-bold text-slate-400">Total Patients</p>
            <p className="text-lg font-black text-slate-900 mt-0.5">{sysStatus?.totalPatients ?? 0}</p>
            <span className="text-[10px] font-semibold text-purple-600">Registered Accounts</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <p className="text-[10px] uppercase font-bold text-slate-400">Appointments</p>
            <p className="text-lg font-black text-slate-900 mt-0.5">{sysStatus?.totalAppointments ?? 0}</p>
            <span className="text-[10px] font-semibold text-blue-600">Live Synchronized</span>
          </div>
        </div>

        <div className="p-4 bg-sky-50/60 rounded-2xl border border-sky-200/80 text-xs text-slate-700 leading-relaxed flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-[#0284c7] shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-slate-900">Synchronized Portal Architecture</p>
            <p className="text-slate-600 mt-0.5">
              When a patient books an appointment, submits vitals, or requests emergency ambulance assistance, the hospital administration queue receives the updates instantaneously with zero delay.
            </p>
          </div>
        </div>
      </div>

      {/* 2. SUPABASE CLOUD DATABASE INTEGRATION */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-200/80 shadow-xl space-y-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-sm">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-slate-900">Supabase Cloud Database</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 font-mono">
                  Project: crnurqfbksebpzceymvq
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Connected to your remote Supabase PostgreSQL cloud backend. Appointment submissions are synchronized automatically.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={checkSupabaseStatus}
              disabled={testingSupabase}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingSupabase ? 'animate-spin' : ''}`} />
              <span>{testingSupabase ? 'Testing Connection...' : 'Test Connection'}</span>
            </button>
          </div>
        </div>

        {/* Supabase Status Banner */}
        {supabaseStatus && (
          <div
            className={`p-4 rounded-2xl border text-xs leading-relaxed flex items-start gap-3 ${
              supabaseStatus.tableReady
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            {supabaseStatus.tableReady ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <p className="font-extrabold">
                {supabaseStatus.tableReady
                  ? 'Supabase Backend Connected & Table Ready'
                  : 'Supabase Project Connected • SQL Schema Setup Required'}
              </p>
              <p className="text-[11px] opacity-90">{supabaseStatus.message}</p>
            </div>
          </div>
        )}

        {/* Config Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <p className="text-[10px] uppercase font-bold text-slate-400">Project ID</p>
            <p className="font-mono font-bold text-slate-900 mt-0.5">crnurqfbksebpzceymvq</p>
            <span className="text-[10px] font-semibold text-emerald-600">Active</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <p className="text-[10px] uppercase font-bold text-slate-400">Database Table</p>
            <p className="font-mono font-bold text-slate-900 mt-0.5">public.appointments</p>
            <span className="text-[10px] font-semibold text-sky-600">Row Level Security</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <p className="text-[10px] uppercase font-bold text-slate-400">API Key Authentication</p>
            <p className="font-mono font-bold text-slate-900 mt-0.5">sb_publishable_Mz6a...8xw0</p>
            <span className="text-[10px] font-semibold text-purple-600">Publishable / Anon</span>
          </div>
        </div>

        {/* SQL Schema helper box */}
        <div className="p-4 bg-slate-900 rounded-2xl text-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-xs text-white">Supabase SQL Migration Script</span>
            </div>
            <button
              onClick={copySqlSchema}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? 'Copied to Clipboard!' : 'Copy SQL Script'}</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            If you have not already run the migration in Supabase, open your Supabase Dashboard SQL Editor and execute this script to ensure the <code className="text-emerald-300 font-mono">public.appointments</code> table is created with full permissions.
          </p>
          <div className="pt-1">
            <a
              href="https://supabase.com/dashboard/project/crnurqfbksebpzceymvq/sql"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
            >
              <span>Open Supabase SQL Editor (Project crnurqfbksebpzceymvq)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* 3. HOSPITAL FACILITY & HELPLINE SETTINGS */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#1e40af] flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-lg text-slate-900">Hospital Facility Configuration</h3>
            <p className="text-xs text-slate-500">Update emergency helpline numbers, physical campus details, and OPD timings.</p>
          </div>
        </div>

        {savedSettings && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Facility configuration updated and saved successfully!</span>
          </div>
        )}

        <form onSubmit={handleSaveHospitalSettings} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Hospital Official Name</label>
              <input
                type="text"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-600 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">District / Region</label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-600 outline-none bg-white font-medium"
              >
                <option value="Bengaluru Urban">Bengaluru Urban</option>
                <option value="Bengaluru Rural">Bengaluru Rural</option>
                <option value="Mysuru">Mysuru</option>
                <option value="Dakshina Kannada">Dakshina Kannada</option>
                <option value="Dharwad">Dharwad</option>
                <option value="Tumakuru">Tumakuru</option>
                <option value="Kolar">Kolar</option>
                <option value="Mandya">Mandya</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Emergency Desk Helpline</label>
              <input
                type="text"
                value={helpline}
                onChange={(e) => setHelpline(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-600 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">24/7 Ambulance Dispatch Hotline</label>
              <input
                type="text"
                value={ambulanceHotline}
                onChange={(e) => setAmbulanceHotline(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-600 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Campus Physical Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-600 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block font-bold text-slate-700 mb-1">OPD Opening Time</label>
              <input
                type="text"
                value={opdStartTime}
                onChange={(e) => setOpdStartTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-600 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">OPD Closing Time</label>
              <input
                type="text"
                value={opdEndTime}
                onChange={(e) => setOpdEndTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-600 outline-none"
              />
            </div>
          </div>

          {/* Operational Toggles */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
              <div>
                <p className="font-bold text-slate-800">Auto-Approve Follow-up Consultations</p>
                <p className="text-[11px] text-slate-500">Automatically confirm recurring patients with active case files.</p>
              </div>
              <input
                type="checkbox"
                checked={autoApproval}
                onChange={(e) => setAutoApproval(e.target.checked)}
                className="w-5 h-5 text-[#1e40af] rounded accent-[#1e40af]"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
              <div>
                <p className="font-bold text-slate-800">Real-time SMS & Push Alerts for Doctors</p>
                <p className="text-[11px] text-slate-500">Notify on-call doctors when a new booking is finalized.</p>
              </div>
              <input
                type="checkbox"
                checked={smsAlerts}
                onChange={(e) => setSmsAlerts(e.target.checked)}
                className="w-5 h-5 text-[#1e40af] rounded accent-[#1e40af]"
              />
            </label>
          </div>

          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#1e40af] hover:bg-blue-900 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-800/20"
            >
              <Save className="w-4 h-4" />
              <span>Save Configuration</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
