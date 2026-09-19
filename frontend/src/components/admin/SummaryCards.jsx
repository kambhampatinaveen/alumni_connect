import React from 'react';
import { Users, UserCheck, GraduationCap, ArrowUpRight, CheckCircle2 } from 'lucide-react';

export default function SummaryCards({ data = {}, activeFilter = 'activeAlumni', onSelectFilter }) {
  const cards = [
    {
      key: 'totalAlumni',
      title: 'Total Alumni',
      value: data.totalAlumni != null ? data.totalAlumni.toLocaleString() : '0',
      growth: data.totalAlumniGrowth || 0,
      subtitle: `${data.totalAlumni || 0} registered`,
      icon: Users,
      color: 'bg-indigo-50 text-indigo-600',
      activeColor: 'bg-indigo-600 text-white',
      ringColor: 'ring-indigo-500 border-indigo-400 bg-indigo-50/50'
    },
    {
      key: 'activeAlumni',
      title: 'Active Alumni',
      value: data.activeAlumni != null ? data.activeAlumni.toLocaleString() : '0',
      growth: data.activeAlumniGrowth || 0,
      subtitle: data.totalAlumni ? `${Math.round((data.activeAlumni / data.totalAlumni) * 100)}% active (<30d)` : '0% active',
      icon: UserCheck,
      color: 'bg-blue-50 text-blue-600',
      activeColor: 'bg-blue-600 text-white',
      ringColor: 'ring-blue-500 border-blue-400 bg-blue-50/50'
    },
    {
      key: 'inactiveAlumni',
      title: 'Inactive Alumni',
      value: data.inactiveAlumni != null ? data.inactiveAlumni.toLocaleString() : '0',
      growth: 0,
      subtitle: `${data.inactiveAlumni || 0} inactive (≥30d)`,
      icon: Users,
      color: 'bg-amber-50 text-amber-600',
      activeColor: 'bg-amber-600 text-white',
      ringColor: 'ring-amber-500 border-amber-400 bg-amber-50/50'
    },
    {
      key: 'totalStudents',
      title: 'Total Students',
      value: data.totalStudents != null ? data.totalStudents.toLocaleString() : '0',
      growth: data.totalStudentsGrowth || 0,
      subtitle: `${data.totalStudents || 0} enrolled`,
      icon: GraduationCap,
      color: 'bg-emerald-50 text-emerald-600',
      activeColor: 'bg-emerald-600 text-white',
      ringColor: 'ring-emerald-500 border-emerald-400 bg-emerald-50/50'
    },
    {
      key: 'activeStudents',
      title: 'Active Students',
      value: data.activeStudents != null ? data.activeStudents.toLocaleString() : '0',
      growth: data.activeStudentsGrowth || 0,
      subtitle: data.totalStudents ? `${Math.round((data.activeStudents / data.totalStudents) * 100)}% active (<30d)` : '0% active',
      icon: UserCheck,
      color: 'bg-teal-50 text-teal-600',
      activeColor: 'bg-teal-600 text-white',
      ringColor: 'ring-teal-500 border-teal-400 bg-teal-50/50'
    },
    {
      key: 'inactiveStudents',
      title: 'Inactive Students',
      value: data.inactiveStudents != null ? data.inactiveStudents.toLocaleString() : '0',
      growth: 0,
      subtitle: `${data.inactiveStudents || 0} inactive (≥30d)`,
      icon: GraduationCap,
      color: 'bg-rose-50 text-rose-600',
      activeColor: 'bg-rose-600 text-white',
      ringColor: 'ring-rose-500 border-rose-400 bg-rose-50/50'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeFilter === card.key;
        return (
          <button
            type="button"
            key={card.key}
            onClick={() => onSelectFilter && onSelectFilter(card.key)}
            className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer relative flex flex-col justify-between group ${
              isActive 
                ? `ring-2 ${card.ringColor} shadow-md -translate-y-0.5` 
                : 'bg-white border-slate-200/80 shadow-xs hover:border-indigo-300 hover:shadow-sm'
            }`}
          >
            {isActive && (
              <div className="absolute -top-2 -right-2 bg-indigo-600 text-white p-0.5 rounded-full shadow-xs">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            )}

            <div className="flex items-center justify-between mb-3">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${isActive ? 'text-indigo-900 font-extrabold' : 'text-slate-500'}`}>
                {card.title}
              </span>
              <div className={`p-2 rounded-xl transition-colors ${isActive ? card.activeColor : card.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {card.value}
              </span>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>{card.subtitle}</span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

