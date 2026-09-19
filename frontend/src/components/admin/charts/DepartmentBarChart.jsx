import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { BarChart3 } from 'lucide-react';

const COLORS = ['#0F4C81', '#0284C7', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-xl text-xs">
        <p className="font-semibold text-slate-900 mb-1">{label}</p>
        <p className="text-slate-600">
          Alumni: <span className="font-bold text-[#0F4C81]">{payload[0]?.value?.toLocaleString?.() ?? payload[0]?.value}</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function DepartmentBarChart({ data = [] }) {
  const hasData = Array.isArray(data) && data.length > 0;

  return (
    <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-xs flex flex-col h-full text-slate-900">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Department-wise Alumni</h3>
          <p className="text-xs text-slate-500 font-medium">Distribution across academic departments</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-blue-50 text-[#0F4C81] border border-blue-100">
          Department Sync
        </span>
      </div>

      <div className="w-full h-64 mt-2 flex items-center justify-center">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center text-slate-400 text-xs py-8">
            <BarChart3 className="w-8 h-8 mb-2 opacity-50" />
            <span>No department data available</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.8} vertical={false} />
              <XAxis 
                dataKey="department" 
                stroke="#64748b" 
                fontSize={11} 
                tickLine={false} 
                interval={0}
                angle={-20}
                textAnchor="end"
              />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
