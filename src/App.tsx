/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { Navbar } from './components/Navbar.js';
import { Sidebar } from './components/Sidebar.js';
import { PrivacyConsentModal } from './components/PrivacyConsentModal.js';

// Public Onboarding Views
import { WelcomeView } from './views/WelcomeView.js';
import { RoleSelectionView } from './views/RoleSelectionView.js';
import { PatientAuthView } from './views/PatientAuthView.js';
import { HospitalAuthView } from './views/HospitalAuthView.js';

// Patient Views
import { PatientDashboardView } from './views/patient/PatientDashboardView.js';
import { FindDoctorsView } from './views/patient/FindDoctorsView.js';
import { BookAppointmentView } from './views/patient/BookAppointmentView.js';
import { MyAppointmentsView } from './views/patient/MyAppointmentsView.js';
import { SymptomCheckerView } from './views/patient/SymptomCheckerView.js';
import { NearbyHospitalsView } from './views/patient/NearbyHospitalsView.js';
import { AmbulanceEmergencyView } from './views/patient/AmbulanceEmergencyView.js';
import { HealthRecordsView } from './views/patient/HealthRecordsView.js';
import { PatientProfileView } from './views/patient/PatientProfileView.js';
import { NotificationsView } from './views/patient/NotificationsView.js';

// Hospital Views
import { HospitalDashboardView } from './views/hospital/HospitalDashboardView.js';
import { HospitalAppointmentManagementView } from './views/hospital/HospitalAppointmentManagementView.js';
import { HospitalDoctorManagementView } from './views/hospital/HospitalDoctorManagementView.js';
import { HospitalPatientManagementView } from './views/hospital/HospitalPatientManagementView.js';
import { HospitalBedsManagementView } from './views/hospital/HospitalBedsManagementView.js';
import { HospitalBillingView } from './views/hospital/HospitalBillingView.js';
import { HospitalAnalyticsView } from './views/hospital/HospitalAnalyticsView.js';
import { HospitalActivityLogsView } from './views/hospital/HospitalActivityLogsView.js';
import { HospitalEmergencyView } from './views/hospital/HospitalEmergencyView.js';
import { HospitalSettingsView } from './views/hospital/HospitalSettingsView.js';

import type { Doctor, HospitalUser } from './types/index.js';

