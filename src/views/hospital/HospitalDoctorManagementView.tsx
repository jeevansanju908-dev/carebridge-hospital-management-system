import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  DollarSign,
  GraduationCap,
  Star,
  Building2,
  X,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import type { Doctor, MedicalSpecialty } from '../../types/index.js';

const specialties: MedicalSpecialty[] = [
  'Cardiologist',
  'Neurologist',
  'Dermatologist',
  'General Physician',
  'Orthopedic',
  'Pediatrician',
  'Gynecologist',
  'Dentist',
  'ENT Specialist',
  'Ophthalmologist',
  'Emergency Medicine',
  'Oncologist',
];

export const HospitalDoctorManagementView: React.FC = () => {
  const { currentUser } = useAuth();
  const hospital = currentUser as any;
  const hospitalId = hospital?.id;

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('All');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    qualification: '',
    specialization: 'General Physician' as MedicalSpecialty,
    experienceYears: 8,
    consultationFee: 750,
    about: '',
    isAvailable: true,
  });

  const fetchDoctors = async () => {
    if (!hospitalId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`/api/doctors?hospitalId=${hospitalId}`);
      if (res.ok) {
        const data = await res.json();
        setDoctors(data);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [hospitalId]);

  // Toggle Doctor Availability (Available <-> On Leave)
  const toggleAvailability = async (doc: Doctor) => {
    try {
      const res = await fetch(`/api/doctors/${doc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !doc.isAvailable }),
      });
      if (res.ok) {
        setDoctors((prev) =>
          prev.map((d) => (d.id === doc.id ? { ...d, isAvailable: !d.isAvailable } : d))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Doctor
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospitalId) return;
    try {
      const res = await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          hospitalId,
          hospitalName: hospital?.hospitalName || '',
        }),
      });
      if (res.ok) {
        setShowAddModal(false);
        fetchDoctors();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Edit Doctor
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoctor) return;
    try {
      const res = await fetch(`/api/doctors/${editingDoctor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setEditingDoctor(null);
        fetchDoctors();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Doctor
  const handleDelete = async (doc: Doctor) => {
    if (!confirm(`Are you sure you want to remove ${doc.name} from the hospital staff?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/doctors/${doc.id}`, { method: 'DELETE' });
      if (res.ok) {
        setDoctors((prev) => prev.filter((d) => d.id !== doc.id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openEditModal = (doc: Doctor) => {
    setEditingDoctor(doc);
    setFormData({
      name: doc.name,
      qualification: doc.qualification,
      specialization: doc.specialization,
      experienceYears: doc.experienceYears,
      consultationFee: doc.consultationFee,
      about: doc.about,
      isAvailable: doc.isAvailable,
    });
  };

  const filteredDoctors = doctors.filter((doc) => {
    if (specialtyFilter !== 'All' && doc.specialization !== specialtyFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const mName = doc.name.toLowerCase().includes(q);
      const mSpec = doc.specialization.toLowerCase().includes(q);
      if (!mName && !mSpec) return false;
    }
    return true;
  });

  const availableCount = doctors.filter((d) => d.isAvailable).length;
  const onLeaveCount = doctors.filter((d) => !d.isAvailable).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Doctor Roster Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Maintain clinical faculty, assign specialties, update consultation fees, and toggle OPD availability.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              name: '',
              qualification: 'MBBS, MD',
              specialization: 'General Physician',
              experienceYears: 6,
              consultationFee: 700,
              about: 'Experienced clinical specialist committed to patient health outcomes.',
              isAvailable: true,
            });
            setShowAddModal(true);
          }}
          className="px-5 py-2.5 bg-[#0284c7] hover:bg-sky-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-sky-600/20 flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Doctor</span>
        </button>
      </div>

      {/* Roster Balance Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Total Faculty</span>
            <p className="text-2xl font-black text-slate-900">{doctors.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            {doctors.length}
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-emerald-600 uppercase">Available In OPD</span>
            <p className="text-2xl font-black text-emerald-600">{availableCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            {availableCount}
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-amber-600 uppercase">On Academic/Clinical Leave</span>
            <p className="text-2xl font-black text-amber-600">{onLeaveCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            {onLeaveCount}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by doctor name or qualification..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:border-sky-500 outline-none"
          />
        </div>

        <select
          value={specialtyFilter}
          onChange={(e) => setSpecialtyFilter(e.target.value)}
          className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:border-sky-500 outline-none bg-white font-medium w-full sm:w-auto"
        >
          <option value="All">All Specialties</option>
          {specialties.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Doctor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDoctors.map((doc) => (
          <div
            key={doc.id}
            className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {doc.avatar ? (
                    <img
                      src={doc.avatar}
                      alt={doc.name}
                      className="w-14 h-14 rounded-2xl object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-sky-100 text-[#0284c7] font-black text-base flex items-center justify-center border border-sky-200">
                      {doc.name.replace(/^Dr\.\s*/i, '').slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">{doc.name}</h3>
                    <p className="text-xs font-semibold text-[#0284c7]">{doc.specialization}</p>
                    <p className="text-[11px] text-slate-400">{doc.qualification}</p>
                  </div>
                </div>

                <button
                  onClick={() => toggleAvailability(doc)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                    doc.isAvailable
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                  }`}
                  title="Click to toggle availability"
                >
                  {doc.isAvailable ? '● Available' : 'On Leave'}
                </button>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Experience:</span>
                  <span className="font-bold text-slate-800">{doc.experienceYears} Years</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Consultation Fee:</span>
                  <span className="font-black text-slate-900">₹{doc.consultationFee}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Rating:</span>
                  <span className="font-bold text-amber-600 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    {doc.rating} ({doc.reviewsCount})
                  </span>
                </div>
              </div>
            </div>

            {/* Actions: Edit, Toggle, Delete */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                onClick={() => toggleAvailability(doc)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Mark {doc.isAvailable ? 'On Leave' : 'Available'}
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => openEditModal(doc)}
                  className="p-1.5 rounded-xl text-[#0284c7] hover:bg-sky-50 transition-colors"
                  title="Edit doctor details"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(doc)}
                  className="p-1.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
                  title="Remove doctor"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ADD / EDIT MODAL */}
      {(showAddModal || editingDoctor) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">
                {editingDoctor ? `Edit ${editingDoctor.name}` : 'Add New Clinical Specialist'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingDoctor(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={editingDoctor ? handleEditSubmit : handleAddSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Doctor Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Dr. Ramesh Kumar"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-sky-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Specialization</label>
                  <select
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-sky-500 outline-none bg-white font-medium"
                  >
                    {specialties.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Qualifications</label>
                  <input
                    type="text"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    placeholder="MBBS, MD, FRCP"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-sky-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Experience (Years)</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={formData.experienceYears}
                    onChange={(e) => setFormData({ ...formData, experienceYears: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Consultation Fee (₹)</label>
                  <input
                    type="number"
                    min={200}
                    max={5000}
                    step={50}
                    value={formData.consultationFee}
                    onChange={(e) => setFormData({ ...formData, consultationFee: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-sky-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">About & Clinical Focus</label>
                <textarea
                  rows={3}
                  value={formData.about}
                  onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                  placeholder="Doctor bio, special interest, clinical procedures..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:border-sky-500 outline-none"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                  className="w-4 h-4 text-[#0284c7] rounded accent-[#0284c7]"
                />
                <span className="font-bold text-slate-800">Available for OPD Consultations</span>
              </label>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingDoctor(null);
                  }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0284c7] hover:bg-sky-700 text-white rounded-xl font-bold shadow-md shadow-sky-600/20"
                >
                  {editingDoctor ? 'Update Doctor' : 'Save Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
