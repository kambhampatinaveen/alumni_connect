import React, { useState } from 'react';
import Header from '../../components/admin/Header';
import { useAuth } from '../../lib/auth';
import { 
  User, 
  Building, 
  Briefcase, 
  MapPin, 
  GraduationCap, 
  CheckCircle2, 
  Save, 
  Sparkles, 
  Plus, 
  X,
  Mail
} from 'lucide-react';

export default function AlumniProfileView({ onBack, onToggleSidebar }) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState({
    name: user?.name || 'Sarah Jenkins',
    email: user?.email || 'alumni@alumniconnect.edu',
    company: user?.company || 'Stripe',
    designation: user?.designation || 'Senior Product Designer',
    department: user?.department || 'Computer Science',
    batch: user?.batch || '2018',
    location: user?.location || 'San Francisco, CA',
    about: user?.about || 'Senior Product Designer at Stripe with 6+ years of experience in fintech, design systems, and product strategy. Passionate about helping students break into tech.',
    skills: ['Product Design', 'UI/UX', 'Design Systems', 'Figma', 'User Research', 'Mentorship'],
    openForMentorship: true,
    openForReferrals: true,
    openForMockInterviews: true,
    openForGuestLectures: false,
    linkedin: 'https://linkedin.com/in/example',
    github: 'https://github.com/example'
  });

  const [newSkill, setNewSkill] = useState('');

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (newSkill.trim() && !profile.skills.includes(newSkill.trim())) {
      setProfile(prev => ({ ...prev, skills: [...prev.skills, newSkill.trim()] }));
      setNewSkill('');
      setSaved(false);
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skillToRemove)
    }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="flex-1 min-w-0 bg-[#EBF3FA] pb-16 min-h-screen">
      <Header
        title="Alumni Profile & Availability Settings"
        subtitle="Keep your professional profile up to date so students can find and connect with you"
        onBack={onBack}
        onToggleSidebar={onToggleSidebar}
      />

      <main className="p-6 lg:p-8 space-y-8 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Manage Your Alumni Mentor Profile
            </h2>
          </div>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F4C81] hover:bg-[#0d3d68] text-white text-xs font-bold shadow-md shadow-blue-900/20 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4 text-amber-300" />
            <span>Save Profile</span>
          </button>
        </div>

        {saved && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Your profile and availability preferences have been updated!
          </div>
        )}

        {/* Main card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Avatar & Quick Info */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-5 text-center flex flex-col items-center">
            <div className="relative">
              <img 
                src={user?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'} 
                alt={profile.name}
                className="w-24 h-24 rounded-3xl object-cover border-2 border-[#0F4C81]/30 shadow-md"
              />
              <div className="absolute bottom-0 right-0 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white shadow-xs" title="Active on platform" />
            </div>

            <div>
              <h2 className="text-lg font-black text-slate-900">{profile.name}</h2>
              <p className="text-xs text-[#0F4C81] font-bold">{profile.designation}</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{profile.company}</p>
            </div>

            <div className="w-full pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600 text-left font-medium">
              <div className="flex items-center gap-2 text-slate-600">
                <GraduationCap className="w-4 h-4 text-[#0F4C81]" />
                <span>{profile.department} (Batch '{profile.batch})</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin className="w-4 h-4 text-[#0F4C81]" />
                <span>{profile.location}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Mail className="w-4 h-4 text-[#0F4C81]" />
                <span className="truncate">{profile.email}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Edit Details & Availability */}
          <div className="md:col-span-2 space-y-6">
            {/* Availability Toggles */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Student Engagement Availability
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition-colors">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">1-on-1 Mentorship</span>
                    <span className="text-[11px] text-slate-500 font-medium">Receive mentorship requests</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={profile.openForMentorship} 
                    onChange={(e) => setProfile({ ...profile, openForMentorship: e.target.checked })}
                    className="w-4 h-4 rounded text-[#0F4C81] focus:ring-[#0F4C81]"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition-colors">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Job Referrals</span>
                    <span className="text-[11px] text-slate-500 font-medium">Accept candidate referrals</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={profile.openForReferrals} 
                    onChange={(e) => setProfile({ ...profile, openForReferrals: e.target.checked })}
                    className="w-4 h-4 rounded text-[#0F4C81] focus:ring-[#0F4C81]"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition-colors">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Mock Interviews</span>
                    <span className="text-[11px] text-slate-500 font-medium">Help students prep</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={profile.openForMockInterviews} 
                    onChange={(e) => setProfile({ ...profile, openForMockInterviews: e.target.checked })}
                    className="w-4 h-4 rounded text-[#0F4C81] focus:ring-[#0F4C81]"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition-colors">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Guest Lectures</span>
                    <span className="text-[11px] text-slate-500 font-medium">Campus tech talks & panels</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={profile.openForGuestLectures} 
                    onChange={(e) => setProfile({ ...profile, openForGuestLectures: e.target.checked })}
                    className="w-4 h-4 rounded text-[#0F4C81] focus:ring-[#0F4C81]"
                  />
                </label>
              </div>
            </div>

            {/* Bio & Skills */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm">About & Bio</h3>
              <textarea 
                rows={3}
                value={profile.about}
                onChange={(e) => setProfile({ ...profile, about: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#0F4C81] focus:ring-2 focus:ring-[#0F4C81]/20 leading-relaxed shadow-xs"
              />

              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Expertise & Skills Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {profile.skills.map((skill) => (
                    <span 
                      key={skill}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#0F4C81] border border-blue-200"
                    >
                      {skill}
                      <button 
                        type="button" 
                        onClick={() => handleRemoveSkill(skill)}
                        className="text-[#0F4C81] hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <form onSubmit={handleAddSkill} className="flex gap-2">
                  <input 
                    type="text"
                    placeholder="Add skill (e.g. Distributed Systems)..."
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    className="flex-1 px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0F4C81] focus:ring-2 focus:ring-[#0F4C81]/20 shadow-xs"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#0F4C81] hover:bg-[#0d3d68] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
