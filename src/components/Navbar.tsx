import React, { useState, useEffect } from 'react';
import {
  HeartPulse,
  Bell,
  Search,
  ShieldCheck,
  Building2,
  User,
  ArrowRightLeft,
  AlertTriangle,
  Menu,
  X,
  ExternalLink,
  ChevronDown,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import type { AppNotification } from '../types/index.js';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, onToggleSidebar }) => {
  const { currentUser, userRole, switchRole, logout } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch real-time notifications
  const fetchNotifs = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/notifications?userId=${currentUser.id}&role=${currentUser.role}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch {
      // Ignore network errors in demo
    }
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 8000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser?.id }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      console.warn(e);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    if (userRole === 'patient') {
      onNavigate(`find-doctors?q=${encodeURIComponent(searchQuery)}`);
    } else {
      onNavigate('appointment-management');
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 shadow-xs backdrop-blur-md">
      <div className="px-4 sm:px-6 lg:px-8 h-17 flex items-center justify-between gap-4">
        {/* Left: Hamburger & Brand */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0284c7] to-[#1e40af] flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
              <HeartPulse className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-slate-900 group-hover:text-[#0284c7] transition-colors">
                  Care<span className="text-[#0284c7]">Bridge</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-sky-100 text-[#0284c7]">
                  {userRole === 'patient' ? 'Patient Portal' : 'Hospital Portal'}
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 hidden sm:block -mt-0.5">
                Your Health, Our Priority
              </p>
            </div>
          </div>
        </div>

        {/* Center: Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="hidden md:flex flex-1 max-w-md items-center relative"
        >
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              userRole === 'patient'
                ? 'Search doctors, specialties (e.g. Cardiologist), hospitals...'
                : 'Search patient name, appointment ID, department...'
            }
            className="w-full pl-9.5 pr-4 py-2 bg-slate-100 hover:bg-slate-100/80 focus:bg-white text-sm text-slate-800 placeholder-slate-400 rounded-full border border-transparent focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none transition-all"
          />
        </form>

        {/* Right: Quick SOS, Role Switcher, Notifications & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Blue Button: Nearby Hospitals */}
          <button
            onClick={() => onNavigate('nearby-hospitals')}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 text-xs font-bold text-white bg-[#0284c7] hover:bg-sky-700 rounded-full shadow-sm shadow-sky-600/30 transition-all hover:scale-105 active:scale-95"
            title="Automatically detect GPS & find nearby hospitals"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Nearby Hospitals</span>
          </button>

          {/* Emergency SOS Button for instant assistance */}
          <button
            onClick={() => onNavigate('ambulance')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-full shadow-xs transition-all hover:scale-105 animate-pulse"
            title="Emergency SOS & Ambulance"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
            <span className="hidden sm:inline">SOS / 112</span>
            <span className="sm:hidden">SOS</span>
          </button>

          {/* Portal Indicator Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border bg-slate-50 text-slate-700 border-slate-200">
            <span className={`w-2 h-2 rounded-full ${userRole === 'patient' ? 'bg-[#0284c7]' : 'bg-[#1e40af]'}`} />
            <span>{userRole === 'patient' ? 'Patient Portal' : 'Hospital Portal'}</span>
          </div>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl relative transition-colors"
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50">
                <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-100 text-[#0284c7]">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-[#0284c7] hover:underline font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-50 px-2 py-1">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-center text-xs text-slate-400">No new notifications</p>
                  ) : (
                    notifications.slice(0, 5).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          setShowNotifMenu(false);
                          onNavigate('notifications');
                        }}
                        className={`p-2.5 rounded-xl text-left cursor-pointer transition-colors ${
                          !n.isRead ? 'bg-sky-50/60 hover:bg-sky-50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                          <span className="text-[10px] text-slate-400">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-2 px-4 border-t border-slate-100 text-center">
                  <button
                    onClick={() => {
                      setShowNotifMenu(false);
                      onNavigate('notifications');
                    }}
                    className="text-xs font-semibold text-[#0284c7] hover:underline"
                  >
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Badge / Menu */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
            >
              {(currentUser?.role === 'patient'
                ? (currentUser as any)?.avatar
                : (currentUser as any)?.staffAvatar || (currentUser as any)?.logo) ? (
                <img
                  src={
                    currentUser?.role === 'patient'
                      ? (currentUser as any)?.avatar
                      : (currentUser as any)?.staffAvatar || (currentUser as any)?.logo
                  }
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover border-2 border-sky-500/40"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-sky-100 text-[#0284c7] font-bold text-xs flex items-center justify-center border-2 border-sky-500/30">
                  {(
                    (currentUser?.role === 'patient'
                      ? (currentUser as any)?.fullName
                      : (currentUser as any)?.hospitalName || (currentUser as any)?.staffName) ||
                    (currentUser as any)?.email ||
                    'U'
                  )
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
              )}
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-slate-800 leading-tight">
                  {currentUser?.role === 'patient'
                    ? (currentUser as any).fullName || 'Patient'
                    : (currentUser as any).hospitalName || (currentUser as any).staffName || 'Hospital Administrator'}
                </p>
                <p className="text-[10px] text-slate-500 capitalize">
                  {currentUser?.role === 'patient' ? 'Verified Patient' : 'Clinical Administrator'}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs text-slate-400">Signed in as</p>
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {currentUser?.role === 'patient'
                      ? (currentUser as any).email
                      : (currentUser as any).email}
                  </p>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onNavigate(userRole === 'patient' ? 'profile' : 'hospital-settings');
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>{userRole === 'patient' ? 'My Profile' : 'Hospital Account'}</span>
                  </button>
                  {userRole === 'hospital' && (
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        onNavigate('hospital-settings');
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                    >
                      <ShieldCheck className="w-4 h-4 text-slate-400" />
                      <span>Facility Settings</span>
                    </button>
                  )}
                </div>

                <div className="pt-1 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                      onNavigate('welcome');
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-semibold"
                  >
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
