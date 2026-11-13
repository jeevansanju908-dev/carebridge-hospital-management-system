import React, { useState, useEffect } from 'react';
import {
  CalendarPlus,
  Search,
  Stethoscope,
  MapPin,
  Ambulance,
  FileText,
  Heart,
  Activity,
  Thermometer,
  Gauge,
  ArrowRight,
  TrendingUp,
  Clock,
  Plus,
  AlertCircle,
  CheckCircle,
  FileCheck,
  ChevronRight,
  X,
  Bell,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import type { Appointment, HealthVitalRecord, HealthDocument, AppNotification } from '../../types/index.js';

interface PatientDashboardViewProps {
  onNavigate: (view: string, filter?: string) => void;
}

export const PatientDashboardView: React.FC<PatientDashboardViewProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const patient = currentUser as any;

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [vitalsData, setVitalsData] = useState<{
    latest: HealthVitalRecord;
    history: HealthVitalRecord[];
    referenceRanges: any;
    disclaimer: string;
  } | null>(null);
  const [documents, setDocuments] = useState<HealthDocument[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showAddVitalModal, setShowAddVitalModal] = useState(false);
  const [selectedVitalMetric, setSelectedVitalMetric] = useState<string | null>(null);

  // New Vital Form State
  const [newHeartRate, setNewHeartRate] = useState('72');
  const [newOxygen, setNewOxygen] = useState('98');
  const [newTemp, setNewTemp] = useState('36.6');
  const [newBpSys, setNewBpSys] = useState('120');
  const [newBpDia, setNewBpDia] = useState('80');
  const [vitalNotes, setVitalNotes] = useState('');

  const patientId = patient?.id;

  const loadData = async () => {
    if (!patientId) return;
    try {
      // 1. Fetch Appointments
      const aptRes = await fetch(`/api/appointments?patientId=${patientId}`);
      if (aptRes.ok) {
        const apts = await aptRes.json();
        setAppointments(apts);
      }

      // 2. Fetch Vitals
      const vitRes = await fetch(`/api/vitals/${patientId}`);
      if (vitRes.ok) {
        const vits = await vitRes.json();
        setVitalsData(vits);
      }

      // 3. Fetch Records
      const docRes = await fetch(`/api/records/${patientId}`);
      if (docRes.ok) {
        const docs = await docRes.json();
        setDocuments(docs);
      }

      // 4. Fetch Notifications
      const notifRes = await fetch(`/api/notifications?userId=${patientId}&role=patient`);
      if (notifRes.ok) {
        const notifs = await notifRes.json();
        setNotifications(notifs);
      }
    } catch (e) {
      console.warn('Dashboard fetch offline', e);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // Live poll sync with hospital
    return () => clearInterval(interval);
  }, [patientId]);

  // Statistics derived directly from actual appointments
  const totalAppointments = appointments.length;
  const upcomingAppointments = appointments.filter(
    (a) => a.status === 'Approved' || a.status === 'Pending' || a.status === 'Rescheduled'
  ).length;
  const completedAppointments = appointments.filter((a) => a.status === 'Completed').length;
  const cancelledAppointments = appointments.filter((a) => a.status === 'Cancelled').length;

  const handleAddVital = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          heartRate: Number(newHeartRate),
          oxygenLevel: Number(newOxygen),
          temperature: Number(newTemp),
          bloodPressureSys: Number(newBpSys),
          bloodPressureDia: Number(newBpDia),
          notes: vitalNotes || 'Self-recorded reading from home monitor',
        }),
      });
      setShowAddVitalModal(false);
      setVitalNotes('');
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const latestVital = vitalsData?.latest || {
    heartRate: 72,
    oxygenLevel: 98,
    temperature: 36.6,
    bloodPressureSys: 120,
    bloodPressureDia: 80,
    timestamp: new Date().toISOString(),
  };

  const lastVisit = appointments.find((a) => a.status === 'Completed');
  const nextVisit = appointments.find(
    (a) => a.status === 'Approved' || a.status === 'Pending' || a.status === 'Rescheduled'
  );

  return (
    <div className="space-y-8 pb-12">
      {/* 1. TOP GREETING & DATE (Section 7) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Hello, {patient?.fullName || 'Patient'}</span>
            <span className="text-2xl animate-wave">👋</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}{' '}
            • Welcome to your CareBridge Health Overview.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Blue Button: Nearby Hospitals */}
          <button
            onClick={() => onNavigate('nearby-hospitals')}
            className="px-4 py-2.5 bg-[#0284c7] hover:bg-sky-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-sky-600/25 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
            title="Automatically detect location and find nearby hospitals"
          >
            <MapPin className="w-4 h-4" />
            <span>Nearby Hospitals</span>
          </button>
          <button
            onClick={() => onNavigate('book-appointment')}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold shadow-xs flex items-center gap-2 transition-all"
          >
            <CalendarPlus className="w-4 h-4 text-[#0284c7]" />
            <span>Book Appointment</span>
          </button>
          <button
            onClick={() => onNavigate('ambulance')}
            className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all"
          >
            <Ambulance className="w-4 h-4 text-red-600" />
            <span>Emergency SOS</span>
          </button>
        </div>
      </div>

      {/* 2. DASHBOARD HERO SECTION (Large photograph of doctors caring for patients) */}
      <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200/80 group">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/60 to-transparent z-10" />
        <img
          src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1600&q=85"
          alt="Doctors caring for patient during consultation"
          className="w-full h-72 sm:h-80 object-cover object-center group-hover:scale-105 transition-transform duration-700"
        />

        <div className="absolute inset-0 z-20 flex flex-col justify-center px-6 sm:px-10 lg:px-12 max-w-2xl text-white space-y-3.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/30 backdrop-blur-md border border-sky-400/40 text-sky-200 text-xs font-bold w-max">
            <Sparkles className="w-3.5 h-3.5" />
            <span>CareBridge Patient Care</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            Your Health, Our Priority
          </h2>

          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
            Get connected with trusted healthcare professionals and take control of your health.
            Schedule instant specialist appointments, verify health vitals, and explore nearby Karnataka hospitals.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('nearby-hospitals')}
              className="px-5 py-2.5 rounded-xl bg-[#0284c7] hover:bg-sky-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-sky-600/40 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 ring-2 ring-white/30"
            >
              <MapPin className="w-4 h-4" />
              <span>Nearby Hospitals</span>
            </button>
            <button
              onClick={() => onNavigate('book-appointment')}
              className="px-5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold text-xs sm:text-sm border border-white/30 flex items-center gap-2 transition-all"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>Book Appointment</span>
            </button>
            <button
              onClick={() => onNavigate('find-doctors')}
              className="px-5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold text-xs sm:text-sm border border-white/30 flex items-center gap-2 transition-all"
            >
              <Search className="w-4 h-4" />
              <span>Find Doctors</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. DASHBOARD STATISTICS (Clicking opens corresponding filtered appointment list) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-slate-900 tracking-tight">
            Appointment Statistics
          </h3>
          <span className="text-xs text-slate-500">Live synced with hospital records</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Appointments */}
          <div
            onClick={() => onNavigate('my-appointments', 'All')}
            className="cursor-pointer bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-[#0284c7] transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total
              </span>
              <div className="w-9 h-9 rounded-xl bg-sky-100 text-[#0284c7] flex items-center justify-center group-hover:scale-110 transition-transform">
                <CalendarPlus className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-black text-slate-900">{totalAppointments}</p>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <span>View all bookings</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </p>
            </div>
          </div>

          {/* Card 2: Upcoming Appointments */}
          <div
            onClick={() => onNavigate('my-appointments', 'Upcoming')}
            className="cursor-pointer bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-amber-500 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Upcoming / Pending
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-black text-amber-600">{upcomingAppointments}</p>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <span>Pending or confirmed</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </p>
            </div>
          </div>

          {/* Card 3: Completed Appointments */}
          <div
            onClick={() => onNavigate('my-appointments', 'Completed')}
            className="cursor-pointer bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-500 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Completed
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-black text-emerald-600">{completedAppointments}</p>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <span>View past visits</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </p>
            </div>
          </div>

          {/* Card 4: Cancelled Appointments */}
          <div
            onClick={() => onNavigate('my-appointments', 'Cancelled')}
            className="cursor-pointer bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-400 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Cancelled
              </span>
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <X className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-black text-slate-600">{cancelledAppointments}</p>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <span>View cancelled records</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. QUICK ACCESS FEATURES (Section 7) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-slate-900 tracking-tight">
            Quick Healthcare Access
          </h3>
          <span className="text-xs text-slate-500">Essential one-click services</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* 1. Book Appointment */}
          <div
            onClick={() => onNavigate('book-appointment')}
            className="cursor-pointer bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-[#0284c7] transition-all text-center flex flex-col items-center justify-center space-y-2 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#0284c7] flex items-center justify-center group-hover:bg-[#0284c7] group-hover:text-white transition-colors">
              <CalendarPlus className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-900 leading-tight">Book Appointment</p>
            <span className="text-[10px] text-slate-400">7-Step Flow</span>
          </div>

          {/* 2. Find Doctors */}
          <div
            onClick={() => onNavigate('find-doctors')}
            className="cursor-pointer bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-[#0284c7] transition-all text-center flex flex-col items-center justify-center space-y-2 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1e40af] flex items-center justify-center group-hover:bg-[#1e40af] group-hover:text-white transition-colors">
              <Search className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-900 leading-tight">Find Doctors</p>
            <span className="text-[10px] text-slate-400">20 Specialists</span>
          </div>

          {/* 3. Check Symptoms */}
          <div
            onClick={() => onNavigate('symptom-checker')}
            className="cursor-pointer bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-purple-500 transition-all text-center flex flex-col items-center justify-center space-y-2 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Stethoscope className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-900 leading-tight">Check Symptoms</p>
            <span className="text-[10px] text-purple-600 font-semibold">Gemini AI Triage</span>
          </div>

          {/* 4. Nearby Hospitals */}
          <div
            onClick={() => onNavigate('nearby-hospitals')}
            className="cursor-pointer bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-500 transition-all text-center flex flex-col items-center justify-center space-y-2 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <MapPin className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-900 leading-tight">Nearby Hospitals</p>
            <span className="text-[10px] text-slate-400">Karnataka Map</span>
          </div>

          {/* 5. Ambulance */}
          <div
            onClick={() => onNavigate('ambulance')}
            className="cursor-pointer bg-white p-4 rounded-2xl border border-red-200/80 shadow-xs hover:shadow-md hover:border-red-500 transition-all text-center flex flex-col items-center justify-center space-y-2 group bg-red-50/20"
          >
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors animate-pulse">
              <Ambulance className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-red-700 leading-tight">Ambulance & SOS</p>
            <span className="text-[10px] text-red-600 font-bold">Dial 112</span>
          </div>

          {/* 6. Health Records */}
          <div
            onClick={() => onNavigate('health-records')}
            className="cursor-pointer bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-[#0284c7] transition-all text-center flex flex-col items-center justify-center space-y-2 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-900 leading-tight">Health Records</p>
            <span className="text-[10px] text-slate-400">Prescriptions & Labs</span>
          </div>
        </div>
      </div>

      {/* 5. HEALTH VITALS SECTION (Section 7) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Personal Health Vitals
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                Sample Demonstration Data
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Recorded at: {new Date(latestVital.timestamp).toLocaleString()} • Click any card to inspect clinical trends & reference ranges.
            </p>
          </div>

          <button
            onClick={() => setShowAddVitalModal(true)}
            className="px-4 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#0284c7] border border-sky-200 text-xs font-bold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Record New Reading</span>
          </button>
        </div>

        {/* 4 Interactive Vital Cards with sample values */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Heart Rate */}
          <div
            onClick={() => setSelectedVitalMetric('heartRate')}
            className="cursor-pointer p-4.5 rounded-2xl border-2 border-slate-100 hover:border-red-400 bg-red-50/20 hover:bg-red-50/40 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">Heart Rate</span>
              <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                <Heart className="w-4 h-4 animate-pulse" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-slate-900">{latestVital.heartRate}</span>
                <span className="text-xs font-semibold text-slate-500">BPM</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className="px-2 py-0.5 rounded-md font-bold text-emerald-700 bg-emerald-100">
                  Normal (60-100)
                </span>
                <span className="text-slate-400">Click graph →</span>
              </div>
            </div>
          </div>

          {/* Card 2: Oxygen Level (SpO2) */}
          <div
            onClick={() => setSelectedVitalMetric('oxygenLevel')}
            className="cursor-pointer p-4.5 rounded-2xl border-2 border-slate-100 hover:border-sky-400 bg-sky-50/20 hover:bg-sky-50/40 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">Oxygen Level</span>
              <div className="w-8 h-8 rounded-lg bg-sky-100 text-[#0284c7] flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-slate-900">{latestVital.oxygenLevel}%</span>
                <span className="text-xs font-semibold text-slate-500">SpO2</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className="px-2 py-0.5 rounded-md font-bold text-emerald-700 bg-emerald-100">
                  Normal (95-100%)
                </span>
                <span className="text-slate-400">Click graph →</span>
              </div>
            </div>
          </div>

          {/* Card 3: Body Temperature */}
          <div
            onClick={() => setSelectedVitalMetric('temperature')}
            className="cursor-pointer p-4.5 rounded-2xl border-2 border-slate-100 hover:border-amber-400 bg-amber-50/20 hover:bg-amber-50/40 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">Body Temperature</span>
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <Thermometer className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-slate-900">{latestVital.temperature}</span>
                <span className="text-xs font-semibold text-slate-500">°C</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className="px-2 py-0.5 rounded-md font-bold text-emerald-700 bg-emerald-100">
                  Normal (36.1-37.2°C)
                </span>
                <span className="text-slate-400">Click graph →</span>
              </div>
            </div>
          </div>

          {/* Card 4: Blood Pressure */}
          <div
            onClick={() => setSelectedVitalMetric('bloodPressure')}
            className="cursor-pointer p-4.5 rounded-2xl border-2 border-slate-100 hover:border-purple-400 bg-purple-50/20 hover:bg-purple-50/40 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">Blood Pressure</span>
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                <Gauge className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-slate-900">
                  {latestVital.bloodPressureSys}/{latestVital.bloodPressureDia}
                </span>
                <span className="text-xs font-semibold text-slate-500">mmHg</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className="px-2 py-0.5 rounded-md font-bold text-emerald-700 bg-emerald-100">
                  Optimal (120/80)
                </span>
                <span className="text-slate-400">Click graph →</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mandatory Medical Disclaimer (Section 7) */}
        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p>
            <strong>Medical Notice:</strong> Values shown above are patient self-reported or sample demonstration values.
            CareBridge does not claim live physiological telemetry unless connected with a verified clinical IoT sensor. Consult a physician for diagnostic evaluation.
          </p>
        </div>
      </div>

      {/* 6. HEALTH ACTIVITY SECTION (Section 7) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Recent Doctor Consultations & Upcoming Appointments */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-extrabold text-base text-slate-900">Recent Appointments & Visits</h4>
            <button
              onClick={() => onNavigate('my-appointments')}
              className="text-xs font-bold text-[#0284c7] hover:underline"
            >
              View All
            </button>
          </div>

          <div className="space-y-3">
            {appointments.slice(0, 3).map((apt) => (
              <div
                key={apt.id}
                onClick={() => onNavigate('my-appointments')}
                className="p-3.5 rounded-2xl border border-slate-100 hover:border-slate-200 bg-slate-50/60 hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={apt.doctorAvatar}
                    alt={apt.doctorName}
                    className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900">{apt.doctorName}</p>
                    <p className="text-[11px] text-slate-500">
                      {apt.doctorSpecialization} • {apt.hospitalName}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      📅 {apt.date} at {apt.timeSlot}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      apt.status === 'Approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : apt.status === 'Pending'
                        ? 'bg-amber-100 text-amber-800'
                        : apt.status === 'Completed'
                        ? 'bg-sky-100 text-[#0284c7]'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {apt.status}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">Ref: {apt.id}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Uploaded Reports & Recent Notifications */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-extrabold text-base text-slate-900">Recently Uploaded Reports & Activity</h4>
            <button
              onClick={() => onNavigate('health-records')}
              className="text-xs font-bold text-[#0284c7] hover:underline"
            >
              Open Vault
            </button>
          </div>

          <div className="space-y-3">
            {documents.slice(0, 3).map((doc) => (
              <div
                key={doc.id}
                onClick={() => onNavigate('health-records')}
                className="p-3.5 rounded-2xl border border-slate-100 hover:border-slate-200 bg-slate-50/60 hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{doc.title}</p>
                    <p className="text-[11px] text-slate-500">
                      {doc.type} • {doc.date}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-400 font-medium">{doc.fileSize}</span>
                  <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Verified</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL: Record New Vital Reading */}
      {showAddVitalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">Add Health Vital Reading</h3>
              <button
                onClick={() => setShowAddVitalModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddVital} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Heart Rate (BPM)</label>
                  <input
                    type="number"
                    required
                    min={40}
                    max={200}
                    value={newHeartRate}
                    onChange={(e) => setNewHeartRate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-sky-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Oxygen (SpO2 %)</label>
                  <input
                    type="number"
                    required
                    min={70}
                    max={100}
                    value={newOxygen}
                    onChange={(e) => setNewOxygen(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-sky-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Temperature (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    min={34}
                    max={43}
                    value={newTemp}
                    onChange={(e) => setNewTemp(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-sky-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">BP (Sys/Dia mmHg)</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      required
                      value={newBpSys}
                      onChange={(e) => setNewBpSys(e.target.value)}
                      placeholder="120"
                      className="w-1/2 px-2 py-2 rounded-xl border border-slate-200 text-sm text-center"
                    />
                    <span>/</span>
                    <input
                      type="number"
                      required
                      value={newBpDia}
                      onChange={(e) => setNewBpDia(e.target.value)}
                      placeholder="80"
                      className="w-1/2 px-2 py-2 rounded-xl border border-slate-200 text-sm text-center"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Context / Notes</label>
                <input
                  type="text"
                  value={vitalNotes}
                  onChange={(e) => setVitalNotes(e.target.value)}
                  placeholder="e.g. Resting morning reading after 5 min sit"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-sky-500 outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddVitalModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#0284c7] hover:bg-sky-700 rounded-xl shadow-md shadow-sky-600/20"
                >
                  Save Reading
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Vital Detail & Historical Graph */}
      {selectedVitalMetric && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#0284c7]" />
                <h3 className="font-extrabold text-base text-slate-900 capitalize">
                  {selectedVitalMetric === 'heartRate'
                    ? 'Heart Rate History (BPM)'
                    : selectedVitalMetric === 'oxygenLevel'
                    ? 'Oxygen Level Trend (SpO2 %)'
                    : selectedVitalMetric === 'temperature'
                    ? 'Body Temperature Trend (°C)'
                    : 'Blood Pressure Record (mmHg)'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedVitalMetric(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Visual Simulated Bar Chart */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
              <p className="text-xs font-bold text-slate-600">Past Readings History</p>
              <div className="flex items-end justify-between h-36 pt-4 gap-2">
                {(vitalsData?.history || []).slice(0, 5).reverse().map((v, idx) => {
                  let val = 70;
                  let max = 100;
                  if (selectedVitalMetric === 'heartRate') {
                    val = v.heartRate;
                    max = 120;
                  } else if (selectedVitalMetric === 'oxygenLevel') {
                    val = v.oxygenLevel;
                    max = 100;
                  } else if (selectedVitalMetric === 'temperature') {
                    val = v.temperature;
                    max = 40;
                  } else {
                    val = v.bloodPressureSys;
                    max = 160;
                  }
                  const pct = Math.min(100, Math.max(20, (val / max) * 100));

                  return (
                    <div key={v.id || idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <span className="text-[10px] font-bold text-slate-700">{val}</span>
                      <div
                        style={{ height: `${pct}%` }}
                        className="w-full bg-[#0284c7] rounded-t-lg transition-all"
                      />
                      <span className="text-[9px] text-slate-400 truncate max-w-[48px]">
                        {new Date(v.timestamp).toLocaleDateString([], { month: 'numeric', day: 'numeric' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-3 bg-sky-50 rounded-xl text-xs text-sky-900 border border-sky-100">
              <strong>Clinical Reference Standard:</strong> Normal resting bounds are clinically monitored. Always verify unexpected variations with a healthcare specialist.
            </div>

            <div className="text-right">
              <button
                onClick={() => setSelectedVitalMetric(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
