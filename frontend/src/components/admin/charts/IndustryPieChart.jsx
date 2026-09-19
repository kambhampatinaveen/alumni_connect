import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const COLORS = ['#0F4C81', '#0284C7', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

const defaultData = [
  { industry: 'Technology', count: 920, percentage: 42 },
  { industry: 'Research', count: 350, percentage: 22 },
  { industry: 'Healthcare', count: 280, percentage: 18 },
  { industry: 'Education', count: 210, percentage: 18 }
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-xl text-xs">
        <p className="font-bold text-slate-900 mb-0.5">{data?.name}</p>
        <p className="text-slate-600">
          Alumni Count: <span className="font-bold text-[#0F4C81]">{data?.value}</span> ({data?.payload?.percentage ?? 0}%)
        </p>
      </div>
    );
  }
  return null;
};

export default function IndustryPieChart({ data = [] }) {
  const chartData = (Array.isArray(data) && data.length > 0) ? data.filter(d => (d.count || 0) > 0) : [];

  return (
    <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-xs flex flex-col h-full text-slate-900">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-base font-bold text-slate-900">Alumni by Industry</h3>
          <p className="text-xs text-slate-500 font-medium">Sector employment distribution</p>
        </div>
      </div>

      <div className="w-full h-64 flex items-center justify-center">
        {chartData.length === 0 ? (
          <div className="text-center text-slate-400">
            <p className="text-xs font-semibold text-slate-600">No Industry Data Available</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Alumni records will dynamically populate this chart</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={4}
                dataKey="count"
                nameKey="industry"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#ffffff" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span className="text-xs text-slate-600 font-medium ml-1">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
