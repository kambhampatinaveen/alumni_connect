import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  CalendarDays, 
  Briefcase, 
  BookOpen,
  CalendarCheck,
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Award,
  MessageSquare,
  DollarSign,
  FileText,
  Settings,
  Search,
  UserCheck,
  X
} from 'lucide-react';
import { useAuth } from '../../lib/auth';

export default function Sidebar({ activeTab, setActiveTab, collapsed, setCollapsed, isOpen, onClose }) {
  const { user, role } = useAuth();

  // Navigation configurations based on role
  const getNavSections = () => {
    if (role === 'alumni') {
      return [
        {
          title: 'Alumni Workspace',
          items: [
            { id: 'alumni-dashboard', label: 'Alumni Dashboard', icon: LayoutDashboard },
            { id: 'mentorship', label: 'Mentorships & Classes', icon: BookOpen },
            { id: 'events', label: 'Events & Workshops', icon: CalendarDays },
            { id: 'referrals', label: 'Post Job Referrals', icon: Briefcase },
            { id: 'alumni-profile', label: 'Profile & Availability', icon: UserCheck },
          ]
        },
        {
          title: 'Community & Messages',
          items: [
            { id: 'chat', label: 'Student Messages', icon: MessageSquare, badge: 'Live' },
          ]
        }
      ];
    }

    if (role === 'student') {
      return [
        {
          title: 'Student Portal',
          items: [
            { id: 'student-dashboard', label: 'Student Dashboard', icon: LayoutDashboard },
            { id: 'mentorship', label: 'Mentorships & Classes', icon: BookOpen },
            { id: 'events', label: 'Events & Workshops', icon: CalendarDays },
            { id: 'referrals', label: 'Job Referrals Board', icon: Briefcase },
            { id: 'find-alumni', label: 'Find Alumni Mentors', icon: Search },
          ]
        },
        {
          title: 'Community & Messages',
          items: [
            { id: 'chat', label: 'Alumni Messages', icon: MessageSquare, badge: 'Live' },
          ]
        }
      ];
    }

    // Default: Admin has full access to the whole platform
    return [
      {
        title: 'Platform Administration',
        items: [
          { id: 'dashboard', label: 'Admin Analytics', icon: LayoutDashboard },
          { id: 'alumni', label: 'Manage Alumni', icon: Users },
          { id: 'students', label: 'Manage Students', icon: GraduationCap },
          { id: 'manage-events', label: 'Manage Events', icon: CalendarCheck },
        ]
      },
      {
        title: 'Operations & Programs',
        items: [
          { id: 'mentorship', label: 'Mentorships & Classes', icon: BookOpen },
          { id: 'referrals', label: 'Job Referrals', icon: Briefcase },
          { id: 'settings', label: 'Platform Settings', icon: Settings },
        ]
      }
    ];
  };

  const navSections = getNavSections();

  const getActiveGradient = () => {
    if (role === 'admin') return 'bg-gradient-to-r from-[#0F4C81] to-[#1E56A0] shadow-blue-900/30';
    if (role === 'alumni') return 'bg-gradient-to-r from-[#0284C7] to-[#0EA5E9] shadow-sky-900/30';
    return 'bg-gradient-to-r from-[#059669] to-[#10B981] shadow-emerald-900/30';
  };

  return (
    <>
      {/* Semi-transparent Backdrop Overlay when Drawer Sidebar is Open */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Slide-out Drawer Panel Sidebar */}
      <aside
        className={`fixed left-0 top-0 bottom-0 z-50 bg-[#0F2942] text-slate-100 border-r border-white/10 transition-transform duration-300 ease-in-out flex flex-col shadow-2xl ${
          isOpen ? 'translate-x-0 w-72' : '-translate-x-full w-72'
        }`}
      >
        {/* Brand Header & Close Button (Logo removed as requested) */}
        <div className="h-[76px] flex items-center justify-between px-6 border-b border-white/10 shrink-0 bg-[#0C2237]">
          <div 
            className="flex flex-col cursor-pointer select-none" 
            onClick={() => {
              if (role === 'alumni') setActiveTab('alumni-dashboard');
              else if (role === 'student') setActiveTab('student-dashboard');
              else setActiveTab('dashboard');
              if (onClose) onClose();
            }}
          >
            <div className="flex items-center gap-1.5 font-black text-lg tracking-tight text-white whitespace-nowrap leading-tight">
              <span>Alumni</span><span className="text-[#F59E0B]">Connect</span>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-sky-200/80 leading-tight mt-0.5">
              {role === 'admin' ? 'Admin Portal' : role === 'alumni' ? 'Alumni Portal' : 'Student Portal'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 text-slate-300 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
            title="Close Menu Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Menu */}
        <nav className="flex-1 py-6 px-4 space-y-6 overflow-y-auto custom-scrollbar">
          {navSections.map((section, sIdx) => (
            <div key={sIdx}>
              <div className="px-2 mb-3 text-[11px] font-bold uppercase tracking-widest text-slate-400 block">
                {section.title}
              </div>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        if (onClose) onClose();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer group ${
                        isActive
                          ? `${getActiveGradient()} text-white shadow-lg font-semibold`
                          : 'text-slate-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <Icon className={`w-5 h-5 shrink-0 transition-colors duration-200 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md ${
                          isActive ? 'bg-white/20 text-white' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
