import React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';

export function formatYYYYMMDD(date = new Date()) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function DatePicker({
  value,
  onChange,
  minDate = new Date(), // Global Calendar Rule: Default minimum selectable date is TODAY
  maxDate,
  required = false,
  className = '',
  ...props
}) {
  const min = minDate ? (typeof minDate === 'string' ? minDate : formatYYYYMMDD(minDate)) : formatYYYYMMDD(new Date());
  const max = maxDate ? (typeof maxDate === 'string' ? maxDate : formatYYYYMMDD(maxDate)) : undefined;

  return (
    <div className={`relative flex items-center ${className}`}>
      <input
        type="date"
        value={value || ''}
        min={min}
        max={max}
        required={required}
        onChange={(e) => onChange && onChange(e.target.value)}
        className="flex h-10 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 pl-10 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#0F4C81] focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20 transition-all cursor-pointer shadow-xs"
        {...props}
      />
      <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0F4C81]" />
    </div>
  );
}

export default DatePicker;
