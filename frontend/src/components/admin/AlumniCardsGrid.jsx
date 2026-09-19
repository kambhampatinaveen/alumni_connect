import React, { useState } from 'react';
import { 
  Building, 
  MapPin, 
  GraduationCap, 
  Users, 
  Award, 
  Star, 
  MessageSquare, 
  Search, 
  Sparkles,
  DollarSign,
  ChevronRight,
  X,
  UserCheck,
  CheckCircle2
} from 'lucide-react';

export default function AlumniCardsGrid({ alumniList = [], activeFilter = 'activeAlumni', searchQuery = '', onSearchChange }) {
  const [selectedAlumni, setSelectedAlumni] = useState(null);

  // Filter title mapping
  const filterTitles = {
    totalAlumni: 'Total Registered Alumni',
    activeAlumni: 'Active Alumni Members',
    inactiveAlumni: 'Inactive Alumni (≥15 Days Inactive)',
    totalStudents: 'Total Enrolled Students',
    activeStudents: 'Active Students',
    inactiveStudents: 'Inactive Students',
    mentors: 'Active Mentors Available',
    connections: 'Student Connection Profiles',
    conversations: 'Active Conversation Members',
    contributions: 'Top Contributing Alumni'
  };

  const filterBadges = {
    totalAlumni: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', label: 'Registered' },
    activeAlumni: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Active Now' },
    inactiveAlumni: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Inactive' },
    totalStudents: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Student' },
    activeStudents: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', label: 'Active Student' },
    inactiveStudents: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Inactive Student' },
    mentors: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Verified Mentor' },
    connections: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200', label: 'Connected' },
    conversations: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: 'In Chat' },
    contributions: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Contributor' }
  };

  // 1. Filter by Metric Card selection
  const filterByMetric = (item) => {
    switch (activeFilter) {
      case 'activeAlumni':
        return (item.status || '').toUpperCase() === 'ACTIVE' || item.status === 'Verified';
      case 'inactiveAlumni':
        return (item.status || '').toUpperCase() === 'INACTIVE';
      case 'mentors':
        return item.availableForMentorship === true;
      case 'connections':
        return item.hasStudentConnection === true;
      case 'conversations':
        return item.activeConversation === true;
      case 'totalAlumni':
      default:
        return true;
    }
  };

  // 2. Filter by Search Query
  const filteredAlumni = alumniList.filter(item => {
    const matchesMetric = filterByMetric(item);
    if (!matchesMetric) return false;

    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase();
    const name = (item.name || '').toLowerCase();
    const company = (item.company || '').toLowerCase();
    const role = (item.role || item.designation || '').toLowerCase();
    const branch = (item.branch || item.department || '').toLowerCase();
    const location = (item.location || '').toLowerCase();
    const skills = Array.isArray(item.skills) ? item.skills.join(' ').toLowerCase() : '';

    return (
      name.includes(q) ||
      company.includes(q) ||
      role.includes(q) ||
      branch.includes(q) ||
      location.includes(q) ||
      skills.includes(q)
    );
  });

  // Helper for initial avatar color
  const getAvatarBg = (name = '') => {
    const char = name.trim().charAt(0).toUpperCase();
    if (['A', 'E', 'I', 'M', 'Q', 'U'].includes(char)) return 'bg-emerald-100 text-emerald-800';
    if (['B', 'F', 'J', 'N', 'R', 'V'].includes(char)) return 'bg-blue-100 text-blue-800';
    if (['C', 'G', 'K', 'O', 'S', 'W'].includes(char)) return 'bg-purple-100 text-purple-800';
    return 'bg-amber-100 text-amber-800';
  };

  const badgeInfo = filterBadges[activeFilter] || filterBadges.activeAlumni;

  return (
    <div className="space-y-4">
      {/* Directory Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
              {filterTitles[activeFilter] || 'Alumni Directory'}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Showing <strong className="text-indigo-600">{filteredAlumni.length}</strong> matching member cards
            </p>
          </div>
        </div>

        {/* Small Search Bar embedded right inside directory header if needed */}
        <div className="relative min-w-[260px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, company, skill..."
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            className="w-full pl-9 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange && onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Cards Grid */}
      {filteredAlumni.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200/80 rounded-2xl space-y-3">
          <Users className="w-10 h-10 mx-auto text-slate-300" />
          <h4 className="text-sm font-bold text-slate-700">No Alumni Found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No profiles match "{searchQuery}" under the "{filterTitles[activeFilter]}" filter.
          </p>
          <button
            onClick={() => onSearchChange && onSearchChange('')}
            className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors"
          >
            Clear Search Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredAlumni.map((item) => {
            const initial = (item.name || 'A').trim().charAt(0).toUpperCase();
            const avatarStyle = getAvatarBg(item.name);

            return (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-indigo-400 hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4 shadow-xs group"
              >
                {/* Top Profile Header */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Image or Letter Avatar */}
                      {item.avatar && item.avatar.includes('http') ? (
                        <img
                          src={item.avatar}
                          alt={item.name}
                          className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-xs group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className={`w-12 h-12 rounded-2xl ${avatarStyle} font-black text-lg flex items-center justify-center shadow-xs border border-white`}>
                          {initial}
                        </div>
                      )}

                      <div className="space-y-0.5 min-w-0">
                        <h4 className="font-bold text-slate-900 text-sm tracking-tight truncate group-hover:text-indigo-600 transition-colors">
                          {item.name}
                        </h4>
                        <p className="text-xs font-semibold text-indigo-600 leading-tight truncate">
                          {item.role || item.designation || 'Alumnus'}
                        </p>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeInfo.bg} ${badgeInfo.text} ${badgeInfo.border} shrink-0`}>
                      {badgeInfo.label}
                    </span>
                  </div>

                  {/* Info Tags */}
                  <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                    {/* Company */}
                    <div className="flex items-center gap-2 text-slate-700 font-semibold">
                      <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{item.company || 'Tech Organization'}</span>
                    </div>

                    {/* Degree & Year */}
                    <div className="flex items-center gap-2 text-slate-500">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">
                        B.Tech • {item.branch || 'CSE'} ({item.batch || '2024'})
                      </span>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-2 text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{item.location || 'India'}</span>
                    </div>
                  </div>

                  {/* Skill Badges */}
                  {Array.isArray(item.skills) && item.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {item.skills.slice(0, 3).map((skill, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold tracking-wide"
                        >
                          {skill}
                        </span>
                      ))}
                      {item.skills.length > 3 && (
                        <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-400 text-[10px] font-bold">
                          +{item.skills.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>{item.rating || 4.9}</span>
                  </div>

                  <button
                    onClick={() => setSelectedAlumni(item)}
                    className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 text-xs font-bold transition-all duration-150 flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Profile</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Profile Quick Detail */}
      {selectedAlumni && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl ${getAvatarBg(selectedAlumni.name)} font-black text-xl flex items-center justify-center`}>
                  {(selectedAlumni.name || 'A').charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedAlumni.name}</h3>
                  <p className="text-xs font-semibold text-indigo-600">{selectedAlumni.role} at {selectedAlumni.company}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAlumni(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-slate-50 rounded-xl space-y-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Department:</span>
                  <span className="font-bold text-slate-800">{selectedAlumni.department || selectedAlumni.branch}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">College & Batch:</span>
                  <span className="font-bold text-slate-800">{selectedAlumni.college || 'KIET'} ({selectedAlumni.batch})</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Location:</span>
                  <span className="font-bold text-slate-800">{selectedAlumni.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Mentorship Sessions:</span>
                  <span className="font-bold text-emerald-600">{selectedAlumni.mentorshipsCompleted || 12} Completed</span>
                </div>
              </div>

              {selectedAlumni.bio && (
                <div>
                  <h5 className="font-bold text-slate-800 mb-1">About</h5>
                  <p className="text-slate-600 leading-relaxed bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                    {selectedAlumni.bio}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedAlumni(null)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors"
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
