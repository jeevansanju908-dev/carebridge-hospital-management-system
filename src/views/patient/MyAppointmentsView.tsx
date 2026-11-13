import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Calendar,
  Clock,
  Building2,
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  Eye,
  X,
  FileText,
  Trash2,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import type { Appointment, AppointmentStatus } from '../../types/index.js';

interface MyAppointmentsViewProps {
  initialTab?: string;
  onBookNew: () => void;
  onNavigateToRecords?: () => void;
}

const tabs: Array<{ id: string; label: string }> = [
  { id: 'All', label: 'All Active' },
  { id: 'Pending', label: 'Pending' },
  { id: 'Approved', label: 'Approved' },
  { id: 'Upcoming', label: 'Upcoming' },
  { id: 'Completed', label: 'Completed' },
  { id: 'Rejected', label: 'Rejected' },
  { id: 'Cancelled', label: 'Cancelled' },
];

export const MyAppointmentsView: React.FC<MyAppointmentsViewProps> = ({
  initialTab = 'All',
  onBookNew,
  onNavigateToRecords,
}) => {
  const { currentUser } = useAuth();
  const patient = currentUser as any;
  const patientId = patient?.id;

  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);
  const [rescheduleApt, setRescheduleApt] = useState<Appointment | null>(null);
  const [deleteConfirmApt, setDeleteConfirmApt] = useState<Appointment | null>(null);
  const [newDate, setNewDate] = useState('2026-11-20');
  const [newSlot, setNewSlot] = useState('11:00 AM');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAppointments = async () => {
    if (!patientId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`/api/appointments?patientId=${patientId}`);
      if (res.ok) {
        const data = await res.json();
        setAppointments(data);
      }
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    const interval = setInterval(fetchAppointments, 8000); // Polling for hospital approvals
    return () => clearInterval(interval);
  }, [patientId]);

  // Delete / Cancel Booking (Removes from active list, preserves in Records)
  const handleDeleteBooking = async (apt: Appointment) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/appointments/${apt.id}/patient-delete`, {
        method: 'PUT',
      });
      if (res.ok) {
        setAppointments((prev) => prev.filter((a) => a.id !== apt.id));
        setDeleteConfirmApt(null);
        setSelectedApt(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Reschedule Appointment
  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleApt) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/appointments/${rescheduleApt.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Rescheduled',
          newDate,
          newTimeSlot: newSlot,
          hospitalNotes: `Rescheduled by patient to ${newDate} at ${newSlot}.`,
        }),
      });
      if (res.ok) {
        fetchAppointments();
        setRescheduleApt(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter logic
  const filteredAppointments = appointments.filter((apt) => {
    if (activeTab === 'Upcoming') {
      if (apt.status !== 'Approved' && apt.status !== 'Pending' && apt.status !== 'Rescheduled') {
        return false;
      }
    } else if (activeTab !== 'All' && apt.status.toLowerCase() !== activeTab.toLowerCase()) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDoc = apt.doctorName.toLowerCase().includes(q);
      const matchHosp = apt.hospitalName.toLowerCase().includes(q);
      const matchId = apt.id.toLowerCase().includes(q);
      const matchReason = apt.reasonForVisit.toLowerCase().includes(q);
      if (!matchDoc && !matchHosp && !matchId && !matchReason) return false;
    }
    return true;
  });

  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Completed':
        return 'bg-sky-100 text-[#0284c7] border-sky-200';
      case 'Cancelled':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'Rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Rescheduled':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            My Appointments
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track all your scheduled visits, hospital approvals, and historical clinical consultations.
          </p>
        </div>

        <button
          onClick={onBookNew}
          className="px-5 py-2.5 bg-[#0284c7] hover:bg-sky-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-sky-600/20 flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <CalendarCheck className="w-4 h-4" />
          <span>Book New Visit</span>
        </button>
      </div>

      {/* Tabs and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        {/* Horizontal Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {tabs.map((tab) => {
            const count =
              tab.id === 'All'
                ? appointments.length
                : tab.id === 'Upcoming'
                ? appointments.filter(
                    (a) => a.status === 'Approved' || a.status === 'Pending' || a.status === 'Rescheduled'
                  ).length
                : appointments.filter((a) => a.status.toLowerCase() === tab.id.toLowerCase()).length;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-[#0284c7] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by doctor name, hospital, appointment ID, or reason..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:border-sky-500 outline-none"
          />
        </div>
      </div>

      {/* Appointments List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">Loading appointments...</div>
      ) : filteredAppointments.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 space-y-3">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No appointments in this category</h3>
          <p className="text-xs text-slate-500">
            {activeTab === 'All'
              ? 'You have not booked any appointments yet.'
              : `No appointments currently marked as ${activeTab}.`}
          </p>
          <button
            onClick={onBookNew}
            className="mt-2 px-4 py-2 bg-[#0284c7] text-white rounded-xl text-xs font-bold"
          >
            Book Appointment
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredAppointments.map((apt) => (
            <div
              key={apt.id}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <img
                  src={apt.doctorAvatar}
                  alt={apt.doctorName}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-100 shrink-0"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusBadge(
                        apt.status
                      )}`}
                    >
                      ● {apt.status}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">ID: {apt.id}</span>
                  </div>

                  <h3 className="font-extrabold text-base text-slate-900">{apt.doctorName}</h3>
                  <p className="text-xs font-semibold text-[#0284c7]">
                    {apt.doctorSpecialization} • {apt.hospitalName}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {apt.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {apt.timeSlot}
                    </span>
                    <span className="font-bold text-slate-800">Fee: ₹{apt.consultationFee}</span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-1 pt-0.5">
                    <strong>Reason:</strong> {apt.reasonForVisit}
                  </p>
                </div>
              </div>

              {/* Action Buttons: View Details, Cancel, Reschedule */}
              <div className="flex flex-wrap items-center gap-2 md:self-center shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                <button
                  onClick={() => setSelectedApt(apt)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Details</span>
                </button>

                {apt.status !== 'Cancelled' && apt.status !== 'Completed' && (
                  <button
                    onClick={() => {
                      setRescheduleApt(apt);
                      setNewDate(apt.date);
                      setNewSlot(apt.timeSlot);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#0284c7] border border-sky-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reschedule</span>
                  </button>
                )}

                <button
                  onClick={() => setDeleteConfirmApt(apt)}
                  className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  title="Remove from active appointments"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Booking</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* APPOINTMENT DETAILS MODAL */}
      {selectedApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-slate-900">Appointment Details</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                    selectedApt.status
                  )}`}
                >
                  {selectedApt.status}
                </span>
              </div>
              <button
                onClick={() => setSelectedApt(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-400">Appointment ID:</span>
                <span className="font-bold font-mono text-[#0284c7] text-sm">{selectedApt.id}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block">Doctor:</span>
                  <p className="font-bold text-slate-900">{selectedApt.doctorName}</p>
                  <p className="text-[11px] text-[#0284c7]">{selectedApt.doctorSpecialization}</p>
                </div>
                <div>
                  <span className="text-slate-400 block">Hospital Facility:</span>
                  <p className="font-bold text-slate-900">{selectedApt.hospitalName}</p>
                </div>
                <div>
                  <span className="text-slate-400 block">Scheduled Date & Time:</span>
                  <p className="font-bold text-slate-900">
                    {selectedApt.date} at {selectedApt.timeSlot}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 block">Consultation Fee:</span>
                  <p className="font-bold text-slate-900">₹{selectedApt.consultationFee}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-400 block">Reason for Visit:</span>
                <p className="font-medium text-slate-800 mt-0.5">{selectedApt.reasonForVisit}</p>
              </div>

              {selectedApt.additionalNotes && (
                <div>
                  <span className="text-slate-400 block">Patient Additional Notes:</span>
                  <p className="text-slate-600 mt-0.5">{selectedApt.additionalNotes}</p>
                </div>
              )}

              {selectedApt.hospitalNotes && (
                <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-200 text-blue-900">
                  <span className="font-bold block text-[11px]">Hospital Desk Feedback:</span>
                  <p className="mt-0.5 text-xs">{selectedApt.hospitalNotes}</p>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setSelectedApt(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESCHEDULE MODAL */}
      {rescheduleApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">
                Reschedule Appointment ({rescheduleApt.id})
              </h3>
              <button
                onClick={() => setRescheduleApt(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">New Consultation Date</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-sky-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">New Time Slot</label>
                <select
                  value={newSlot}
                  onChange={(e) => setNewSlot(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-sky-500 outline-none bg-white"
                >
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="11:30 AM">11:30 AM</option>
                  <option value="02:00 PM">02:00 PM</option>
                  <option value="03:30 PM">03:30 PM</option>
                  <option value="05:00 PM">05:00 PM</option>
                </select>
              </div>

              <div className="p-3 bg-sky-50 rounded-xl text-sky-900 border border-sky-100 text-[11px]">
                Upon submission, the hospital coordinator is immediately notified with the new requested slot.
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
                  disabled={actionLoading}
                  className="px-5 py-2 bg-[#0284c7] hover:bg-sky-700 text-white rounded-xl font-bold shadow-md shadow-sky-600/20 disabled:opacity-50"
                >
                  {actionLoading ? 'Updating...' : 'Confirm Reschedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE / CANCEL BOOKING CONFIRMATION MODAL */}
      {deleteConfirmApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-xs">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-slate-900">
                Delete Booking from Active List?
              </h3>
              <p className="text-xs text-slate-500">
                Booking <strong className="text-slate-800 font-mono">{deleteConfirmApt.id}</strong> with {deleteConfirmApt.doctorName} will be removed from your active appointments.
              </p>
            </div>

            <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5 text-left">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Permanent Records Protected:</strong> This booking will not be deleted from the database. It will remain permanently available with status <strong>"Cancelled"</strong> under the <strong>Health Records</strong> section.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setDeleteConfirmApt(null)}
                className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold text-xs transition-colors"
              >
                Keep Booking
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleDeleteBooking(deleteConfirmApt)}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs shadow-md shadow-red-600/25 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{actionLoading ? 'Removing...' : 'Delete from Active List'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
