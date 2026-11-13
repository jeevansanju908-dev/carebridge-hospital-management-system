import React, { useState, useEffect } from 'react';
import { History, ShieldCheck, Clock, User, CheckCircle, RefreshCw, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface ActivityLog {
  id: string;
  hospitalId: string;
  action: string;
  actor: string;
  timestamp: string;
  details: string;
}

export const HospitalActivityLogsView: React.FC = () => {
  const { currentUser } = useAuth();
  const hospital = currentUser as any;
  const hospitalId = hospital?.id;

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = async () => {
    if (!hospitalId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`/api/hospital/logs?hospitalId=${hospitalId}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [hospitalId]);

  const filteredLogs = logs.filter((log) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        log.action.toLowerCase().includes(q) ||
        log.actor.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Hospital Clinical Audit Trail & Activity Logs
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tamper-evident record of all appointment status changes, doctor roster updates, and bed allotments.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Audit Trail</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search action type, staff actor, or description..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:border-blue-600 outline-none"
          />
        </div>

        <div className="divide-y divide-slate-100">
          {filteredLogs.map((log) => (
            <div key={log.id} className="py-3.5 flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                <History className="w-4 h-4 text-[#1e40af]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-900">{log.action}</h4>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">{log.details}</p>
                <p className="text-[10px] text-slate-400 mt-1">Authorized Actor: {log.actor}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
