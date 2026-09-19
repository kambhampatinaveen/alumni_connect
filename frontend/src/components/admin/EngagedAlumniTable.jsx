import React from 'react';
import { Award, Star, MessageSquare, Calendar, Building, ChevronRight } from 'lucide-react';

export default function EngagedAlumniTable({ alumni = [] }) {
  // If empty, supply default active mock data
  const defaultList = [
    { id: 'ALM-1', name: 'Dr. Aris Vance', department: 'Computer Science', batch: '2016', company: 'Google', role: 'Staff Engineer', mentorshipsCompleted: 24, eventsAttended: 12, engagementScore: 98, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' },
    { id: 'ALM-2', name: 'Sarah Jenkins', department: 'Business Admin', batch: '2018', company: 'McKinsey', role: 'Engagement Manager', mentorshipsCompleted: 19, eventsAttended: 15, engagementScore: 95, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
    { id: 'ALM-3', name: 'Marcus Chen', department: 'Electrical Eng', batch: '2015', company: 'Apple', role: 'Principal Architect', mentorshipsCompleted: 18, eventsAttended: 9, engagementScore: 91, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
    { id: 'ALM-4', name: 'Priya Sharma', department: 'Computer Science', batch: '2019', company: 'Microsoft', role: 'Senior Data Scientist', mentorshipsCompleted: 16, eventsAttended: 14, engagementScore: 88, avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150' },
    { id: 'ALM-5', name: 'David Miller', department: 'Biotechnology', batch: '2017', company: 'Pfizer', role: 'Lead Researcher', mentorshipsCompleted: 14, eventsAttended: 11, engagementScore: 85, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' },
  ];

  const rawData = alumni.length > 0 ? alumni : defaultList;
  
  // Strictly sort descending by engagementScore so top score (e.g. 98% / 95%) is always Rank 1
  const sortedData = [...rawData]
    .map((item, idx) => ({
      ...item,
      engagementScore: Number(item.engagementScore || [98, 95, 91, 88, 85][idx] || (95 - idx * 3))
    }))
    .sort((a, b) => b.engagementScore - a.engagementScore);

  return (
    <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            Top Engaged Alumni Leaderboard
          </h3>
          <p className="text-xs text-slate-500">Ranked by mentorship sessions, student guidance, and platform activity</p>
        </div>
        <span className="self-start sm:self-auto text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
          Academic Year 2024-25
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-3">Rank</th>
              <th className="py-3 px-3">Alumnus Profile</th>
              <th className="py-3 px-3">Department & Batch</th>
              <th className="py-3 px-3">Company & Role</th>
              <th className="py-3 px-3 text-center">Mentorships</th>
              <th className="py-3 px-3 text-center">Events</th>
              <th className="py-3 px-3 text-right">Engagement Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedData.map((item, idx) => (
              <tr key={item.id || idx} className="hover:bg-slate-50/70 transition-colors">
                {/* Rank */}
                <td className="py-3.5 px-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-lg font-bold text-xs bg-slate-100 text-slate-700">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                  </div>
                </td>

                {/* Profile */}
                <td className="py-3.5 px-3">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={item.avatar}
                      alt={item.name}
                      className="w-8 h-8 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block leading-tight">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-slate-400">{item.id}</span>
                    </div>
                  </div>
                </td>

                {/* Department */}
                <td className="py-3.5 px-3">
                  <div className="text-slate-800 font-medium">{item.department}</div>
                  <div className="text-[10px] text-slate-400">Class of {item.batch}</div>
                </td>

                {/* Company & Role */}
                <td className="py-3.5 px-3">
                  <div className="text-slate-900 font-semibold">{item.company}</div>
                  <div className="text-[10px] text-slate-500">{item.role}</div>
                </td>

                {/* Mentorships */}
                <td className="py-3.5 px-3 text-center">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 font-bold text-[11px]">
                    <MessageSquare className="w-3 h-3 text-purple-500" />
                    {item.mentorshipsCompleted}
                  </span>
                </td>

                {/* Events */}
                <td className="py-3.5 px-3 text-center">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[11px]">
                    <Calendar className="w-3 h-3 text-blue-500" />
                    {item.eventsAttended}
                  </span>
                </td>

                {/* Engagement Score */}
                <td className="py-3.5 px-3 text-right">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs">
                    {item.engagementScore}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
