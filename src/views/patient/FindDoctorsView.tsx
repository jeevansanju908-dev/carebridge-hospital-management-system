import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Star,
  MapPin,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Stethoscope,
  Building2,
  DollarSign,
  User,
  GraduationCap,
  Globe,
  ChevronRight,
  X,
} from 'lucide-react';
import type { Doctor, MedicalSpecialty } from '../../types/index.js';

interface FindDoctorsViewProps {
  initialSearch?: string;
  onSelectDoctorToBook: (doctor: Doctor) => void;
}

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
];

export const FindDoctorsView: React.FC<FindDoctorsViewProps> = ({
  initialSearch = '',
  onSelectDoctorToBook,
}) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('All');
  const [selectedHospital, setSelectedHospital] = useState<string>('All');
  const [availabilityFilter, setAvailabilityFilter] = useState<'All' | 'Available' | 'On Leave'>('All');
  const [maxFee, setMaxFee] = useState<number>(1500);

  // Modal profile inspection
  const [profileDoctor, setProfileDoctor] = useState<Doctor | null>(null);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/doctors');
      if (res.ok) {
        const data = await res.json();
        setDoctors(data);
      }
    } catch (e) {
      console.warn('Failed loading doctors', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  // Filtered doctors
  const filteredDoctors = doctors.filter((doc) => {
    if (selectedSpecialty !== 'All' && doc.specialization !== selectedSpecialty) {
      return false;
    }
    if (selectedHospital !== 'All' && doc.hospitalName !== selectedHospital) {
      return false;
    }
    if (availabilityFilter === 'Available' && !doc.isAvailable) {
      return false;
    }
    if (availabilityFilter === 'On Leave' && doc.isAvailable) {
      return false;
    }
    if (doc.consultationFee > maxFee) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = doc.name.toLowerCase().includes(q);
      const matchSpec = doc.specialization.toLowerCase().includes(q);
      const matchHosp = doc.hospitalName.toLowerCase().includes(q);
      if (!matchName && !matchSpec && !matchHosp) return false;
    }
    return true;
  });

  const uniqueHospitals = Array.from(new Set(doctors.map((d) => d.hospitalName)));

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Find Trusted Doctors
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Explore 20 certified medical specialists across top Karnataka hospitals. 15 Available for immediate booking.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Search by doctor name/specialty */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search doctor or specialty..."
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none"
            />
          </div>

          {/* Specialty Filter */}
          <div>
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-sky-500 outline-none bg-white text-slate-800"
            >
              <option value="All">All Specialties ({specialties.length})</option>
              {specialties.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
          </div>

          {/* Hospital Filter */}
          <div>
            <select
              value={selectedHospital}
              onChange={(e) => setSelectedHospital(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-sky-500 outline-none bg-white text-slate-800"
            >
              <option value="All">All Hospitals ({uniqueHospitals.length})</option>
              {uniqueHospitals.map((hosp) => (
                <option key={hosp} value={hosp}>
                  {hosp}
                </option>
              ))}
            </select>
          </div>

          {/* Availability Status */}
          <div>
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-sky-500 outline-none bg-white text-slate-800"
            >
              <option value="All">All Schedules (Available & On Leave)</option>
              <option value="Available">Available Now (15 OPD)</option>
              <option value="On Leave">On Leave (5 Specialists)</option>
            </select>
          </div>
        </div>

        {/* Fee Slider & Quick Specialty Chips */}
        <div className="pt-2 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
            <span className="text-[11px] font-bold text-slate-400 shrink-0">Quick Specialty:</span>
            {['Cardiologist', 'Neurologist', 'Dermatologist', 'Orthopedic', 'Pediatrician'].map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSpecialty(selectedSpecialty === s ? 'All' : s)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${
                  selectedSpecialty === s
                    ? 'bg-[#0284c7] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[11px] font-bold text-slate-500">
              Max Fee: ₹{maxFee}
            </span>
            <input
              type="range"
              min={400}
              max={1500}
              step={50}
              value={maxFee}
              onChange={(e) => setMaxFee(Number(e.target.value))}
              className="w-28 sm:w-36 accent-[#0284c7]"
            />
            {(selectedSpecialty !== 'All' || selectedHospital !== 'All' || availabilityFilter !== 'All' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedSpecialty('All');
                  setSelectedHospital('All');
                  setAvailabilityFilter('All');
                  setSearchQuery('');
                  setMaxFee(1500);
                }}
                className="text-xs text-red-600 hover:underline font-semibold"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-semibold text-slate-500">
          Showing <span className="text-slate-900 font-bold">{filteredDoctors.length}</span> doctors
        </p>
        <span className="text-xs text-slate-400">Verified Credentials & Hospital Affiliations</span>
      </div>

      {/* Doctors Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">Loading doctors roster...</div>
      ) : filteredDoctors.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 space-y-3">
          <Stethoscope className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No doctors matched your search criteria</h3>
          <p className="text-xs text-slate-500">Try adjusting your filters, location, or maximum fee.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDoctors.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-300 p-5 flex flex-col justify-between group relative overflow-hidden"
            >
              {/* Top Doctor Header */}
              <div>
                <div className="flex items-start gap-3.5">
                  <div className="relative shrink-0">
                    <img
                      src={doc.avatar}
                      alt={doc.name}
                      className="w-18 h-18 rounded-2xl object-cover border-2 border-slate-100 group-hover:scale-105 transition-transform"
                    />
                    <span
                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                        doc.isAvailable ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                      title={doc.isAvailable ? 'Available for booking' : 'Currently on leave'}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          doc.isAvailable
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {doc.isAvailable ? '● Available' : 'On Leave'}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{doc.rating}</span>
                        <span className="text-[10px] text-slate-400">({doc.reviewsCount})</span>
                      </div>
                    </div>

                    <h3 className="font-extrabold text-base text-slate-900 mt-1 truncate group-hover:text-[#0284c7] transition-colors">
                      {doc.name}
                    </h3>
                    <p className="text-xs font-semibold text-[#0284c7]">{doc.specialization}</p>
                    <p className="text-[11px] text-slate-500 truncate">{doc.qualification}</p>
                  </div>
                </div>

                {/* Details snippet */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2 text-[11px]">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{doc.hospitalName}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-slate-500 font-medium">Experience:</span>
                    <span className="font-bold text-slate-800">{doc.experienceYears} Years</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Consultation Fee:</span>
                    <span className="font-black text-slate-900 text-sm">₹{doc.consultationFee}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: View Profile & Book Appointment */}
              <div className="mt-5 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setProfileDoctor(doc)}
                  className="py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors"
                >
                  View Profile
                </button>

                <button
                  onClick={() => onSelectDoctorToBook(doc)}
                  disabled={!doc.isAvailable}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                    doc.isAvailable
                      ? 'bg-[#0284c7] hover:bg-sky-700 text-white shadow-sky-600/20'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {doc.isAvailable ? 'Book Visit' : 'On Leave'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DOCTOR PROFILE MODAL */}
      {profileDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <img
                  src={profileDoctor.avatar}
                  alt={profileDoctor.name}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-sky-100"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-xl text-slate-900">{profileDoctor.name}</h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        profileDoctor.isAvailable
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {profileDoctor.isAvailable ? 'Available' : 'On Leave'}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-[#0284c7] mt-0.5">
                    {profileDoctor.specialization} • {profileDoctor.experienceYears} Years Exp
                  </p>
                  <p className="text-xs text-slate-500">{profileDoctor.qualification}</p>
                </div>
              </div>
              <button
                onClick={() => setProfileDoctor(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* About Doctor */}
            <div className="space-y-1.5 text-xs text-slate-600">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                About Doctor
              </h4>
              <p className="leading-relaxed">{profileDoctor.about}</p>
            </div>

            {/* Hospital & Fee */}
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
              <div>
                <span className="text-[11px] text-slate-400 font-medium">Affiliated Hospital</span>
                <p className="font-bold text-slate-800">{profileDoctor.hospitalName}</p>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-medium">Consultation Fee</span>
                <p className="font-black text-slate-900 text-base">₹{profileDoctor.consultationFee}</p>
              </div>
            </div>

            {/* Available Days & Time Slots */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Consultation Schedule
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {profileDoctor.availableDays.map((day) => (
                  <span
                    key={day}
                    className="px-2.5 py-1 rounded-lg bg-sky-50 text-[#0284c7] text-xs font-semibold"
                  >
                    {day}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {profileDoctor.timeSlots.map((slot) => (
                  <span
                    key={slot}
                    className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium"
                  >
                    🕒 {slot}
                  </span>
                ))}
              </div>
            </div>

            {/* Education & Languages */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
              <div>
                <h5 className="font-bold text-slate-800 flex items-center gap-1.5 mb-1 text-[11px]">
                  <GraduationCap className="w-3.5 h-3.5 text-[#0284c7]" />
                  Education & Honors
                </h5>
                <ul className="list-disc list-inside text-slate-500 space-y-0.5 text-[11px]">
                  {profileDoctor.education.map((edu) => (
                    <li key={edu}>{edu}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h5 className="font-bold text-slate-800 flex items-center gap-1.5 mb-1 text-[11px]">
                  <Globe className="w-3.5 h-3.5 text-[#0284c7]" />
                  Languages Spoken
                </h5>
                <p className="text-slate-500 text-[11px]">{profileDoctor.languages.join(', ')}</p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setProfileDoctor(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const doc = profileDoctor;
                  setProfileDoctor(null);
                  onSelectDoctorToBook(doc);
                }}
                disabled={!profileDoctor.isAvailable}
                className="px-5 py-2.5 rounded-xl bg-[#0284c7] hover:bg-sky-700 text-white font-bold text-xs shadow-md shadow-sky-600/30 disabled:opacity-50"
              >
                {profileDoctor.isAvailable ? 'Book Appointment Now' : 'Doctor On Leave'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
