import React, { useState, useEffect } from 'react';
import {
  Users,
  CalendarCheck,
  Clock,
  CheckCircle,
  XCircle,
  UserCheck,
  Building2,
  BedDouble,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import type { Appointment } from '../../types/index.js';

interface HospitalDashboardViewProps {
  onNavigate: (view: string, filter?: string) => void;
}

export const HospitalDashboardView: React.FC<HospitalDashboardViewProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const hospital = currentUser as any;
  const hospitalId = hospital?.id;

  const [stats, setStats] = useState({
    totalPatients: 0,
    totalAppointments: 0,
    pendingAppointments: 0,
    approvedAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    totalDoctors: 0,
    availableDoctors: 0,
  });

  const [recentAppointments, setRecentAppointments] = useState<Appointment[]>([]);
  const [bookingScope, setBookingScope] = useState<'all' | 'facility'>('all');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!hospitalId) {
      setLoading(false);
      return;
    }
    try {
      const statsUrl =
        bookingScope === 'all'
          ? `/api/hospital/stats?hospitalId=${hospitalId}&scope=all`
          : `/api/hospital/stats?hospitalId=${hospitalId}`;
      const aptUrl =
        bookingScope === 'all'
          ? `/api/appointments?scope=all`
          : `/api/appointments?hospitalId=${hospitalId}`;

      const [statsRes, aptRes] = await Promise.all([fetch(statsUrl), fetch(aptUrl)]);
      if (statsRes.ok) {
        const s = await statsRes.json();
        setStats(s);
      }
      if (aptRes.ok) {
        const apts = await aptRes.json();
        setRecentAppointments(Array.isArray(apts) ? apts : []);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Live poll sync with patient bookings
    return () => clearInterval(interval);
  }, [hospitalId, bookingScope]);

  return (
    <div className="space-y-8 pb-12">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200 uppercase tracking-wider">
              Hospital Operations Command
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            {hospital?.hospitalName || 'Hospital Command Center'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            {hospital?.district || 'Karnataka'}, India
            {hospital?.registrationDetails ? ` • ${hospital.registrationDetails}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('appointment-management', 'Pending')}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-amber-500/20 flex items-center gap-2"
          >
            <Clock className="w-4 h-4" />
            <span>Review Pending ({stats.pendingAppointments})</span>
          </button>
          <button
            onClick={() => onNavigate('doctor-management')}
            className="px-4 py-2.5 bg-[#0284c7] hover:bg-sky-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-sky-600/20 flex items-center gap-2"
          >
            <UserCheck className="w-4 h-4" />
            <span>Manage Doctors ({stats.totalDoctors})</span>
          </button>
        </div>
      </div>

      {/* DASHBOARD STATISTICS CARDS (Section 17 requirements) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-slate-900 tracking-tight">
            Hospital Operational Metrics
          </h3>
          <span className="text-xs text-emerald-600 font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Database Synced
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Patients */}
          <div
            onClick={() => onNavigate('patient-management')}
            className="cursor-pointer bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-[#0284c7] transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Patients
              </span>
              <div className="w-9 h-9 rounded-xl bg-sky-100 text-[#0284c7] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-black text-slate-900">{stats.totalPatients}</p>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <span>View patient profiles</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5" />
              </p>
            </div>
          </div>

          {/* Card 2: Total Appointments */}
          <div
            onClick={() => onNavigate('appointment-management', 'All')}
            className="cursor-pointer bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-600 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Bookings
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CalendarCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-black text-blue-700">{stats.totalAppointments}</p>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <span>All patient appointments</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5" />
              </p>
            </div>
          </div>

          {/* Card 3: Pending Appointments */}
          <div
            onClick={() => onNavigate('appointment-management', 'Pending')}
            className="cursor-pointer bg-white p-5 rounded-2xl border-2 border-amber-300 shadow-xs hover:shadow-md hover:border-amber-500 transition-all group bg-amber-50/20"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                Pending Approval
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center group-hover:scale-110 transition-transform animate-pulse">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-black text-amber-600">{stats.pendingAppointments}</p>
              <p className="text-xs text-amber-800 mt-1 font-semibold flex items-center gap-1">
                <span>Action required</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </p>
            </div>
          </div>

          {/* Card 4: Approved Appointments */}
          <div
            onClick={() => onNavigate('appointment-management', 'Approved')}
            className="cursor-pointer bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-500 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Approved
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-black text-emerald-600">{stats.approvedAppointments}</p>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <span>Ready for consultation</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5" />
              </p>
            </div>
          </div>

          {/* Card 5: Completed Appointments */}
          <div
            onClick={() => onNavigate('appointment-management', 'Completed')}
            className="cursor-pointer bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Completed
              </span>
              <div className="w-9 h-9 rounded-xl bg-sky-100 text-[#0284c7] flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-black text-slate-900">{stats.completedAppointments}</p>
              <p className="text-xs text-slate-500 mt-1">Archived visits</p>
            </div>
          </div>

          {/* Card 6: Cancelled Appointments */}
          <div
            onClick={() => onNavigate('appointment-management', 'Cancelled')}
            className="cursor-pointer bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Cancelled
              </span>
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                <XCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-black text-slate-600">{stats.cancelledAppointments}</p>
              <p className="text-xs text-slate-500 mt-1">By patient or clinic</p>
            </div>
          </div>

          {/* Card 7: Total Doctors */}
          <div
            onClick={() => onNavigate('doctor-management')}
            className="cursor-pointer bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-purple-500 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Doctors
              </span>
              <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-black text-purple-700">{stats.totalDoctors}</p>
              <p className="text-xs text-slate-500 mt-1">Facility Specialists</p>
            </div>
          </div>

          {/* Card 8: Available Doctors */}
          <div
            onClick={() => onNavigate('doctor-management')}
            className="cursor-pointer bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-500 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Available Doctors
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-black text-emerald-600">
                {stats.availableDoctors}{' '}
                <span className="text-xs text-slate-400 font-normal">
                  / {Math.max(0, stats.totalDoctors - stats.availableDoctors)} On Leave
                </span>
              </p>
              <p className="text-xs text-emerald-700 font-semibold mt-1">
                {stats.availableDoctors} Active in OPD
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK OPERATIONAL ACTIONS & HOSPITAL FEATURES */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div
          onClick={() => onNavigate('appointment-management')}
          className="cursor-pointer bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-[#0284c7] transition-all text-center flex flex-col items-center justify-center space-y-1.5"
        >
          <CalendarCheck className="w-5 h-5 text-[#0284c7]" />
          <p className="text-xs font-bold text-slate-800">Appointments</p>
          <span className="text-[10px] text-slate-400">Approve / Reject</span>
        </div>

        <div
          onClick={() => onNavigate('doctor-management')}
          className="cursor-pointer bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-[#0284c7] transition-all text-center flex flex-col items-center justify-center space-y-1.5"
        >
          <UserCheck className="w-5 h-5 text-purple-600" />
          <p className="text-xs font-bold text-slate-800">Doctor Roster</p>
          <span className="text-[10px] text-slate-400">Availability</span>
        </div>

        <div
          onClick={() => onNavigate('beds-wards')}
          className="cursor-pointer bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-[#0284c7] transition-all text-center flex flex-col items-center justify-center space-y-1.5"
        >
          <BedDouble className="w-5 h-5 text-emerald-600" />
          <p className="text-xs font-bold text-slate-800">Beds & Wards</p>
          <span className="text-[10px] text-slate-400">ICU Capacity</span>
        </div>

        <div
          onClick={() => onNavigate('emergency-management')}
          className="cursor-pointer bg-white p-4 rounded-2xl border border-red-200 shadow-xs hover:border-red-500 transition-all text-center flex flex-col items-center justify-center space-y-1.5 bg-red-50/20"
        >
          <AlertTriangle className="w-5 h-5 text-red-600 animate-pulse" />
          <p className="text-xs font-bold text-red-700">Emergencies</p>
          <span className="text-[10px] text-red-600">ALS Dispatch</span>
        </div>

        <div
          onClick={() => onNavigate('billing-payments')}
          className="cursor-pointer bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-[#0284c7] transition-all text-center flex flex-col items-center justify-center space-y-1.5"
        >
          <DollarSign className="w-5 h-5 text-indigo-600" />
          <p className="text-xs font-bold text-slate-800">Billing & Invoices</p>
          <span className="text-[10px] text-slate-400">OPD Payments</span>
        </div>

        <div
          onClick={() => onNavigate('analytics')}
          className="cursor-pointer bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-[#0284c7] transition-all text-center flex flex-col items-center justify-center space-y-1.5"
        >
          <TrendingUp className="w-5 h-5 text-amber-600" />
          <p className="text-xs font-bold text-slate-800">Analytics</p>
          <span className="text-[10px] text-slate-400">Clinical Reports</span>
        </div>
      </div>

      {/* RECENT PATIENT BOOKINGS (Live Shared Queue) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-black text-base text-slate-900">
              All Patient Bookings ({recentAppointments.length})
            </h3>
            <p className="text-xs text-slate-500">
              Appointments booked through the Patient Portal automatically appear here in real time.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex rounded-xl bg-slate-100 p-1 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setBookingScope('all')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  bookingScope === 'all'
                    ? 'bg-[#1e40af] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Patient Bookings
              </button>
              <button
                type="button"
                onClick={() => setBookingScope('facility')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  bookingScope === 'facility'
                    ? 'bg-[#1e40af] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                This Hospital Only
              </button>
            </div>

            <button
              onClick={() => onNavigate('appointment-management')}
              className="text-xs font-bold text-[#0284c7] hover:underline ml-1"
            >
              Manage All Bookings →
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-center text-xs text-slate-400 py-6">Loading patient bookings...</p>
        ) : recentAppointments.length === 0 ? (
          <p className="text-center text-xs text-slate-400 py-6">No patient appointments booked yet.</p>
        ) : (
          <div className="space-y-3">
            {recentAppointments.map((apt) => (
              <div
                key={apt.id}
                onClick={() => onNavigate('appointment-management')}
                className="p-4 rounded-2xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 font-extrabold flex items-center justify-center text-xs shrink-0">
                    {apt.patientName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs font-bold text-slate-900">{apt.patientName}</p>
                      <span className="text-[10px] font-mono text-slate-400">({apt.id})</span>
                      {apt.hospitalName && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-100">
                          {apt.hospitalName}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#0284c7] font-semibold mt-0.5">
                      Doctor: {apt.doctorName} ({apt.doctorSpecialization})
                    </p>
                    <p className="text-[11px] text-slate-500">
                      📅 {apt.date} at {apt.timeSlot} • <strong>Reason:</strong> {apt.reasonForVisit}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      apt.status === 'Approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : apt.status === 'Pending'
                        ? 'bg-amber-100 text-amber-800 animate-pulse'
                        : apt.status === 'Completed'
                        ? 'bg-sky-100 text-[#0284c7]'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    ● {apt.status}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
