import React, { useState, useEffect } from 'react';
import { Ambulance, AlertTriangle, Phone, Radio, MapPin, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import type { EmergencyRequest } from '../../types/index.js';

export const HospitalEmergencyView: React.FC = () => {
  const { currentUser } = useAuth();
  const hospital = currentUser as any;
  const hospitalId = hospital?.id;

  const [emergencies, setEmergencies] = useState<EmergencyRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEmergencies = async () => {
    if (!hospitalId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`/api/emergency/list?hospitalId=${hospitalId}`);
      if (res.ok) {
        const data = await res.json();
        setEmergencies(data);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmergencies();
    const interval = setInterval(fetchEmergencies, 6000);
    return () => clearInterval(interval);
  }, [hospitalId]);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 uppercase tracking-wider">
              Trauma Center Feed
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Emergency & ALS Ambulance Coordination
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time tracking of active in-transit ambulances, trauma arrivals, and bed pre-allotments.
          </p>
        </div>

        <div className="p-3 bg-red-50 rounded-2xl border border-red-200 text-xs text-red-800 font-bold flex items-center gap-2">
          <Radio className="w-4 h-4 text-red-600 animate-pulse" />
          <span>Active Emergencies: {emergencies.filter((e) => e.status !== 'Completed').length}</span>
        </div>
      </div>

      <div className="space-y-4">
        {emergencies.map((emg) => (
          <div
            key={emg.id}
            className={`bg-white rounded-3xl p-6 border-2 transition-all space-y-4 ${
              emg.status !== 'Completed'
                ? 'border-red-500 shadow-xl'
                : 'border-slate-200/80 shadow-xs opacity-90'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
                  <Ambulance className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    {emg.emergencyType} • Ref: {emg.id}
                  </h3>
                  <p className="text-xs text-slate-500">Patient: <strong className="text-slate-900">{emg.patientName}</strong> ({emg.patientPhone})</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-black bg-red-600 text-white uppercase tracking-wider">
                  {emg.severity}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                  {emg.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <span className="text-slate-400 font-medium block">GPS Location:</span>
                <p className="font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-red-500" />
                  {emg.locationAddress}
                </p>
              </div>

              <div>
                <span className="text-slate-400 font-medium block">Ambulance Vehicle:</span>
                <p className="font-bold text-slate-900">{emg.ambulanceId}</p>
                <p className="text-slate-500 text-[11px]">Driver: {emg.driverName} ({emg.driverPhone})</p>
              </div>

              <div>
                <span className="text-slate-400 font-medium block">ETA to ER Bay:</span>
                <p className="font-black text-red-600 text-lg">
                  {emg.status === 'Completed' ? 'Arrived / Handed Over' : `~${emg.estimatedArrivalMinutes || 8} Mins`}
                </p>
              </div>
            </div>

            {emg.notes && (
              <p className="text-xs text-slate-600">
                <strong>Paramedic Clinical Notes:</strong> {emg.notes}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
