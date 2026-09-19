import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  CalendarDays, 
  BookOpen, 
  Briefcase, 
  DollarSign, 
  MessageSquare, 
  BarChart3, 
  FileText, 
  Settings, 
  LogOut, 
  Bell, 
  Search, 
  Send, 
  Check, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  MoreVertical,
  ChevronDown,
  Layers,
  Database,
  Code2,
  Cpu
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell 
} from 'recharts';

export default function PlatformShowcase({ onSelectRole, onNavigateTab }) {
  // Chat state in Panel 5
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: 'them', text: "Hi Rahul, I'm in 3rd year CSE. I want to prepare for placements. Can you guide me?", time: '10:30 AM' },
    { id: 2, sender: 'me', text: "Sure! Focus on DSA and build 2-3 good projects.", time: '10:32 AM' },
    { id: 3, sender: 'them', text: "Which technologies should I learn?", time: '10:33 AM' },
    { id: 4, sender: 'me', text: "Start with React + Node.js and understand the fundamentals well.", time: '10:35 AM' }
  ]);
  const [chatInput, setChatInput] = useState('');

  // Alumni Connect request state (Panel 1 -> 2 -> 3)
  const [connectionStep, setConnectionStep] = useState(1); // 1 = Find, 2 = Sent, 3 = Accepted
  const [connectedAlumnus, setConnectedAlumnus] = useState('Rahul Kumar');

  // Chart Data (Matching screenshot numbers)
  const engagementData = [
    { year: '2022', rate: 42 },
    { year: '2023', rate: 51 },
    { year: '2024', rate: 63 },
    { year: '2025', rate: 71 },
    { year: '2026', rate: 78 },
  ];

  const deptData = [
    { name: 'CSE', value: 1820 },
    { name: 'ECE', value: 1150 },
    { name: 'EEE', value: 760 },
    { name: 'MECH', value: 520 },
    { name: 'CIVIL', value: 420 },
    { name: 'IT', value: 570 },
  ];

  const industryData = [
    { name: 'IT', value: 55, color: '#3b82f6' },
    { name: 'Finance', value: 15, color: '#6366f1' },
    { name: 'Healthcare', value: 10, color: '#f59e0b' },
    { name: 'Education', value: 8, color: '#10b981' },
    { name: 'Others', value: 12, color: '#94a3b8' },
  ];

  const topAlumni = [
    { name: 'Rahul Kumar', dept: 'CSE • 2022', score: '92%', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' },
    { name: 'Priya Sharma', dept: 'ECE • 2021', score: '88%', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
    { name: 'Arun Verma', dept: 'CSE • 2020', score: '84%', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
    { name: 'Sai Krishna', dept: 'IT • 2021', score: '81%', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' },
    { name: 'Neha Reddy', dept: 'CSE • 2023', score: '78%', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150' },
  ];

  const recentActivities = [
    { name: 'Rahul Kumar', action: 'mentored a student', time: '10 min ago', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' },
    { name: 'Priya Sharma', action: 'attended Alumni Meet', time: '1 hour ago', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
    { name: 'Arun Verma', action: 'referred a student', time: '3 hours ago', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
    { name: 'Neha Reddy', action: 'contributed ₹5,000', time: '5 hours ago', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150' },
    { name: 'Sai Krishna', action: 'started a mentorship', time: '1 day ago', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' },
  ];

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const msg = {
      id: Date.now(),
      sender: 'them',
      text: chatInput.trim(),
      time: 'Just now'
    };
    setChatMessages([...chatMessages, msg]);
    setChatInput('');

    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'me',
          text: "I'd be glad to help! Let's schedule a 30-min call this Saturday to review your resume.",
          time: 'Just now'
        }
      ]);
    }, 1000);
  };

  const handleConnectClick = (name) => {
    setConnectedAlumnus(name);
    setConnectionStep(2);
    setTimeout(() => setConnectionStep(3), 1500);
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-800 p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* ─── Top Main Platform Header ─────────────────────────────────────────── */}
      <div className="text-center space-y-1 mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Alumni Connect & Engagement Platform
        </h1>
        <p className="text-xs sm:text-sm font-medium text-slate-500">
          Connect. Engage. Mentor. Grow Together.
        </p>

        {/* Interactive portal switcher bar */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-3">
          <span className="text-xs font-semibold text-slate-500 mr-1">Switch to Portal:</span>
          <button 
            onClick={() => onSelectRole('admin')}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>🛡️ Admin Portal</span>
          </button>
          <button 
            onClick={() => onSelectRole('alumni')}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>🎓 Alumni Portal</span>
          </button>
          <button 
            onClick={() => onSelectRole('student')}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>📖 Student Portal</span>
          </button>
        </div>
      </div>

      {/* ─── Main 3-Column Visual Layout (Matching the user screenshot) ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1700px] mx-auto items-start">
        
        {/* ═════════════════════════════════════════════════════════════════════
            LEFT COLUMN: 
            1. Student Side - Find Alumni
            2. Student Request to Connect
            3. Alumni Accepts Request
           ═════════════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-3 space-y-5">
          
          {/* 1. Student Side - Find Alumni */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3.5">
            <div className="inline-block px-3 py-1 rounded-md bg-indigo-600 text-white text-[11px] font-bold">
              1. Student Side - Find Alumni
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-800">Find & Connect with Alumni</h3>
              <div className="relative mt-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search alumni by name, skills, company..."
                  className="w-full pl-8 pr-3 py-1.5 text-[11px] bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Filters row */}
              <div className="grid grid-cols-3 gap-1.5 mt-2 text-[10px]">
                <div className="bg-slate-50 border border-slate-200 p-1 rounded flex items-center justify-between text-slate-600 font-medium">
                  <span>Department</span>
                  <ChevronDown className="w-2.5 h-2.5" />
                </div>
                <div className="bg-slate-50 border border-slate-200 p-1 rounded flex items-center justify-between text-slate-600 font-medium">
                  <span>Batch</span>
                  <ChevronDown className="w-2.5 h-2.5" />
                </div>
                <div className="bg-slate-50 border border-slate-200 p-1 rounded flex items-center justify-between text-slate-600 font-medium">
                  <span>Industry</span>
                  <ChevronDown className="w-2.5 h-2.5" />
                </div>
              </div>
            </div>

            {/* Alumni mini cards */}
            <div className="space-y-2.5 pt-1">
              {/* Alumnus 1 */}
              <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 space-y-2">
                <div className="flex items-center gap-2.5">
                  <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" alt="Rahul" className="w-9 h-9 rounded-full object-cover" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Rahul Kumar</h4>
                    <p className="text-[10px] text-slate-500">CSE • 2022</p>
                    <p className="text-[10px] text-slate-600 font-medium">Software Engineer @ TCS</p>
                  </div>
                </div>
                <div className="flex gap-1 text-[9px] text-slate-600 font-medium">
                  <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded">React</span>
                  <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded">Node.js</span>
                  <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded">MongoDB</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                  <button className="py-1 text-[10px] font-semibold border border-slate-200 rounded-md text-slate-700 bg-white hover:bg-slate-50">
                    View Profile
                  </button>
                  <button 
                    onClick={() => handleConnectClick('Rahul Kumar')}
                    className="py-1 text-[10px] font-semibold rounded-md text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
                  >
                    Connect
                  </button>
                </div>
              </div>

              {/* Alumnus 2 */}
              <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 space-y-2">
                <div className="flex items-center gap-2.5">
                  <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" alt="Priya" className="w-9 h-9 rounded-full object-cover" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Priya Sharma</h4>
                    <p className="text-[10px] text-slate-500">ECE • 2021</p>
                    <p className="text-[10px] text-slate-600 font-medium">Analyst @ Deloitte</p>
                  </div>
                </div>
                <div className="flex gap-1 text-[9px] text-slate-600 font-medium">
                  <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded">SQL</span>
                  <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded">Python</span>
                  <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded">Power BI</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                  <button className="py-1 text-[10px] font-semibold border border-slate-200 rounded-md text-slate-700 bg-white hover:bg-slate-50">
                    View Profile
                  </button>
                  <button 
                    onClick={() => handleConnectClick('Priya Sharma')}
                    className="py-1 text-[10px] font-semibold rounded-md text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
                  >
                    Connect
                  </button>
                </div>
              </div>

              {/* Alumnus 3 */}
              <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 space-y-2">
                <div className="flex items-center gap-2.5">
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" alt="Arun" className="w-9 h-9 rounded-full object-cover" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Arun Verma</h4>
                    <p className="text-[10px] text-slate-500">CSE • 2020</p>
                    <p className="text-[10px] text-slate-600 font-medium">SDE @ Microsoft</p>
                  </div>
                </div>
                <div className="flex gap-1 text-[9px] text-slate-600 font-medium">
                  <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded">Azure</span>
                  <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded">React</span>
                  <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded">System Design</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                  <button className="py-1 text-[10px] font-semibold border border-slate-200 rounded-md text-slate-700 bg-white hover:bg-slate-50">
                    View Profile
                  </button>
                  <button 
                    onClick={() => handleConnectClick('Arun Verma')}
                    className="py-1 text-[10px] font-semibold rounded-md text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
                  >
                    Connect
                  </button>
                </div>
              </div>
            </div>

            <button className="w-full text-center text-xs font-semibold text-indigo-600 hover:text-indigo-700 pt-1">
              View More Alumni →
            </button>
          </div>

          {/* 2. Student Request to Connect */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
            <div className="inline-block px-3 py-1 rounded-md bg-pink-500 text-white text-[11px] font-bold">
              2. Student Request to Connect
            </div>
            
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div className="flex flex-col items-center">
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">
                  👨‍🎓
                </div>
                <span className="text-[10px] font-medium text-slate-600 mt-1">Student</span>
              </div>

              <div className="flex-1 flex items-center justify-center px-2">
                <div className="h-0.5 w-full bg-slate-300 relative flex items-center justify-center">
                  <div className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[10px]">
                    ✉️
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xs">
                  👔
                </div>
                <span className="text-[10px] font-medium text-slate-600 mt-1">Alumni</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold bg-emerald-50 p-2 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
              <span>Connection Request Sent! Alumni will be notified.</span>
            </div>
          </div>

          {/* 3. Alumni Accepts Request */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
            <div className="inline-block px-3 py-1 rounded-md bg-amber-500 text-white text-[11px] font-bold">
              3. Alumni Accepts Request
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div className="flex flex-col items-center">
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">
                  👨‍🎓
                </div>
                <span className="text-[10px] font-medium text-slate-600 mt-1">Student</span>
              </div>

              <div className="flex-1 flex items-center justify-center px-2">
                <div className="h-0.5 w-full bg-emerald-400 relative flex items-center justify-center">
                  <div className="bg-emerald-500 text-white px-2 py-0.5 rounded text-[9px] font-bold">
                    Accepted ✓
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-xs">
                  👔
                </div>
                <span className="text-[10px] font-medium text-slate-600 mt-1">Alumni</span>
              </div>
            </div>

            <p className="text-center text-xs font-semibold text-slate-700">
              You are now connected. You can start chatting!
            </p>
          </div>

        </div>

        {/* ═════════════════════════════════════════════════════════════════════
            CENTER COLUMN (Large Main Panel): 
            The Admin Dashboard & Sidebar (Matching screenshot central view)
           ═════════════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200/90 shadow-md overflow-hidden flex flex-col">
          
          {/* Main inner container with Navy Sidebar + Content */}
          <div className="flex flex-col md:flex-row flex-1">
            
            {/* Dark Navy Sidebar */}
            <aside className="w-full md:w-48 bg-[#0f172a] text-slate-300 p-3 flex flex-col justify-between shrink-0">
              <div className="space-y-4">
                {/* Brand Title (Logo removed) */}
                <div className="px-2 py-3 border-b border-slate-800">
                  <h2 className="text-xs font-bold text-white leading-tight">Alumni</h2>
                  <h3 className="text-xs font-bold text-slate-300 leading-tight">Connect</h3>
                </div>

                {/* Navigation links */}
                <nav className="space-y-1 text-xs font-medium">
                  <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-indigo-600 text-white font-semibold shadow-sm">
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>Dashboard</span>
                  </button>
                  <button className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60">
                    <Users className="w-3.5 h-3.5" />
                    <span>Alumni</span>
                  </button>
                  <button className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60">
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Students</span>
                  </button>
                  <button className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60">
                    <CalendarDays className="w-3.5 h-3.5" />
                    <span>Events</span>
                  </button>
                  <button className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Mentorship</span>
                  </button>
                  <button className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Referrals</span>
                  </button>
                  <button className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Contributions</span>
                  </button>
                  <button className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Chat</span>
                  </button>
                  <button className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60">
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Analytics</span>
                  </button>
                  <button className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Reports</span>
                  </button>
                  <button className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60">
                    <Settings className="w-3.5 h-3.5" />
                    <span>Settings</span>
                  </button>
                </nav>
              </div>

              {/* Bottom Logout */}
              <div className="pt-4 border-t border-slate-800">
                <button 
                  onClick={() => onSelectRole('admin')}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-rose-400 text-xs font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            </aside>

            {/* Admin Main Workspace */}
            <main className="flex-1 bg-[#f8fafc] p-4 sm:p-5 space-y-4 min-w-0">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 text-sm">≡ Dashboard Overview</span>
                </div>
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-slate-400 hover:text-slate-600 cursor-pointer" />
                  <div className="flex items-center gap-2">
                    <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" alt="Admin" className="w-7 h-7 rounded-full object-cover" />
                    <div className="text-left hidden sm:block">
                      <p className="text-xs font-bold text-slate-800 leading-none">Admin</p>
                      <p className="text-[10px] text-slate-400 leading-none mt-0.5">Administrator</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 6 KPI Cards (Grid of 6) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-indigo-600">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] font-medium text-slate-500 block">Total Alumni</span>
                  <div className="text-sm font-extrabold text-slate-900 leading-none">5,240</div>
                  <span className="text-[9px] font-semibold text-emerald-600">+12.5% this year</span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-blue-600">
                    <GraduationCap className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] font-medium text-slate-500 block">Active Alumni</span>
                  <div className="text-sm font-extrabold text-slate-900 leading-none">2,840</div>
                  <span className="text-[9px] font-medium text-slate-500">54.2% of total</span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-amber-500">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] font-medium text-slate-500 block">Active Mentors</span>
                  <div className="text-sm font-extrabold text-slate-900 leading-none">620</div>
                  <span className="text-[9px] font-semibold text-emerald-600">+18 this month</span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-pink-500">
                    <BookOpen className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] font-medium text-slate-500 block">Student Connections</span>
                  <div className="text-sm font-extrabold text-slate-900 leading-none">1,240</div>
                  <span className="text-[9px] font-semibold text-emerald-600">+32 this month</span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-purple-600">
                    <MessageSquare className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] font-medium text-slate-500 block">Active Conversations</span>
                  <div className="text-sm font-extrabold text-slate-900 leading-none">380</div>
                  <span className="text-[9px] font-semibold text-emerald-600">+15 this week</span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-emerald-600">
                    <DollarSign className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] font-medium text-slate-500 block">Total Contributions</span>
                  <div className="text-sm font-extrabold text-slate-900 leading-none">₹12.4L</div>
                  <span className="text-[9px] font-semibold text-emerald-600">+8.7% this year</span>
                </div>
              </div>

              {/* Middle Charts Row (Engagement Line + Dept Bar) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Alumni Engagement Over Years */}
                <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
                  <h4 className="text-xs font-bold text-slate-800 mb-2">Alumni Engagement Over Years</h4>
                  <div className="h-36 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={engagementData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <XAxis dataKey="year" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} stroke="#94a3b8" tickFormatter={(v) => `${v}%`} />
                        <Tooltip />
                        <Line type="monotone" dataKey="rate" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3, fill: '#6366f1' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Alumni by Department */}
                <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
                  <h4 className="text-xs font-bold text-slate-800 mb-2">Alumni by Department</h4>
                  <div className="h-36 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={deptData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <XAxis dataKey="name" tick={{ fontSize: 8 }} stroke="#94a3b8" />
                        <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" />
                        <Tooltip />
                        <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Bottom 3 Panels: Industry Donut + Top Engaged + Recent Activities */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Donut Chart */}
                <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                  <h4 className="text-xs font-bold text-slate-800 mb-1">Alumni by Industry</h4>
                  <div className="h-28 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={industryData} innerRadius={24} outerRadius={42} dataKey="value" paddingAngle={2}>
                          {industryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px] text-slate-600 font-medium pt-1">
                    {industryData.map((d, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="truncate">{d.name} {d.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Engaged Alumni */}
                <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
                  <h4 className="text-xs font-bold text-slate-800 mb-2">Top Engaged Alumni</h4>
                  <div className="space-y-1.5">
                    {topAlumni.map((a, i) => (
                      <div key={i} className="flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-1.5 truncate">
                          <img src={a.avatar} alt={a.name} className="w-5 h-5 rounded-full object-cover" />
                          <div className="truncate">
                            <span className="font-bold text-slate-800 block leading-tight truncate">{a.name}</span>
                            <span className="text-[9px] text-slate-400 block leading-tight">{a.dept}</span>
                          </div>
                        </div>
                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 font-bold text-[9px]">
                          {a.score}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Activities */}
                <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
                  <h4 className="text-xs font-bold text-slate-800 mb-2">Recent Activities</h4>
                  <div className="space-y-1.5">
                    {recentActivities.map((act, i) => (
                      <div key={i} className="flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-1.5 truncate">
                          <img src={act.avatar} alt={act.name} className="w-5 h-5 rounded-full object-cover" />
                          <div className="truncate">
                            <span className="font-semibold text-slate-800">{act.name} </span>
                            <span className="text-slate-500 text-[9px]">{act.action}</span>
                          </div>
                        </div>
                        <span className="text-[8px] text-slate-400 shrink-0">{act.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </main>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════════
            RIGHT COLUMN: 
            4. Alumni Profile
            5. Student - Alumni Chat
           ═════════════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-3 space-y-5">
          
          {/* 4. Alumni Profile */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3.5">
            <div className="inline-block px-3 py-1 rounded-md bg-indigo-600 text-white text-[11px] font-bold">
              4. Alumni Profile
            </div>

            <div className="flex flex-col items-center text-center space-y-1">
              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" 
                alt="Rahul Kumar" 
                className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500 shadow-sm"
              />
              <h3 className="text-sm font-bold text-slate-900 mt-1">Rahul Kumar</h3>
              <p className="text-xs text-slate-500">CSE • 2022</p>
              <p className="text-xs text-slate-700 font-semibold">Software Engineer @ TCS</p>
              <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 pt-0.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span>Online</span>
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Skills</span>
              <div className="flex flex-wrap gap-1 text-[10px] font-medium text-slate-600">
                <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">React</span>
                <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">Node.js</span>
                <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">MongoDB</span>
                <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">AWS</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">About</span>
              <p className="text-xs text-slate-600 leading-relaxed">
                Passionate about full stack development and mentoring students.
              </p>
            </div>

            <div className="space-y-1 text-xs text-slate-700">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Available For</span>
              <div className="space-y-0.5 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                  <Check className="w-3.5 h-3.5" />
                  <span className="text-slate-700">Career Guidance</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                  <Check className="w-3.5 h-3.5" />
                  <span className="text-slate-700">Technical Mentorship</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                  <Check className="w-3.5 h-3.5" />
                  <span className="text-slate-700">Placement Support</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button className="py-2 text-xs font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors">
                Start Chat
              </button>
              <button className="py-2 text-xs font-semibold rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition-colors">
                Request Mentorship
              </button>
            </div>
          </div>

          {/* 5. Student - Alumni Chat */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-3">
            <div className="inline-block px-3 py-1 rounded-md bg-emerald-600 text-white text-[11px] font-bold">
              5. Student - Alumni Chat
            </div>

            <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" alt="Rahul" className="w-7 h-7 rounded-full object-cover" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Rahul Kumar</h4>
                  <span className="text-[9px] text-emerald-600 font-semibold flex items-center gap-1">
                    <span className="w-1 h-1 bg-emerald-500 rounded-full" />
                    Online
                  </span>
                </div>
              </div>
              <MoreVertical className="w-3.5 h-3.5 text-slate-400" />
            </div>

            {/* Chat message bubbles */}
            <div className="space-y-2.5 h-48 overflow-y-auto pr-1">
              {chatMessages.map(msg => {
                const isMe = msg.sender === 'me';
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className={`p-2 rounded-xl text-[11px] max-w-[85%] leading-relaxed ${
                      isMe ? 'bg-emerald-50 text-slate-800 border border-emerald-200/80 rounded-br-none' : 'bg-slate-100 text-slate-800 rounded-bl-none'
                    }`}>
                      {msg.text}
                    </div>
                    <span className="text-[8px] text-slate-400 mt-0.5 px-1">{msg.time}</span>
                  </div>
                );
              })}
            </div>

            {/* Input bar */}
            <form onSubmit={handleSendChat} className="flex gap-1.5 pt-1 border-t border-slate-100">
              <input 
                type="text" 
                placeholder="Type a message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 text-[11px] px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button 
                type="submit"
                className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

        </div>

      </div>

      {/* ─── Bottom Sections: 6. Key Modules, 7. How It Works, 8. Tech Stack ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1700px] mx-auto pt-2">
        
        {/* 6. Key Modules */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
          <div className="inline-block px-3 py-1 rounded-md bg-indigo-600 text-white text-[11px] font-bold">
            6. Key Modules
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 space-y-1">
              <div className="text-purple-600 font-bold text-sm">👤 Alumni Management</div>
              <p className="text-[10px] text-slate-500">Add, update, and manage alumni information</p>
            </div>
            <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 space-y-1">
              <div className="text-rose-600 font-bold text-sm">📅 Events Management</div>
              <p className="text-[10px] text-slate-500">Create events and track participation</p>
            </div>
            <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 space-y-1">
              <div className="text-blue-600 font-bold text-sm">🧭 Mentorship</div>
              <p className="text-[10px] text-slate-500">Track mentorship sessions and guidance</p>
            </div>
            <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 space-y-1">
              <div className="text-emerald-600 font-bold text-sm">💼 Referrals</div>
              <p className="text-[10px] text-slate-500">Track student referrals and placements</p>
            </div>
            <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 space-y-1">
              <div className="text-amber-600 font-bold text-sm">💰 Contributions</div>
              <p className="text-[10px] text-slate-500">Manage alumni contributions and donations</p>
            </div>
            <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 space-y-1">
              <div className="text-indigo-600 font-bold text-sm">📊 Analytics & Reports</div>
              <p className="text-[10px] text-slate-500">Visualize engagement and generate insights</p>
            </div>
          </div>
        </div>

        {/* 7. How It Works */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
          <div className="inline-block px-3 py-1 rounded-md bg-blue-600 text-white text-[11px] font-bold">
            7. How It Works
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
            <div className="space-y-1">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 mx-auto flex items-center justify-center text-xs font-bold">
                👤
              </div>
              <p className="text-[9px] font-semibold text-slate-700">Student finds alumni</p>
            </div>
            <span className="text-slate-400 text-xs">→</span>

            <div className="space-y-1">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 mx-auto flex items-center justify-center text-xs font-bold">
                ✉️
              </div>
              <p className="text-[9px] font-semibold text-slate-700">Sends connection request</p>
            </div>
            <span className="text-slate-400 text-xs">→</span>

            <div className="space-y-1">
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 mx-auto flex items-center justify-center text-xs font-bold">
                🤝
              </div>
              <p className="text-[9px] font-semibold text-slate-700">Alumni accepts request</p>
            </div>
            <span className="text-slate-400 text-xs">→</span>

            <div className="space-y-1">
              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 mx-auto flex items-center justify-center text-xs font-bold">
                💬
              </div>
              <p className="text-[9px] font-semibold text-slate-700">Start Chat / Mentorship</p>
            </div>
            <span className="text-slate-400 text-xs">→</span>

            <div className="space-y-1">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center text-xs font-bold">
                📈
              </div>
              <p className="text-[9px] font-semibold text-slate-700">Engagement Tracked</p>
            </div>
            <span className="text-slate-400 text-xs">→</span>

            <div className="space-y-1">
              <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center text-xs font-bold">
                📊
              </div>
              <p className="text-[9px] font-semibold text-slate-700">Analytics & Insights</p>
            </div>
          </div>
        </div>

        {/* 8. Tech Stack */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
          <div className="inline-block px-3 py-1 rounded-md bg-indigo-600 text-white text-[11px] font-bold">
            8. Tech Stack
          </div>

          <div className="grid grid-cols-6 gap-2 text-center text-[9px] font-bold text-slate-700">
            <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg">
              <div className="text-emerald-500 text-base mb-0.5">🍃</div>
              <span>MongoDB</span>
            </div>
            <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg">
              <div className="text-slate-800 text-base mb-0.5 font-mono font-bold">ex</div>
              <span>Express.js</span>
            </div>
            <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg">
              <div className="text-cyan-500 text-base mb-0.5">⚛️</div>
              <span>React</span>
            </div>
            <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg">
              <div className="text-emerald-600 text-base mb-0.5">🟢</div>
              <span>Node.js</span>
            </div>
            <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg">
              <div className="text-slate-900 text-base mb-0.5 font-mono">⌘</div>
              <span>Tailwind</span>
            </div>
            <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg">
              <div className="text-teal-500 text-base mb-0.5">📊</div>
              <span>Recharts</span>
            </div>
          </div>

          <p className="text-[10px] text-slate-500 text-center font-medium">
            Data Flow: MongoDB ➔ Express API ➔ React (Vite / Tailwind) ➔ Recharts
          </p>
        </div>

      </div>

      {/* ─── 9. Benefits Footer Strip ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-slate-700 max-w-[1700px] mx-auto">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 font-bold">9. Benefits</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-700">
          <span className="text-indigo-600">👥</span>
          <span>Stronger Alumni Network</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-700">
          <span className="text-blue-600">🎓</span>
          <span>Smarter Student Guidance</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-700">
          <span className="text-amber-600">🧭</span>
          <span>More Mentorship Opportunities</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-700">
          <span className="text-emerald-600">📈</span>
          <span>Real-time Engagement Tracking</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-700">
          <span className="text-purple-600">🎯</span>
          <span>Data-driven Decision Making</span>
        </div>
      </div>

    </div>
  );
}
