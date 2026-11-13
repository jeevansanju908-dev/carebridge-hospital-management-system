import React from 'react';
import {
  LayoutDashboard,
  Search,
  CalendarPlus,
  CalendarCheck,
  Stethoscope,
  MapPin,
  Ambulance,
  FileText,
  Bell,
  User,
  Settings,
  LogOut,
  Users,
  UserCheck,
  BedDouble,
  DollarSign,
  BarChart3,
  History,
  ShieldAlert,
  X,
  ChevronRight,
  HeartPulse,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, isOpen, onClose }) => {
  const { userRole, logout } = useAuth();

  const patientNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'find-doctors', label: 'Find Doctors', icon: Search },
    { id: 'book-appointment', label: 'Book Appointment', icon: CalendarPlus },
    { id: 'my-appointments', label: 'My Appointments', icon: CalendarCheck },
    { id: 'symptom-checker', label: 'Symptom Checker', icon: Stethoscope, badge: 'AI' },
    { id: 'nearby-hospitals', label: 'Nearby Hospitals', icon: MapPin },
    { id: 'ambulance', label: 'Ambulance & SOS', icon: Ambulance, isEmergency: true },
    { id: 'health-records', label: 'Health Records', icon: FileText },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'profile', label: 'My Profile', icon: User },
  ];

  const hospitalNavItems = [
    { id: 'hospital-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'patient-management', label: 'Patient Management', icon: Users },
    { id: 'doctor-management', label: 'Doctor Management', icon: UserCheck, badge: '20' },
    { id: 'appointment-management', label: 'Appointment Management', icon: CalendarCheck },
    { id: 'emergency-management', label: 'Emergency Management', icon: ShieldAlert, isEmergency: true },
    { id: 'beds-wards', label: 'Beds and Wards', icon: BedDouble },
    { id: 'medical-reports', label: 'Medical Reports', icon: FileText },
    { id: 'billing-payments', label: 'Billing and Payments', icon: DollarSign },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'activity-logs', label: 'Activity Logs', icon: History },
    { id: 'hospital-settings', label: 'Settings & Facility Config', icon: Settings },
  ];

  const items = userRole === 'patient' ? patientNavItems : hospitalNavItems;

  const handleSelect = (viewId: string) => {
    onNavigate(viewId);
    onClose();
  };

  const handleLogout = () => {
    logout();
    onNavigate('welcome');
    onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container: background #0f172a as required */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-72 bg-[#0f172a] text-slate-300 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } border-r border-slate-800 shadow-xl lg:shadow-none`}
      >
        {/* Brand & Mobile Close */}
        <div className="h-17 px-6 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#0284c7] to-[#1e40af] flex items-center justify-center text-white shadow-xs">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-white tracking-tight">
                Care<span className="text-[#0284c7]">Bridge</span>
              </span>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                {userRole === 'patient' ? 'Patient Portal' : 'Hospital Command'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {userRole === 'patient' ? 'Patient Services' : 'Hospital Operations'}
          </div>

          {items.map((item) => {
            const Icon = item.icon;
            const isActive =
              currentView === item.id ||
              (currentView === 'dashboard' && item.id === 'hospital-dashboard' && userRole === 'hospital');

            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-[#0284c7] text-white shadow-md shadow-sky-600/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive
                        ? 'text-white'
                        : item.isEmergency
                        ? 'text-red-400'
                        : 'text-slate-400 group-hover:text-sky-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                      item.badge === 'AI'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-sky-500/20 text-sky-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer with Logout */}
        <div className="p-3.5 border-t border-slate-800/80 space-y-1">
          <div className="px-3 py-2 bg-slate-800/50 rounded-xl mb-2 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-400">Database Engine</p>
              <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Shared DB (Active)
              </p>
            </div>
            {userRole === 'hospital' && (
              <button
                onClick={() => handleSelect('hospital-settings')}
                className="text-slate-400 hover:text-white text-[11px] underline"
              >
                System Status
              </button>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};
