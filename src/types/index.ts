export type UserRole = 'patient' | 'hospital';

export type AppointmentStatus =
  | 'Pending'
  | 'Approved'
  | 'Rejected'
  | 'Cancelled'
  | 'Completed'
  | 'Rescheduled'
  | 'Deleted';

export type MedicalSpecialty =
  | 'Cardiologist'
  | 'Neurologist'
  | 'Dermatologist'
  | 'General Physician'
  | 'Orthopedic'
  | 'Pediatrician'
  | 'Gynecologist'
  | 'Dentist'
  | 'ENT Specialist'
  | 'Ophthalmologist'
  | 'Emergency Medicine'
  | 'Oncologist';

export interface PatientUser {
  id: string;
  role: 'patient';
  fullName: string;
  email: string;
  mobile: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup: string;
  address: string;
  avatar?: string;
  googleSub?: string;
  isGoogleVerified?: boolean;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  hasAcceptedConsent?: boolean;
  consentPreferences?: ConsentPreferences;
  createdAt: string;
}

export interface HospitalUser {
  id: string;
  role: 'hospital';
  hospitalName: string;
  email: string;
  authorizedStaffEmails?: string[];
  contactNumber: string;
  address: string;
  district: string;
  state: string;
  registrationDetails: string;
  emergencyHelpline: string;
  availableDepartments: string[];
  hasEmergencyUnit: boolean;
  logo?: string;
  googleSub?: string;
  staffName?: string;
  staffEmail?: string;
  staffAvatar?: string;
  isGoogleVerified?: boolean;
  latitude?: number;
  longitude?: number;
  createdAt: string;
}

export interface NearbyHealthcareFacility {
  id: string;
  name: string;
  type: 'Hospital' | 'Clinic' | 'Medical Centre' | 'Specialty Centre';
  address: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  distanceFormatted: string;
  contactNumber: string;
  emergencyHelpline: string;
  hasEmergencyUnit: boolean;
  rating: number;
  availableDepartments: string[];
  logo?: string;
  googleMapsDirectionsUrl: string;
  googleMapsPlaceUrl: string;
}

export interface Doctor {
  id: string;
  name: string;
  avatar: string;
  qualification: string;
  specialization: MedicalSpecialty;
  experienceYears: number;
  hospitalId: string;
  hospitalName: string;
  consultationFee: number;
  isAvailable: boolean; // 15 available, 5 on leave demo requirement
  rating: number;
  reviewsCount: number;
  about: string;
  availableDays: string[];
  timeSlots: string[];
  education: string[];
  languages: string[];
}

export interface Appointment {
  id: string; // e.g. "CB-APT-2026-1042"
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  patientBloodGroup?: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string;
  doctorAvatar: string;
  hospitalId: string;
  hospitalName: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "10:30 AM"
  reasonForVisit: string;
  additionalNotes?: string;
  status: AppointmentStatus;
  consultationFee: number;
  createdAt: string;
  updatedAt: string;
  hospitalNotes?: string;
  isDeletedByPatient?: boolean;
  isDeletedByHospital?: boolean;
  deletedAt?: string;
}

export interface HealthVitalRecord {
  id: string;
  patientId: string;
  timestamp: string;
  heartRate: number; // BPM
  oxygenLevel: number; // %
  temperature: number; // °C
  bloodPressureSys: number; // mmHg
  bloodPressureDia: number; // mmHg
  recordedBy: 'Patient Self-Entry' | 'Clinical Triage';
  notes?: string;
}

export interface HealthDocument {
  id: string;
  patientId: string;
  title: string;
  type: 'Prescription' | 'Lab Report' | 'Blood Report' | 'X-Ray' | 'Scan Report' | 'Medical Document';
  doctorName?: string;
  hospitalName?: string;
  date: string;
  fileSize: string;
  fileUrl?: string;
  tags?: string[];
  summary?: string;
}

export interface EmergencyRequest {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  emergencyType: 'Accident' | 'Critical Condition' | 'Medical Emergency' | 'Other';
  severity: 'Critical' | 'Severe' | 'Moderate';
  locationAddress: string;
  latitude?: number;
  longitude?: number;
  status: 'Dispatched' | 'Arrived' | 'In-Transit' | 'Completed' | 'Pending';
  ambulanceId?: string;
  driverName?: string;
  driverPhone?: string;
  assignedHospitalId: string;
  assignedHospitalName: string;
  estimatedArrivalMinutes?: number;
  createdAt: string;
  notes?: string;
}

export interface BedWardInfo {
  id: string;
  hospitalId: string;
  wardName: string;
  wardType: 'ICU' | 'General Ward' | 'Emergency Ward' | 'Oxygen Ward' | 'Pediatric Ward';
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  ventilatorAvailable: number;
  nurseInCharge: string;
}

export interface BillingRecord {
  id: string;
  appointmentId?: string;
  patientId: string;
  patientName: string;
  hospitalId: string;
  amount: number;
  serviceDescription: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  date: string;
  paymentMethod?: string;
}

export interface AppNotification {
  id: string;
  recipientId: string; // patientId or hospitalId
  recipientRole: UserRole;
  title: string;
  message: string;
  type: 'appointment_booked' | 'appointment_status' | 'emergency' | 'doctor_update' | 'general';
  isRead: boolean;
  referenceId?: string;
  createdAt: string;
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface ConsentPreferences {
  acceptedAll: boolean;
  personalHealthData: boolean;
  appointmentNotifications: boolean;
  locationAccess: boolean;
  analyticsCookies: boolean;
  acceptedAt: string;
}

export interface SymptomCheckResult {
  triageSummary: string;
  urgencyLevel: 'Emergency' | 'High' | 'Moderate' | 'Low';
  triageCategory?: 'Common Illness (Primary Care)' | 'Specialist Consultation' | 'Life-Threatening Emergency';
  isEmergency?: boolean;
  recommendedSpecialty: MedicalSpecialty;
  possibleConditions: Array<{
    name: string;
    description: string;
    likelihood: 'High' | 'Moderate' | 'Low';
  }>;
  recommendedActions: string[];
  emergencyWarning?: string;
  recommendedDoctors: Doctor[];
  recommendedHospitals: HospitalUser[];
  disclaimer: string;
}
