import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';

const defaultData = [
  { domain: 'Software Development', count: 42 },
  { domain: 'System Design', count: 32 },
  { domain: 'AI & Data Science', count: 25 },
  { domain: 'Product Management', count: 18 },
  { domain: 'Career Guidance', count: 15 }
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-xl text-xs">
        <p className="font-bold text-slate-900 mb-1">{payload[0]?.payload?.domain}</p>
        <p className="text-slate-600">
          Mentorship Requests: <span className="font-bold text-[#0F4C81]">{payload[0]?.value}</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function MentorshipDomainBarChart({ data = [] }) {
  const chartData = (Array.isArray(data) && data.length > 0) ? data.filter(d => (d.count || 0) > 0) : [];

  return (
    <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-xs flex flex-col h-full text-slate-900">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Most Common Mentorship Domains</h3>
          <p className="text-xs text-slate-500 font-medium">High-demand student guidance topics</p>
        </div>
      </div>

      <div className="w-full h-64 mt-2 flex items-center justify-center">
        {chartData.length === 0 ? (
          <div className="text-center text-slate-400">
            <p className="text-xs font-semibold text-slate-600">No Mentorship Domains Recorded</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Live student mentorship requests will populate topics</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={chartData}
              margin={{ top: 10, right: 20, left: 40, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.8} horizontal={false} />
              <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis
                type="category"
                dataKey="domain"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                width={120}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#0F4C81" radius={[0, 6, 6, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill="#0F4C81" opacity={1 - index * 0.14} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