function MainApp() {
  const { currentUser, userRole, isLoggedIn, showConsentModal, setShowConsentModal } = useAuth();

  // Navigation views
  // Public flows: 'welcome', 'role-selection', 'patient-login', 'patient-register', 'hospital-login', 'hospital-register'
  // Portal views: 'dashboard', 'find-doctors', 'book-appointment', etc.
  const [currentView, setCurrentView] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('carebridge_active_user');
      return stored ? 'dashboard' : 'welcome';
    } catch {
      return 'welcome';
    }
  });
  const [subFilter, setSubFilter] = useState<string | undefined>(undefined);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState<Doctor | null>(null);

  const handleNavigate = (view: string, filter?: string) => {
    // Check if view has query string (e.g. find-doctors?q=...)
    if (view.startsWith('find-doctors?q=')) {
      const q = decodeURIComponent(view.split('?q=')[1]);
      setSubFilter(q);
      setCurrentView('find-doctors');
      return;
    }
    setCurrentView(view);
    setSubFilter(filter);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If user is not authenticated, show public welcome and auth flows
  if (!isLoggedIn) {
    if (currentView === 'role-selection') {
      return (
        <RoleSelectionView
          onSelectPatient={() => setCurrentView('patient-login')}
          onSelectHospital={() => setCurrentView('hospital-login')}
          onBack={() => setCurrentView('welcome')}
        />
      );
    }

    if (currentView === 'patient-login' || currentView === 'patient-register') {
      return (
        <PatientAuthView
          initialMode={currentView === 'patient-register' ? 'register' : 'login'}
          onSuccess={() => setCurrentView('dashboard')}
          onBack={() => setCurrentView('role-selection')}
          onSwitchToHospital={() => setCurrentView('hospital-login')}
        />
      );
    }

    if (currentView === 'hospital-login' || currentView === 'hospital-register') {
      return (
        <HospitalAuthView
          initialMode={currentView === 'hospital-register' ? 'register' : 'login'}
          onSuccess={() => setCurrentView('dashboard')}
          onBack={() => setCurrentView('role-selection')}
          onSwitchToPatient={() => setCurrentView('patient-login')}
        />
      );
    }

    // Default to WelcomeView when not logged in
    return (
      <WelcomeView
        onSelectPatientLogin={() => setCurrentView('patient-login')}
        onSelectHospitalLogin={() => setCurrentView('hospital-login')}
        onSelectPatientRegister={() => setCurrentView('patient-register')}
        onSelectHospitalRegister={() => setCurrentView('hospital-register')}
        onGetStarted={() => setCurrentView('role-selection')}
      />
    );
  }

  // Authenticated Portal Layout (Patient or Hospital)
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col antialiased selection:bg-[#0284c7] selection:text-white">
      {/* Privacy and Cookie Consent Modal */}
      <PrivacyConsentModal
        isOpen={showConsentModal}
        onClose={() => setShowConsentModal(false)}
      />

      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Container with Sidebar + Content */}
      <div className="flex-1 flex w-full">
        {/* Navigation Sidebar: Background #0f172a */}
        <Sidebar
          currentView={currentView}
          onNavigate={handleNavigate}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Viewport Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* ================= PATIENT PORTAL VIEWS ================= */}
          {userRole === 'patient' && (
            <>
              {currentView === 'dashboard' && (
                <PatientDashboardView onNavigate={handleNavigate} />
              )}

              {currentView === 'find-doctors' && (
                <FindDoctorsView
                  initialSearch={subFilter || ''}
                  onSelectDoctorToBook={(doc) => {
                    setSelectedDoctorForBooking(doc);
                    setCurrentView('book-appointment');
                  }}
                />
              )}

              {currentView === 'book-appointment' && (
                <BookAppointmentView
                  preselectedDoctor={selectedDoctorForBooking}
                  onSuccessNavigate={() => {
                    setSelectedDoctorForBooking(null);
                    setCurrentView('my-appointments');
                  }}
                />
              )}

              {currentView === 'my-appointments' && (
                <MyAppointmentsView
                  initialTab={subFilter || 'All'}
                  onBookNew={() => setCurrentView('book-appointment')}
                />
              )}

              {currentView === 'symptom-checker' && (
                <SymptomCheckerView
                  onBookDoctor={(doc) => {
                    setSelectedDoctorForBooking(doc);
                    setCurrentView('book-appointment');
                  }}
                  onExploreHospitals={() => setCurrentView('nearby-hospitals')}
                  onEmergencySOS={() => setCurrentView('ambulance')}
                />
              )}

              {currentView === 'nearby-hospitals' && (
                <NearbyHospitalsView
                  onBookAtHospital={(hosp) => {
                    setCurrentView('find-doctors');
                  }}
                />
              )}

              {currentView === 'ambulance' && (
                <AmbulanceEmergencyView
                  onBackToDashboard={() => setCurrentView('dashboard')}
                />
              )}

              {currentView === 'health-records' && (
                <HealthRecordsView
                  onBackToDashboard={() => setCurrentView('dashboard')}
                />
              )}

              {currentView === 'notifications' && (
                <NotificationsView
                  onNavigateToApt={() => setCurrentView('my-appointments')}
                />
              )}

              {currentView === 'profile' && <PatientProfileView />}
            </>
          )}

          {/* ================= HOSPITAL PORTAL VIEWS ================= */}
          {userRole === 'hospital' && (
            <>
              {(currentView === 'dashboard' || currentView === 'hospital-dashboard') && (
                <HospitalDashboardView onNavigate={handleNavigate} />
              )}

              {currentView === 'appointment-management' && (
                <HospitalAppointmentManagementView
                  initialStatusFilter={subFilter || 'All'}
                />
              )}

              {currentView === 'doctor-management' && (
                <HospitalDoctorManagementView />
              )}

              {currentView === 'patient-management' && (
                <HospitalPatientManagementView />
              )}

              {currentView === 'beds-wards' && <HospitalBedsManagementView />}

              {currentView === 'billing-payments' && <HospitalBillingView />}

              {currentView === 'analytics' && <HospitalAnalyticsView />}

              {currentView === 'activity-logs' && <HospitalActivityLogsView />}

              {currentView === 'emergency-management' && <HospitalEmergencyView />}

              {currentView === 'notifications' && (
                <NotificationsView
                  onNavigateToApt={() => setCurrentView('appointment-management')}
                />
              )}

              {currentView === 'medical-reports' && <HealthRecordsView />}

              {(currentView === 'settings' || currentView === 'hospital-settings') && (
                <HospitalSettingsView />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
