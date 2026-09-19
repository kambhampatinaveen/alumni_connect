import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

const defaultData = [
  { month: 'Q1 2025', webinars: 12, workshops: 8, reunions: 5 },
  { month: 'Q2 2025', webinars: 15, workshops: 11, reunions: 8 },
  { month: 'Q3 2025', webinars: 18, workshops: 14, reunions: 10 },
  { month: 'Q4 2025', webinars: 22, workshops: 17, reunions: 14 }
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-xl text-xs space-y-1">
        <p className="font-bold text-slate-900 mb-1 border-b border-slate-100 pb-1">{label}</p>
        {payload.map((p, idx) => (
          <div key={idx} className="flex items-center justify-between gap-4">
            <span style={{ color: p.color }} className="font-medium">{p.name}:</span>
            <span className="font-bold text-slate-900">{p?.value} attendees</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function EventAreaChart({ data = [] }) {
  const chartData = (Array.isArray(data) && data.length > 0) 
    ? data 
    : [
        { month: 'Q1 2025', webinars: 0, workshops: 0, reunions: 0 },
        { month: 'Q2 2025', webinars: 0, workshops: 0, reunions: 0 },
        { month: 'Q3 2025', webinars: 0, workshops: 0, reunions: 0 },
        { month: 'Q4 2025', webinars: 0, workshops: 0, reunions: 0 }
      ];

  return (
    <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-xs flex flex-col h-full text-slate-900">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Event Participation</h3>
          <p className="text-xs text-slate-500 font-medium">Quarterly breakdown by event categories</p>
        </div>
      </div>

      <div className="w-full h-64 mt-2 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorReunions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ec4899" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorWebinars" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0F4C81" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#0F4C81" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorWorkshops" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.8} />
            <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              iconSize={8}
              formatter={(value) => <span className="text-xs text-slate-600 font-medium ml-1">{value}</span>}
            />
            <Area type="monotone" dataKey="reunions" name="Reunions" stroke="#ec4899" fillOpacity={1} fill="url(#colorReunions)" />
            <Area type="monotone" dataKey="webinars" name="Webinars" stroke="#0F4C81" fillOpacity={1} fill="url(#colorWebinars)" />
            <Area type="monotone" dataKey="workshops" name="Workshops" stroke="#10B981" fillOpacity={1} fill="url(#colorWorkshops)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
