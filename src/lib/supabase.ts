import { createClient } from '@supabase/supabase-js';

export const SUPABASE_PROJECT_ID = 'crnurqfbksebpzceymvq';
export const SUPABASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  'https://crnurqfbksebpzceymvq.supabase.co';
export const SUPABASE_ANON_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  'sb_publishable_Mz6a8H_JlVzq2ibHLzJZPA_Au838xw0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Direct helper to save an appointment into Supabase
 */
export async function saveAppointmentToSupabase(appointment: {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  patientBloodGroup?: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization?: string;
  hospitalId: string;
  hospitalName: string;
  date: string;
  timeSlot: string;
  reasonForVisit: string;
  additionalNotes?: string;
  status: string;
  consultationFee?: number;
  createdAt: string;
}) {
  try {
    const payload = {
      id: appointment.id,
      patient_id: appointment.patientId,
      patient_name: appointment.patientName,
      patient_email: appointment.patientEmail,
      patient_phone: appointment.patientPhone,
      patient_blood_group: appointment.patientBloodGroup || 'O+',
      doctor_id: appointment.doctorId,
      doctor_name: appointment.doctorName,
      doctor_specialization: appointment.doctorSpecialization || '',
      hospital_id: appointment.hospitalId,
      hospital_name: appointment.hospitalName,
      date: appointment.date,
      time_slot: appointment.timeSlot,
      reason_for_visit: appointment.reasonForVisit,
      additional_notes: appointment.additionalNotes || '',
      status: appointment.status || 'Pending',
      consultation_fee: appointment.consultationFee || 0,
      created_at: appointment.createdAt || new Date().toISOString(),
    };

    const { data, error } = await supabase.from('appointments').insert([payload]);
    if (error) {
      console.warn('Supabase client insert note:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (err: any) {
    console.warn('Supabase save error:', err);
    return { success: false, error: err.message };
  }
}
