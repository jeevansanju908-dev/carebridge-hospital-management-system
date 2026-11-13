import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  User,
  Phone,
  Mail,
  Calendar,
  Droplet,
  FileText,
  Clock,
  ShieldCheck,
  CheckCircle,
  X,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface PatientRecord {
  id: string;
  fullName: string;
  email: string;
  mobile: string;
  dob: string;
  gender: string;
  bloodGroup: string;
  address: string;
  appointmentCount: number;
  lastVisit: string;
  status: string;
}

export const HospitalPatientManagementView: React.FC = () => {
  const { currentUser } = useAuth();
  const hospital = currentUser as any;
  const hospitalId = hospital?.id;

  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);

  const fetchPatients = async () => {
    if (!hospitalId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`/api/hospital/patients?hospitalId=${hospitalId}&scope=all`);
      if (res.ok) {
        const data = await res.json();
        setPatients(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [hospitalId]);

  const filteredPatients = patients.filter((p) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const mName = p.fullName.toLowerCase().includes(q);
      const mMail = p.email.toLowerCase().includes(q);
      const mPhone = p.mobile.includes(q);
      if (!mName && !mMail && !mPhone) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Patient Directory & Clinical Profiles
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Registered patients who have booked appointments with hospital clinical staff.
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patient name, phone number, or email..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:border-blue-600 outline-none"
          />
        </div>
      </div>

      {/* Patient Cards */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">Loading patient directory...</div>
      ) : filteredPatients.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 space-y-3">
          <Users className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No patients found</h3>
          <p className="text-xs text-slate-500">Patients will appear here automatically when they book consultations.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-900 font-black flex items-center justify-center text-sm shrink-0 border border-blue-200">
                      {p.fullName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900">{p.fullName}</h3>
                      <p className="text-xs text-slate-500">{p.gender} • DOB: {p.dob}</p>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                    {p.bloodGroup}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2 text-[11px]">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{p.mobile}</span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px]">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{p.email}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-slate-400 font-medium">Booked Visits:</span>
                    <span className="font-bold text-slate-900">{p.appointmentCount}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">Last Scheduled Visit:</span>
                    <span className="font-semibold text-slate-800 truncate">{p.lastVisit}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono">ID: {p.id}</span>
                <button
                  onClick={() => setSelectedPatient(p)}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold transition-colors"
                >
                  View Health Dossier
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PATIENT DETAIL MODAL */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-extrabold text-base text-slate-900">
                Authorized Clinical Patient Dossier
              </span>
              <button
                onClick={() => setSelectedPatient(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-900 font-black flex items-center justify-center text-sm">
                  {selectedPatient.fullName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">{selectedPatient.fullName}</h4>
                  <p className="text-xs text-slate-500">CareBridge Health ID: {selectedPatient.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <span className="text-slate-400 block font-medium">Contact Mobile:</span>
                  <p className="font-bold text-slate-900">{selectedPatient.mobile}</p>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Email:</span>
                  <p className="font-bold text-slate-900">{selectedPatient.email}</p>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Blood Group:</span>
                  <p className="font-black text-red-600">{selectedPatient.bloodGroup}</p>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Gender & DOB:</span>
                  <p className="font-bold text-slate-900">
                    {selectedPatient.gender} • {selectedPatient.dob}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-400 block font-medium">Residential Address:</span>
                <p className="text-slate-800 mt-0.5">{selectedPatient.address || 'Bengaluru, Karnataka'}</p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                onClick={() => setSelectedPatient(null)}
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
