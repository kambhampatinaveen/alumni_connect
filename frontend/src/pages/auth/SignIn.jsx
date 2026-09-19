import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  ArrowRight, 
  AlertCircle, 
  ShieldCheck, 
  GraduationCap, 
  BookOpen
} from 'lucide-react';

const roleMeta = {
  admin: {
    id: 'admin',
    title: 'Administrator',
    icon: ShieldCheck,
    accentText: 'text-[#0F4C81]',
    accentBg: 'bg-blue-50 border-blue-200',
    ring: 'focus:ring-[#0F4C81]',
    btnGradient: 'from-[#0F4C81] to-[#1E56A0]',
    shadow: 'shadow-blue-900/30'
  },
  alumni: {
    id: 'alumni',
    title: 'Alumni',
    icon: GraduationCap,
    accentText: 'text-[#0284C7]',
    accentBg: 'bg-sky-50 border-sky-200',
    ring: 'focus:ring-[#0284C7]',
    btnGradient: 'from-[#0284C7] to-[#0EA5E9]',
    shadow: 'shadow-sky-500/25'
  },
  student: {
    id: 'student',
    title: 'Student',
    icon: BookOpen,
    accentText: 'text-[#059669]',
    accentBg: 'bg-emerald-50 border-emerald-200',
    ring: 'focus:ring-[#059669]',
    btnGradient: 'from-[#059669] to-[#10B981]',
    shadow: 'shadow-emerald-500/25'
  }
};

