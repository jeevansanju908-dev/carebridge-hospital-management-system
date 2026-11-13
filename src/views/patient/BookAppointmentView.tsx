import React, { useState, useEffect } from 'react';
import {
  CalendarPlus,
  CheckCircle,
  Clock,
  Building2,
  User,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  FileText,
  Database,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext.js';
import type { Doctor, HospitalUser, Appointment } from '../../types/index.js';
import { saveAppointmentToSupabase, SUPABASE_PROJECT_ID } from '../../lib/supabase.js';

interface BookAppointmentViewProps {
  preselectedDoctor?: Doctor | null;
  onSuccessNavigate: () => void;
}

export const BookAppointmentView: React.FC<BookAppointmentViewProps> = ({
  preselectedDoctor,
  onSuccessNavigate,
}) => {
  const { currentUser } = useAuth();
  const patient = currentUser as any;

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [hospitals, setHospitals] = useState<HospitalUser[]>([]);
  const [step, setStep] = useState<number>(preselectedDoctor ? 3 : 1);

  // Form State for 7 Steps
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(preselectedDoctor || null);
  const [selectedHospital, setSelectedHospital] = useState<HospitalUser | null>(null);
  const [appointmentDate, setAppointmentDate] = useState<string>('2026-11-18');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('10:00 AM');
  const [reasonForVisit, setReasonForVisit] = useState<string>('');
  const [additionalNotes, setAdditionalNotes] = useState<string>('');

  // Booking Result
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null);
  const [supabaseSyncResult, setSupabaseSyncResult] = useState<{
    success: boolean;
    message: string;
    projectId: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch doctors & hospitals
  useEffect(() => {
    fetch('/api/doctors')
      .then((r) => r.json())
      .then((data) => {
        setDoctors(data);
        if (!selectedDoctor && data.length > 0) {
          const firstAvail = data.find((d: Doctor) => d.isAvailable) || data[0];
          setSelectedDoctor(firstAvail);
        }
      })
      .catch((err) => console.warn(err));

    fetch('/api/hospitals')
      .then((r) => r.json())
      .then((data) => {
        setHospitals(data);
        if (!selectedHospital && data.length > 0) {
          setSelectedHospital(data[0]);
        }
      })
      .catch((err) => console.warn(err));
  }, []);

  // Sync hospital with doctor when doctor changes
  useEffect(() => {
    if (selectedDoctor && hospitals.length > 0) {
      const match = hospitals.find((h) => h.id === selectedDoctor.hospitalId);
      if (match) setSelectedHospital(match);
    }
  }, [selectedDoctor, hospitals]);

  const handleSelectHospital = (hosp: HospitalUser) => {
    setSelectedHospital(hosp);
    if (selectedDoctor && selectedDoctor.hospitalId !== hosp.id) {
      const docsAtHosp = doctors.filter((d) => d.hospitalId === hosp.id);
      if (docsAtHosp.length > 0) {
        const availDoc = docsAtHosp.find((d) => d.isAvailable) || docsAtHosp[0];
        setSelectedDoctor(availDoc);
      }
    }
  };

  const handleSubmitBooking = async () => {
    if (!patient?.id) {
      setError('Please sign in with your patient account to submit a booking.');
      return;
    }
    if (!selectedDoctor || !appointmentDate || !selectedTimeSlot || !reasonForVisit.trim()) {
      setError('Please complete all booking steps.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patient.id,
          patientName: patient.fullName || patient.email || 'Patient',
          patientPhone: patient.mobile || '',
          patientEmail: patient.email || '',
          patientBloodGroup: patient.bloodGroup || 'O+',
          doctorId: selectedDoctor.id,
          hospitalId: selectedHospital?.id || selectedDoctor.hospitalId,
          date: appointmentDate,
          timeSlot: selectedTimeSlot,
          reasonForVisit,
          additionalNotes,
        }),
      });

      const data = await res.json();
      setIsSubmitting(false);

      if (res.ok && data.appointment) {
        setConfirmedAppointment(data.appointment);
        if (data.supabase) {
          setSupabaseSyncResult(data.supabase);
        } else {
          // Direct client fallback attempt
          saveAppointmentToSupabase(data.appointment).then((res) => {
            setSupabaseSyncResult({
              success: res.success,
              message: res.success
                ? `Saved to Supabase database (table: appointments)`
                : (res.error || 'Connected to Supabase project crnurqfbksebpzceymvq'),
              projectId: SUPABASE_PROJECT_ID,
            });
          });
        }
        try {
          confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
        } catch {}
      } else {
        setError(data.error || 'Failed to submit booking.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || 'Network error occurred.');
    }
  };

  if (confirmedAppointment) {
    return (
      <div className="max-w-2xl mx-auto py-10 px-4">
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-2xl text-center space-y-6 relative overflow-hidden">
          <div className="w-18 h-18 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
            <CheckCircle className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
              Booking Submitted • Status: Pending Approval
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Appointment Request Confirmed!
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              Your booking has been forwarded to the hospital portal. The hospital administration will review and approve your slot.
            </p>
          </div>

          {/* Appointment Ticket Details */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 text-left space-y-3.5 text-xs text-slate-700">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
              <span className="text-slate-400 font-medium">Appointment ID:</span>
              <span className="font-extrabold text-sm text-[#0284c7] font-mono">
                {confirmedAppointment.id}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 font-medium block">Doctor</span>
                <span className="font-bold text-slate-900">{confirmedAppointment.doctorName}</span>
                <p className="text-[11px] text-slate-500">{confirmedAppointment.doctorSpecialization}</p>
              </div>

              <div>
                <span className="text-slate-400 font-medium block">Hospital</span>
                <span className="font-bold text-slate-900">{confirmedAppointment.hospitalName}</span>
              </div>

              <div>
                <span className="text-slate-400 font-medium block">Date & Time</span>
                <span className="font-bold text-slate-900">
                  {confirmedAppointment.date} at {confirmedAppointment.timeSlot}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-medium block">Consultation Fee</span>
                <span className="font-bold text-slate-900">₹{confirmedAppointment.consultationFee}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/60">
              <span className="text-slate-400 font-medium block">Reason for Visit</span>
              <p className="text-slate-800 font-medium mt-0.5">{confirmedAppointment.reasonForVisit}</p>
            </div>
          </div>

          {/* SUPABASE CLOUD DATABASE SYNC STATUS */}
          <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 text-xs text-emerald-900 text-left space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-700" />
                <span className="font-extrabold text-emerald-900">
                  Supabase Cloud Database
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200/70 text-emerald-800 font-mono">
                Project: {SUPABASE_PROJECT_ID}
              </span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              {supabaseSyncResult?.message ||
                `Appointment data forwarded to Supabase project ${SUPABASE_PROJECT_ID} (table: appointments).`}
            </p>
            <div className="text-[10px] text-emerald-700 font-mono bg-white/70 rounded-lg p-1.5 border border-emerald-100 flex items-center justify-between">
              <span>Target: https://{SUPABASE_PROJECT_ID}.supabase.co</span>
              <span className="font-semibold text-emerald-800">table: public.appointments</span>
            </div>
          </div>

          <div className="p-3 bg-sky-50 rounded-xl border border-sky-100 text-xs text-sky-900 flex items-start gap-2 text-left">
            <Sparkles className="w-4 h-4 text-[#0284c7] shrink-0 mt-0.5" />
            <p>
              <strong>Real-Time Synchronization Active:</strong> This booking is now live on the hospital dashboard. You can track status changes under <strong>My Appointments</strong>.
            </p>
          </div>

          <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onSuccessNavigate}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#0284c7] hover:bg-sky-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-sky-600/25"
            >
              View in My Appointments →
            </button>
            <button
              onClick={() => {
                setConfirmedAppointment(null);
                setSupabaseSyncResult(null);
                setStep(1);
                setReasonForVisit('');
                setAdditionalNotes('');
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs sm:text-sm"
            >
              Book Another Visit
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Book Doctor Appointment
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          7-Step streamlined clinical booking with live hospital synchronization.
        </p>
      </div>

      {/* Step Indicators */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between text-xs">
          {[
            '1. Doctor',
            '2. Hospital',
            '3. Date',
            '4. Slot',
            '5. Reason',
            '6. Notes',
            '7. Confirm',
          ].map((label, idx) => {
            const stepNum = idx + 1;
            const isDone = step > stepNum;
            const isCurr = step === stepNum;
            return (
              <div
                key={label}
                onClick={() => isDone && setStep(stepNum)}
                className={`flex items-center gap-1.5 cursor-pointer font-bold ${
                  isCurr
                    ? 'text-[#0284c7]'
                    : isDone
                    ? 'text-emerald-600 hover:underline'
                    : 'text-slate-400'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    isCurr
                      ? 'bg-[#0284c7] text-white'
                      : isDone
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isDone ? '✓' : stepNum}
                </span>
                <span className="hidden md:inline">{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Step Content Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Select Doctor */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Step 1: Select Medical Specialist</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
              {doctors.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => doc.isAvailable && setSelectedDoctor(doc)}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                    selectedDoctor?.id === doc.id
                      ? 'border-[#0284c7] bg-sky-50/50 shadow-xs'
                      : doc.isAvailable
                      ? 'border-slate-100 hover:border-slate-200'
                      : 'border-slate-100 opacity-50 cursor-not-allowed bg-slate-50'
                  }`}
                >
                  <img
                    src={doc.avatar}
                    alt={doc.name}
                    className="w-12 h-12 rounded-xl object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0 text-xs">
                    <p className="font-bold text-slate-900 truncate">{doc.name}</p>
                    <p className="text-[11px] text-[#0284c7] font-semibold">{doc.specialization}</p>
                    <p className="text-[10px] text-slate-500 truncate">{doc.hospitalName}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-black text-slate-900 text-xs">₹{doc.consultationFee}</span>
                    <p className="text-[9px] text-emerald-600 font-bold">
                      {doc.isAvailable ? 'Available' : 'On Leave'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Select Hospital */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Step 2: Select Hospital Facility</h3>
            <div className="space-y-3">
              {hospitals.map((hosp) => (
                <div
                  key={hosp.id}
                  onClick={() => handleSelectHospital(hosp)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start justify-between ${
                    selectedHospital?.id === hosp.id
                      ? 'border-[#0284c7] bg-sky-50/50 shadow-xs'
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-100 text-[#0284c7] flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{hosp.hospitalName}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{hosp.address}</p>
                      <p className="text-[11px] text-[#0284c7] font-semibold mt-1">
                        Emergency Helpline: {hosp.emergencyHelpline}
                      </p>
                    </div>
                  </div>
                  {selectedHospital?.id === hosp.id && (
                    <span className="text-xs font-bold text-[#0284c7]">Selected ✓</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: Select Date */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Step 3: Select Appointment Date</h3>
            <p className="text-xs text-slate-500">
              Dr. {selectedDoctor?.name} conducts consultations on:{' '}
              <strong className="text-slate-800">{selectedDoctor?.availableDays.join(', ')}</strong>
            </p>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 max-w-sm space-y-3">
              <label className="block text-xs font-bold text-slate-700">Choose Consultation Date</label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-sky-500 outline-none bg-white font-medium"
              />
            </div>
          </div>
        )}

        {/* STEP 4: Select Time Slot */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Step 4: Select Available Time Slot</h3>
            <p className="text-xs text-slate-500">
              Available OPD slots for {appointmentDate} with Dr. {selectedDoctor?.name}:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {(selectedDoctor?.timeSlots || [
                '09:00 AM',
                '10:00 AM',
                '11:30 AM',
                '02:00 PM',
                '03:30 PM',
                '05:00 PM',
              ]).map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedTimeSlot(slot)}
                  className={`py-3 px-4 rounded-xl border-2 text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    selectedTimeSlot === slot
                      ? 'border-[#0284c7] bg-[#0284c7] text-white shadow-md'
                      : 'border-slate-200 hover:border-sky-400 bg-white text-slate-700'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{slot}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 5: Reason for Visit */}
        {step === 5 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Step 5: Reason for Visit *</h3>
            <p className="text-xs text-slate-500">
              Briefly describe your primary health concern, symptoms, or consultation objective.
            </p>

            <textarea
              required
              rows={4}
              value={reasonForVisit}
              onChange={(e) => setReasonForVisit(e.target.value)}
              placeholder="e.g. Experiencing persistent dry cough and mild fever for 3 days; need chest examination and medication advice."
              className="w-full p-4 rounded-2xl border border-slate-200 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none"
            />

            <div className="flex flex-wrap gap-2 text-[11px]">
              <span className="text-slate-400 font-semibold">Suggested reasons:</span>
              {[
                'Routine Clinical Review',
                'Cardiac Follow-up',
                'Skin Rash / Allergy',
                'Joint Pain Assessment',
                'Prescription Renewal',
              ].map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setReasonForVisit(sug)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs"
                >
                  + {sug}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 6: Additional Notes */}
        {step === 6 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Step 6: Additional Clinical Notes (Optional)</h3>
            <p className="text-xs text-slate-500">
              Mention any known drug allergies, existing ongoing medications, or specific requirements for the hospital desk.
            </p>

            <textarea
              rows={4}
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="e.g. Known allergy to Penicillin. Wheelchair assistance required upon arrival."
              className="w-full p-4 rounded-2xl border border-slate-200 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none"
            />
          </div>
        )}

        {/* STEP 7: Confirm Booking */}
        {step === 7 && (
          <div className="space-y-5">
            <h3 className="text-lg font-bold text-slate-900">Step 7: Review & Confirm Booking</h3>
            <p className="text-xs text-slate-500">
              Please inspect your appointment summary before submitting. Status will be initialized as <strong>Pending</strong>.
            </p>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 text-xs">
              <div className="flex items-center gap-3">
                <img
                  src={selectedDoctor?.avatar}
                  alt={selectedDoctor?.name}
                  className="w-12 h-12 rounded-xl object-cover"
                />
                <div>
                  <p className="font-extrabold text-sm text-slate-900">{selectedDoctor?.name}</p>
                  <p className="text-[#0284c7] font-semibold">{selectedDoctor?.specialization}</p>
                  <p className="text-slate-500">{selectedHospital?.hospitalName}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200">
                <div>
                  <span className="text-slate-400 font-medium">Scheduled Date:</span>
                  <p className="font-bold text-slate-900">{appointmentDate}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Time Slot:</span>
                  <p className="font-bold text-slate-900">{selectedTimeSlot}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Patient Name:</span>
                  <p className="font-bold text-slate-900">{patient?.fullName || patient?.email || 'Patient'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Consultation Fee:</span>
                  <p className="font-black text-slate-900 text-sm">₹{selectedDoctor?.consultationFee}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200">
                <span className="text-slate-400 font-medium">Reason:</span>
                <p className="font-medium text-slate-800 mt-0.5">{reasonForVisit}</p>
              </div>

              {additionalNotes && (
                <div>
                  <span className="text-slate-400 font-medium">Notes:</span>
                  <p className="text-slate-600 mt-0.5">{additionalNotes}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step Navigation Buttons */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 7 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 5 && !reasonForVisit.trim()) {
                  setError('Please describe your reason for visit.');
                  return;
                }
                setError(null);
                setStep(step + 1);
              }}
              className="px-6 py-2.5 rounded-xl bg-[#0284c7] hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-600/20 flex items-center gap-1.5"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmitBooking}
              className="px-7 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2 disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Confirming with Hospital...' : 'Confirm & Forward Booking'}</span>
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
