import React, { useState, useEffect } from 'react';
import {
  BedDouble,
  Activity,
  Plus,
  Minus,
  CheckCircle,
  AlertTriangle,
  HeartPulse,
  User,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import type { BedWardInfo } from '../../types/index.js';

export const HospitalBedsManagementView: React.FC = () => {
  const { currentUser } = useAuth();
  const hospital = currentUser as any;
  const hospitalId = hospital?.id;

  const [wards, setWards] = useState<BedWardInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBeds = async () => {
    if (!hospitalId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`/api/hospital/beds?hospitalId=${hospitalId}`);
      if (res.ok) {
        const data = await res.json();
        setWards(data);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBeds();
  }, [hospitalId]);

  const updateOccupancy = async (ward: BedWardInfo, delta: number) => {
    const newOccupied = Math.max(0, Math.min(ward.totalBeds, ward.occupiedBeds + delta));
    try {
      const res = await fetch(`/api/hospital/beds/${ward.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ occupiedBeds: newOccupied }),
      });
      if (res.ok) {
        setWards((prev) =>
          prev.map((w) =>
            w.id === ward.id
              ? {
                  ...w,
                  occupiedBeds: newOccupied,
                  availableBeds: w.totalBeds - newOccupied,
                }
              : w
          )
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const totalBedsAcross = wards.reduce((acc, w) => acc + w.totalBeds, 0);
  const totalOccupied = wards.reduce((acc, w) => acc + w.occupiedBeds, 0);
  const totalAvailable = wards.reduce((acc, w) => acc + w.availableBeds, 0);
  const totalVentilators = wards.reduce((acc, w) => acc + w.ventilatorAvailable, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Beds & Ward Inpatient Capacity
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time occupancy management for Intensive Care Units (ICU), Oxygen beds, and General Wards.
          </p>
        </div>

        <button
          onClick={fetchBeds}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Sync Status</span>
        </button>
      </div>

      {/* Aggregate Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Total Facility Beds</span>
          <p className="text-3xl font-black text-slate-900 mt-2">{totalBedsAcross}</p>
          <p className="text-[11px] text-slate-500 mt-1">Registered Inpatient Wing</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-amber-600 uppercase">Occupied Beds</span>
          <p className="text-3xl font-black text-amber-600 mt-2">{totalOccupied}</p>
          <p className="text-[11px] text-slate-500 mt-1">
            {totalBedsAcross > 0 ? ((totalOccupied / totalBedsAcross) * 100).toFixed(0) : 0}% Occupancy Rate
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-emerald-600 uppercase">Vacant Available</span>
          <p className="text-3xl font-black text-emerald-600 mt-2">{totalAvailable}</p>
          <p className="text-[11px] text-slate-500 mt-1">Immediate Admission Ready</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-sky-600 uppercase">Standby Ventilators</span>
          <p className="text-3xl font-black text-[#0284c7] mt-2">{totalVentilators}</p>
          <p className="text-[11px] text-slate-500 mt-1">Life Support Equipped</p>
        </div>
      </div>

      {/* Ward Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {wards.map((ward) => {
          const occupancyRate = ((ward.occupiedBeds / ward.totalBeds) * 100).toFixed(0);

          return (
            <div
              key={ward.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-[#1e40af] flex items-center justify-center shrink-0">
                    <BedDouble className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">{ward.wardName}</h3>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                      Type: {ward.wardType}
                    </span>
                  </div>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    ward.availableBeds > 3
                      ? 'bg-emerald-100 text-emerald-800'
                      : ward.availableBeds > 0
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {ward.availableBeds} Vacant
                </span>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                  <span>Occupancy: {occupancyRate}%</span>
                  <span>{ward.occupiedBeds} / {ward.totalBeds} Beds Filled</span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    style={{ width: `${occupancyRate}%` }}
                    className={`h-full rounded-full transition-all ${
                      Number(occupancyRate) > 85
                        ? 'bg-red-500'
                        : Number(occupancyRate) > 60
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                  />
                </div>
              </div>

              {/* Details and Adjuster */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Nurse In-Charge:</span>
                  <p className="font-bold text-slate-800">{ward.nurseInCharge}</p>
                  <p className="text-[10px] text-sky-600 font-semibold mt-0.5">
                    Ventilators: {ward.ventilatorAvailable} Available
                  </p>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
                  <button
                    onClick={() => updateOccupancy(ward, -1)}
                    disabled={ward.occupiedBeds <= 0}
                    className="p-1.5 rounded-xl bg-white hover:bg-slate-200 text-slate-700 disabled:opacity-40 shadow-xs"
                    title="Discharge patient (decrease occupied beds)"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2 text-xs font-black text-slate-900">{ward.occupiedBeds}</span>
                  <button
                    onClick={() => updateOccupancy(ward, 1)}
                    disabled={ward.occupiedBeds >= ward.totalBeds}
                    className="p-1.5 rounded-xl bg-white hover:bg-slate-200 text-slate-700 disabled:opacity-40 shadow-xs"
                    title="Admit patient (increase occupied beds)"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
