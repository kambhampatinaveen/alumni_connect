import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth';
import Header from '../../components/admin/Header';
import { getMentorships, updateMentorship } from '../../api/mentorshipApi';
import { getReferrals } from '../../api/referralApi';
import { 
  Users, 
  BookOpen, 
  Briefcase, 
  MessageSquare, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Sparkles, 
  Clock, 
  Award,
  Calendar,
  Building,
  UserCheck,
  Mail,
  Video
} from 'lucide-react';

export default function AlumniDashboard({ onNavigate, onToggleSidebar }) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModal, setActiveModal] = useState(null); // 'mentees' | 'referrals' | 'sessions' | 'rating' | null

  const [mentorships, setMentorships] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [mRes, rRes] = await Promise.allSettled([
        getMentorships(),
        getReferrals()
      ]);

      if (mRes.status === 'fulfilled') {
        setMentorships(mRes.value.data?.data || []);
      }
      if (rRes.status === 'fulfilled') {
        setReferrals(rRes.value.data?.data || []);
      }
    } catch (e) {
      console.error('Error loading alumni dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAction = async (id, newStatus) => {
    try {
      await updateMentorship(id, { status: newStatus });
      await loadData();
      if (newStatus === 'active') {
        onNavigate('mentorship');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update request');
    }
  };

  // Derive live metrics
  const activeMentees = mentorships.filter(m => m.status === 'active');
  const pendingRequests = mentorships.filter(m => m.status === 'requested');
  const completedMentorships = mentorships.filter(m => m.status === 'completed');

  const userId = user?.id || user?._id;
  const postedReferrals = referrals.filter(r => {
    const refAlumniId = r.alumniId?._id || r.alumniId?.id || r.alumniId;
    return refAlumniId === userId || (r.alumniEmail && r.alumniEmail === user?.email);
  });

  const totalSessionsLogged = mentorships.reduce((acc, m) => acc + (m.sessions?.length || 0), 0);

  const filteredRequests = pendingRequests.filter(r => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const sName = r.studentId?.name?.toLowerCase() || '';
    const domain = r.domain?.toLowerCase() || '';
    const goal = r.goal?.toLowerCase() || '';
    return sName.includes(q) || domain.includes(q) || goal.includes(q);
  });

  return (
    <div className="flex-1 min-w-0 bg-[#EBF3FA] pb-16 min-h-screen">
      <Header
        title="Alumni Portal Overview"
        subtitle="Manage student mentorship requests, post job referrals, and view sessions"
        onToggleSidebar={onToggleSidebar}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search student requests, topics, skills..."
      />

      <main className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
        {/* Welcome Banner - Deep Blue with Amber Accent */}
        <div className="relative rounded-3xl bg-gradient-to-r from-[#0F4C81] via-[#1E3A8A] to-[#0F2942] text-white p-6 lg:p-8 overflow-hidden shadow-xl shadow-[#0F4C81]/15">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-amber-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Alumnus Mentor & Referrer
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Welcome back, {user?.name || 'Alumni Mentor'}!
              </h1>
              <p className="text-sm text-blue-100 max-w-xl leading-relaxed">
                {user?.designation || 'Software Professional'} {user?.company ? `at ${user.company}` : ''} · Batch of {user?.batch || '2019'}. 
                You currently have <strong className="text-amber-300 font-extrabold">{pendingRequests.length} pending student mentorship requests</strong>.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => onNavigate('submit-referral')}
                className="px-4 py-2.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-slate-950 text-xs font-extrabold shadow-lg shadow-black/10 transition-all cursor-pointer"
              >
                + Post Job Referral
              </button>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div 
            onClick={() => setActiveModal('mentees')}
            className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-[#0F4C81]/50 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 group-hover:text-[#0F4C81] transition-colors">Active Mentees</span>
              <div className="p-2 rounded-xl bg-blue-50 text-[#0F4C81] border border-blue-100 group-hover:scale-110 transition-transform">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{activeMentees.length} Students</div>
            <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-semibold">
              <span>{pendingRequests.length} pending request{pendingRequests.length === 1 ? '' : 's'}</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </p>
          </div>

          <div 
            onClick={() => setActiveModal('referrals')}
            className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-[#0F4C81]/50 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 group-hover:text-[#0F4C81] transition-colors">Referrals Posted</span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 group-hover:scale-110 transition-transform">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{postedReferrals.length} Listings</div>
            <p className="text-[11px] text-blue-600 mt-1 flex items-center gap-1 font-semibold">
              <span>View campus referral pool</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </p>
          </div>

          <div 
            onClick={() => setActiveModal('sessions')}
            className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-[#0F4C81]/50 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 group-hover:text-[#0F4C81] transition-colors">Sessions Logged</span>
              <div className="p-2 rounded-xl bg-blue-50 text-[#0F4C81] border border-blue-100 group-hover:scale-110 transition-transform">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{totalSessionsLogged} Sessions</div>
            <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-semibold">
              <span>Across all mentees</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </p>
          </div>
        </div>

        {/* MODALS */}
        {activeModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl relative text-slate-900">
              <button 
                onClick={() => setActiveModal(null)}
                className="absolute top-6 right-6 p-2 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition-colors"
              >
                ✕
              </button>

              {/* ACTIVE MENTEES MODAL */}
              {activeModal === 'mentees' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-blue-50 text-[#0F4C81] border border-blue-200">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900">Active Connected Student Mentees ({activeMentees.length})</h2>
                      <p className="text-xs text-slate-500 font-medium">Students currently receiving 1-on-1 mentorship</p>
                    </div>
                  </div>

                  {activeMentees.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-6">No active student mentees currently.</p>
                  ) : (
                    <div className="space-y-3.5">
                      {activeMentees.map(m => (
                        <div key={m.id || m._id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-[#0F4C81] text-amber-300 font-black flex items-center justify-center text-base shrink-0">
                              {(m.studentId?.name || 'S').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-slate-900 text-sm">{m.studentId?.name || 'Student'}</h4>
                                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">{m.studentId?.department || 'Engineering'}</span>
                              </div>
                              <p className="text-xs text-[#0F4C81] font-bold">{m.domain || 'General Mentorship'}</p>
                              <span className="text-[11px] text-slate-500 font-medium">{m.sessions?.length || 0} session(s) logged</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            <button 
                              onClick={() => { setActiveModal(null); onNavigate('mentorship'); }}
                              className="px-4 py-2 rounded-xl bg-[#0F4C81] hover:bg-[#1E3A8A] text-white text-xs font-bold shadow-sm"
                            >
                              View Workspace
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* REFERRALS POSTED MODAL */}
              {activeModal === 'referrals' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200">
                      <Briefcase className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900">Your Posted Job Referrals ({postedReferrals.length})</h2>
                      <p className="text-xs text-slate-500 font-medium">Open referral listings you posted for campus students</p>
                    </div>
                  </div>

                  {postedReferrals.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-6">You haven't posted any referrals yet.</p>
                  ) : (
                    <div className="space-y-3.5">
                      {postedReferrals.map(ref => (
                        <div key={ref.id || ref._id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <h4 className="font-extrabold text-slate-900 text-base">{ref.jobTitle || ref.role}</h4>
                              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-[#0F4C81] font-bold">
                                {ref.companyName || ref.company}
                              </span>
                            </div>
                            <span className="text-xs text-slate-500 font-medium">{ref.location || 'Remote'}</span>
                          </div>

                          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                            <button 
                              onClick={() => { setActiveModal(null); onNavigate('referrals'); }}
                              className="px-4 py-1.5 rounded-xl bg-[#0F4C81] hover:bg-[#1E3A8A] text-white text-xs font-bold shadow-sm"
                            >
                              Manage Referrals
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => { setActiveModal(null); onNavigate('submit-referral'); }}
                      className="px-5 py-2.5 rounded-xl bg-[#0F4C81] hover:bg-[#1E3A8A] text-white text-xs font-bold shadow-sm"
                    >
                      + Post New Job Referral
                    </button>
                  </div>
                </div>
              )}

              {/* SESSIONS LOGGED MODAL */}
              {activeModal === 'sessions' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-blue-50 text-[#0F4C81] border border-blue-200">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900">Mentorship Meeting Sessions ({totalSessionsLogged})</h2>
                      <p className="text-xs text-slate-500 font-medium">All logged sessions across active mentees</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-black text-slate-900">{totalSessionsLogged} Total Sessions</span>
                      <p className="text-xs text-[#0F4C81] font-bold">Documented guidance & career strategy sessions</p>
                    </div>
                    <button
                      onClick={() => { setActiveModal(null); onNavigate('mentorship'); }}
                      className="px-4 py-2 rounded-xl bg-[#0F4C81] text-white text-xs font-bold"
                    >
                      Open Mentorship Page
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Incoming Student Mentorship Requests */}
        <div className="rounded-2xl bg-white border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-slate-900 text-base">Incoming Student Mentorship Requests</h2>
              <p className="text-xs text-slate-500 font-medium">Review notes from students seeking career guidance or interview prep</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              {pendingRequests.length} Pending
            </span>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs italic">
              No pending mentorship requests at this time.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredRequests.map(req => {
                const reqId = req.id || req._id;
                const studentName = req.studentId?.name || 'Student Mentee';
                const studentDept = req.studentId?.department || 'Department';

                return (
                  <div key={reqId} className="p-5 hover:bg-slate-50/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#0F4C81] text-amber-300 font-black flex items-center justify-center text-base shrink-0">
                        {studentName.charAt(0).toUpperCase()}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-sm">{studentName}</h3>
                          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
                            {studentDept}
                          </span>
                        </div>
                        <div className="font-bold text-xs text-[#0F4C81]">{req.domain || 'Mentorship Request'}</div>
                        <p className="text-xs text-slate-700 italic bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          "{req.goal || 'Looking forward to career mentorship and industry guidance.'}"
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
                      <button
                        onClick={() => handleAction(reqId, 'active')}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Accept Request</span>
                      </button>
                      <button
                        onClick={() => handleAction(reqId, 'rejected')}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-red-600 text-xs font-semibold border border-slate-200 transition-all"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Decline</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div 
            onClick={() => onNavigate('mentorship')}
            className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-[#0F4C81]/50 transition-all cursor-pointer space-y-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0F4C81] border border-blue-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-[#0F4C81]">Mentorship Workspace</h4>
            <p className="text-xs text-slate-500 font-medium">View active mentee cards, schedule upcoming sessions, and launch mentor classes.</p>
          </div>

          <div 
            onClick={() => onNavigate('referrals')}
            className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-[#0F4C81]/50 transition-all cursor-pointer space-y-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Briefcase className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-amber-700">Manage Referrals</h4>
            <p className="text-xs text-slate-500 font-medium">Post open engineering or design positions at your company to recruit students.</p>
          </div>

          <div 
            onClick={() => onNavigate('chat')}
            className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-[#0F4C81]/50 transition-all cursor-pointer space-y-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0F4C81] border border-blue-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-[#0F4C81]">Student-Alumni Messages</h4>
            <p className="text-xs text-slate-500 font-medium">Directly chat with your connected students, share resources, and set up calls.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
