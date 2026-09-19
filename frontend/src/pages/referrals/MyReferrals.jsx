import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getReferrals, updateReferral } from '../../api/referralApi';
import { Card } from '../../components/ui/card';
import { statusClass } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Select } from '../../components/ui/select';
import { Alert, AlertDescription } from '../../components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '../../components/ui/dialog';
import { useAuth } from '../../lib/auth';
import Header from '../../components/admin/Header';
import {
  BriefcaseBusiness, Building, User, Calendar, CheckCircle2,
  Clock, Award, XCircle, PlusCircle, ArrowRight, Sparkles,
  Copy, ExternalLink, ChevronRight
} from 'lucide-react';

export default function MyReferrals({ onBack, onToggleSidebar, onNavigate }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedReferral, setSelectedReferral] = useState(null);
  const [copiedMessage, setCopiedMessage] = useState('');

  async function load() {
    try {
      setLoading(true);
      setError('');
      const r = await getReferrals();
      setItems(r.data?.data || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Could not load referrals');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Student updates referral status through official workflow
  async function handleStatusUpdate(id, newStatus) {
    try {
      setUpdatingId(id);
      await updateReferral(id, { status: newStatus });
      setItems((prev) =>
        prev.map((r) => ((r._id === id || r.id === id) ? { ...r, status: newStatus } : r))
      );
      if (selectedReferral && (selectedReferral._id === id || selectedReferral.id === id)) {
        setSelectedReferral((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  }

  const handleCopyLink = async (link) => {
    if (!link) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = link;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedMessage('Application link copied to clipboard!');
      setTimeout(() => setCopiedMessage(''), 2500);
    } catch (err) {
      setCopiedMessage('Application link copied to clipboard!');
      setTimeout(() => setCopiedMessage(''), 2500);
    }
  };

  const handleOpenLink = (link) => {
    if (!link) return;
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  const filteredItems = items.filter((r) => {
    if (activeTab === 'all') return true;
    return r.status === activeTab;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'selected':
        return <Award className="w-4 h-4 text-emerald-600" />;
      case 'shortlisted':
        return <CheckCircle2 className="w-4 h-4 text-blue-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-amber-600" />;
    }
  };

  const isStudent = user?.role === 'student';
  const isAlumni = user?.role === 'alumni';
  const isAdmin = user?.role === 'admin';

  return (
    <div className="flex-1 min-w-0 bg-[#EBF3FA] pb-16 min-h-screen">
      <Header
        title={isAdmin ? 'Job Referrals Monitoring' : isStudent ? 'Job & Internship Referrals Board' : 'Job Referrals'}
        subtitle={
          isAdmin 
            ? 'Monitor referral pipeline submissions made by alumni mentors for student candidates' 
            : isStudent 
            ? 'Track job referral opportunities provided to you by verified alumni mentors' 
            : ''
        }
        onBack={onBack}
        onToggleSidebar={onToggleSidebar}
      />

      <main className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <BriefcaseBusiness className="w-6 h-6 text-[#0F4C81]" />
              {isAdmin ? 'Corporate Referrals Monitoring' : isStudent ? 'Referral Opportunities & Status' : 'Alumni Candidate Referrals'}
            </h2>
          </div>

          {/* Only Alumni can submit referrals - Admin is strictly read-only monitor */}
          {isAlumni && (
            <Button
              onClick={() => onNavigate ? onNavigate('submit-referral') : window.dispatchEvent(new CustomEvent('navigate-tab', { detail: 'submit-referral' }))}
              className="bg-[#0F4C81] hover:bg-[#1E3A8A] flex items-center gap-1.5 text-xs font-semibold cursor-pointer text-white rounded-xl shadow-sm"
            >
              <PlusCircle className="w-4 h-4 text-amber-300" /> Post Job Referral
            </Button>
          )}
        </div>

      {error && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Dynamic Filter Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-white border border-slate-200 shadow-sm rounded-2xl w-fit">
        {[
          { key: 'all', label: `All (${items.length})` },
          { key: 'pending', label: `Pending (${items.filter((r) => r.status?.toLowerCase() === 'pending').length})` },
          { key: 'shortlisted', label: `Shortlisted (${items.filter((r) => r.status?.toLowerCase() === 'shortlisted').length})` },
          { key: 'selected', label: `Selected (${items.filter((r) => r.status?.toLowerCase() === 'selected').length})` },
          { key: 'rejected', label: `Rejected (${items.filter((r) => r.status?.toLowerCase() === 'rejected').length})` }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === tab.key
                ? 'bg-[#0F4C81] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Referrals Cards Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      ) : filteredItems.length === 0 ? (
        <Card className="text-center py-16 border-dashed">
          <div className="space-y-3 p-5">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <BriefcaseBusiness className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-slate-800">No referrals found</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              {isStudent
                ? 'Engage with alumni mentors in your field to seek career guidance and job referrals.'
                : 'Help students kickstart their careers by referring them to open positions in your organization.'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredItems.map((r) => {
            const dateStr = r.createdAt || r.date ? new Date(r.createdAt || r.date).toLocaleDateString('en-GB') : 'Recent';
            const jobTitle = r.jobTitle || r.role || 'Open Position';

            return (
              <Card
                key={r._id || r.id}
                onClick={() => setSelectedReferral(r)}
                role="button"
                tabIndex={0}
                className="border-slate-200/90 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all overflow-hidden cursor-pointer group"
              >
                <div className="p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-extrabold text-lg flex-shrink-0 group-hover:scale-105 transition-transform">
                      {r.company ? r.company.charAt(0).toUpperCase() : 'C'}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {jobTitle}
                        </h2>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold flex items-center gap-1">
                          <Building className="w-3 h-3 text-slate-400" />
                          {r.company}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-1 font-medium">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {isAdmin
                            ? <><span>Referring Alumni:</span> <strong className="text-slate-800">{r.alumniId?.name || r.alumniName || 'Alumni'}</strong></>
                            : isStudent
                            ? `Referred by: ${r.alumniId?.name || 'Alumni Mentor'}`
                            : `Audience: All Connected Student Mentees`}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar className="w-3 h-3 text-slate-400" /> {dateStr}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Status Controls */}
                  <div className="flex flex-wrap items-center gap-3 self-end md:self-center">
                    {/* Student Status Control: Student controls the status */}
                    {isStudent && (
                      <div
                        className="flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="text-xs text-slate-500 font-medium">Status:</span>
                        <Select
                          value={r.status}
                          disabled={updatingId === (r.id || r._id)}
                          onChange={(e) => handleStatusUpdate(r.id || r._id, e.target.value)}
                          className="text-xs py-1 px-2.5 h-8 w-36 bg-slate-50 border-slate-200 font-medium"
                        >
                          <option value="pending">Pending</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="selected">Selected</option>
                          <option value="rejected">Rejected</option>
                        </Select>
                      </div>
                    )}

                    {/* Alumni View: Read-only badge (Alumni CANNOT change status) */}
                    {!isStudent && (
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusClass(r.status)}`}>
                        {getStatusIcon(r.status)}
                        {r.status}
                      </span>
                    )}

                    <span className="text-xs font-medium text-emerald-600 group-hover:underline flex items-center ml-1">
                      Details <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                    </span>
                  </div>
                </div>

                {/* Visual Recruitment Pipeline Bar */}
                <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700">Pipeline Stage:</span>
                    <span className={r.status === 'pending' ? 'text-amber-600 font-bold' : 'text-slate-400'}>
                      1. Pending Review
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-300" />
                    <span className={r.status === 'shortlisted' ? 'text-blue-600 font-bold' : 'text-slate-400'}>
                      2. Shortlisted
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-300" />
                    <span className={r.status === 'selected' ? 'text-emerald-600 font-bold' : r.status === 'rejected' ? 'text-red-600 font-bold' : 'text-slate-400'}>
                      3. {r.status === 'rejected' ? 'Rejected' : 'Selected (Offer)'}
                    </span>
                  </div>

                  {r.status === 'selected' && (
                    <span className="font-bold text-emerald-600 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Placed!
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Referral Details Modal Dialog */}
      <Dialog
        open={!!selectedReferral}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedReferral(null);
            setCopiedMessage('');
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BriefcaseBusiness className="w-5 h-5 text-emerald-600" />
            Referral Details
          </DialogTitle>
          <DialogDescription>
            Complete job and application details for this referral.
          </DialogDescription>
        </DialogHeader>

        {selectedReferral && (
          <DialogContent className="space-y-4">
            {copiedMessage && (
              <Alert variant="success" className="py-2">
                <AlertDescription className="text-xs font-semibold text-emerald-800">
                  {copiedMessage}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase">Hiring Company / Organization</span>
                <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-slate-400" />
                  {selectedReferral.company}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase">Job Title / Position</span>
                <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <BriefcaseBusiness className="w-4 h-4 text-emerald-600" />
                  {selectedReferral.jobTitle || selectedReferral.role}
                </p>
              </div>
            </div>

            {/* Application Link Section with Copy and Open buttons */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase">Link to Apply for Job</span>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="text-xs font-mono text-slate-700 break-all bg-white px-3 py-2 rounded-lg border border-slate-200 flex-1">
                  {selectedReferral.applicationLink && selectedReferral.applicationLink.trim()
                    ? selectedReferral.applicationLink
                    : 'Application link not specified'}
                </div>
                {selectedReferral.applicationLink && selectedReferral.applicationLink.trim() && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyLink(selectedReferral.applicationLink)}
                      className="text-xs h-8 flex items-center gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copy Link
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleOpenLink(selectedReferral.applicationLink)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Open Application
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase">Referred By</span>
                <p className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  {selectedReferral.alumniId?.name || 'Alumni Mentor'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase">Referral Date</span>
                <p className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {selectedReferral.date ? new Date(selectedReferral.date).toLocaleDateString('en-GB') : 'Recent'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase">Current Status</span>
                {isStudent ? (
                  <Select
                    value={selectedReferral.status}
                    disabled={updatingId === (selectedReferral.id || selectedReferral._id)}
                    onChange={(e) => handleStatusUpdate(selectedReferral.id || selectedReferral._id, e.target.value)}
                    className="text-xs py-0.5 px-2 h-7 bg-white border-slate-200 font-semibold"
                  >
                    <option value="pending">Pending</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="selected">Selected</option>
                    <option value="rejected">Rejected</option>
                  </Select>
                ) : (
                  <div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${statusClass(selectedReferral.status)}`}>
                      {getStatusIcon(selectedReferral.status)}
                      {selectedReferral.status}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setSelectedReferral(null)} className="text-xs">
            Close
          </Button>
        </DialogFooter>
      </Dialog>
      </main>
    </div>
  );
}
