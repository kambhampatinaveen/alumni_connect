import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitReferral } from '../../api/referralApi';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { 
  BriefcaseBusiness, 
  ArrowLeft, 
  Building, 
  Link as LinkIcon, 
  CheckCircle,
  XCircle,
  Sparkles
} from 'lucide-react';

export default function SubmitReferral({ onBack, onToggleSidebar }) {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    company: '',
    role: '',
    applicationLink: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleGoBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/referrals');
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!form.company.trim()) {
      setError('Please enter the hiring company or organization.');
      return;
    }

    if (!form.role.trim()) {
      setError('Please enter the job title or position.');
      return;
    }

    if (!form.applicationLink.trim()) {
      setError('Please enter the link to apply for the job.');
      return;
    }

    const urlPattern = /^https?:\/\/.+/i;
    if (!urlPattern.test(form.applicationLink.trim())) {
      setError('Please enter a valid application URL (e.g. https://company.com/careers/job-123).');
      return;
    }

    try {
      setSubmitting(true);
      await submitReferral({
        company: form.company.trim(),
        role: form.role.trim(),
        jobTitle: form.role.trim(),
        applicationLink: form.applicationLink.trim()
      });

      setMessage('Referral posted successfully.');
      setForm({ company: '', role: '', applicationLink: '' });
      setTimeout(() => {
        handleGoBack();
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Could not submit referral. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#EBF3FA] pb-16">
      {/* Top Breadcrumb Navigation */}
      <div className="bg-white border-b border-slate-200 shadow-xs px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={handleGoBack}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#0F4C81] transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Referrals Pipeline
          </button>
          <span className="text-xs font-bold uppercase tracking-wider text-[#0F4C81] bg-blue-50 px-3 py-1 rounded-full border border-blue-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Alumni Mentorship Portal
          </span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
        {/* Page Header */}
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0F4C81] text-white flex items-center justify-center shadow-md shadow-blue-900/20 shrink-0">
              <BriefcaseBusiness className="w-5 h-5 text-amber-300" />
            </div>
            <span>Post Job Referral</span>
          </h1>
          <p className="text-sm font-medium text-slate-600 pl-13">
            Share an open role or internship referral opportunity directly with all student mentees connected with you.
          </p>
        </div>

        {/* Feedback Alerts */}
        {message && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-sm font-bold flex items-center gap-3 shadow-xs">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-sm font-bold flex items-center gap-3 shadow-xs">
            <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Main Referral Form Card */}
        <Card className="border border-slate-200/90 shadow-lg shadow-slate-200/60 bg-white rounded-3xl overflow-hidden">
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Field 1: Hiring Company / Organization */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  Hiring Company / Organization <span className="text-rose-600">*</span>
                </Label>
                <div className="relative">
                  <Building className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <Input
                    required
                    placeholder="e.g. Google, Microsoft, Amazon, Infosys, Deloitte"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    className="pl-10 text-xs sm:text-sm font-medium"
                  />
                </div>
              </div>

              {/* Field 2: Job Title / Position */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  Job Title / Position <span className="text-rose-600">*</span>
                </Label>
                <div className="relative">
                  <BriefcaseBusiness className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <Input
                    required
                    placeholder="e.g. Software Engineer, Data Analyst Intern, Cloud Architect"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="pl-10 text-xs sm:text-sm font-medium"
                  />
                </div>
              </div>

              {/* Field 3: Link to Apply for Job */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  Link to Apply for Job (URL) <span className="text-rose-600">*</span>
                </Label>
                <div className="relative">
                  <LinkIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <Input
                    required
                    type="url"
                    placeholder="https://company.com/careers/job-123"
                    value={form.applicationLink}
                    onChange={(e) => setForm({ ...form, applicationLink: e.target.value })}
                    className="pl-10 font-mono text-xs sm:text-sm"
                  />
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Direct job application or career portal link for connected students to apply.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleGoBack}
                  className="px-5 text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#0F4C81] hover:bg-[#0d3d68] text-white font-bold px-7 py-2.5 rounded-xl shadow-md shadow-blue-900/20 text-xs sm:text-sm cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Posting Referral...' : 'Submit Referral'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
