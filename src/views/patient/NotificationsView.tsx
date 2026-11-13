import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCheck,
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Info,
  X,
  Trash2,
  Archive,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import type { AppNotification } from '../../types/index.js';

interface NotificationsViewProps {
  onNavigateToApt?: () => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({ onNavigateToApt }) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [archivedNotifs, setArchivedNotifs] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const fetchNotifs = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const [activeRes, recordRes] = await Promise.all([
        fetch(`/api/notifications?userId=${currentUser.id}&role=${currentUser.role}`),
        fetch(`/api/notifications/records?userId=${currentUser.id}&role=${currentUser.role}`),
      ]);

      if (activeRes.ok) {
        const data = await activeRes.json();
        setNotifications(data);
      }
      if (recordRes.ok) {
        const recordsData: AppNotification[] = await recordRes.json();
        setArchivedNotifs(recordsData.filter((n) => n.isDeleted));
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, [currentUser]);

  const showToast = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (e) {
      console.warn(e);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser?.id }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      showToast('All notifications marked as read.');
    } catch (e) {
      console.warn(e);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const deletedItem = notifications.find((n) => n.id === id);
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        if (deletedItem) {
          setArchivedNotifs((prev) => [
            { ...deletedItem, isDeleted: true, deletedAt: new Date().toISOString() },
            ...prev,
          ]);
        }
        showToast('Notification removed from active alerts and archived in Records.');
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const handleClearAll = async () => {
    if (!currentUser?.id) return;
    if (!confirm('Are you sure you want to clear all active notifications? They will be removed from your active feed and safely preserved in the audit Records archive.')) {
      return;
    }

    try {
      const res = await fetch('/api/notifications/clear-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      if (res.ok) {
        setNotifications([]);
        fetchNotifs();
        showToast('All active notifications cleared and preserved in Records audit archive.');
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const currentList = activeTab === 'active' ? notifications : archivedNotifs;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Notification Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time updates regarding appointment approvals, doctor reschedules, and clinical alerts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {activeTab === 'active' && unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="px-3.5 py-2 bg-sky-50 hover:bg-sky-100 text-[#0284c7] border border-sky-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark All as Read</span>
            </button>
          )}

          {activeTab === 'active' && notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
              title="Clear all active notifications (safely archived in Records audit log)"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear All Notifications</span>
            </button>
          )}
        </div>
      </div>

      {/* Toast Feedback */}
      {feedbackMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Notice box */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-slate-600">
        <Info className="w-4 h-4 text-[#0284c7] shrink-0 mt-0.5" />
        <p>
          <strong>Audit Preservation Policy:</strong> Deleting notifications removes them from your live alert badge.
          In compliance with healthcare auditing standards, all deleted notifications are safely retained in the{' '}
          <strong>Records section</strong> and will never affect or delete your appointment bookings or medical documents.
        </p>
      </div>

      {/* View Tabs: Active vs Archived */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
            activeTab === 'active'
              ? 'bg-[#0284c7] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Active Notifications</span>
          <span
            className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'active' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {notifications.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('archived')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
            activeTab === 'archived'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Archive className="w-4 h-4" />
          <span>Archived in Records</span>
          <span
            className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'archived' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {archivedNotifs.length}
          </span>
        </button>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs space-y-3">
        {loading ? (
          <p className="text-center text-xs text-slate-400 py-8">Loading notifications...</p>
        ) : currentList.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <Bell className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700">
              {activeTab === 'active' ? 'No Active Notifications' : 'No Archived Notifications'}
            </p>
            <p className="text-[11px] text-slate-400">
              {activeTab === 'active'
                ? 'All caught up! You will be alerted when doctors update your visits.'
                : 'Deleted notifications will be archived here.'}
            </p>
          </div>
        ) : (
          currentList.map((n) => (
            <div
              key={n.id}
              onClick={() => activeTab === 'active' && markAsRead(n.id)}
              className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                activeTab === 'active' && !n.isRead
                  ? 'bg-sky-50/70 border-sky-200 shadow-xs cursor-pointer'
                  : 'bg-slate-50/60 border-slate-100 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    n.type === 'emergency'
                      ? 'bg-red-100 text-red-600'
                      : n.type === 'appointment_status'
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-sky-100 text-[#0284c7]'
                  }`}
                >
                  {n.type === 'emergency' ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : n.type === 'appointment_status' ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Calendar className="w-4 h-4" />
                  )}
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-extrabold text-slate-900">{n.title}</h4>
                    {activeTab === 'active' && !n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#0284c7] animate-pulse" />
                    )}
                    {n.isDeleted && (
                      <span className="px-2 py-0.2 rounded text-[9px] font-bold bg-slate-200 text-slate-700">
                        Archived
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                  <p className="text-[10px] text-slate-400 pt-1 flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(n.createdAt).toLocaleString()}</span>
                    {n.deletedAt && (
                      <span>• Cleared: {new Date(n.deletedAt).toLocaleString()}</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {activeTab === 'active' && !n.isRead && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(n.id);
                    }}
                    className="text-[11px] font-bold text-[#0284c7] hover:underline"
                  >
                    Mark read
                  </button>
                )}

                {activeTab === 'active' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNotification(n.id);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete notification (archived in Records)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
