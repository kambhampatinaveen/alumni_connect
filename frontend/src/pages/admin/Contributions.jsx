import React, { useState } from 'react';
import Header from '../../components/admin/Header';
import { 
  DollarSign, 
  TrendingUp, 
  Heart, 
  Award, 
  Download, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  Building2,
  Calendar
} from 'lucide-react';

export default function Contributions({ onBack, onToggleSidebar }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');

  const stats = [
    { label: 'Total Contributions', value: '₹14,25,000', change: '+28.4%', icon: DollarSign, color: 'emerald' },
    { label: 'Active Donors', value: '184 Alumni', change: '+12.5%', icon: Heart, color: 'rose' },
    { label: 'Endowment Projects', value: '12 Active', change: '4 Completed', icon: Building2, color: 'blue' },
    { label: 'Average Contribution', value: '₹7,745', change: '+15.2%', icon: TrendingUp, color: 'amber' },
  ];

  const projects = [
    {
      id: 'PRJ-1',
      title: 'AI & Robotics Research Lab Fund',
      target: 1000000,
      raised: 750000,
      donors: 64,
      category: 'Infrastructure',
      deadline: 'Oct 31, 2024'
    },
    {
      id: 'PRJ-2',
      title: 'Merit-Based Need Scholarships 2024',
      target: 500000,
      raised: 420000,
      donors: 82,
      category: 'Student Aid',
      deadline: 'Nov 15, 2024'
    },
    {
      id: 'PRJ-3',
      title: 'Annual Hackathon & Innovation Grant',
      target: 250000,
      raised: 255000,
      donors: 38,
      category: 'Events',
      deadline: 'Funded',
      completed: true
    }
  ];

  const donors = [
    {
      id: 'DON-01',
      name: 'Vikram Mehta',
      batch: '2014',
      company: 'Microsoft',
      amount: '₹1,50,000',
      project: 'AI & Robotics Research Lab Fund',
      date: 'Sep 12, 2024',
      status: 'Verified',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
    },
    {
      id: 'DON-02',
      name: 'Ananya Deshmukh',
      batch: '2017',
      company: 'Google',
      amount: '₹75,000',
      project: 'Merit-Based Need Scholarships 2024',
      date: 'Sep 10, 2024',
      status: 'Verified',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'
    },
    {
      id: 'DON-03',
      name: 'Rohit Sharma',
      batch: '2019',
      company: 'Stripe',
      amount: '₹50,000',
      project: 'Annual Hackathon & Innovation Grant',
      date: 'Sep 05, 2024',
      status: 'Verified',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'
    },
    {
      id: 'DON-04',
      name: 'Dr. Sarah Jenkins',
      batch: '2018',
      company: 'McKinsey',
      amount: '₹1,00,000',
      project: 'Merit-Based Need Scholarships 2024',
      date: 'Aug 28, 2024',
      status: 'Verified',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
    }
  ];

  const filteredDonors = donors.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.company.toLowerCase().includes(search.toLowerCase()) ||
    d.project.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 min-w-0 bg-[#f8fafc] pb-12 min-h-screen">
      <Header
        title="Alumni Contributions & Endowment"
        subtitle="Track alumni donations, scholarships, laboratory sponsorships, and endowment drives"
        onBack={onBack}
        onToggleSidebar={onToggleSidebar}
      />

      <main className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Institutional Endowment Overview
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => alert('Exporting financial report CSV...')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Report</span>
            </button>
            <button 
              onClick={() => alert('New Campaign Modal: Campaign creation is enabled for Administrators.')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Campaign</span>
            </button>
          </div>
        </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">{stat.label}</span>
                <div className="p-2 rounded-xl bg-slate-800 text-slate-300">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-white tracking-tight">{stat.value}</span>
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  {stat.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Campaigns */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <Award className="w-5 h-5 text-blue-400" />
          Active Endowment Campaigns
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {projects.map(proj => {
            const percent = Math.min(100, Math.round((proj.raised / proj.target) * 100));
            return (
              <div key={proj.id} className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {proj.category}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {proj.deadline}
                    </span>
                  </div>
                  <h3 className="font-semibold text-white text-base leading-snug">{proj.title}</h3>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Raised: <strong className="text-white">₹{(proj.raised/100000).toFixed(2)}L</strong></span>
                    <span className="text-slate-400">Target: <strong className="text-slate-300">₹{(proj.target/100000).toFixed(2)}L</strong></span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${percent >= 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>{proj.donors} Alumni Contributors</span>
                    <span className="font-semibold text-blue-400">{percent}% Funded</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Donor Leaderboard Table */}
      <div className="rounded-2xl bg-slate-900/70 border border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-white text-base">Recent Contributions Ledger</h3>
            <p className="text-xs text-slate-400">Audited and verified alumni donations for 2024</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text"
              placeholder="Search donor or campaign..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Donor Name</th>
                <th className="py-3 px-4">Company & Batch</th>
                <th className="py-3 px-4">Allocated Project</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredDonors.map((d) => (
                <tr key={d.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 flex items-center gap-3">
                    <img src={d.avatar} alt={d.name} className="w-8 h-8 rounded-full object-cover border border-slate-700" />
                    <span className="font-semibold text-white">{d.name}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    <div>{d.company}</div>
                    <div className="text-[11px] text-slate-500">Batch of {d.batch}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-300 max-w-xs truncate">{d.project}</td>
                  <td className="py-3 px-4 font-bold text-emerald-400">{d.amount}</td>
                  <td className="py-3 px-4 text-slate-400">{d.date}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      {d.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </main>
    </div>
  );
}
