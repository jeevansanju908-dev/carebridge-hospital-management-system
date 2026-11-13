import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Eye,
  Plus,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Pill,
  Droplet,
  FolderLock,
  X,
  Calendar,
  Clock,
  Bell,
  History,
  Archive,
  User,
  Building2,
  CheckCheck,
  AlertCircle,
  Activity,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import type { HealthDocument, Appointment, AppNotification } from '../../types/index.js';

interface HealthRecordsViewProps {
  onBackToDashboard?: () => void;
}

const docTypes = [
  'All',
  'Prescription',
  'Lab Report',
  'Blood Report',
  'X-Ray',
  'Scan Report',
  'Medical Document',
] as const;

export const HealthRecordsView: React.FC<HealthRecordsViewProps> = () => {
  const { currentUser, userRole } = useAuth();
  const entity = currentUser as any;
  const entityId = entity?.id || '';

  const [primaryTab, setPrimaryTab] = useState<'documents' | 'appointments' | 'notifications'>('documents');
  const [documents, setDocuments] = useState<HealthDocument[]>([]);
  const [appointmentRecords, setAppointmentRecords] = useState<Appointment[]>([]);
  const [notificationRecords, setNotificationRecords] = useState<AppNotification[]>([]);
  const [selectedType, setSelectedType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Appointment Records Filter
  const [aptStatusFilter, setAptStatusFilter] = useState<string>('All');
  const [notifFilter, setNotifFilter] = useState<'All' | 'Active' | 'Archived'>('All');

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [viewDoc, setViewDoc] = useState<HealthDocument | null>(null);
  const [selectedAptDetails, setSelectedAptDetails] = useState<Appointment | null>(null);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<HealthDocument['type']>('Lab Report');
  const [newDoctor, setNewDoctor] = useState('');
  const [newHospital, setNewHospital] = useState(
    userRole === 'hospital' ? entity?.hospitalName || '' : ''
  );
  const [newSummary, setNewSummary] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);

  // Clinical profile data
  const currentMedications = [
    { name: 'CoQ10 100mg', dosage: '1 tablet daily after food', reason: 'Preventive Cardiac' },
    { name: 'Vitamin D3 60,000 IU', dosage: '1 capsule monthly', reason: 'Immune & Bone Health' },
    { name: 'Levocetirizine 5mg (SOS)', dosage: 'As needed for seasonal rhinitis', reason: 'Antihistamine' },
  ];

  const knownAllergies = ['Penicillin (Moderate Rash)', 'Dust Mite Allergen (Mild Sneezing)'];

  const fetchRecords = async () => {
    if (!entityId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const isHospital = userRole === 'hospital';
      const docUrl = isHospital ? `/api/records/all` : `/api/records/${entityId}`;
      const aptUrl = isHospital
        ? `/api/appointments/records?scope=all`
        : `/api/appointments/records?patientId=${entityId}`;
      const notifUrl = `/api/notifications/records?userId=${entityId}&role=${userRole}`;

      const [docRes, aptRes, notifRes] = await Promise.all([
        fetch(docUrl),
        fetch(aptUrl),
        fetch(notifUrl),
      ]);

      if (docRes.ok) {
        const docData = await docRes.json();
        setDocuments(Array.isArray(docData) ? docData : []);
      }
      if (aptRes.ok) {
        const aptData = await aptRes.json();
        setAppointmentRecords(Array.isArray(aptData) ? aptData : []);
      }
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setNotificationRecords(Array.isArray(notifData) ? notifData : []);
      }
    } catch (e) {
      console.warn('Error loading health records:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [entityId, userRole]);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setUploadLoading(true);
    try {
      const res = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: entityId,
          title: newTitle,
          type: newType,
          doctorName: newDoctor,
          hospitalName: newHospital,
          summary: newSummary || 'Archived patient health record.',
          fileSize: '1.4 MB',
        }),
      });

      if (res.ok) {
        setShowUploadModal(false);
        setNewTitle('');
        setNewSummary('');
        fetchRecords();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDeleteDoc = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${title}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/records/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== id));
        if (viewDoc?.id === id) setViewDoc(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownload = (doc: HealthDocument) => {
    const content = `CareBridge Health Document\nTitle: ${doc.title}\nType: ${doc.type}\nDoctor: ${doc.doctorName}\nHospital: ${doc.hospitalName}\nDate: ${doc.date}\nClinical Summary: ${doc.summary || 'Verified Document'}\nEncrypted Storage ID: ${doc.id}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${doc.title.replace(/\s+/g, '_')}_CareBridge.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Filter Documents
  const filteredDocs = documents.filter((doc) => {
    if (selectedType !== 'All' && doc.type !== selectedType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const mTitle = doc.title.toLowerCase().includes(q);
      const mType = doc.type.toLowerCase().includes(q);
      const mDoc = (doc.doctorName || '').toLowerCase().includes(q);
      if (!mTitle && !mType && !mDoc) return false;
    }
    return true;
  });

  // Filter Appointment Records (Includes Active, Completed, Cancelled, Deleted)
  const filteredAppointments = appointmentRecords.filter((apt) => {
    if (aptStatusFilter !== 'All') {
      if (aptStatusFilter === 'Cancelled') {
        const isCancelled =
          apt.status === 'Cancelled' ||
          apt.status === 'Deleted' ||
          apt.isDeletedByPatient ||
          apt.isDeletedByHospital;
        if (!isCancelled) return false;
      } else if (apt.status.toLowerCase() !== aptStatusFilter.toLowerCase()) {
        return false;
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const mDoc = apt.doctorName.toLowerCase().includes(q);
      const mPat = apt.patientName.toLowerCase().includes(q);
      const mHosp = (apt.hospitalName || '').toLowerCase().includes(q);
      const mId = apt.id.toLowerCase().includes(q);
      if (!mDoc && !mPat && !mHosp && !mId) return false;
    }

    return true;
  });

  // Filter Notification Records
  const filteredNotifications = notificationRecords.filter((notif) => {
    if (notifFilter === 'Active' && notif.isDeleted) return false;
    if (notifFilter === 'Archived' && !notif.isDeleted) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const mTitle = notif.title.toLowerCase().includes(q);
      const mMsg = notif.message.toLowerCase().includes(q);
      if (!mTitle && !mMsg) return false;
    }

    return true;
  });

  const cancelledCount = appointmentRecords.filter(
    (a) => a.status === 'Cancelled' || a.isDeletedByPatient || a.isDeletedByHospital
  ).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {userRole === 'hospital' ? 'Facility Health & Booking Records' : 'Personal Health & Audit Records'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Permanent archive of clinical documents, complete booking history, and system audit trails.
          </p>
        </div>

        {primaryTab === 'documents' && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-5 py-2.5 bg-[#0284c7] hover:bg-sky-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-sky-600/20 flex items-center gap-2 self-start sm:self-auto transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Medical Document</span>
          </button>
        )}
      </div>

      {/* Primary Tab Navigation */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => {
            setPrimaryTab('documents');
            setSearchQuery('');
          }}
          className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            primaryTab === 'documents'
              ? 'bg-[#0284c7] text-white shadow-md shadow-sky-600/20'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Clinical Documents</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              primaryTab === 'documents' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {documents.length}
          </span>
        </button>

        <button
          onClick={() => {
            setPrimaryTab('appointments');
            setSearchQuery('');
          }}
          className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            primaryTab === 'appointments'
              ? 'bg-[#0284c7] text-white shadow-md shadow-sky-600/20'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Booking Records & History</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              primaryTab === 'appointments' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {appointmentRecords.length}
          </span>
        </button>

        <button
          onClick={() => {
            setPrimaryTab('notifications');
            setSearchQuery('');
          }}
          className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            primaryTab === 'notifications'
              ? 'bg-[#0284c7] text-white shadow-md shadow-sky-600/20'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Notification Audit History</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              primaryTab === 'notifications' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {notificationRecords.length}
          </span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: CLINICAL DOCUMENTS                                 */}
      {/* ======================================================== */}
      {primaryTab === 'documents' && (
        <div className="space-y-6">
          {/* Clinical Summary Cards (Medications, Allergies, Blood Group) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Blood Group & Patient Info */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Droplet className="w-7 h-7 fill-red-600" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Blood Group Profile
                </span>
                <h3 className="text-2xl font-black text-slate-900">{entity?.bloodGroup || 'O+'}</h3>
                <p className="text-[11px] text-slate-500">Universal Donor Profile</p>
              </div>
            </div>

            {/* Current Medications */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center gap-2">
                <Pill className="w-4 h-4 text-[#0284c7]" />
                <span className="text-xs font-bold text-slate-900">Current Medications (3)</span>
              </div>
              <div className="space-y-1 text-xs text-slate-600">
                {currentMedications.slice(0, 2).map((m, idx) => (
                  <p key={idx} className="truncate">
                    • <strong>{m.name}</strong> - {m.dosage}
                  </p>
                ))}
                <span className="text-[10px] text-slate-400 font-medium">+1 additional medication</span>
              </div>
            </div>

            {/* Allergies */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold text-slate-900">Known Clinical Allergies</span>
              </div>
              <div className="space-y-1 text-xs text-slate-600">
                {knownAllergies.map((allg, idx) => (
                  <p key={idx} className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md text-[11px] truncate">
                    ⚠️ {allg}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
              {docTypes.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedType(t)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                    selectedType === t
                      ? 'bg-[#0284c7] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents by title, doctor, or test type..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:border-sky-500 outline-none"
              />
            </div>
          </div>

          {/* Document Records Grid */}
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs">Loading health vault records...</div>
          ) : filteredDocs.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 space-y-3">
              <FolderLock className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No medical documents found</h3>
              <p className="text-xs text-slate-500">Upload lab reports, prescriptions, or radiological scans.</p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="mt-2 px-4 py-2 bg-[#0284c7] text-white rounded-xl text-xs font-bold"
              >
                Upload Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {doc.type}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1">
                      <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-[#0284c7] transition-colors line-clamp-2">
                        {doc.title}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {doc.doctorName} • {doc.hospitalName}
                      </p>
                      <p className="text-[11px] text-slate-400">📅 {doc.date} • {doc.fileSize}</p>
                    </div>

                    {doc.summary && (
                      <p className="text-xs text-slate-600 line-clamp-2 mt-2 pt-2 border-t border-slate-100">
                        {doc.summary}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setViewDoc(doc)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleDownload(doc)}
                        className="p-1.5 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
                        title="Download document record"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteDoc(doc.id, doc.title)}
                        className="p-1.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: BOOKING RECORDS & PERMANENT HISTORY                */}
      {/* ======================================================== */}
      {primaryTab === 'appointments' && (
        <div className="space-y-6">
          {/* Policy Information Box */}
          <div className="bg-sky-50/80 border border-sky-200 rounded-3xl p-5 flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#0284c7] text-white flex items-center justify-center shrink-0">
              <Archive className="w-5 h-5" />
            </div>
            <div className="space-y-1 text-xs text-slate-700">
              <h4 className="font-extrabold text-sm text-[#0284c7]">
                Permanent Clinical Booking Archive
              </h4>
              <p>
                In compliance with medical record guidelines, appointments cancelled or deleted from the active queue
                are <strong>never permanently erased</strong> from the database. All booking histories, doctor consultations,
                fees, and timestamps are safely preserved here for patient reference and clinical audits.
              </p>
            </div>
          </div>

          {/* Status & Search Filter */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-3.5">
            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
              {['All', 'Approved', 'Pending', 'Completed', 'Cancelled'].map((st) => (
                <button
                  key={st}
                  onClick={() => setAptStatusFilter(st)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    aptStatusFilter === st
                      ? 'bg-[#0284c7] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{st === 'Cancelled' ? 'Cancelled / Deleted' : st}</span>
                  {st === 'Cancelled' && cancelledCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-100 text-red-700 font-black">
                      {cancelledCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search booking records by doctor, hospital, patient, or Reference ID..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:border-sky-500 outline-none"
              />
            </div>
          </div>

          {/* Bookings Records List */}
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs">Loading booking archives...</div>
          ) : filteredAppointments.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 space-y-2">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No booking records found</h3>
              <p className="text-xs text-slate-500">
                {aptStatusFilter === 'All'
                  ? 'No past or archived appointments recorded.'
                  : `No appointments found under "${aptStatusFilter}".`}
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredAppointments.map((apt) => {
                const isCancelled =
                  apt.status === 'Cancelled' ||
                  apt.status === 'Deleted' ||
                  apt.isDeletedByPatient ||
                  apt.isDeletedByHospital;

                return (
                  <div
                    key={apt.id}
                    className={`bg-white rounded-3xl p-5 border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                      isCancelled
                        ? 'border-slate-200 bg-slate-50/70 opacity-95'
                        : 'border-slate-200/80 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black shrink-0 ${
                          isCancelled
                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                            : apt.status === 'Approved'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : apt.status === 'Completed'
                            ? 'bg-sky-100 text-[#0284c7] border border-sky-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {isCancelled ? (
                          <X className="w-5 h-5 stroke-[2.5]" />
                        ) : (
                          <Calendar className="w-5 h-5" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                              isCancelled
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : apt.status === 'Approved'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : apt.status === 'Completed'
                                ? 'bg-sky-50 text-sky-700 border-sky-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            ● {isCancelled ? 'Cancelled / Archived in Records' : apt.status}
                          </span>

                          <span className="text-[11px] font-mono text-slate-400 font-bold">
                            Ref: {apt.id}
                          </span>

                          {apt.isDeletedByPatient && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                              Removed from Patient Queue
                            </span>
                          )}

                          {apt.isDeletedByHospital && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700">
                              Removed from Hospital Queue
                            </span>
                          )}
                        </div>

                        <h3 className="font-extrabold text-base text-slate-900">
                          {apt.doctorName}
                          <span className="text-xs font-semibold text-slate-500 ml-2">
                            ({apt.doctorSpecialization})
                          </span>
                        </h3>

                        <p className="text-xs text-slate-600 flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{apt.hospitalName}</span>
                          <span>•</span>
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>Patient: {apt.patientName}</span>
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-1">
                          <span className="font-medium">📅 Date: <strong>{apt.date}</strong> at <strong>{apt.timeSlot}</strong></span>
                          <span>•</span>
                          <span>Consultation Fee: <strong className="text-slate-900">₹{apt.consultationFee}</strong></span>
                          {apt.deletedAt && (
                            <>
                              <span>•</span>
                              <span className="text-rose-600 font-medium">
                                Archived on: {new Date(apt.deletedAt).toLocaleDateString()}
                              </span>
                            </>
                          )}
                        </div>

                        <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 mt-2">
                          <p><strong>Reason for Visit:</strong> {apt.reasonForVisit}</p>
                          {apt.hospitalNotes && (
                            <p className="text-slate-500 mt-1 pt-1 border-t border-slate-100">
                              <strong>Clinical/Cancellation Notes:</strong> {apt.hospitalNotes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 lg:self-center shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-200">
                      <button
                        onClick={() => setSelectedAptDetails(apt)}
                        className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-white text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Audit Details</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: NOTIFICATION AUDIT HISTORY                         */}
      {/* ======================================================== */}
      {primaryTab === 'notifications' && (
        <div className="space-y-6">
          {/* Policy Information Box */}
          <div className="bg-slate-100 border border-slate-200 rounded-3xl p-5 flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-slate-800 text-white flex items-center justify-center shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div className="space-y-1 text-xs text-slate-700">
              <h4 className="font-extrabold text-sm text-slate-900">
                Notification Audit History
              </h4>
              <p>
                Clearing notifications removes them from your live alert badge and active notification feed,
                while retaining this comprehensive audit record. Deleting notifications <strong>does not alter or delete</strong> any
                clinical appointment records or health reports.
              </p>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
              {(['All', 'Active', 'Archived'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setNotifFilter(filter)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                    notifFilter === filter
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {filter === 'Archived' ? 'Archived / Cleared' : filter}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notification messages or titles..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:border-slate-800 outline-none"
              />
            </div>
          </div>

          {/* Notifications List */}
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs">Loading notification records...</div>
          ) : filteredNotifications.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 space-y-2">
              <Bell className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No notification logs found</h3>
              <p className="text-xs text-slate-500">All alerts and actions will be audited here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                    notif.isDeleted
                      ? 'bg-slate-50 border-slate-200/80 text-slate-600'
                      : 'bg-white border-slate-200 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        notif.type === 'emergency'
                          ? 'bg-red-100 text-red-600'
                          : notif.type === 'appointment_status'
                          ? 'bg-emerald-100 text-emerald-600'
                          : 'bg-sky-100 text-[#0284c7]'
                      }`}
                    >
                      {notif.type === 'emergency' ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : notif.type === 'appointment_status' ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Calendar className="w-4 h-4" />
                      )}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-extrabold text-slate-900">{notif.title}</h4>
                        {notif.isDeleted && (
                          <span className="px-2 py-0.2 rounded-full text-[9px] font-bold bg-slate-200 text-slate-700">
                            Archived Record
                          </span>
                        )}
                        {!notif.isRead && !notif.isDeleted && (
                          <span className="w-2 h-2 rounded-full bg-[#0284c7]" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>
                      <p className="text-[10px] text-slate-400 pt-1 flex items-center gap-2">
                        <span>Created: {new Date(notif.createdAt).toLocaleString()}</span>
                        {notif.deletedAt && (
                          <span>• Archived: {new Date(notif.deletedAt).toLocaleString()}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-slate-400 font-bold shrink-0">
                    ID: {notif.id}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODALS                                                   */}
      {/* ======================================================== */}

      {/* UPLOAD DOCUMENT MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">Upload Health Document</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Complete Lipid Profile Test"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-sky-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Document Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-sky-500 outline-none bg-white font-medium"
                >
                  <option value="Prescription">Prescription</option>
                  <option value="Lab Report">Lab Report</option>
                  <option value="Blood Report">Blood Report</option>
                  <option value="X-Ray">X-Ray</option>
                  <option value="Scan Report">Scan Report</option>
                  <option value="Medical Document">Medical Document</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Doctor Name</label>
                  <input
                    type="text"
                    value={newDoctor}
                    onChange={(e) => setNewDoctor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-sky-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hospital / Lab</label>
                  <input
                    type="text"
                    value={newHospital}
                    onChange={(e) => setNewHospital(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-sky-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Clinical Findings / Summary</label>
                <textarea
                  rows={3}
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  placeholder="Enter diagnosis findings or report notes..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:border-sky-500 outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadLoading}
                  className="px-5 py-2 bg-[#0284c7] hover:bg-sky-700 text-white rounded-xl font-bold shadow-md shadow-sky-600/20 disabled:opacity-50"
                >
                  {uploadLoading ? 'Uploading...' : 'Save to Health Vault'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW DOCUMENT MODAL */}
      {viewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-slate-900">{viewDoc.title}</span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-100 text-[#0284c7]">
                  {viewDoc.type}
                </span>
              </div>
              <button onClick={() => setViewDoc(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block font-medium">Physician:</span>
                  <p className="font-bold text-slate-900">{viewDoc.doctorName}</p>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Hospital Facility:</span>
                  <p className="font-bold text-slate-900">{viewDoc.hospitalName}</p>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Date Archived:</span>
                  <p className="font-bold text-slate-900">{viewDoc.date}</p>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">File Size:</span>
                  <p className="font-bold text-slate-900">{viewDoc.fileSize}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-400 block font-medium">Clinical Report Summary:</span>
                <p className="text-slate-800 leading-relaxed mt-1">{viewDoc.summary}</p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={() => handleDeleteDoc(viewDoc.id, viewDoc.title)}
                className="text-xs text-red-600 hover:underline font-bold"
              >
                Delete Record
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(viewDoc)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => setViewDoc(null)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* APPOINTMENT DETAILS MODAL */}
      {selectedAptDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-slate-900">
                  Booking Audit Log • {selectedAptDetails.id}
                </span>
              </div>
              <button onClick={() => setSelectedAptDetails(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block font-medium">Patient:</span>
                  <p className="font-bold text-slate-900">{selectedAptDetails.patientName}</p>
                  <p className="text-[11px] text-slate-500">{selectedAptDetails.patientPhone}</p>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Doctor:</span>
                  <p className="font-bold text-slate-900">{selectedAptDetails.doctorName}</p>
                  <p className="text-[11px] text-[#0284c7]">{selectedAptDetails.doctorSpecialization}</p>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Consultation Slot:</span>
                  <p className="font-bold text-slate-900">{selectedAptDetails.date} at {selectedAptDetails.timeSlot}</p>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Current Status:</span>
                  <p className="font-black text-slate-900">{selectedAptDetails.status}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-400 block font-medium">Reason for Visit:</span>
                <p className="text-slate-800 mt-0.5">{selectedAptDetails.reasonForVisit}</p>
              </div>

              {selectedAptDetails.hospitalNotes && (
                <div>
                  <span className="text-slate-400 block font-medium">Hospital Notes / Cancellation Details:</span>
                  <p className="text-slate-700 bg-white p-2 rounded-xl border border-slate-200 mt-1">
                    {selectedAptDetails.hospitalNotes}
                  </p>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 space-y-1">
                <p>• Booked at: {new Date(selectedAptDetails.createdAt).toLocaleString()}</p>
                {selectedAptDetails.deletedAt && (
                  <p className="text-rose-600">• Removed from active schedule at: {new Date(selectedAptDetails.deletedAt).toLocaleString()}</p>
                )}
                <p>• Database Sync: Permanently preserved in shared database.</p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                onClick={() => setSelectedAptDetails(null)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
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
