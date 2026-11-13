import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  UserCheck,
  Eye,
  Calendar,
  Clock,
  Building2,
  User,
  AlertCircle,
  X,
  FileText,
  Trash2,
  Archive,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import type { Appointment, AppointmentStatus, Doctor } from '../../types/index.js';

interface HospitalAppointmentManagementViewProps {
  initialStatusFilter?: string;
}

const statusOptions = ['All', 'Pending', 'Approved', 'Rejected', 'Completed', 'Cancelled', 'Rescheduled'];

export const HospitalAppointmentManagementView: React.FC<HospitalAppointmentManagementViewProps> = ({
  initialStatusFilter = 'All',
}) => {
  const { currentUser } = useAuth();
  const hospital = currentUser as any;
  const hospitalId = hospital?.id;

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [bookingScope, setBookingScope] = useState<'all' | 'facility'>('all');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Action Modals
  const [rejectingApt, setRejectingApt] = useState<Appointment | null>(null);
  const [rejectReason, setRejectReason] = useState('Doctor fully booked for this slot.');

  const [reassignApt, setReassignApt] = useState<Appointment | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');

  const [rescheduleApt, setRescheduleApt] = useState<Appointment | null>(null);
  const [reschedDate, setReschedDate] = useState('2026-11-20');
  const [reschedSlot, setReschedSlot] = useState('11:30 AM');

  const [inspectApt, setInspectApt] = useState<Appointment | null>(null);

  // Delete / Cancel Booking Modal (Permanent Records retention)
  const [deleteModalApt, setDeleteModalApt] = useState<Appointment | null>(null);
  const [deleteReason, setDeleteReason] = useState('Cancelled by hospital clinical coordinator.');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchAppointments = async () => {
    if (!hospitalId) {
      setLoading(false);
      return;
    }
    try {
      const url =
        bookingScope === 'all'
          ? `/api/appointments?scope=all`
          : `/api/appointments?hospitalId=${hospitalId}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAppointments(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    if (!hospitalId) return;
    try {
      const url = bookingScope === 'all' ? `/api/doctors` : `/api/doctors?hospitalId=${hospitalId}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setDoctors(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
    const interval = setInterval(fetchAppointments, 5000); // Live poll sync
    return () => clearInterval(interval);
  }, [hospitalId, bookingScope]);

  // Status update API caller
  const updateStatus = async (
    aptId: string,
    status: AppointmentStatus,
    extraData?: {
      hospitalNotes?: string;
      assignedDoctorId?: string;
      newDate?: string;
      newTimeSlot?: string;
    }
  ) => {
    try {
      const res = await fetch(`/api/appointments/${aptId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...extraData }),
      });
      if (res.ok) {
        fetchAppointments();
        setRejectingApt(null);
        setReassignApt(null);
        setRescheduleApt(null);
        if (inspectApt?.id === aptId) {
          const updated = await res.json();
          setInspectApt(updated.appointment);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApprove = (apt: Appointment) => {
    updateStatus(apt.id, 'Approved', {
      hospitalNotes: `Confirmed by ${hospital?.hospitalName || 'Hospital'} OPD reception. Please arrive 15 minutes before scheduled slot.`,
    });
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingApt) return;
    updateStatus(rejectingApt.id, 'Rejected', {
      hospitalNotes: rejectReason || 'Doctor unavailable due to emergency duty.',
    });
  };

  const handleReassignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignApt || !selectedDoctorId) return;
    updateStatus(reassignApt.id, reassignApt.status, {
      assignedDoctorId: selectedDoctorId,
      hospitalNotes: `Reassigned to new medical specialist by clinical coordinator.`,
    });
  };

  const handleRescheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleApt) return;
    updateStatus(rescheduleApt.id, 'Rescheduled', {
      newDate: reschedDate,
      newTimeSlot: reschedSlot,
      hospitalNotes: `Rescheduled by hospital to ${reschedDate} at ${reschedSlot}.`,
    });
  };

  const handleDeleteBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteModalApt) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/appointments/${deleteModalApt.id}/hospital-delete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: deleteReason }),
      });
      if (res.ok) {
        setDeleteModalApt(null);
        setInspectApt(null);
        fetchAppointments();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Filtered Appointments
  const filteredAppointments = appointments.filter((apt) => {
    if (statusFilter !== 'All' && apt.status.toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }
    if (dateFilter && apt.date !== dateFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchPat = apt.patientName.toLowerCase().includes(q);
      const matchDoc = apt.doctorName.toLowerCase().includes(q);
      const matchId = apt.id.toLowerCase().includes(q);
      if (!matchPat && !matchDoc && !matchId) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Appointment Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review, approve, reject, reschedule, or reassign all incoming patient bookings across departments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setBookingScope('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
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
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                bookingScope === 'facility'
                  ? 'bg-[#1e40af] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              This Hospital Only
            </button>
          </div>

          <button
            onClick={fetchAppointments}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-3.5">
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
          {statusOptions.map((st) => {
            const count =
              st === 'All'
                ? appointments.length
                : appointments.filter((a) => a.status.toLowerCase() === st.toLowerCase()).length;
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  statusFilter === st
                    ? 'bg-[#1e40af] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{st}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    statusFilter === st ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Search by Patient / ID */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Patient Name, ID, or Doctor..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:border-blue-600 outline-none"
            />
          </div>

          {/* Filter by Date */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-blue-600 outline-none bg-white font-medium"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="text-xs text-red-600 hover:underline font-bold shrink-0"
              >
                Clear Date
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Appointments List (Showing ALL appointments) */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">Loading hospital bookings...</div>
      ) : filteredAppointments.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 space-y-3">
          <CalendarCheck className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No appointments in this view</h3>
          <p className="text-xs text-slate-500">
            {statusFilter === 'All'
              ? 'No bookings currently assigned to this hospital facility.'
              : `No appointments currently marked as ${statusFilter}.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredAppointments.map((apt) => (
            <div
              key={apt.id}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-900 font-black flex items-center justify-center text-sm shrink-0 border border-blue-200">
                  {apt.patientName.slice(0, 2).toUpperCase()}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                        apt.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : apt.status === 'Pending'
                          ? 'bg-amber-100 text-amber-800 border-amber-200 animate-pulse'
                          : apt.status === 'Completed'
                          ? 'bg-sky-100 text-[#0284c7] border-sky-200'
                          : apt.status === 'Rejected'
                          ? 'bg-red-100 text-red-800 border-red-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      ● {apt.status}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 font-bold">
                      Ref: {apt.id}
                    </span>
                    {apt.hospitalName && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-100">
                        {apt.hospitalName}
                      </span>
                    )}
                  </div>

                  <h3 className="font-extrabold text-base text-slate-900">{apt.patientName}</h3>
                  <p className="text-xs text-slate-500">
                    Phone: <strong className="text-slate-800">{apt.patientPhone}</strong> • Blood Group: {apt.patientBloodGroup || 'O+'}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-1">
                    <span className="font-bold text-[#1e40af]">
                      Doctor: {apt.doctorName} ({apt.doctorSpecialization})
                    </span>
                    <span>•</span>
                    <span>📅 {apt.date} at {apt.timeSlot}</span>
                    <span>•</span>
                    <span className="font-black text-slate-900">Fee: ₹{apt.consultationFee}</span>
                  </div>

                  <p className="text-xs text-slate-700 bg-slate-50 p-2 rounded-xl border border-slate-100 mt-1">
                    <strong>Patient Note:</strong> {apt.reasonForVisit}
                  </p>
                </div>
              </div>

              {/* Action Buttons: Approve, Reject, Reschedule, Assign Doctor */}
              <div className="flex flex-wrap items-center gap-2 lg:self-center shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                <button
                  onClick={() => setInspectApt(apt)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect</span>
                </button>

                {apt.status === 'Pending' && (
                  <>
                    <button
                      onClick={() => handleApprove(apt)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1 transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>

                    <button
                      onClick={() => setRejectingApt(apt)}
                      className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs flex items-center gap-1 transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </>
                )}

                {apt.status === 'Approved' && (
                  <button
                    onClick={() =>
                      updateStatus(apt.id, 'Completed', {
                        hospitalNotes: 'Consultation concluded and patient discharged with prescription.',
                      })
                    }
                    className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs flex items-center gap-1"
                  >
                    <span>Mark Completed</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setReassignApt(apt);
                    setSelectedDoctorId(apt.doctorId);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold flex items-center gap-1"
                  title="Assign a different doctor to this booking"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Reassign</span>
                </button>

                <button
                  onClick={() => {
                    setRescheduleApt(apt);
                    setReschedDate(apt.date);
                    setReschedSlot(apt.timeSlot);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reschedule</span>
                </button>

                <button
                  onClick={() => {
                    setDeleteModalApt(apt);
                    setDeleteReason('Cancelled by hospital clinical coordinator.');
                  }}
                  className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1 transition-colors"
                  title="Remove from active schedule (permanently retained in Records)"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectingApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">
                Reject Appointment ({rejectingApt.id})
              </h3>
              <button
                onClick={() => setRejectingApt(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-3 text-xs">
              <p className="text-slate-600">
                Provide a clinical explanation or schedule conflict note for {rejectingApt.patientName}:
              </p>
              <textarea
                required
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:border-red-500 outline-none"
              />

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setRejectingApt(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-md shadow-red-600/20"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REASSIGN DOCTOR MODAL */}
      {reassignApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">
                Assign Doctor ({reassignApt.id})
              </h3>
              <button
                onClick={() => setReassignApt(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReassignSubmit} className="space-y-3 text-xs">
              <p className="text-slate-600">
                Reassign <strong>{reassignApt.patientName}</strong> to another available specialist:
              </p>

              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-purple-600 outline-none bg-white font-medium"
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.specialization}) — {d.isAvailable ? 'Available' : 'On Leave'}
                  </option>
                ))}
              </select>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setReassignApt(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold shadow-md shadow-purple-700/20"
                >
                  Save Reassignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESCHEDULE MODAL */}
      {rescheduleApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">
                Reschedule Slot ({rescheduleApt.id})
              </h3>
              <button
                onClick={() => setRescheduleApt(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">New Consultation Date</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={reschedDate}
                  onChange={(e) => setReschedDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">New OPD Slot</label>
                <select
                  value={reschedSlot}
                  onChange={(e) => setReschedSlot(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-blue-600 outline-none bg-white"
                >
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="11:30 AM">11:30 AM</option>
                  <option value="02:00 PM">02:00 PM</option>
                  <option value="03:30 PM">03:30 PM</option>
                  <option value="05:00 PM">05:00 PM</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setRescheduleApt(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1e40af] hover:bg-blue-900 text-white rounded-xl font-bold"
                >
                  Update & Notify Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INSPECT MODAL */}
      {inspectApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-extrabold text-base text-slate-900">
                Patient Case Summary • {inspectApt.id}
              </span>
              <button onClick={() => setInspectApt(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block font-medium">Patient:</span>
                  <p className="font-bold text-slate-900">{inspectApt.patientName}</p>
                  <p className="text-[11px] text-slate-500">{inspectApt.patientPhone}</p>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Assigned Doctor:</span>
                  <p className="font-bold text-slate-900">{inspectApt.doctorName}</p>
                  <p className="text-[11px] text-blue-700">{inspectApt.doctorSpecialization}</p>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Slot:</span>
                  <p className="font-bold text-slate-900">
                    {inspectApt.date} at {inspectApt.timeSlot}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Status:</span>
                  <p className="font-black text-slate-900">{inspectApt.status}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-400 block font-medium">Reason for Visit:</span>
                <p className="text-slate-800 font-medium mt-0.5">{inspectApt.reasonForVisit}</p>
              </div>

              {inspectApt.additionalNotes && (
                <div>
                  <span className="text-slate-400 block font-medium">Additional Clinical Notes:</span>
                  <p className="text-slate-600 mt-0.5">{inspectApt.additionalNotes}</p>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={() => {
                  setDeleteModalApt(inspectApt);
                  setDeleteReason('Cancelled by hospital clinical coordinator.');
                }}
                className="text-xs text-rose-600 hover:underline font-bold flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete & Archive Booking</span>
              </button>

              <button
                onClick={() => setInspectApt(null)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE / CANCEL BOOKING MODAL (PERMANENTLY RETAINED IN RECORDS) */}
      {deleteModalApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600">
                <Trash2 className="w-5 h-5" />
                <h3 className="font-extrabold text-base text-slate-900">
                  Delete Booking ({deleteModalApt.id})
                </h3>
              </div>
              <button
                onClick={() => setDeleteModalApt(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <Archive className="w-4 h-4 text-amber-700" />
                Permanent Audit Record Notice:
              </p>
              <p className="text-[11px] leading-relaxed text-amber-800">
                This booking for <strong>{deleteModalApt.patientName}</strong> will be removed from your active appointments list, but <strong>will not be erased from the database</strong>. It is permanently retained in the Records section marked as <strong>Cancelled / Deleted by Hospital</strong> for full regulatory compliance.
              </p>
            </div>

            <form onSubmit={handleDeleteBookingSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Cancellation Reason / Clinical Note:
                </label>
                <textarea
                  required
                  rows={3}
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="e.g. Cancelled due to emergency doctor duty or patient reschedule request..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:border-rose-500 outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeleteModalApt(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                >
                  Keep Active
                </button>
                <button
                  type="submit"
                  disabled={deleteLoading}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-md shadow-rose-600/20 disabled:opacity-50"
                >
                  {deleteLoading ? 'Archiving...' : 'Confirm Delete & Archive'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
