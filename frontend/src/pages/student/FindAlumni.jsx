import React, { useState, useEffect } from 'react';
import Header from '../../components/admin/Header';
import { getAlumni } from '../../api/managementApi';
import { requestMentorship } from '../../api/mentorshipApi';
import { useAuth } from '../../lib/auth';
import { useNotifications } from '../../context/NotificationContext';
import { 
  Search, 
  MapPin, 
  Building, 
  GraduationCap, 
  CheckCircle2, 
  Sparkles, 
  Send, 
  X, 
  Briefcase,
  Star,
  Users
} from 'lucide-react';

export default function FindAlumni({ onBack, onToggleSidebar, onNavigateToChat }) {
  const { user } = useAuth();
  const { sendMentorshipRequest } = useNotifications();
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedCollege, setSelectedCollege] = useState('all');
  const [mentorshipOnly, setMentorshipOnly] = useState(false);
  const [selectedAlumni, setSelectedAlumni] = useState(null);
  const [detailsAlumni, setDetailsAlumni] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [requestModal, setRequestModal] = useState(null); // 'mentorship' | 'referral'
  const [requestNote, setRequestNote] = useState('');
  const [sentSuccess, setSentSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function loadAlumni() {
    try {
      setLoading(true);
      const res = await getAlumni();
      const list = res.data?.data || res.data || [];
      setAlumni(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load alumni from server:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAlumni();
  }, []);

  const filtered = alumni.filter(alm => {
    const sTerm = search.toLowerCase();
    const nameMatch = (alm.name || '').toLowerCase().includes(sTerm);
    const companyMatch = (alm.company || '').toLowerCase().includes(sTerm);
    const roleMatch = (alm.role || '').toLowerCase().includes(sTerm);
    const rollMatch = (alm.rollNumber || '').toLowerCase().includes(sTerm);
    const skills = Array.isArray(alm.skills) ? alm.skills : [];
    const skillsMatch = skills.some(s => s.toLowerCase().includes(sTerm));

    const matchesSearch = !search || nameMatch || companyMatch || roleMatch || rollMatch || skillsMatch;
    const matchesBranch = selectedBranch === 'all' || alm.branch === selectedBranch;
    const matchesCollege = selectedCollege === 'all' || alm.college === selectedCollege;
    const matchesMentorship = !mentorshipOnly || Boolean(alm.availableForMentorship);

    return matchesSearch && matchesBranch && matchesCollege && matchesMentorship;
  });

  const handleSendRequest = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      if (requestModal === 'mentorship') {
        const alumniId = selectedAlumni.userId?._id || selectedAlumni.userId || selectedAlumni.id || selectedAlumni._id;
        await requestMentorship({
          alumniId,
          goal: requestNote || '1-on-1 Guidance & Placement Advice',
          domain: selectedAlumni.branch || selectedAlumni.role || selectedAlumni.mentorshipDomain || 'Engineering'
        });
      }

      sendMentorshipRequest({
        studentName: user?.name || 'Student Mentee',
        alumniName: selectedAlumni?.name || 'Alumni Mentor',
        topic: requestModal === 'mentorship' ? '1-on-1 Guidance & Placement Advice' : 'Internal Job Referral',
        note: requestNote
      });

      setSentSuccess(true);
      setTimeout(() => {
        setSentSuccess(false);
        setRequestModal(null);
        setSelectedAlumni(null);
        setRequestNote('');
      }, 1200);
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.error || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 min-w-0 bg-[#EBF3FA] pb-16 min-h-screen">
      <Header
        title="Find & Connect with Alumni Mentors"
        subtitle="Explore verified alumni across departments working at leading technology companies"
        onBack={onBack}
        onToggleSidebar={onToggleSidebar}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, company, branch, or skill..."
      />

      <main className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Search & Filter Controls */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search by name, company (e.g. Google, Microsoft, TCS), branch, or skill..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="all">All Branches</option>
                <option value="AID">AID (AI & Data Science)</option>
                <option value="CSD">CSD (Computer Science & Data)</option>
                <option value="CAI">CAI (CS & Artificial Intelligence)</option>
                <option value="CSM">CSM (CS & Machine Learning)</option>
                <option value="CSE">CSE (Computer Science)</option>
              </select>

              <select
                value={selectedCollege}
                onChange={(e) => setSelectedCollege(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="all">All Colleges</option>
                <option value="KIET">KIET</option>
                <option value="KIEW">KIEW</option>
                <option value="KIEK">KIEK</option>
              </select>
            </div>
          </div>

          {/* Quick Toggles */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
            <label className="flex items-center gap-2 text-slate-600 font-medium cursor-pointer">
              <input 
                type="checkbox"
                checked={mentorshipOnly}
                onChange={(e) => setMentorshipOnly(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Open for Mentorship</span>
            </label>

            <span className="text-slate-500">
              Showing <strong className="text-slate-900">{filtered.length}</strong> verified alumni
            </span>
          </div>
        </div>

        {/* Alumni Cards Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 p-6 space-y-3">
            <Users className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="font-semibold text-slate-800 text-sm">No Alumni Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No alumni records match your filter criteria or have been created by the administrator yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(alm => {
              const almId = alm.id || alm._id;
              const skills = Array.isArray(alm.skills) ? alm.skills : [];
              const initials = alm.name ? alm.name.charAt(0).toUpperCase() : 'A';

              return (
                <div 
                  key={almId}
                  onClick={() => {
                    setDetailsAlumni(alm);
                    setDetailsModalOpen(true);
                  }}
                  className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-400 hover:shadow-md transition-all flex flex-col justify-between space-y-4 shadow-xs cursor-pointer group"
                >
                  {/* Top header */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {alm.avatar ? (
                            <img 
                              src={alm.avatar} 
                              alt={alm.name} 
                              className="w-12 h-12 rounded-full object-cover border border-slate-200" 
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-base border border-emerald-200">
                              {initials}
                            </div>
                          )}
                          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">
                            {alm.name}
                          </h3>
                          <p className="text-xs font-semibold text-emerald-600">{alm.role || 'Alumni Mentor'}</p>
                          <p className="text-xs text-slate-600 font-medium">{alm.company || 'Tech Leader'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/60">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span>{alm.rating || '4.9'}</span>
                      </div>
                    </div>

                    {/* Badges & Meta */}
                    <div className="flex items-center gap-1.5 text-[10px] font-bold flex-wrap">
                      {alm.branch && (
                        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                          {alm.branch}
                        </span>
                      )}
                      {alm.college && (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {alm.college}
                        </span>
                      )}
                      {alm.ctc && (
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono">
                          {alm.ctc}
                        </span>
                      )}
                    </div>

                    {/* Bio */}
                    {alm.bio && (
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                        {alm.bio}
                      </p>
                    )}

                    {/* Skills Tags */}
                    {skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {skills.slice(0, 3).map(sk => (
                          <span key={sk} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                            {sk}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAlumni(alm);
                        setRequestModal('mentorship');
                      }}
                      className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Mentorship</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAlumni(alm);
                        setRequestModal('referral');
                      }}
                      className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Briefcase className="w-3.5 h-3.5 text-slate-600" />
                      <span>Ask Referral</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ALUMNI DETAILS MODAL (Part 11) */}
        {detailsModalOpen && detailsAlumni && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    {detailsAlumni.avatar ? (
                      <img 
                        src={detailsAlumni.avatar} 
                        alt={detailsAlumni.name} 
                        className="w-14 h-14 rounded-full object-cover border-2 border-emerald-100 shadow-xs" 
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center text-lg border-2 border-emerald-200">
                        {detailsAlumni.name ? detailsAlumni.name.charAt(0).toUpperCase() : 'A'}
                      </div>
                    )}
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{detailsAlumni.name}</h3>
                    <p className="text-xs font-semibold text-emerald-600">
                      {detailsAlumni.role || 'Alumni Mentor'}
                    </p>
                    <p className="text-xs text-slate-500 font-medium">
                      {detailsAlumni.company || 'Tech Leader'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => { setDetailsModalOpen(false); setDetailsAlumni(null); }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Profile Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-medium block">Department & Branch</span>
                  <span className="font-semibold text-slate-800 block">
                    {detailsAlumni.department || detailsAlumni.branch || 'Computer Science'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-medium block">Graduation Batch</span>
                  <span className="font-semibold text-slate-800 block">
                    Class of {detailsAlumni.batch || '2023'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-medium block">College / Campus</span>
                  <span className="font-semibold text-slate-800 block">
                    {detailsAlumni.college || 'KIET Group of Institutions'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-medium block">Availability</span>
                  <span className="font-semibold text-emerald-700 block">
                    {detailsAlumni.availableForMentorship !== false ? '● Open for Mentorship' : 'Unavailable'}
                  </span>
                </div>
              </div>

              {/* Mentorship Domain */}
              {detailsAlumni.mentorshipDomain && (
                <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100 space-y-1 text-xs">
                  <span className="text-emerald-800 font-bold uppercase tracking-wider text-[10px] block">
                    Mentorship Domain & Expertise
                  </span>
                  <p className="font-semibold text-emerald-950">
                    {detailsAlumni.mentorshipDomain}
                  </p>
                </div>
              )}

              {/* Bio */}
              {detailsAlumni.bio && (
                <div className="space-y-1 text-xs">
                  <span className="text-slate-500 font-semibold block">About / Background</span>
                  <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {detailsAlumni.bio}
                  </p>
                </div>
              )}

              {/* Skills */}
              {Array.isArray(detailsAlumni.skills) && detailsAlumni.skills.length > 0 && (
                <div className="space-y-1.5 text-xs">
                  <span className="text-slate-500 font-semibold block">Skills & Core Focus</span>
                  <div className="flex flex-wrap gap-1.5">
                    {detailsAlumni.skills.map((sk) => (
                      <span key={sk} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold text-[11px] border border-slate-200/80">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 text-xs">
                <button
                  type="button"
                  onClick={() => { setDetailsModalOpen(false); setDetailsAlumni(null); }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition cursor-pointer"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedAlumni(detailsAlumni);
                    setRequestModal('referral');
                    setDetailsModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition cursor-pointer flex items-center gap-1.5"
                >
                  <Briefcase className="w-3.5 h-3.5 text-slate-600" />
                  <span>Ask Referral</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedAlumni(detailsAlumni);
                    setRequestModal('mentorship');
                    setDetailsModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                  <span>Request Mentorship</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal for request */}
        {requestModal && selectedAlumni && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
                    Request {requestModal === 'mentorship' ? '1-on-1 Mentorship' : 'Internal Job Referral'}
                  </span>
                  <h3 className="text-base font-bold text-slate-900">{selectedAlumni.name}</h3>
                  <p className="text-xs text-slate-500">{selectedAlumni.role} at {selectedAlumni.company}</p>
                </div>
                <button 
                  onClick={() => { setRequestModal(null); setSelectedAlumni(null); }}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {sentSuccess ? (
                <div className="p-4 rounded-xl bg-emerald-50 text-emerald-700 text-center space-y-1 font-bold text-xs">
                  <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-600" />
                  <p>Request Dispatched to {selectedAlumni.name}!</p>
                </div>
              ) : (
                <form onSubmit={handleSendRequest} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Your Mentorship Focus / Query Note *
                    </label>
                    <textarea 
                      rows={4}
                      required
                      placeholder={`Hi ${selectedAlumni.name}, I am a student interested in your work at ${selectedAlumni.company}. Would love 20 minutes to discuss placement guidance...`}
                      value={requestNote}
                      onChange={(e) => setRequestNote(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-sm"
                  >
                    {submitting ? 'Submitting Request...' : 'Send Request'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
