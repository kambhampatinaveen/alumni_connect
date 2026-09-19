import React, { useEffect, useState } from 'react';
import Header from '../../components/admin/Header';
import { getMentorships, updateMentorship, addMentorshipSession } from '../../api/mentorshipApi';
import { getMentorClasses, createMentorClass } from '../../api/mentorClassApi';
import { Card, CardContent } from '../../components/ui/card';
import { Badge, statusClass } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter } from '../../components/ui/dialog';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { useAuth } from '../../lib/auth';
import {
  GraduationCap, Calendar, Clock, BookOpen, CheckCircle,
  XCircle, PlusCircle, Star, Sparkles, Video, Users, Search,
  Shield, CheckSquare, Square, ArrowLeft, ArrowRight, ExternalLink,
  User, Mail, Target
} from 'lucide-react';
import { DatePicker, formatYYYYMMDD } from '../../components/ui/calendar';
import RequestMentorshipButton from '../../components/mentorship/RequestMentorshipButton';

function isSessionCompleted(sessionDateInput) {
  if (!sessionDateInput) return false;
  const sessionDate = new Date(sessionDateInput);
  if (isNaN(sessionDate.getTime())) return false;
  const now = new Date();

  const isMidnight =
    (sessionDate.getUTCHours() === 0 && sessionDate.getUTCMinutes() === 0 && sessionDate.getUTCSeconds() === 0) ||
    (sessionDate.getHours() === 0 && sessionDate.getMinutes() === 0 && sessionDate.getSeconds() === 0);

  if (isMidnight) {
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sessionDayStart = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());
    return sessionDayStart < todayStart;
  }
  return sessionDate < now;
}

function formatDisplayDate(dateInput) {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  return isNaN(d.getTime()) ? String(dateInput) : d.toLocaleDateString();
}

