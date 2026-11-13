import React, { createContext, useContext, useState, useEffect } from 'react';
import type { PatientUser, HospitalUser, ConsentPreferences } from '../types/index.js';

export interface GooglePendingProfile {
  fullName: string;
  email: string;
  avatar: string;
}

export interface GoogleAuthResult {
  success: boolean;
  error?: string;
  user?: any;
  isNewUser?: boolean;
  needsRegistration?: boolean;
  registrationToken?: string;
  googleProfile?: GooglePendingProfile;
}

interface AuthContextType {
  currentUser: PatientUser | HospitalUser | null;
  userRole: 'patient' | 'hospital' | 'guest';
  isLoggedIn: boolean;
  loginPatient: (emailOrPhone: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  registerPatient: (data: Partial<PatientUser> & { password?: string }) => Promise<{ success: boolean; error?: string }>;
  loginHospital: (
    identifier: string,
    password?: string,
    hospitalName?: string
  ) => Promise<{ success: boolean; error?: string }>;
  registerHospital: (
    data: Partial<HospitalUser> & { password?: string }
  ) => Promise<{
    success: boolean;
    error?: string;
    alreadyExists?: boolean;
    existingEmail?: string;
    existingHospitalName?: string;
  }>;
  loginWithGoogle: (
    authPayload: {
      credential?: string;
      accessToken?: string;
      token?: string;
    },
    role: 'patient' | 'hospital',
    intent?: 'login' | 'register'
  ) => Promise<GoogleAuthResult>;
  completeGooglePatientRegistration: (data: {
    registrationToken: string;
    mobile: string;
    dob?: string;
    gender?: 'Male' | 'Female' | 'Other';
    bloodGroup?: string;
    address?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  completeGoogleHospitalRegistration: (data: {
    registrationToken: string;
    hospitalName: string;
    contactNumber: string;
    district?: string;
    address?: string;
    registrationDetails?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchRole: (role: 'patient' | 'hospital') => void;
  saveConsent: (preferences: ConsentPreferences) => Promise<void>;
  updatePatientProfile: (updates: Partial<PatientUser>) => Promise<void>;
  showConsentModal: boolean;
  setShowConsentModal: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<PatientUser | HospitalUser | null>(() => {
    try {
      const stored = localStorage.getItem('carebridge_active_user');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed reading auth from localStorage', e);
    }
    return null;
  });

  const [showConsentModal, setShowConsentModal] = useState<boolean>(false);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('carebridge_active_user', JSON.stringify(currentUser));
      if (currentUser.role === 'patient' && !(currentUser as PatientUser).hasAcceptedConsent) {
        setShowConsentModal(true);
      }
    } else {
      localStorage.removeItem('carebridge_active_user');
    }
  }, [currentUser]);

  const loginPatient = async (identifier: string, password = '') => {
    try {
      const res = await fetch('/api/auth/login-patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed. Please check your credentials.' };
      }
      setCurrentUser(data.user);
      if (!data.user.hasAcceptedConsent) {
        setShowConsentModal(true);
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Unable to connect to authentication server.' };
    }
  };

  const registerPatient = async (data: Partial<PatientUser> & { password?: string }) => {
    try {
      const res = await fetch('/api/auth/register-patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok) {
        return { success: false, error: resData.error || 'Registration failed' };
      }
      setCurrentUser(resData.user);
      setShowConsentModal(true);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  const loginHospital = async (identifier: string, password = '', hospitalName = '') => {
    try {
      const res = await fetch('/api/auth/login-hospital', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, email: identifier, hospitalName, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Hospital login failed. Please check credentials.' };
      }
      setCurrentUser(data.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Unable to connect to hospital authentication service.' };
    }
  };

  const registerHospital = async (data: Partial<HospitalUser> & { password?: string }) => {
    try {
      const res = await fetch('/api/auth/register-hospital', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: resData.error || 'Hospital registration failed',
          alreadyExists: resData.alreadyExists,
          existingEmail: resData.existingEmail,
          existingHospitalName: resData.existingHospitalName,
        };
      }
      setCurrentUser(resData.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  const loginWithGoogle = async (
    authPayload: {
      credential?: string;
      accessToken?: string;
      token?: string;
    },
    role: 'patient' | 'hospital',
    intent: 'login' | 'register' = 'login'
  ): Promise<GoogleAuthResult> => {
    try {
      const res = await fetch('/api/auth/google/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...authPayload, role, intent }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Google authentication failed' };
      }

      if (data.needsRegistration && data.registrationToken && data.googleProfile) {
        return {
          success: true,
          needsRegistration: true,
          isNewUser: true,
          registrationToken: data.registrationToken,
          googleProfile: data.googleProfile,
        };
      }

      setCurrentUser(data.user);
      if (role === 'patient' && !data.user.hasAcceptedConsent) {
        setShowConsentModal(true);
      }
      return { success: true, user: data.user, isNewUser: data.isNewUser, needsRegistration: false };
    } catch (err: any) {
      return { success: false, error: err.message || 'Google verification network error' };
    }
  };

  const completeGooglePatientRegistration = async (data: {
    registrationToken: string;
    mobile: string;
    dob?: string;
    gender?: 'Male' | 'Female' | 'Other';
    bloodGroup?: string;
    address?: string;
  }) => {
    try {
      const res = await fetch('/api/auth/google/complete-patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok) {
        return { success: false, error: resData.error || 'Could not complete Google registration.' };
      }
      setCurrentUser(resData.user);
      if (!resData.user.hasAcceptedConsent) {
        setShowConsentModal(true);
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error while completing registration.' };
    }
  };

  const completeGoogleHospitalRegistration = async (data: {
    registrationToken: string;
    hospitalName: string;
    contactNumber: string;
    district?: string;
    address?: string;
    registrationDetails?: string;
  }) => {
    try {
      const res = await fetch('/api/auth/google/complete-hospital', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok) {
        return { success: false, error: resData.error || 'Could not complete hospital registration.' };
      }
      setCurrentUser(resData.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error while completing registration.' };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('carebridge_active_user');
  };

  const switchRole = (role: 'patient' | 'hospital') => {
    if (currentUser && currentUser.role !== role) {
      setCurrentUser(null);
      localStorage.removeItem('carebridge_active_user');
    }
  };

  const saveConsent = async (preferences: ConsentPreferences) => {
    if (!currentUser || currentUser.role !== 'patient') return;

    try {
      await fetch('/api/auth/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: currentUser.id, preferences }),
      });
    } catch (e) {
      console.warn('Consent save offline:', e);
    }

    const updated = {
      ...currentUser,
      hasAcceptedConsent: true,
      consentPreferences: preferences,
    } as PatientUser;

    setCurrentUser(updated);
    setShowConsentModal(false);
  };

  const updatePatientProfile = async (updates: Partial<PatientUser>) => {
    if (!currentUser || currentUser.role !== 'patient') return;
    try {
      const res = await fetch(`/api/patient/${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.user) {
        setCurrentUser(data.user);
      }
    } catch {
      setCurrentUser({ ...currentUser, ...updates } as PatientUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userRole: currentUser ? currentUser.role : 'guest',
        isLoggedIn: !!currentUser,
        loginPatient,
        registerPatient,
        loginHospital,
        registerHospital,
        loginWithGoogle,
        completeGooglePatientRegistration,
        completeGoogleHospitalRegistration,
        logout,
        switchRole,
        saveConsent,
        updatePatientProfile,
        showConsentModal,
        setShowConsentModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
