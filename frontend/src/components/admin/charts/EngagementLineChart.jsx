import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { TrendingUp } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-xl text-xs space-y-1">
        <p className="font-bold text-slate-900 border-b border-slate-100 pb-1 mb-1">{label} Summary</p>
        {payload.map((p, idx) => (
          <div key={idx} className="flex items-center justify-between gap-4">
            <span style={{ color: p.color }} className="font-medium">{p.name}:</span>
            <span className="font-bold text-slate-900">{p?.value?.toLocaleString?.() ?? p?.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function EngagementLineChart({ data = [] }) {
  const hasData = Array.isArray(data) && data.length > 0;

  return (
    <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-xs flex flex-col h-full text-slate-900">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Engagement Trend</h3>
          <p className="text-xs text-slate-500 font-medium">Monthly active users & activity volume</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[11px] font-medium text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0F4C81]"></span> Active
          </span>
          <span className="flex items-center gap-1 text-[11px] font-medium text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Mentorship
          </span>
        </div>
      </div>

      <div className="w-full h-64 mt-2 flex items-center justify-center">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center text-slate-400 text-xs py-8">
            <TrendingUp className="w-8 h-8 mb-2 opacity-50" />
            <span>No engagement trend data available</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.8} />
              <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="activeUsers"
                name="Active Users"
                stroke="#0F4C81"
                strokeWidth={3}
                dot={{ r: 4, fill: '#0F4C81' }}
                activeDot={{ r: 6, stroke: '#1E3A8A', strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="mentorshipSessions"
                name="Mentorship Sessions"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 4, fill: '#10b981' }}
                activeDot={{ r: 6, stroke: '#34d399', strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="eventAttendees"
                name="Event Attendees"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 3, fill: '#f59e0b' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