export default function MyMentorships({ onBack, onToggleSidebar }) {
  const { user } = useAuth();
  const [mainTab, setMainTab] = useState('1on1'); // '1on1' or 'classes'

  // 1-to-1 Mentorship State
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCard, setSelectedCard] = useState(null); // When set, renders the Detail View (Screenshot 2 structure)

  // Mentor Classes State
  const [mentorClasses, setMentorClasses] = useState([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [classesError, setClassesError] = useState('');
  const [classModalOpen, setClassModalOpen] = useState(false);
  const [classForm, setClassForm] = useState({
    title: '',
    description: '',
    date: formatYYYYMMDD(),
    time: '10:00 AM',
    meetingLink: '',
    targetType: 'all', // 'all' or 'select'
    selectedStudents: []
  });
  const [classSaving, setClassSaving] = useState(false);
  const [classModalError, setClassModalError] = useState('');

  // Session Logging Modal State (Alumni only)
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    date: formatYYYYMMDD(),
    time: '10:00 AM',
    topic: '',
    notes: '',
    meetingLink: ''
  });
  const [sessionSaving, setSessionSaving] = useState(false);
  const [sessionError, setSessionError] = useState('');

  // Completion & Feedback Modal State
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [completeSaving, setCompleteSaving] = useState(false);

  async function loadMentorships() {
    try {
      setLoading(true);
      setError('');
      const r = await getMentorships();
      const fetched = r.data.data || [];
      setItems(fetched);
      setSelectedCard((prev) => {
        if (!prev) return null;
        const prevId = prev.id || prev._id;
        return fetched.find((m) => (m.id || m._id) === prevId) || null;
      });
    } catch (e) {
      setError(e.response?.data?.message || 'Could not load mentorships');
    } finally {
      setLoading(false);
    }
  }

  async function loadMentorClasses() {
    try {
      setClassesLoading(true);
      setClassesError('');
      const r = await getMentorClasses();
      setMentorClasses(r.data.data || []);
    } catch (e) {
      setClassesError(e.response?.data?.message || 'Could not load mentor classes');
    } finally {
      setClassesLoading(false);
    }
  }

  useEffect(() => {
    loadMentorships();
    loadMentorClasses();
  }, []);

  async function changeStatus(id, status) {
    try {
      await updateMentorship(id, { status });
      window.dispatchEvent(new CustomEvent('refresh-notifications'));
      await loadMentorships();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to update mentorship status');
    }
  }

  // Open Log Session Dialog (Alumni only)
  const handleOpenSessionModal = (mentorship) => {
    setSelectedCard(mentorship);
    setSessionForm({
      date: formatYYYYMMDD(),
      time: '10:00 AM',
      topic: '',
      notes: '',
      meetingLink: ''
    });
    setSessionError('');
    setSessionModalOpen(true);
  };

  // Submit Logged Session
  const handleSaveSession = async (e) => {
    e.preventDefault();
    setSessionError('');
    if (!sessionForm.topic.trim()) {
      setSessionError('Session topic is required.');
      return;
    }

    const todayStr = formatYYYYMMDD();
    if (sessionForm.date < todayStr) {
      setSessionError('Meeting date cannot be in the past. Please select today or a future date.');
      return;
    }

    if (!sessionForm.meetingLink?.trim()) {
      setSessionError('Meeting link is required.');
      return;
    }

    try {
      const url = new URL(sessionForm.meetingLink.trim());
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error();
      }
    } catch (err) {
      setSessionError('Please enter a valid meeting URL (e.g. https://meet.google.com/abc-defg-hij)');
      return;
    }

    try {
      setSessionSaving(true);
      const mId = selectedCard.id || selectedCard._id;
      await addMentorshipSession(mId, sessionForm);
      window.dispatchEvent(new CustomEvent('refresh-notifications'));
      setSessionModalOpen(false);
      await loadMentorships();
    } catch (err) {
      setSessionError(err.response?.data?.message || 'Failed to save session');
    } finally {
      setSessionSaving(false);
    }
  };

  // Open Complete & Feedback Dialog
  const handleOpenCompleteModal = (mentorship) => {
    setSelectedCard(mentorship);
    setFeedbackText(mentorship.feedback || '');
    setCompleteModalOpen(true);
  };

  // Submit Completion & Feedback
  const handleCompleteMentorship = async (e) => {
    e.preventDefault();
    try {
      setCompleteSaving(true);
      const mId = selectedCard.id || selectedCard._id;
      await updateMentorship(mId, {
        status: 'completed',
        feedback: feedbackText
      });
      window.dispatchEvent(new CustomEvent('refresh-notifications'));
      setCompleteModalOpen(false);
      await loadMentorships();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to complete mentorship');
    } finally {
      setCompleteSaving(false);
    }
  };

  // Mentor Class Handlers
  const handleOpenClassModal = () => {
    setClassForm({
      title: '',
      description: '',
      date: formatYYYYMMDD(),
      time: '10:00 AM',
      meetingLink: '',
      targetType: 'all',
      selectedStudents: []
    });
    setClassModalError('');
    setClassModalOpen(true);
  };

  // Accepted mentees for this alumni
  const acceptedMentees = items
    .filter((m) => m.status === 'active')
    .map((m) => ({
      id: m.studentId?._id || m.studentId?.id || m.studentId,
      name: m.studentId?.name || 'Student',
      email: m.studentId?.email || '',
      department: m.studentId?.department || ''
    }))
    .filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i); // unique

  const toggleStudentSelection = (studentId) => {
    setClassForm((prev) => {
      const exists = prev.selectedStudents.includes(studentId);
      return {
        ...prev,
        selectedStudents: exists
          ? prev.selectedStudents.filter((id) => id !== studentId)
          : [...prev.selectedStudents, studentId]
      };
    });
  };

  const selectAllStudents = () => {
    setClassForm((prev) => ({
      ...prev,
      selectedStudents: acceptedMentees.map((s) => s.id)
    }));
  };

  const clearAllStudents = () => {
    setClassForm((prev) => ({
      ...prev,
      selectedStudents: []
    }));
  };

  const handleSaveMentorClass = async (e) => {
    e.preventDefault();
    setClassModalError('');

    if (!classForm.title.trim()) {
      setClassModalError('Class title is required.');
      return;
    }
    if (!classForm.meetingLink.trim()) {
      setClassModalError('Meeting link is required.');
      return;
    }

    try {
      const url = new URL(classForm.meetingLink.trim());
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
    } catch (err) {
      setClassModalError('Please enter a valid meeting URL (e.g. https://meet.google.com/abc-xyz)');
      return;
    }

    let targetStudentIds = [];
    let targetStudentNames = [];

    if (classForm.targetType === 'all') {
      targetStudentIds = acceptedMentees.map((s) => s.id);
      targetStudentNames = acceptedMentees.map((s) => s.name);
    } else {
      if (classForm.selectedStudents.length === 0) {
        setClassModalError('Please select at least one student or choose "All Accepted Students".');
        return;
      }
      targetStudentIds = classForm.selectedStudents;
      targetStudentNames = acceptedMentees
        .filter((s) => classForm.selectedStudents.includes(s.id))
        .map((s) => s.name);
    }

    try {
      setClassSaving(true);
      await createMentorClass({
        title: classForm.title.trim(),
        description: classForm.description.trim(),
        date: classForm.date,
        time: classForm.time,
        meetingLink: classForm.meetingLink.trim(),
        targetType: classForm.targetType,
        studentIds: targetStudentIds,
        studentNames: targetStudentNames
      });
      setClassModalOpen(false);
      await loadMentorClasses();
    } catch (err) {
      setClassModalError(err.response?.data?.message || 'Failed to create mentor class');
    } finally {
      setClassSaving(false);
    }
  };

  // Helper getters
  const getPartnerName = (m) => {
    if (!m) return '';
    if (user?.role === 'student') {
      return (
        m.alumniId?.name ||
        m.alumni?.name ||
        m.alumniId?.user?.name ||
        m.alumni?.user?.name ||
        m.alumniId?.userId?.name ||
        m.alumni?.userId?.name ||
        m.mentor?.name ||
        'Unknown Alumni'
      );
    }
    if (user?.role === 'alumni') {
      return (
        m.studentId?.name ||
        m.student?.name ||
        m.studentId?.user?.name ||
        m.student?.user?.name ||
        m.studentId?.userId?.name ||
        m.student?.userId?.name ||
        m.mentee?.name ||
        'Unknown Student'
      );
    }
    const aName =
      m.alumniId?.name ||
      m.alumni?.name ||
      m.alumniId?.user?.name ||
      m.alumni?.user?.name ||
      m.alumniId?.userId?.name ||
      m.alumni?.userId?.name ||
      m.mentor?.name ||
      'Unknown Alumni';
    const sName =
      m.studentId?.name ||
      m.student?.name ||
      m.studentId?.user?.name ||
      m.student?.user?.name ||
      m.studentId?.userId?.name ||
      m.student?.userId?.name ||
      m.mentee?.name ||
      'Unknown Student';
    return `${aName} & ${sName}`;
  };

  const getPartnerEmail = (m) => {
    if (!m) return '';
    if (user?.role === 'student') {
      return m.alumniId?.email || m.alumni?.email || m.alumniId?.user?.email || m.alumni?.user?.email || '';
    }
    if (user?.role === 'alumni') {
      return m.studentId?.email || m.student?.email || m.studentId?.user?.email || m.student?.user?.email || '';
    }
    return `${m.alumniId?.email || m.alumni?.email || ''} | ${m.studentId?.email || m.student?.email || ''}`;
  };

  // Filtering 1-to-1 items
  const filteredItems = items.filter((m) => {
    if (activeTab !== 'all') {
      if (activeTab === 'requested') {
        if (m.status !== 'requested' && m.status !== 'pending') return false;
      } else if (m.status !== activeTab) {
        return false;
      }
    }
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const sName = (m.studentId?.name || m.student?.name || m.studentId?.user?.name || '').toLowerCase();
    const aName = (m.alumniId?.name || m.alumni?.name || m.alumniId?.user?.name || '').toLowerCase();
    const domain = (m.alumniId?.department || m.studentId?.department || m.domain || '').toLowerCase();
    return sName.includes(term) || aName.includes(term) || domain.includes(term);
  });

  return (
    <div className="flex-1 min-w-0 bg-[#EBF3FA] pb-16 min-h-screen">
      <Header
        title="Mentorships & Classes"
        subtitle="Manage 1-to-1 mentorship relationships, schedule sessions, and host group mentor classes"
        onBack={onBack}
        onToggleSidebar={onToggleSidebar}
      />

      <main className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Top-Level Section Switch Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setMainTab('1on1');
                setSelectedCard(null);
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all shadow-sm ${
                mainTab === '1on1'
                  ? 'bg-[#0F4C81] text-white shadow-[#0F4C81]/20'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-amber-300" />
              {user?.role === 'admin' ? '1-to-1 Mentorship Monitoring' : '1-to-1 Mentorships'}
            </button>

            <button
              onClick={() => {
                setMainTab('classes');
                setSelectedCard(null);
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all shadow-sm ${
                mainTab === 'classes'
                  ? 'bg-[#0F4C81] text-white shadow-[#0F4C81]/20'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Users className="w-4 h-4 text-amber-300" />
              {user?.role === 'alumni'
                ? 'Mentor Classes'
                : user?.role === 'student'
                ? 'My Mentor Classes'
                : 'Mentor Classes Monitoring'}
            </button>
          </div>

          {/* Action on Header right */}
          {mainTab === '1on1' && user?.role === 'student' && !selectedCard && (
            <RequestMentorshipButton onSuccess={loadMentorships} />
          )}

          {mainTab === 'classes' && user?.role === 'alumni' && (
            <Button
              onClick={handleOpenClassModal}
              className="bg-[#0F4C81] hover:bg-[#1E3A8A] text-white flex items-center gap-2 shadow-sm font-semibold text-xs rounded-xl px-4 py-2.5"
            >
              <PlusCircle className="w-4 h-4 text-amber-300" />
              Create Mentor Class
            </Button>
          )}
        </div>

        {/* ======================================================== */}
        {/* SECTION 1: 1-TO-1 MENTORSHIPS                            */}
        {/* ======================================================== */}
        {mainTab === '1on1' && (
          <div className="space-y-6">
            {error && (
              <Alert variant="destructive" className="rounded-2xl">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* IF A CARD IS SELECTED: RENDER DETAIL VIEW (Screenshot 2 Spec) */}
            {selectedCard ? (
              <div className="space-y-6">
                {/* Back Button */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setSelectedCard(null)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition shadow-sm"
                  >
                    <ArrowLeft className="w-4 h-4 text-[#0F4C81]" /> Back to All Mentorships
                  </button>

                  <div className="flex items-center gap-2">
                    <Badge className={`${statusClass(selectedCard.status)} uppercase tracking-wider text-xs px-3 py-1 font-bold`}>
                      {selectedCard.status}
                    </Badge>
                  </div>
                </div>

                {/* Relationship Summary Card */}
                <Card className="border-slate-200/90 shadow-sm rounded-2xl bg-white overflow-hidden">
                  <div className="p-6 bg-gradient-to-r from-slate-50 to-blue-50/40 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-[#0F4C81] text-amber-300 flex items-center justify-center font-black text-xl shadow-md">
                        {user?.role === 'admin'
                          ? (selectedCard.alumniId?.name ? selectedCard.alumniId.name.charAt(0).toUpperCase() : 'M')
                          : getPartnerName(selectedCard).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        {user?.role === 'admin' ? (
                          <div className="space-y-1">
                            <div className="text-base font-extrabold text-slate-900 flex flex-wrap items-center gap-2">
                              <span className="text-[#0F4C81]">
                                {selectedCard.alumniId?.name || selectedCard.alumni?.name || selectedCard.alumniId?.user?.name || selectedCard.alumni?.user?.name || 'Unknown Alumni'}
                              </span>
                              <span className="text-slate-400 font-normal">── 1-to-1 Mentorship ──</span>
                              <span className="text-emerald-700">
                                {selectedCard.studentId?.name || selectedCard.student?.name || selectedCard.studentId?.user?.name || selectedCard.student?.user?.name || 'Unknown Student'}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500">
                              {selectedCard.alumniId?.email || selectedCard.alumni?.email} • {selectedCard.studentId?.email || selectedCard.student?.email}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center gap-2.5">
                              <h2 className="font-extrabold text-slate-900 text-lg">
                                {getPartnerName(selectedCard)}
                              </h2>
                              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#0F4C81]/10 text-[#0F4C81] font-bold border border-[#0F4C81]/20">
                                {user?.role === 'student'
                                  ? (selectedCard.alumniId?.department || selectedCard.domain || 'General Mentorship')
                                  : (selectedCard.studentId?.department || selectedCard.domain || 'General Mentorship')}
                              </span>
                            </div>
                            {getPartnerEmail(selectedCard) && (
                              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 text-slate-400" /> {getPartnerEmail(selectedCard)}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Alumni / Student Actions */}
                    {user?.role !== 'admin' && (
                      <div className="flex flex-wrap items-center gap-2.5">
                        {/* Alumni requested options */}
                        {user?.role === 'alumni' && (selectedCard.status === 'requested' || selectedCard.status === 'pending') && (
                          <>
                            <Button
                              onClick={() => changeStatus(selectedCard.id || selectedCard._id, 'active')}
                              className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm"
                            >
                              <CheckCircle className="w-4 h-4" /> Accept Mentorship
                            </Button>
                            <Button
                              onClick={() => changeStatus(selectedCard.id || selectedCard._id, 'rejected')}
                              className="flex items-center gap-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-sm"
                            >
                              <XCircle className="w-4 h-4" /> Decline
                            </Button>
                          </>
                        )}

                        {/* Alumni active options: Log Session & Complete */}
                        {user?.role === 'alumni' && selectedCard.status === 'active' && (
                          <>
                            <Button
                              onClick={() => handleOpenSessionModal(selectedCard)}
                              className="bg-[#0F4C81] hover:bg-[#1E3A8A] text-white flex items-center gap-1.5 text-xs rounded-xl shadow-sm font-bold"
                            >
                              <PlusCircle className="w-4 h-4 text-amber-300" /> Log Session
                            </Button>
                            <Button
                              onClick={() => handleOpenCompleteModal(selectedCard)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 text-xs rounded-xl shadow-sm font-semibold"
                            >
                              <CheckCircle className="w-4 h-4" /> Complete Mentorship
                            </Button>
                          </>
                        )}

                        {/* Student feedback if completed */}
                        {user?.role === 'student' && selectedCard.status === 'completed' && !selectedCard.feedback && (
                          <Button
                            onClick={() => handleOpenCompleteModal(selectedCard)}
                            className="bg-[#0F4C81] hover:bg-[#1E3A8A] text-white flex items-center gap-1.5 text-xs rounded-xl shadow-sm font-semibold"
                          >
                            <Star className="w-4 h-4 text-amber-300" /> Share Feedback
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  <CardContent className="p-6 space-y-4">
                    {/* Goal Section */}
                    <div className="rounded-2xl bg-blue-50/50 p-4 border border-blue-100">
                      <span className="text-xs uppercase font-extrabold tracking-wider text-[#0F4C81] flex items-center gap-1.5">
                        <Target className="w-4 h-4 text-amber-500" /> Mentorship Goal & Focus
                      </span>
                      <p className="text-sm font-medium text-slate-800 mt-1.5 leading-relaxed">
                        {selectedCard.goal || 'Professional mentorship and career guidance.'}
                      </p>
                    </div>

                    {/* Feedback if available */}
                    {selectedCard.feedback && (
                      <div className="rounded-2xl bg-amber-50/50 p-4 border border-amber-200/70">
                        <span className="text-xs uppercase font-extrabold tracking-wider text-amber-800 flex items-center gap-1.5">
                          <Star className="w-4 h-4 text-amber-500" /> Mentorship Reflection & Feedback
                        </span>
                        <p className="text-sm italic text-slate-700 mt-1.5 leading-relaxed">
                          "{selectedCard.feedback}"
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* SESSIONS SECTION */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-[#0F4C81]" />
                      <h3 className="font-extrabold text-slate-900 text-base">
                        Meeting Sessions ({selectedCard.sessions?.length || 0})
                      </h3>
                    </div>

                    {user?.role === 'alumni' && selectedCard.status === 'active' && (
                      <Button
                        onClick={() => handleOpenSessionModal(selectedCard)}
                        className="bg-[#0F4C81] hover:bg-[#1E3A8A] text-white flex items-center gap-1.5 text-xs rounded-xl shadow-sm font-semibold"
                      >
                        <PlusCircle className="w-4 h-4 text-amber-300" /> Log Session
                      </Button>
                    )}
                  </div>

                  {(!selectedCard.sessions || selectedCard.sessions.length === 0) ? (
                    <Card className="text-center py-12 border-dashed border-slate-300 rounded-2xl bg-white">
                      <CardContent className="space-y-3">
                        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto text-[#0F4C81]">
                          <BookOpen className="w-6 h-6" />
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm">No Sessions Logged Yet</h4>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                          {user?.role === 'alumni' && selectedCard.status === 'active'
                            ? 'Click "+ Log Session" above to schedule your first meeting with this mentee.'
                            : 'Logged sessions and meeting details will appear here once scheduled.'}
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-6">
                      {/* Upcoming Sessions */}
                      {(() => {
                        const upcoming = (selectedCard.sessions || []).filter(
                          (s) => !isSessionCompleted(s.date) && s.status !== 'completed'
                        );
                        if (upcoming.length === 0) return null;
                        return (
                          <div className="space-y-3">
                            <div className="text-xs font-extrabold uppercase tracking-wider text-[#0F4C81] flex items-center gap-1.5">
                              <Clock className="w-4 h-4 text-amber-500" /> Upcoming / Active Sessions ({upcoming.length})
                            </div>
                            <div className="space-y-3">
                              {upcoming.map((sess, idx) => (
                                <div
                                  key={sess.id || idx}
                                  className="p-4 rounded-2xl bg-white border border-blue-100 shadow-sm hover:border-blue-300 transition space-y-2.5"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2.5">
                                      <span className="w-6 h-6 rounded-full bg-[#0F4C81]/10 text-[#0F4C81] font-bold text-xs flex items-center justify-center">
                                        {idx + 1}
                                      </span>
                                      <span className="font-bold text-slate-900 text-sm">{sess.topic}</span>
                                      <span className="text-[10px] uppercase font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                                        Upcoming
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1 rounded-xl border border-slate-200/60">
                                      <Calendar className="w-3.5 h-3.5 text-[#0F4C81]" />
                                      <span>{formatDisplayDate(sess.date)}</span>
                                      {sess.time && <span>at {sess.time}</span>}
                                    </div>
                                  </div>

                                  {sess.notes && (
                                    <p className="text-xs text-slate-600 leading-relaxed pl-8">
                                      {sess.notes}
                                    </p>
                                  )}

                                  {user?.role !== 'admin' && sess.meetingLink && (
                                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 pl-8">
                                      <span className="text-slate-400 truncate max-w-xs sm:max-w-md text-xs">
                                        {sess.meetingLink}
                                      </span>
                                      <a
                                        href={sess.meetingLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0F4C81] hover:bg-[#1E3A8A] text-white font-bold text-xs shadow-sm shadow-[#0F4C81]/20 transition active:scale-95"
                                      >
                                        <Video className="w-3.5 h-3.5 text-amber-300" />
                                        Join Meeting
                                      </a>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Completed Sessions */}
                      {(() => {
                        const completed = (selectedCard.sessions || []).filter(
                          (s) => isSessionCompleted(s.date) || s.status === 'completed'
                        );
                        if (completed.length === 0) return null;
                        return (
                          <div className="space-y-3">
                            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                              <CheckCircle className="w-4 h-4 text-emerald-600" /> Past / Completed Sessions ({completed.length})
                            </div>
                            <div className="space-y-3">
                              {completed.map((sess, idx) => (
                                <div
                                  key={sess.id || idx}
                                  className="p-4 rounded-2xl bg-white/70 border border-slate-200 shadow-sm space-y-2.5"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2.5">
                                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 font-bold text-xs flex items-center justify-center">
                                        {idx + 1}
                                      </span>
                                      <span className="font-bold text-slate-700 text-sm">{sess.topic}</span>
                                      <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                        Completed
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                      <Calendar className="w-3.5 h-3.5" />
                                      <span>{formatDisplayDate(sess.date)}</span>
                                    </div>
                                  </div>

                                  {sess.notes && (
                                    <p className="text-xs text-slate-600 leading-relaxed pl-8">
                                      {sess.notes}
                                    </p>
                                  )}

                                  {user?.role !== 'admin' && (
                                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-slate-400 text-xs pl-8">
                                      <span className="truncate max-w-xs">{sess.meetingLink || 'No link recorded'}</span>
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 font-semibold text-xs border border-slate-200 select-none">
                                        ✓ Session Completed
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* MASTER RELATIONSHIP CARDS LIST (Screenshot 2 Spec: 1 Relationship = 1 Card) */
              <div className="space-y-6">
                {/* Filter and Search Bar */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  {/* Status Filter Pills */}
                  <div className="flex flex-wrap gap-2 p-1.5 bg-white rounded-2xl border border-slate-200 shadow-sm w-full md:w-fit">
                    {[
                      { key: 'all', label: `All (${items.length})` },
                      { key: 'active', label: `Active (${items.filter((m) => m.status === 'active').length})` },
                      { key: 'requested', label: `Requested (${items.filter((m) => m.status === 'requested' || m.status === 'pending').length})` },
                      { key: 'completed', label: `Completed (${items.filter((m) => m.status === 'completed').length})` },
                      { key: 'rejected', label: `Declined (${items.filter((m) => m.status === 'rejected').length})` }
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          activeTab === tab.key
                            ? 'bg-[#0F4C81] text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Search by Name */}
                  <div className="relative w-full md:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search by student or mentor name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-2xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0F4C81] placeholder-slate-400 shadow-sm"
                    />
                  </div>
                </div>

                {/* Mentorship Relationship Cards Grid */}
                {loading ? (
                  <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F4C81]"></div>
                  </div>
                ) : filteredItems.length === 0 ? (
                  <Card className="text-center py-16 border-dashed border-slate-300 rounded-2xl bg-white">
                    <CardContent className="space-y-3">
                      <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto text-[#0F4C81]">
                        <GraduationCap className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-slate-800 text-base">No mentorship relationships found</h3>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        {user?.role === 'student'
                          ? 'Discover experienced alumni mentors and send a mentorship request to get started!'
                          : 'Mentorship records and student pairings will appear here.'}
                      </p>
                      {user?.role === 'student' && (
                        <div className="pt-2">
                          <RequestMentorshipButton onSuccess={loadMentorships} />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredItems.map((m) => {
                      const mId = m.id || m._id;
                      const partnerName = getPartnerName(m);
                      const partnerEmail = getPartnerEmail(m);
                      const sessions = m.sessions || [];

                      return (
                        <Card
                          key={mId}
                          onClick={() => setSelectedCard(m)}
                          className="border-slate-200/90 shadow-sm rounded-2xl bg-white overflow-hidden hover:shadow-md hover:border-[#0F4C81]/40 transition-all cursor-pointer flex flex-col justify-between"
                        >
                          <div className="p-5 space-y-4">
                            {/* Card Header: Partner avatar, name, domain, and status */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-12 h-12 rounded-2xl bg-[#0F4C81] text-amber-300 flex items-center justify-center font-black text-lg shadow-sm flex-shrink-0">
                                  {user?.role === 'admin'
                                    ? (m.alumniId?.name ? m.alumniId.name.charAt(0).toUpperCase() : 'M')
                                    : partnerName.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  {user?.role === 'admin' ? (
                                    <div>
                                      <h4 className="font-extrabold text-slate-900 text-sm truncate">
                                        {m.alumniId?.name || m.alumni?.name || m.alumniId?.user?.name || m.alumni?.user?.name || 'Unknown Alumni'}
                                      </h4>
                                      <p className="text-[11px] text-slate-500 font-medium">
                                        Alumni Mentor
                                      </p>
                                      <p className="text-xs text-emerald-800 font-semibold mt-0.5 truncate">
                                        Student: <span className="text-slate-900 font-bold">{m.studentId?.name || m.student?.name || m.studentId?.user?.name || m.student?.user?.name || 'Unknown Student'}</span>
                                      </p>
                                      <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-md bg-blue-50 text-[#0F4C81] font-bold border border-blue-100 truncate max-w-[220px]">
                                        {m.alumniId?.department || m.alumni?.department || m.studentId?.department || m.student?.department || m.domain || 'AID'}
                                      </span>
                                    </div>
                                  ) : (
                                    <>
                                      <h4 className="font-bold text-slate-900 text-sm truncate">
                                        {partnerName}
                                      </h4>
                                      {partnerEmail && (
                                        <p className="text-[11px] text-slate-400 truncate">
                                          {partnerEmail}
                                        </p>
                                      )}
                                      <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-md bg-blue-50 text-[#0F4C81] font-bold border border-blue-100 truncate max-w-[180px]">
                                        {user?.role === 'student'
                                          ? (m.alumniId?.department || m.alumni?.department || m.domain || 'AID')
                                          : (m.studentId?.department || m.student?.department || m.domain || 'AID')}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>

                              <Badge className={`${statusClass(m.status)} uppercase tracking-wider text-[10px] px-2.5 py-0.5 font-bold flex-shrink-0`}>
                                {m.status}
                              </Badge>
                            </div>

                            {/* Goal snippet */}
                            <div className="text-xs text-slate-600 line-clamp-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                              <span className="font-bold text-slate-700">Goal: </span>
                              {m.goal || 'Professional mentorship and career development guidance.'}
                            </div>
                          </div>

                          {/* Card Footer: Session count badge & View Details Button */}
                          <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                              <BookOpen className="w-3.5 h-3.5 text-[#0F4C81]" />
                              <span>{sessions.length} {sessions.length === 1 ? 'Session' : 'Sessions'}</span>
                            </span>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCard(m);
                              }}
                              className="inline-flex items-center gap-1 text-xs font-bold text-[#0F4C81] hover:text-[#1E3A8A] group"
                            >
                              View Details
                              <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                            </button>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* SECTION 2: MENTOR CLASSES (GROUP SESSIONS)               */}
        {/* ======================================================== */}
        {mainTab === 'classes' && (
          <div className="space-y-6">
            {classesError && (
              <Alert variant="destructive" className="rounded-2xl">
                <AlertDescription>{classesError}</AlertDescription>
              </Alert>
            )}

            {classesLoading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F4C81]"></div>
              </div>
            ) : mentorClasses.length === 0 ? (
              <Card className="text-center py-16 border-dashed border-slate-300 rounded-2xl bg-white">
                <CardContent className="space-y-3">
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto text-[#0F4C81]">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-base">No Mentor Classes Found</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {user?.role === 'alumni'
                      ? 'Create interactive group mentor classes for all your accepted mentees or specific students.'
                      : 'Scheduled mentor classes and workshops will appear here once announced by your mentors.'}
                  </p>
                  {user?.role === 'alumni' && (
                    <Button
                      onClick={handleOpenClassModal}
                      className="bg-[#0F4C81] hover:bg-[#1E3A8A] text-white text-xs mt-2 rounded-xl"
                    >
                      <PlusCircle className="w-4 h-4 mr-1.5 text-amber-300" /> Create First Class
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mentorClasses.map((cls) => {
                  const isPast = isSessionCompleted(cls.date);

                  return (
                    <Card key={cls.id} className="border-slate-200/90 shadow-sm rounded-2xl bg-white overflow-hidden hover:shadow-md transition-shadow">
                      <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-[#0F4C81] bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                            Mentor Class
                          </span>
                          <h3 className="font-bold text-slate-900 text-base mt-2">{cls.title}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Conducted by <span className="font-semibold text-slate-700">{cls.alumniName}</span> ({cls.alumniEmail})
                          </p>
                        </div>
                        <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                          isPast ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {isPast ? 'Completed' : 'Upcoming'}
                        </span>
                      </div>

                      <CardContent className="p-5 space-y-4">
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {cls.description || 'No detailed description provided.'}
                        </p>

                        <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <div className="flex items-center gap-2 text-slate-700">
                            <Calendar className="w-4 h-4 text-[#0F4C81]" />
                            <span className="font-medium">{cls.date}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-700">
                            <Clock className="w-4 h-4 text-[#0F4C81]" />
                            <span className="font-medium">{cls.time || '10:00 AM'}</span>
                          </div>
                        </div>

                        {/* Audience Info */}
                        <div className="text-xs">
                          <span className="font-semibold text-slate-500">Audience: </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-50 text-[#0F4C81] font-bold text-[11px] border border-blue-100">
                            {cls.targetType === 'all'
                              ? 'All Accepted Students'
                              : `${cls.studentIds?.length || 0} Selected Students`}
                          </span>
                          {cls.studentNames && cls.studentNames.length > 0 && (
                            <div className="mt-1 text-[11px] text-slate-500 truncate">
                              Students: {cls.studentNames.join(', ')}
                            </div>
                          )}
                        </div>

                        {/* Join / Status Action */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                          {user?.role !== 'admin' && (
                            <span className="text-[11px] text-slate-400 truncate max-w-xs">{cls.meetingLink}</span>
                          )}
                          {user?.role === 'admin' ? (
                            <span className="text-xs font-semibold text-slate-500 ml-auto">
                              Status: {isPast ? 'Completed' : 'Upcoming'}
                            </span>
                          ) : isPast ? (
                            <span className="text-xs font-bold text-slate-400 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 select-none">
                              Session Completed
                            </span>
                          ) : (
                            <a
                              href={cls.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0F4C81] hover:bg-[#1E3A8A] text-white font-semibold text-xs shadow-sm shadow-[#0F4C81]/20 transition active:scale-95"
                            >
                              <Video className="w-3.5 h-3.5 text-amber-300" />
                              Join Class
                            </a>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* MODAL 1: LOG 1-ON-1 SESSION (ALUMNI ONLY)                */}
        {/* ======================================================== */}
        <Dialog open={sessionModalOpen} onOpenChange={setSessionModalOpen}>
          <DialogHeader>
            <DialogTitle>Log 1-on-1 Mentorship Session</DialogTitle>
            <DialogDescription>
              Record session topic, meeting date/time, and actionable discussion points for this mentorship.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveSession}>
            <DialogContent className="space-y-4">
              {sessionError && (
                <Alert variant="destructive" className="rounded-xl">
                  <AlertDescription>{sessionError}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Meeting Date *</Label>
                  <DatePicker
                    value={sessionForm.date}
                    onChange={(date) => setSessionForm({ ...sessionForm, date })}
                    minDate={new Date()}
                    theme="blue"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Meeting Time *</Label>
                  <Input
                    placeholder="e.g. 04:30 PM"
                    value={sessionForm.time}
                    onChange={(e) => setSessionForm({ ...sessionForm, time: e.target.value })}
                    required
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Session Topic *</Label>
                <Input
                  placeholder="e.g. Resume Review, System Design Mock Interview, AWS Architecture"
                  value={sessionForm.topic}
                  onChange={(e) => setSessionForm({ ...sessionForm, topic: e.target.value })}
                  required
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Meeting Link (URL) *</Label>
                <Input
                  type="url"
                  required
                  placeholder="https://meet.google.com/abc-defg-hij"
                  value={sessionForm.meetingLink}
                  onChange={(e) => setSessionForm({ ...sessionForm, meetingLink: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Discussion Notes & Action Items</Label>
                <Textarea
                  rows={4}
                  placeholder="Summary of recommendations, questions discussed, and next steps..."
                  value={sessionForm.notes}
                  onChange={(e) => setSessionForm({ ...sessionForm, notes: e.target.value })}
                  className="rounded-xl"
                />
              </div>
            </DialogContent>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSessionModalOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button type="submit" disabled={sessionSaving} className="bg-[#0F4C81] hover:bg-[#1E3A8A] text-white rounded-xl">
                {sessionSaving ? 'Saving...' : 'Save Session Log'}
              </Button>
            </DialogFooter>
          </form>
        </Dialog>

        {/* ======================================================== */}
        {/* MODAL 2: CREATE MENTOR CLASS (ALUMNI ONLY)               */}
        {/* ======================================================== */}
        <Dialog open={classModalOpen} onOpenChange={setClassModalOpen}>
          <DialogHeader>
            <DialogTitle>Create Group Mentor Class</DialogTitle>
            <DialogDescription>
              Host an interactive workshop or group study session for your accepted mentees.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveMentorClass}>
            <DialogContent className="space-y-4 max-h-[80vh] overflow-y-auto">
              {classModalError && (
                <Alert variant="destructive" className="rounded-xl">
                  <AlertDescription>{classModalError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label>Class Title *</Label>
                <Input
                  placeholder="e.g. Full-Stack Microservices Masterclass"
                  value={classForm.title}
                  onChange={(e) => setClassForm({ ...classForm, title: e.target.value })}
                  required
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Description / Agenda</Label>
                <Textarea
                  rows={3}
                  placeholder="Detailed breakdown of what will be taught in this session..."
                  value={classForm.description}
                  onChange={(e) => setClassForm({ ...classForm, description: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Date *</Label>
                  <DatePicker
                    value={classForm.date}
                    onChange={(date) => setClassForm({ ...classForm, date })}
                    minDate={new Date()}
                    theme="blue"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Time *</Label>
                  <Input
                    placeholder="e.g. 11:00 AM"
                    value={classForm.time}
                    onChange={(e) => setClassForm({ ...classForm, time: e.target.value })}
                    required
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Meeting Link (URL) *</Label>
                <Input
                  type="url"
                  required
                  placeholder="https://meet.google.com/xyz-uvw-rst"
                  value={classForm.meetingLink}
                  onChange={(e) => setClassForm({ ...classForm, meetingLink: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              {/* Target Audience Options */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <Label className="font-bold text-slate-800">Target Audience *</Label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer text-xs font-semibold transition ${
                      classForm.targetType === 'all'
                        ? 'border-[#0F4C81] bg-blue-50/60 text-[#0F4C81]'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="targetType"
                      value="all"
                      checked={classForm.targetType === 'all'}
                      onChange={() => setClassForm({ ...classForm, targetType: 'all' })}
                      className="text-[#0F4C81]"
                    />
                    <span>All Accepted Students ({acceptedMentees.length})</span>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer text-xs font-semibold transition ${
                      classForm.targetType === 'select'
                        ? 'border-[#0F4C81] bg-blue-50/60 text-[#0F4C81]'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="targetType"
                      value="select"
                      checked={classForm.targetType === 'select'}
                      onChange={() => setClassForm({ ...classForm, targetType: 'select' })}
                      className="text-[#0F4C81]"
                    />
                    <span>Select Specific Students</span>
                  </label>
                </div>

                {/* Specific Student Selection */}
                {classForm.targetType === 'select' && (
                  <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <span className="text-xs font-bold text-slate-700">
                        Choose Mentees ({classForm.selectedStudents.length} selected)
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={selectAllStudents}
                          className="text-[11px] font-semibold text-[#0F4C81] hover:underline"
                        >
                          Select All
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={clearAllStudents}
                          className="text-[11px] font-semibold text-slate-500 hover:underline"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>

                    {acceptedMentees.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-2">
                        No accepted mentees found. Accept a mentorship request first!
                      </p>
                    ) : (
                      <div className="max-h-40 overflow-y-auto space-y-1.5 divide-y divide-slate-100">
                        {acceptedMentees.map((s) => {
                          const isSelected = classForm.selectedStudents.includes(s.id);
                          return (
                            <div
                              key={s.id}
                              onClick={() => toggleStudentSelection(s.id)}
                              className="pt-1.5 flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-100/80 p-1.5 rounded-lg transition"
                            >
                              <div className="flex items-center gap-2">
                                {isSelected ? (
                                  <CheckSquare className="w-4 h-4 text-[#0F4C81] flex-shrink-0" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                )}
                                <div>
                                  <span className="text-xs font-bold text-slate-800 block">{s.name}</span>
                                  <span className="text-[11px] text-slate-400 block">{s.email}</span>
                                </div>
                              </div>
                              {s.department && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-600">
                                  {s.department}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </DialogContent>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setClassModalOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button type="submit" disabled={classSaving} className="bg-[#0F4C81] hover:bg-[#1E3A8A] text-white rounded-xl">
                {classSaving ? 'Creating...' : 'Publish Mentor Class'}
              </Button>
            </DialogFooter>
          </form>
        </Dialog>

        {/* ======================================================== */}
        {/* MODAL 3: COMPLETION & FEEDBACK                           */}
        {/* ======================================================== */}
        <Dialog open={completeModalOpen} onOpenChange={setCompleteModalOpen}>
          <DialogHeader>
            <DialogTitle>Mentorship Completion & Feedback</DialogTitle>
            <DialogDescription>
              Mark this mentorship journey as completed and leave feedback on the overall engagement.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCompleteMentorship}>
            <DialogContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Feedback & Reflection Notes *</Label>
                <Textarea
                  rows={4}
                  placeholder="Share your thoughts on the engagement, key takeaways, and guidance for future growth..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  required
                  className="rounded-xl"
                />
              </div>
            </DialogContent>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCompleteModalOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button type="submit" disabled={completeSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                {completeSaving ? 'Submitting...' : 'Complete Mentorship'}
              </Button>
            </DialogFooter>
          </form>
        </Dialog>
      </main>
    </div>
  );
}