export default function SignIn({ 
  initialRole = 'admin', 
  onNavigateToSignUp, 
  onLoginSuccess 
}) {
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState(initialRole || 'admin');
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (initialRole && roleMeta[initialRole]) {
      setSelectedRole(initialRole);
    }
  }, [initialRole]);

  const handleRoleChange = (roleKey) => {
    setSelectedRole(roleKey);
    setError('');
    setForm({ email: '', password: '' });
  };

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError(`Please enter both email and ${selectedRole === 'admin' ? 'password' : 'password / PIN'}.`);
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(form.email, form.password, selectedRole);
      if (onLoginSuccess) onLoginSuccess();
    } catch (err) {
      setError('Incorrect email or password.');
      setShake(true);
      setTimeout(() => setShake(false), 600);
    } finally {
      setLoading(false);
    }
  };

  const currentRole = roleMeta[selectedRole];
  const RoleIcon = currentRole.icon;

  return (
    <div className="min-h-screen w-full bg-[#EBF3FA] font-sans relative overflow-hidden flex items-center justify-center p-4 sm:p-6 lg:p-8">
      
      {/* ─── MAIN CARD CONTAINER (Matching Image 2 Layout) ─── */}
      <div 
        className={`relative z-20 w-full max-w-5xl bg-white rounded-[32px] sm:rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden flex flex-col lg:flex-row min-h-[560px] lg:min-h-[620px] transition-transform duration-300 ${shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}
      >
        
        {/* ─── LEFT BLUE CURVED BANNER (Matching Image 2 Left Side) ─── */}
        <div className="w-full lg:w-5/12 bg-gradient-to-br from-[#0F4C81] via-[#1B5999] to-[#163172] text-white p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden rounded-b-[40px] lg:rounded-b-none lg:rounded-r-[240px] min-h-[340px] lg:min-h-full">
          
          {/* 3D Sphere Overlaps inside/spilling out of Left Banner */}
          
          {/* Sphere 1: Large Bottom-Left 3D Ball */}
          <div className="absolute -bottom-20 -left-20 w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-gradient-to-tr from-[#1572CF] via-[#2A8BF2] to-[#60A5FA] shadow-2xl pointer-events-none opacity-95" />
          
          {/* Sphere 2: Mid Floating 3D Ball overlapping curve */}
          <div className="absolute top-1/2 right-4 lg:-right-12 -translate-y-1/2 w-44 h-44 sm:w-56 sm:h-56 rounded-full bg-gradient-to-tr from-[#1D6FD8] via-[#3B82F6] to-[#93C5FD] shadow-2xl pointer-events-none z-10" />

          {/* TOP SECTION: WELCOME + AlumniConnect */}
          <div className="relative z-20 space-y-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white uppercase leading-none">
                WELCOME
              </h1>
              <div className="mt-3">
                <h2 className="text-xl font-black text-white tracking-tight leading-none">AlumniConnect</h2>
                <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest block mt-0.5">Mentorship Network</span>
              </div>
            </div>

            {/* QUOTE SECTION (Under AlumniConnect - Campus Quote pill removed) */}
            <div className="pt-6 sm:pt-10 space-y-3">
              <blockquote className="space-y-2">
                <p className="text-xl sm:text-2xl font-extrabold text-white leading-tight drop-shadow-sm">
                  "Where <span className="text-amber-300 underline underline-offset-4 decoration-amber-400/50">Memories</span> Meet <span className="text-sky-200">New Opportunities</span>"
                </p>
                <p className="text-xs text-blue-100/80 font-medium leading-relaxed max-w-xs">
                  Connect with verified alumni mentors, career placement opportunities, and college guidance.
                </p>
              </blockquote>
            </div>
          </div>

          {/* Footer note (Team 9 removed) */}
          <div className="relative z-20 pt-6 border-t border-white/15 text-[11px] text-blue-200 font-bold flex items-center justify-between">
            <span>KIET · KIEW · KIEK</span>
          </div>
        </div>

        {/* ─── RIGHT FORM SECTION (Matching Image 2 Right Side) ─── */}
        <div className="w-full lg:w-7/12 bg-white p-8 sm:p-12 lg:p-16 flex flex-col justify-center relative z-10">
          
          {/* Sphere 3: Bottom-Right 3D Ball (spilling outside bottom right corner) */}
          <div className="absolute -bottom-24 -right-24 w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-gradient-to-tl from-[#2563EB]/40 via-[#3B82F6]/30 to-[#60A5FA]/20 blur-sm pointer-events-none z-0" />

          <div className="space-y-6 max-w-md mx-auto w-full relative z-20">
            
            {/* Heading */}
            <div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight uppercase">SIGN IN</h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">Select your portal role and enter your details.</p>
            </div>

            {/* Role Switcher Tabs */}
            <div className="bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80 flex gap-1.5">
              {Object.values(roleMeta).map((role) => {
                const isActive = selectedRole === role.id;
                const Icon = role.icon;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => handleRoleChange(role.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 cursor-pointer ${
                      isActive 
                        ? 'bg-[#0F4C81] text-white shadow-md' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-slate-400'}`} />
                    {role.title}
                  </button>
                );
              })}
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Your email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    name="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    className={`block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 ${currentRole.ring} transition-all`}
                    placeholder="Your email"
                  />
                </div>
              </div>

              {/* Password / PIN Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {selectedRole === 'admin' ? 'Enter Password' : 'Password / PIN'}
                  </label>
                  {selectedRole === 'admin' && (
                    <span className="text-xs font-medium text-slate-400">Min 6 characters</span>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={form.password}
                    onChange={handleChange}
                    className={`block w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 ${currentRole.ring} transition-all`}
                    placeholder={selectedRole === 'admin' ? 'Enter Password' : 'Enter Password / PIN'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex items-center justify-center gap-2 py-4 mt-2 rounded-2xl bg-gradient-to-r ${currentRole.btnGradient} text-white font-black text-sm sm:text-base shadow-xl ${currentRole.shadow} transition-all duration-200 hover:opacity-95 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer uppercase tracking-wider relative z-30`}
              >
                {loading ? (
                  <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <>
                    <span>SIGN IN AS {currentRole.title}</span>
                    <ArrowRight className="w-4.5 h-4.5 text-white" />
                  </>
                )}
              </button>
            </form>

            {/* Registration Navigation: Admin Signup Removed; Alumni/Student can sign up */}
            {selectedRole === 'admin' ? (
              <div className="text-center pt-2">
                <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0F4C81]" />
                  Administrator access is restricted to predefined credentials.
                </div>
              </div>
            ) : (
              <div className="text-center text-xs sm:text-sm text-slate-500 font-medium pt-2">
                Don't have an {selectedRole} account?{' '}
                <button
                  type="button"
                  onClick={() => onNavigateToSignUp(selectedRole)}
                  className="font-extrabold text-[#0F4C81] hover:underline transition-all cursor-pointer"
                >
                  Sign up as {selectedRole === 'alumni' ? 'Alumni' : 'Student'}
                </button>
              </div>
            )}

          </div>

        </div>

      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-5px); }
          40%, 80% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
}
