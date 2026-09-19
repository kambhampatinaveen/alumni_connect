import React, { useState } from 'react';
import Header from '../../components/admin/Header';
import { 
  FileText, 
  Download, 
  Calendar, 
  BarChart3, 
  PieChart, 
  CheckCircle2, 
  ArrowUpRight,
  Filter,
  Layers,
  Sparkles
} from 'lucide-react';

export default function ReportsAnalytics({ onBack, onToggleSidebar }) {
  const [reportType, setReportType] = useState('annual');
  const [downloading, setDownloading] = useState(null);

  const reports = [
    {
      id: 'REP-01',
      title: 'Annual Alumni Engagement & Mentorship Audit (2023-2024)',
      type: 'Comprehensive PDF',
      size: '4.8 MB',
      date: 'Aug 30, 2024',
      downloads: 142,
      category: 'Auditing'
    },
    {
      id: 'REP-02',
      title: 'Q3 Department-wise Placement & Referral Conversion Matrix',
      type: 'Excel Sheet (.xlsx)',
      size: '1.4 MB',
      date: 'Sep 01, 2024',
      downloads: 89,
      category: 'Placements'
    },
    {
      id: 'REP-03',
      title: 'Global Alumni Geographical Distribution & Company Census',
      type: 'CSV Dataset',
      size: '850 KB',
      date: 'Sep 10, 2024',
      downloads: 215,
      category: 'Demographics'
    },
    {
      id: 'REP-04',
      title: 'Mentorship Track Satisfaction & Feedback Scorecard',
      type: 'Executive Summary PDF',
      size: '2.1 MB',
      date: 'Sep 12, 2024',
      downloads: 67,
      category: 'Mentorship'
    }
  ];

  const handleDownload = (id) => {
    setDownloading(id);
    setTimeout(() => {
      setDownloading(null);
      alert('Report generated and downloaded successfully!');
    }, 1000);
  };

  return (
    <div className="flex-1 min-w-0 bg-[#EBF3FA] pb-16 min-h-screen">
      <Header
        title="Analytics & Official Reports"
        subtitle="Export accreditation documents, engagement data matrices, and demographic benchmarks."
        onBack={onBack}
        onToggleSidebar={onToggleSidebar}
      />

      <main className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Platform Data Exports
            </h1>
            <p className="text-slate-500 text-xs mt-1 font-medium">
              Download pre-formatted NIRF, NAAC and internal management audits.
            </p>
          </div>

          <button 
            onClick={() => alert('Generating customized real-time data export...')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F4C81] hover:bg-[#0d3d68] text-white text-xs font-bold shadow-md shadow-blue-900/20 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Generate Custom Export</span>
          </button>
        </div>

        {/* Summary highlight cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
            <div className="flex items-center justify-between text-[#0F4C81] mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0F4C81]">Accreditation Ready</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 mb-1">NAAC / NIRF Data Sync</h3>
            <p className="text-xs text-slate-600 leading-relaxed">All alumni engagement hours, contributions, and placement metrics are pre-formatted for compliance.</p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
            <div className="flex items-center justify-between text-[#0F4C81] mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0F4C81]">Real-time Telemetry</span>
              <BarChart3 className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 mb-1">Live Query Engine</h3>
            <p className="text-xs text-slate-600 leading-relaxed">Query over 5,200 alumni records across 14 batches with multi-parameter filtering.</p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
            <div className="flex items-center justify-between text-[#0F4C81] mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0F4C81]">Automated Delivery</span>
              <Calendar className="w-4 h-4 text-amber-600" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 mb-1">Weekly Digest Scheduled</h3>
            <p className="text-xs text-slate-600 leading-relaxed">Dean & HOD executive briefings sent every Monday morning automatically.</p>
          </div>
        </div>

        {/* Available Documents List */}
        <div className="rounded-2xl bg-white border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <h3 className="font-extrabold text-slate-900 text-base">Archived & Pre-Compiled Reports</h3>
            <span className="text-xs font-medium text-slate-500">Showing all verified platform audits</span>
          </div>

          <div className="divide-y divide-slate-100">
            {reports.map((r) => (
              <div key={r.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0F4C81] flex items-center justify-center shrink-0 border border-blue-100 font-bold">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm hover:text-[#0F4C81] transition-colors cursor-pointer">
                      {r.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1 font-medium">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold uppercase">{r.category}</span>
                      <span>{r.type}</span>
                      <span>•</span>
                      <span>{r.size}</span>
                      <span>•</span>
                      <span>Updated {r.date}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDownload(r.id)}
                  disabled={downloading === r.id}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-200 transition-all cursor-pointer shrink-0"
                >
                  <Download className="w-3.5 h-3.5 text-[#0F4C81]" />
                  <span>{downloading === r.id ? 'Preparing…' : 'Download'}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
