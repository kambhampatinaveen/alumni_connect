import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth';
import api from '../../lib/api';
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  Building, 
  GraduationCap, 
  Sparkles, 
  Save, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { validatePhoneNumber, sanitizePhoneInput } from '../../lib/validation';

export default function EditProfileModal({ isOpen, onClose }) {
  const { user, role, setUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    department: '',
    batch: '',
    company: '',
    designation: '',
    location: '',
    bio: '',
    skills: ''
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        department: user.department || (role === 'student' ? 'AID' : 'Technology'),
        batch: user.batch || '',
        company: user.company || '',
        designation: user.designation || user.role || '',
        location: user.location || '',
        bio: user.bio || user.about || '',
        skills: Array.isArray(user.skills) ? user.skills.join(', ') : (user.skills || '')
      });
      setError('');
      setSuccess(false);
    }
  }, [user, role, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.phone) {
      const phoneError = validatePhoneNumber(formData.phone);
      if (phoneError) {
        setError(phoneError);
        return;
      }
    }

    if (role === 'student' && formData.department && !['AID', 'CSD', 'CSC', 'CSM', 'CAI'].includes(formData.department)) {
      setError('Please select a valid student department: AID, CSD, CSC, CSM, or CAI.');
      return;
    }

    setSaving(true);
    try {
      const skillsArray = formData.skills
        ? formData.skills.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        department: formData.department.trim(),
        batch: formData.batch.trim(),
        company: formData.company.trim(),
        designation: formData.designation.trim(),
        location: formData.location.trim(),
        bio: formData.bio.trim(),
        skills: skillsArray
      };

      const res = await api.put('/auth/profile', payload);
      const updatedUser = res.data?.user || { ...user, ...payload };
      if (setUser) setUser(updatedUser);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0F4C81]/10 text-[#0F4C81] flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 leading-tight">Edit Profile</h3>
              <p className="text-xs text-slate-500 font-medium">Update your account details and information</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Profile updated successfully!</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Full Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/30 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Phone Number</label>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: sanitizePhoneInput(e.target.value) })}
                placeholder="Enter 10-digit phone number"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/30 font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Email (Read-Only)</label>
              <input
                type="text"
                disabled
                value={user?.email || ''}
                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-xs cursor-not-allowed font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Department</label>
              {role === 'student' ? (
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/30 font-medium cursor-pointer"
                >
                  <option value="AID">AID</option>
                  <option value="CSD">CSD</option>
                  <option value="CSC">CSC</option>
                  <option value="CSM">CSM</option>
                  <option value="CAI">CAI</option>
                </select>
              ) : (
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="e.g. Engineering"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/30 font-medium"
                />
              )}
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Batch / Year</label>
              <input
                type="text"
                value={formData.batch}
                onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                placeholder="2025"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/30 font-medium"
              />
            </div>
          </div>

          {role === 'alumni' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Current Company</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Google, Stripe, etc."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/30 font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Role / Designation</label>
                <input
                  type="text"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  placeholder="Senior Software Engineer"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/30 font-medium"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              {role === 'alumni' ? 'Skills & Mentorship Expertise (comma separated)' : 'Skills & Interests (comma separated)'}
            </label>
            <input
              type="text"
              value={formData.skills}
              onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
              placeholder="React, System Design, Machine Learning"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/30 font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">About / Bio</label>
            <textarea
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="A brief background about yourself and your goals..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/30 font-medium resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F4C81] hover:bg-[#1E3A8A] text-white text-xs font-bold shadow-md shadow-blue-900/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-amber-300" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
