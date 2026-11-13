import React, { useState, useEffect } from 'react';
import { DollarSign, CheckCircle, Clock, Search, Download, FileText, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import type { BillingRecord } from '../../types/index.js';

export const HospitalBillingView: React.FC = () => {
  const { currentUser } = useAuth();
  const hospital = currentUser as any;
  const hospitalId = hospital?.id;

  const [invoices, setInvoices] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!hospitalId) {
      setLoading(false);
      return;
    }
    fetch(`/api/hospital/billing?hospitalId=${hospitalId}`)
      .then((r) => r.json())
      .then((data) => setInvoices(data))
      .catch((e) => console.warn(e))
      .finally(() => setLoading(false));
  }, [hospitalId]);

  const totalRevenue = invoices.reduce((acc, inv) => acc + inv.amount, 0);

  const filteredInvoices = invoices.filter((inv) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        inv.patientName.toLowerCase().includes(q) ||
        inv.id.toLowerCase().includes(q) ||
        inv.serviceDescription.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Billing & Revenue Settlement
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Outpatient consultation invoices, payment receipt histories, and settlement records.
          </p>
        </div>

        <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-600" />
          <span>Settled Revenue: ₹{totalRevenue.toLocaleString()}</span>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search invoice ID, patient name, service..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:border-blue-600 outline-none"
          />
        </div>

        <div className="divide-y divide-slate-100">
          {filteredInvoices.map((inv) => (
            <div key={inv.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-xs shrink-0">
                  ₹
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900">{inv.id}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Paid
                    </span>
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900 mt-0.5">{inv.patientName}</h4>
                  <p className="text-xs text-slate-500">{inv.serviceDescription}</p>
                  <p className="text-[11px] text-slate-400">
                    Payment Method: {inv.paymentMethod || 'UPI / NetBanking'} • Date: {inv.date}
                  </p>
                </div>
              </div>

              <div className="text-right sm:self-center">
                <p className="text-lg font-black text-slate-900">₹{inv.amount}</p>
                <button
                  onClick={() => {
                    const content = `CareBridge Clinical Receipt\nInvoice ID: ${inv.id}\nPatient: ${inv.patientName}\nService: ${inv.serviceDescription}\nAmount: INR ${inv.amount}\nMethod: ${inv.paymentMethod || 'UPI / NetBanking'}\nDate: ${inv.date}`;
                    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${inv.id}_Receipt.txt`;
                    link.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="text-xs text-[#0284c7] font-bold hover:underline inline-flex items-center gap-1 mt-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Receipt</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
