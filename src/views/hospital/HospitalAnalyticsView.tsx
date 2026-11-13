import React, { useState, useEffect } from 'react';
import { BarChart3, Star, CalendarCheck, Users, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import type { Appointment } from '../../types/index.js';

export const HospitalAnalyticsView: React.FC = () => {
  const { currentUser } = useAuth();
  const hospital = currentUser as any;
  const hospitalId = hospital?.id;

  const [stats, setStats] = useState({
    totalPatients: 0,
    totalAppointments: 0,
    pendingAppointments: 0,
    approvedAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    totalDoctors: 0,
    availableDoctors: 0,
  });
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    if (!hospitalId) return;
    fetch(`/api/hospital/stats?hospitalId=${hospitalId}&scope=all`)
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data.totalAppointments === 'number') setStats(data);
      })
      .catch(() => {});

    fetch(`/api/appointments?scope=all`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setAppointments(data);
      })
      .catch(() => {});
  }, [hospitalId]);

  // Compute specialty breakdown dynamically from this hospital's appointments
  const specialtyCounts = appointments.reduce<Record<string, number>>((acc, apt) => {
    const spec = apt.doctorSpecialization || 'General Medicine';
    acc[spec] = (acc[spec] || 0) + 1;
    return acc;
  }, {});

  const totalSpecBookings = Object.values(specialtyCounts).reduce((a, b) => a + b, 0);
  const departments = Object.entries(specialtyCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({
      name,
      count,
      share: totalSpecBookings > 0 ? Math.round((count / totalSpecBookings) * 100) : 0,
    }));

  // Compute status breakdown dynamically
  const statusItems = [
    { label: 'Pending', count: stats.pendingAppointments },
    { label: 'Approved', count: stats.approvedAppointments },
    { label: 'Completed', count: stats.completedAppointments },
    { label: 'Cancelled', count: stats.cancelledAppointments },
  ];
  const maxStatusCount = Math.max(1, ...statusItems.map((s) => s.count));

  const doctorAvailabilityRate =
    stats.totalDoctors > 0
      ? Math.round((stats.availableDoctors / stats.totalDoctors) * 100)
      : 0;

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Hospital Clinical Analytics & Intelligence
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Live operational metrics, specialty distribution, and faculty availability for{' '}
          {hospital?.hospitalName || 'your hospital'}.
        </p>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5">
            <CalendarCheck className="w-3.5 h-3.5 text-[#0284c7]" />
            Total Appointments
          </span>
          <p className="text-3xl font-black text-slate-900 mt-2">{stats.totalAppointments}</p>
          <span className="text-xs font-semibold text-emerald-600">
            {stats.approvedAppointments} Approved • {stats.pendingAppointments} Pending
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-purple-600" />
            Registered Patients
          </span>
          <p className="text-3xl font-black text-slate-900 mt-2">{stats.totalPatients}</p>
          <span className="text-xs text-slate-400">Unique patients served</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-amber-500" />
            Completed Visits
          </span>
          <p className="text-3xl font-black text-[#0284c7] mt-2">{stats.completedAppointments}</p>
          <span className="text-xs text-slate-400">Consultations finalized</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            Doctor Availability
          </span>
          <p className="text-3xl font-black text-purple-700 mt-2">{doctorAvailabilityRate}%</p>
          <span className="text-xs text-slate-400">
            {stats.availableDoctors} Active OPD,{' '}
            {Math.max(0, stats.totalDoctors - stats.availableDoctors)} On Leave
          </span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Appointment Status Bar Chart */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#0284c7]" />
              Appointment Status Throughput
            </h3>
            <span className="text-xs text-slate-400">Live Hospital Queue</span>
          </div>

          <div className="flex items-end justify-between h-52 pt-6 gap-4">
            {statusItems.map((item) => {
              const heightPct =
                item.count === 0 ? 6 : Math.max(12, Math.round((item.count / maxStatusCount) * 100));
              return (
                <div key={item.label} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-[11px] font-bold text-slate-700">{item.count}</span>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full max-w-[64px] bg-gradient-to-t from-blue-800 to-sky-500 rounded-t-xl transition-all hover:opacity-90"
                  />
                  <span className="text-xs font-bold text-slate-500">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Department Volume Share */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-slate-900">Specialty Volume Distribution</h3>
            <span className="text-xs text-slate-400">Share %</span>
          </div>

          {departments.length === 0 ? (
            <p className="text-xs text-slate-400 py-10 text-center">
              Specialty distribution will populate as patients book appointments at this facility.
            </p>
          ) : (
            <div className="space-y-3.5">
              {departments.map((dept) => (
                <div key={dept.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-800">{dept.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-[11px] font-semibold">
                        {dept.count} visits
                      </span>
                      <span className="text-slate-900 font-black">{dept.share}%</span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      style={{ width: `${dept.share}%` }}
                      className="h-full bg-[#0284c7] rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
