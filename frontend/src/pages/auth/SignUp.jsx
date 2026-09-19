import React, { useState } from 'react';
import { useAuth } from '../../lib/auth';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle, 
  GraduationCap, 
  BookOpen, 
  Phone, 
  ArrowRight
} from 'lucide-react';
import { validatePhoneNumber, sanitizePhoneInput } from '../../lib/validation';

const roleMeta = {
  alumni: {
    id: 'alumni',
    title: 'Alumni',
    icon: GraduationCap,
    accentText: 'text-[#0284C7]',
    ring: 'focus:ring-[#0284C7]',
    btnGradient: 'from-[#0284C7] to-[#0EA5E9]',
    shadow: 'shadow-sky-500/25'
  },
  student: {
    id: 'student',
    title: 'Student',
    icon: BookOpen,
    accentText: 'text-[#059669]',
    ring: 'focus:ring-[#059669]',
    btnGradient: 'from-[#059669] to-[#10B981]',
    shadow: 'shadow-emerald-500/25'
  }
};

export default function SignUp({ initialRole = 'student', onNavigateToSignIn, onSignUpSuccess }) {
  const { register } = useAuth();
  const [selectedRole, setSelectedRole] = useState(
    initialRole === 'alumni' ? 'alumni' : 'student'
  );
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    phone: '',
    password: '', 
    confirm: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const validate = () => {
    if (!form.name.trim()) return 'Full name is required.';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return 'A valid email address is required.';
    }
    const phoneError = validatePhoneNumber(form.phone);
    if (phoneError) return phoneError;
    if (form.password.length < 6) {
      return 'Password must be at least 6 characters.';
    }
    if (form.password !== form.confirm) {
      return 'Passwords do not match.';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { 
      setError(validationError); 
      return; 
    }
    setLoading(true);
    setError('');
    try {
      await register(form.name.trim(), form.email.trim().toLowerCase(), form.password, {
        phone: form.phone.trim(),
        role: selectedRole
      }, false);
      setSuccess(true);
      setTimeout(() => {
        if (onNavigateToSignIn) {
          onNavigateToSignIn(selectedRole);
        } else if (onSignUpSuccess) {
          onSignUpSuccess();
        }
      }, 1000);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const currentRole = roleMeta[selectedRole] || roleMeta.student;
  const RoleIcon = currentRole.icon;

  return (
    <div className="min-h-screen w-full bg-[#EBF3FA] font-sans relative overflow-hidden flex items-center justify-center p-4 sm:p-6 lg:p-8">
      
      {/* ─── MAIN CARD CONTAINER ─── */}
      <div className="relative z-20 w-full max-w-5xl bg-white rounded-[32px] sm:rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden flex flex-col lg:flex-row min-h-[560px] lg:min-h-[620px] my-auto">
        
        {/* ─── LEFT BLUE CURVED BANNER ─── */}
        <div className="w-full lg:w-5/12 bg-gradient-to-br from-[#0F4C81] via-[#1B5999] to-[#163172] text-white p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden rounded-b-[40px] lg:rounded-b-none lg:rounded-r-[240px] min-h-[320px] lg:min-h-full">
          
          {/* 3D Sphere 1: Bottom Left */}
          <div className="absolute -bottom-20 -left-20 w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-gradient-to-tr from-[#1572CF] via-[#2A8BF2] to-[#60A5FA] shadow-2xl pointer-events-none opacity-95" />
          
          {/* 3D Sphere 2: Mid Right Curve */}
          <div className="absolute top-1/2 right-4 lg:-right-12 -translate-y-1/2 w-44 h-44 sm:w-56 sm:h-56 rounded-full bg-gradient-to-tr from-[#1D6FD8] via-[#3B82F6] to-[#93C5FD] shadow-2xl pointer-events-none z-10" />

          {/* TOP SECTION: WELCOME + AlumniConnect */}
          <div className="relative z-20 space-y-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white uppercase leading-none">
                WELCOME
              </h1>
              <div className="mt-3">
                <h2 className="text-xl font-black text-white tracking-tight leading-none">AlumniConnect</h2>
                <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest block mt-0.5">
                  {selectedRole === 'alumni' ? 'Alumni Registration' : 'Student Registration'}
                </span>
              </div>
            </div>

            {/* QUOTE SECTION */}
            <div className="pt-6 sm:pt-10 space-y-3">
              <blockquote className="space-y-2">
                <p className="text-xl sm:text-2xl font-extrabold text-white leading-tight drop-shadow-sm">
                  "Where <span className="text-amber-300 underline underline-offset-4 decoration-amber-400/50">Memories</span> Meet <span className="text-sky-200">New Opportunities</span>"
                </p>
                <p className="text-xs text-blue-100/80 font-medium leading-relaxed max-w-xs">
                  {selectedRole === 'alumni' 
                    ? 'Join as an alumnus to mentor current students, post job referrals, and connect with your institution network.'
                    : 'Register as a student to book 1-to-1 mentorships, explore alumni career opportunities, and attend campus workshops.'}
                </p>
              </blockquote>
            </div>
          </div>

          <div className="relative z-20 pt-6 border-t border-white/15 text-[11px] text-blue-200 font-bold flex items-center justify-between">
            <span>KIET · KIEW · KIEK</span>
          </div>
        </div>

        {/* ─── RIGHT FORM SECTION ─── */}
        <div className="w-full lg:w-7/12 bg-white p-6 sm:p-10 lg:p-12 flex flex-col justify-center relative z-10 max-h-[88vh] overflow-y-auto">
          
          {/* Sphere 3: Bottom-Right */}
          <div className="absolute -bottom-24 -right-24 w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-gradient-to-tl from-[#2563EB]/40 via-[#3B82F6]/30 to-[#60A5FA]/20 blur-sm pointer-events-none z-0" />

          <div className="space-y-5 max-w-md mx-auto w-full relative z-20">
            
            {/* Heading & Back Link */}
            <div>
              <button
                type="button"
                onClick={onNavigateToSignIn}
                className="inline-flex items-center gap-1 text-xs font-extrabold text-[#0F4C81] hover:underline mb-2 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </button>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase">
                CREATE ACCOUNT
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Select your role and enter your details to sign up.
              </p>
            </div>

            {/* Role Switcher Tabs (Alumni & Student Only) */}
            <div className="bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80 flex gap-1.5">
              {Object.values(roleMeta).map((r) => {
                const isActive = selectedRole === r.id;
                const Icon = r.icon;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setSelectedRole(r.id);
                      setError('');
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 cursor-pointer ${
                      isActive 
                        ? 'bg-[#0F4C81] text-white shadow-md' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-slate-400'}`} />
                    <span>Sign up as {r.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Error / Success Feedback */}
            {error && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{selectedRole === 'alumni' ? 'Alumni' : 'Student'} account created successfully.</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    name="name"
                    type="text"
                    required
                    value={form.name}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 ${currentRole.ring}`}
                    placeholder="Full Name"
                  />
                </div>
              </div>

              {/* Email ID & Phone Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      name="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 ${currentRole.ring}`}
                      placeholder={selectedRole === 'alumni' ? 'alumni@example.com' : 'student@example.com'}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      name="phone"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      required
                      value={form.phone}
                      onChange={(e) => {
                        const val = sanitizePhoneInput(e.target.value);
                        setForm(prev => ({ ...prev, phone: val }));
                        if (error) setError('');
                      }}
                      className={`block w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 ${currentRole.ring}`}
                      placeholder="Enter 10-digit phone number"
                    />
                  </div>
                </div>
              </div>

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={form.password}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 ${currentRole.ring}`}
                      placeholder="Min 6 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      name="confirm"
                      type={showConfirm ? 'text' : 'password'}
                      required
                      value={form.confirm}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 ${currentRole.ring}`}
                      placeholder="Re-enter password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || success}
                className={`w-full flex items-center justify-center gap-2 py-3.5 mt-3 rounded-2xl bg-gradient-to-r ${currentRole.btnGradient} text-white font-black text-sm shadow-xl ${currentRole.shadow} hover:opacity-95 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 transition-all uppercase tracking-wider cursor-pointer`}
              >
                {loading ? (
                  <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <>
                    <span>REGISTER AS {currentRole.title}</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </>
                )}
              </button>
            </form>

            {/* Already have account */}
            <div className="text-center text-xs text-slate-500 font-medium pt-1">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onNavigateToSignIn}
                className="font-extrabold text-[#0F4C81] hover:underline cursor-pointer"
              >
                Sign in
              </button>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
