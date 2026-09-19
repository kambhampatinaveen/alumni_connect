import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth';
import Header from '../../components/admin/Header';
import { getMentorships } from '../../api/mentorshipApi';
import { getReferrals } from '../../api/referralApi';
import { getEvents } from '../../api/eventApi';
import { getAlumni } from '../../api/alumniApi';
import { 
  Users, 
  BookOpen, 
  Briefcase, 
  Calendar, 
  Sparkles, 
  Search, 
  ArrowRight, 
  Clock, 
  MessageSquare,
  GraduationCap,
  Video,
  MapPin,
  Building
} from 'lucide-react';

export default function StudentDashboard({ onNavigate, onToggleSidebar }) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModal, setActiveModal] = useState(null); // 'mentors' | 'referrals' | 'events' | null

  const [mentorships, setMentorships] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [events, setEvents] = useState([]);
  const [alumniList, setAlumniList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [mRes, rRes, eRes, aRes] = await Promise.allSettled([
          getMentorships(),
          getReferrals(),
          getEvents(),
          getAlumni()
        ]);

        if (mRes.status === 'fulfilled') {
          setMentorships(mRes.value.data?.data || []);
        }
        if (rRes.status === 'fulfilled') {
          setReferrals(rRes.value.data?.data || []);
        }
        if (eRes.status === 'fulfilled') {
          setEvents(eRes.value.data?.data || []);
        }
        if (aRes.status === 'fulfilled') {
          setAlumniList(aRes.value.data?.data || []);
        }
      } catch (err) {
        console.error('Error loading student dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const activeMentorships = mentorships.filter(m => m.status === 'active');
  const requestedMentorships = mentorships.filter(m => m.status === 'requested');

  // Next scheduled session across active mentorships
  let nextSession = null;
  for (const m of activeMentorships) {
    if (m.sessions && m.sessions.length > 0) {
      const now = new Date();
      const upcoming = m.sessions.filter(s => new Date(s.date) >= now);
      if (upcoming.length > 0) {
        nextSession = {
          ...upcoming[0],
          mentorName: m.alumniId?.name || m.alumni?.name || m.alumniId?.user?.name || 'Unknown Alumni'
        };
        break;
      }
    }
  }

  const filteredAlumni = alumniList.filter(alm => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = alm.name?.toLowerCase() || '';
    const company = alm.company?.toLowerCase() || '';
    const role = (alm.designation || alm.role)?.toLowerCase() || '';
    return name.includes(q) || company.includes(q) || role.includes(q);
  });

  return (
    <div className="flex-1 min-w-0 bg-[#EBF3FA] pb-16 min-h-screen">
      <Header
        title="Student Portal Overview"
        subtitle="Connect with verified alumni mentors, apply for job referrals, and attend workshops"
        onToggleSidebar={onToggleSidebar}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search mentors, companies, skills, roles..."
      />

      <main className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
        {/* Welcome Banner - Deep Blue with Golden Amber Accent */}
        <div className="relative rounded-3xl bg-gradient-to-r from-[#0F4C81] via-[#1E3A8A] to-[#0F2942] text-white p-6 lg:p-8 overflow-hidden shadow-xl shadow-[#0F4C81]/15">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-amber-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Student Portal · Career Acceleration
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Hello, {user?.name || 'Student'}!
              </h1>
              <p className="text-sm text-blue-100 max-w-xl leading-relaxed">
                {user?.department || 'Engineering'} · Class of {user?.batch || '2025'}. 
                Connect with verified alumni working across top global technology organizations.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => onNavigate('find-alumni')}
                className="px-5 py-2.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-slate-950 text-xs font-extrabold shadow-lg shadow-black/10 transition-all cursor-pointer flex items-center gap-2"
              >
                <Search className="w-4 h-4 text-slate-950" />
                <span>Find Alumni Mentors</span>
              </button>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div 
            onClick={() => setActiveModal('mentors')}
            className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-[#0F4C81]/50 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 group-hover:text-[#0F4C81] transition-colors">Connected Mentors</span>
              <div className="p-2 rounded-xl bg-blue-50 text-[#0F4C81] border border-blue-100 group-hover:scale-110 transition-transform">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{activeMentorships.length} Active</div>
            <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-semibold">
              <span>{requestedMentorships.length} pending request{requestedMentorships.length === 1 ? '' : 's'}</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </p>
          </div>

          <div 
            onClick={() => setActiveModal('referrals')}
            className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-[#0F4C81]/50 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 group-hover:text-[#0F4C81] transition-colors">Referral Listings</span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 group-hover:scale-110 transition-transform">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{referrals.length} Openings</div>
            <p className="text-[11px] text-blue-600 mt-1 flex items-center gap-1 font-semibold">
              <span>Posted by verified alumni</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </p>
          </div>

          <div 
            onClick={() => setActiveModal('events')}
            className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-[#0F4C81]/50 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 group-hover:text-[#0F4C81] transition-colors">Upcoming Events</span>
              <div className="p-2 rounded-xl bg-blue-50 text-[#0F4C81] border border-blue-100 group-hover:scale-110 transition-transform">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{events.length} Events</div>
            <p className="text-[11px] text-purple-600 mt-1 flex items-center gap-1 font-semibold">
              <span>Alumni sessions & workshops</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </p>
          </div>
        </div>

        {/* MODAL DIALOGS FOR STUDENT DASHBOARD */}
        {activeModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl relative text-slate-900">
              <button 
                onClick={() => setActiveModal(null)}
                className="absolute top-6 right-6 p-2 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition-colors"
              >
                ✕
              </button>

              {/* 1. CONNECTED MENTORS MODAL */}
              {activeModal === 'mentors' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-blue-50 text-[#0F4C81] border border-blue-200">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900">Your Connected Alumni Mentors ({activeMentorships.length})</h2>
                      <p className="text-xs text-slate-500 font-medium">Active 1-on-1 mentorship journeys</p>
                    </div>
                  </div>

                  {activeMentorships.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-xs text-slate-400 italic">No active mentorships currently.</p>
                      <button
                        onClick={() => { setActiveModal(null); onNavigate('find-alumni'); }}
                        className="mt-3 px-4 py-2 rounded-xl bg-[#0F4C81] text-white text-xs font-bold"
                      >
                        Explore Alumni Directory
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activeMentorships.map(m => (
                        <div key={m.id || m._id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-2xl bg-[#0F4C81] text-amber-300 font-black flex items-center justify-center text-lg">
                                {(m.alumniId?.name ? m.alumniId.name.charAt(0) : 'A').toUpperCase()}
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-900 text-sm">{m.alumniId?.name || m.alumni?.name || m.alumniId?.user?.name || 'Unknown Alumni'}</h4>
                                <p className="text-xs text-slate-500">{m.alumniId?.email || m.alumni?.email}</p>
                                <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded bg-blue-50 text-[#0F4C81] font-bold border border-blue-100">
                                  {m.alumniId?.department || m.alumni?.department || m.domain || 'AID'}
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                              Active
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-100">
                            Goal: {m.goal || 'Professional mentorship and guidance.'}
                          </p>

                          <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                            <span className="text-xs text-slate-500">{m.sessions?.length || 0} session(s) logged</span>
                            <button
                              onClick={() => { setActiveModal(null); onNavigate('mentorship'); }}
                              className="px-4 py-1.5 rounded-xl bg-[#0F4C81] text-white text-xs font-bold shadow-sm"
                            >
                              View Workspace →
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 2. REFERRALS MODAL */}
              {activeModal === 'referrals' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200">
                      <Briefcase className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900">Open Job & Internship Referrals ({referrals.length})</h2>
                      <p className="text-xs text-slate-500 font-medium">Explore active positions posted by alumni</p>
                    </div>
                  </div>

                  {referrals.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-6">No referrals posted currently.</p>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {referrals.map(ref => (
                        <div key={ref.id || ref._id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-slate-900 text-sm">{ref.jobTitle || ref.role}</h4>
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-[#0F4C81] font-bold">
                              {ref.companyName || ref.company}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" /> {ref.location || 'Remote'}
                          </p>
                          <div className="flex justify-end pt-2">
                            <button
                              onClick={() => { setActiveModal(null); onNavigate('referrals'); }}
                              className="px-3 py-1.5 rounded-xl bg-[#0F4C81] text-white text-xs font-bold"
                            >
                              View & Apply
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 3. EVENTS MODAL */}
              {activeModal === 'events' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-blue-50 text-[#0F4C81] border border-blue-200">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900">Campus Workshops & Tech Talks ({events.length})</h2>
                      <p className="text-xs text-slate-500 font-medium">Interactive sessions hosted by verified alumni</p>
                    </div>
                  </div>

                  {events.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-6">No upcoming events scheduled right now.</p>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {events.map(evt => (
                        <div key={evt.id || evt._id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-slate-900 text-sm">{evt.title}</h4>
                            <span className="text-xs text-slate-500 font-semibold">{evt.date}</span>
                          </div>
                          <p className="text-xs text-slate-600 line-clamp-2">{evt.description}</p>
                          <div className="flex justify-end pt-2">
                            <button
                              onClick={() => { setActiveModal(null); onNavigate('events'); }}
                              className="px-3 py-1.5 rounded-xl bg-[#0F4C81] text-white text-xs font-bold"
                            >
                              View Details & RSVP
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Next Scheduled Session Banner (if available) */}
        {nextSession && (
          <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-[#0F4C81] text-white">
                <Video className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#0F4C81] bg-blue-100/60 px-2 py-0.5 rounded-md">
                  Upcoming 1-on-1 Session
                </span>
                <h4 className="font-extrabold text-slate-900 text-base mt-1">{nextSession.topic}</h4>
                <p className="text-xs text-slate-600">With {nextSession.mentorName} on {nextSession.date} {nextSession.time ? `at ${nextSession.time}` : ''}</p>
              </div>
            </div>

            {nextSession.meetingLink && (
              <a
                href={nextSession.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-xl bg-[#0F4C81] hover:bg-[#1E3A8A] text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5"
              >
                <Video className="w-3.5 h-3.5 text-amber-300" />
                Join Call
              </a>
            )}
          </div>
        )}

        {/* Featured Alumni Mentors */}
        <div className="rounded-2xl bg-white border border-slate-200/90 shadow-sm overflow-hidden p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-slate-900 text-base">Explore Verified Alumni Mentors</h2>
              <p className="text-xs text-slate-500 font-medium">Connect for 1-to-1 mentorship, resume feedback, and interview coaching</p>
            </div>
            <button
              onClick={() => onNavigate('find-alumni')}
              className="text-xs font-bold text-[#0F4C81] hover:underline flex items-center gap-1"
            >
              View All Mentors <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredAlumni.slice(0, 3).map(alm => (
              <div 
                key={alm.id || alm._id} 
                className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-[#0F4C81]/40 transition space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#0F4C81] text-amber-300 font-black flex items-center justify-center text-lg shrink-0">
                      {alm.name ? alm.name.charAt(0).toUpperCase() : 'A'}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 text-sm truncate">{alm.name}</h4>
                      <p className="text-xs text-slate-500 truncate">{alm.designation || alm.role || 'Software Engineer'}</p>
                      {alm.company && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#0F4C81] font-bold">
                          <Building className="w-3 h-3" /> {alm.company}
                        </span>
                      )}
                    </div>
                  </div>

                  {alm.department && (
                    <div className="text-[11px] text-slate-500 bg-white p-2 rounded-lg border border-slate-100">
                      Dept: <span className="font-semibold text-slate-700">{alm.department}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-end">
                  <button
                    onClick={() => onNavigate('find-alumni')}
                    className="px-3.5 py-1.5 rounded-xl bg-[#0F4C81] hover:bg-[#1E3A8A] text-white text-xs font-bold shadow-sm"
                  >
                    View Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Action Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div 
            onClick={() => onNavigate('mentorship')}
            className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-[#0F4C81]/50 transition-all cursor-pointer space-y-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0F4C81] border border-blue-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-[#0F4C81]">1-to-1 Mentorships & Classes</h4>
            <p className="text-xs text-slate-500 font-medium">Review your mentorship goals, join scheduled meetings, and participate in mentor classes.</p>
          </div>

          <div 
            onClick={() => onNavigate('referrals')}
            className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-[#0F4C81]/50 transition-all cursor-pointer space-y-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Briefcase className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-amber-700">Job Referrals Board</h4>
            <p className="text-xs text-slate-500 font-medium">Browse verified job openings and apply directly through alumni mentors.</p>
          </div>

          <div 
            onClick={() => onNavigate('events')}
            className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-[#0F4C81]/50 transition-all cursor-pointer space-y-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0F4C81] border border-blue-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-[#0F4C81]">Events & Tech Talks</h4>
            <p className="text-xs text-slate-500 font-medium">Attend webinars and hands-on masterclasses hosted by global alumni.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
