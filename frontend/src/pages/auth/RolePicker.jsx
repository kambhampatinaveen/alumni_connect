import React from 'react';
import { 
  ShieldCheck, 
  GraduationCap, 
  BookOpen, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  Users, 
  Briefcase, 
  Award,
  Zap
} from 'lucide-react';

export default function RolePicker({ onSelectRole, onNavigateToSignUp }) {
  const roles = [
    {
      id: 'admin',
      title: 'Administrator Portal',
      subtitle: 'Central command & platform oversight',
      description: 'Full administrative access to manage the entire alumni network, analytics, events, mentorship tracks, and platform settings.',
      icon: ShieldCheck,
      color: 'indigo',
      badge: 'Full Access',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      gradient: 'from-indigo-600 to-purple-600',
      borderGlow: 'hover:border-indigo-500/50 hover:shadow-indigo-500/20',
      demoEmail: 'admin@alumniconnect.edu',
      features: [
        'Manage Alumni & Student directories',
        'Real-time Engagement & Endowment Analytics',
        'Approve & moderate Job Referrals & Events',
        'Platform-wide Messaging & Global Settings'
      ]
    },
    {
      id: 'alumni',
      title: 'Alumni Portal',
      subtitle: 'Give back, mentor & hire talent',
      description: 'Connect with fellow graduates, offer mentorship to aspiring students, post company referrals, and participate in alumni events.',
      icon: GraduationCap,
      color: 'blue',
      badge: 'Mentor & Refer',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      gradient: 'from-blue-600 to-cyan-600',
      borderGlow: 'hover:border-blue-500/50 hover:shadow-blue-500/20',
      demoEmail: 'alumni@alumniconnect.edu',
      features: [
        '1-on-1 Student Mentorship & Mock Interviews',
        'Post Job Referrals at your company',
        'Accept or decline student connection requests',
        'Real-time student-alumni direct messaging'
      ]
    },
    {
      id: 'student',
      title: 'Student Portal',
      subtitle: 'Accelerate your career & network',
      description: 'Discover top alumni working at leading tech & finance companies, request 1-on-1 mentorship, apply for job referrals, and join workshops.',
      icon: BookOpen,
      color: 'emerald',
      badge: 'Career Growth',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      gradient: 'from-emerald-600 to-teal-600',
      borderGlow: 'hover:border-emerald-500/50 hover:shadow-emerald-500/20',
      demoEmail: 'student@alumniconnect.edu',
      features: [
        'Search Alumni directory by skill & company',
        'Request 1-on-1 career guidance sessions',
        'Apply for exclusive internal job referrals',
        'Attend alumni tech talks & career workshops'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-40 left-10 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px]" />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 pt-8 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <div className="font-bold text-xl tracking-tight text-white flex items-center gap-1.5">
              Alumni<span className="text-blue-400">Connect</span>
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Engagement & Networking Platform</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateToSignUp('alumni')}
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Create an Account
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto w-full px-6 py-8 flex-1 flex flex-col justify-center">
        {/* Hero title */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs font-semibold mb-4">
            <Zap className="w-3.5 h-3.5 text-blue-400" />
            Role-Based Access Control Enabled
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Choose Your <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">Portal Experience</span>
          </h1>
          <p className="mt-3.5 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">
            Select your role to access dedicated dashboards, tools, and personalized networking features.
          </p>
        </div>

        {/* 3 Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto w-full">
          {roles.map((r) => {
            const Icon = r.icon;
            return (
              <div
                key={r.id}
                className={`group relative rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-7 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 shadow-xl ${r.borderGlow}`}
              >
                {/* Top Badge & Icon */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${r.gradient} flex items-center justify-center text-white shadow-lg`}>
                      <Icon className="w-7 h-7" />
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${r.badgeColor}`}>
                      {r.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">
                    {r.title}
                  </h3>
                  <p className="text-xs font-semibold text-slate-400 mt-0.5 mb-3">{r.subtitle}</p>
                  <p className="text-sm text-slate-300/80 leading-relaxed mb-6">
                    {r.description}
                  </p>

                  {/* Feature list */}
                  <div className="space-y-2.5 pt-4 border-t border-slate-800/80 mb-6">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Key Capabilities:
                    </span>
                    {r.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2.5 pt-4">
                  <button
                    onClick={() => onSelectRole(r.id)}
                    className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r ${r.gradient} hover:opacity-95 text-white font-semibold text-sm shadow-lg transition-all duration-200 group-hover:scale-[1.02] cursor-pointer`}
                  >
                    <span>Sign In as {r.id.charAt(0).toUpperCase() + r.id.slice(1)}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <div className="text-center">
                    <span className="text-[11px] text-slate-500">
                      Demo: <code className="text-slate-400 font-mono">{r.demoEmail}</code>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Banner */}
        <div className="mt-12 text-center max-w-xl mx-auto">
          <p className="text-sm text-slate-400">
            Don't have an account yet?{' '}
            <button
              onClick={() => onNavigateToSignUp('student')}
              className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-4 cursor-pointer"
            >
              Sign up as an Alumnus or Student
            </button>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <p>© 2024-2025 AlumniConnect Platform. Team 9 Engineering.</p>
        <div className="flex items-center gap-4 text-slate-400">
          <span>Enterprise Role-Based Security</span>
          <span>•</span>
          <span>JWT Authenticated</span>
          <span>•</span>
          <span>Real-time Sync</span>
        </div>
      </footer>
    </div>
  );
}
