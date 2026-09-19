import React, { useState, useEffect } from 'react';
import Header from '../../components/admin/Header';
import { getAlumni, addAlumnus, updateAlumnus, deleteAlumnus } from '../../api/managementApi';
import { validatePhoneNumber, sanitizePhoneInput } from '../../lib/validation';
import { 
  Search, 
  Plus, 
  UserCheck, 
  Shield, 
  Trash2, 
  Edit2, 
  X, 
  Check, 
  Download,
  Building,
  GraduationCap,
  Phone,
  Mail,
  DollarSign,
  RefreshCw
} from 'lucide-react';

export default function ManageAlumni({ onBack, onToggleSidebar }) {
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [search, setSearch] = useState('');
  const [collegeFilter, setCollegeFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');

  // Load alumni from backend API
  const fetchAlumni = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await getAlumni();
      setAlumni(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load alumni:', err);
      setApiError('Could not connect to server. Check backend is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAlumni(); }, []);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlumnus, setEditingAlumnus] = useState(null);
  const [modalError, setModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    pin: '',
    rollNumber: '',
    branch: 'AID',
    college: 'KIET',
    company: '',
    role: '',
    ctc: '3.5 LPA',
    batch: '2024',
    status: 'ACTIVE'
  });

  const filteredAlumni = alumni.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.email.toLowerCase().includes(search.toLowerCase()) ||
      item.rollNumber?.toLowerCase().includes(search.toLowerCase()) ||
      item.company?.toLowerCase().includes(search.toLowerCase()) ||
      item.phone?.includes(search);

    const matchesCollege = collegeFilter === 'all' || item.college === collegeFilter;
    const matchesBranch = branchFilter === 'all' || item.branch === branchFilter;

    return matchesSearch && matchesCollege && matchesBranch;
  });

  const handleOpenAdd = () => {
    setEditingAlumnus(null);
    setModalError('');
    setFormData({
      name: '',
      email: '',
      phone: '',
      pin: '',
      rollNumber: '',
      branch: 'AID',
      college: 'KIET',
      company: '',
      role: '',
      ctc: '4.0 LPA',
      batch: '2024',
      status: 'ACTIVE'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingAlumnus(item);
    setModalError('');
    setFormData({ ...item, pin: '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    if (!editingAlumnus && (!formData.pin || !String(formData.pin).trim())) {
      setModalError('PIN number is required to create an alumni account.');
      return;
    }
    if (editingAlumnus && formData.pin && String(formData.pin).trim().length < 4) {
      setModalError('Login PIN must be at least 4 digits.');
      return;
    }
    const phoneErr = validatePhoneNumber(formData.phone);
    if (phoneErr) {
      setModalError(phoneErr);
      return;
    }
    try {
      setSubmitting(true);
      if (editingAlumnus) {
        const payload = { ...formData };
        if (!payload.pin || !String(payload.pin).trim()) {
          delete payload.pin; // Do not overwrite existing password with empty string
        }
        await updateAlumnus(editingAlumnus.id || editingAlumnus._id, payload);
      } else {
        await addAlumnus({
          ...formData,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=6366f1&color=fff&size=150`,
          engagementScore: 85,
          mentorshipsCompleted: 0,
          eventsAttended: 0
        });
      }
      setIsModalOpen(false);
      await fetchAlumni(); // Refresh from server
    } catch (err) {
      console.error('Save failed:', err);
      setModalError(err.response?.data?.error || err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this alumni record?')) {
      try {
        await deleteAlumnus(id);
        await fetchAlumni(); // Refresh from server
      } catch (err) {
        console.error('Delete failed:', err);
      }
    }
  };

  const toggleStatus = async (id) => {
    const alumnus = alumni.find(a => a.id === id);
    if (!alumnus) return;
    const newStatus = alumnus.status === 'Verified' ? 'Pending' : 'Verified';
    try {
      await updateAlumnus(id, { status: newStatus });
      setAlumni(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  const exportCSV = () => {
    const headers = "SNO,Name,Email,Phone,Roll Number,Branch,College,Company,Role,CTC\n";
    const rows = filteredAlumni.map((a, i) => 
      `"${i+1}","${a.name}","${a.email}","${a.phone}","${a.rollNumber}","${a.branch}","${a.college}","${a.company}","${a.role}","${a.ctc}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Alumni_Directory_${Date.now()}.csv`;
    link.click();
  };

  return (
    <div className="flex-1 min-w-0 bg-[#EBF3FA] pb-16 min-h-screen">
      <Header 
        title="Manage Alumni Directory" 
        subtitle="Manage verified alumni records, placement data, institutional branches & contact details"
        onBack={onBack}
        onToggleSidebar={onToggleSidebar}
      />

      <main className="p-6 space-y-6 max-w-[1600px] mx-auto">
        {/* Top Actions & Filters Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name, roll number, email, company, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* College Filter */}
            <select
              value={collegeFilter}
              onChange={(e) => setCollegeFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">All Colleges (KIET, KIEW, KIEK)</option>
              <option value="KIET">KIET</option>
              <option value="KIEW">KIEW</option>
              <option value="KIEK">KIEK</option>
            </select>

            {/* Branch Filter */}
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">All Branches</option>
              <option value="AID">AID (AI & Data Science)</option>
              <option value="CSD">CSD (Computer Science & Data)</option>
              <option value="CAI">CAI (CS & Artificial Intelligence)</option>
              <option value="CSM">CSM (CS & Machine Learning)</option>
            </select>

            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={fetchAlumni}
              title="Refresh from server"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Loading / Error States */}
        {loading && (
          <div className="flex items-center justify-center py-16 text-slate-500 text-sm gap-3">
            <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" />
            <span>Loading alumni from server...</span>
          </div>
        )}

        {apiError && !loading && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm flex items-center justify-between">
            <span>{apiError}</span>
            <button onClick={fetchAlumni} className="px-3 py-1 bg-red-100 hover:bg-red-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer">
              Retry
            </button>
          </div>
        )}

        {/* Alumni Data Table */}
        {!loading && !apiError && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">
              Verified Alumni Records ({filteredAlumni.length} of {alumni.length} total)
            </h3>
            <span className="text-xs text-slate-500">Live Institutional Placement Ledger</span>
          </div>


          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-3">SNO</th>
                  <th className="py-3 px-3">Alumnus Name & Email</th>
                  <th className="py-3 px-3">Roll Number</th>
                  <th className="py-3 px-3">Phone</th>
                  <th className="py-3 px-3">Branch & College</th>
                  <th className="py-3 px-3">Company & Role</th>
                  <th className="py-3 px-3 text-center">Login PIN</th>
                  <th className="py-3 px-3 text-center">CTC / Year</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAlumni.map((a, idx) => (
                  <tr key={a.id || idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-500">
                      {idx + 1}
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <img src={a.avatar} alt={a.name} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                        <div>
                          <span className="font-bold text-slate-900 block leading-tight">{a.name}</span>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {a.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-indigo-600 text-[11px]">
                      {a.rollNumber}
                    </td>

                    <td className="py-3 px-3 text-slate-600 font-medium">
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{a.phone}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[10px]">
                          {a.branch}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">
                          {a.college}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{a.company || 'Not Disclosed'}</div>
                      <div className="text-[11px] text-slate-500 font-medium">{a.role}</div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-600 font-mono text-[11px] font-bold tracking-widest" title="PIN is securely hashed with bcrypt">
                        ••••••
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200/50">
                        {a.ctc || '3.5 LPA'}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => toggleStatus(a.id)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border cursor-pointer ${
                          a.status === 'Verified' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {a.status || 'Verified'}
                      </button>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(a)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-500 transition-colors"
                          title="Edit alumnus"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(a.id)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 transition-colors"
                          title="Delete alumnus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )} {/* end !loading && !apiError */}

        {/* Add Button - always visible */}
        {!loading && (
          <div className="flex justify-end">
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Alumnus</span>
            </button>
          </div>
        )}
      </main>

      {/* Add / Edit Alumnus Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingAlumnus ? 'Edit Alumnus Profile' : 'Add New Alumnus to Directory'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email ID *</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {editingAlumnus ? 'Update PIN (Optional)' : 'Login PIN Number *'}
                  </label>
                  <input 
                    type="text" 
                    required={!editingAlumnus}
                    placeholder="e.g. 123456"
                    value={formData.pin || ''}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                  {editingAlumnus && (
                    <p className="text-[11px] text-slate-400 mt-1">Leave blank to keep existing PIN/password</p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
                <input 
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: sanitizePhoneInput(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                  placeholder="Enter 10-digit phone number"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Roll Number</label>
                  <input 
                    type="text" 
                    value={formData.rollNumber}
                    onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Branch</label>
                  <select
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="AID">AID</option>
                    <option value="CSD">CSD</option>
                    <option value="CAI">CAI</option>
                    <option value="CSM">CSM</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">College</label>
                  <select
                    value={formData.college}
                    onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="KIET">KIET</option>
                    <option value="KIEW">KIEW</option>
                    <option value="KIEK">KIEK</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Company</label>
                  <input 
                    type="text" 
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Role / Designation</label>
                  <input 
                    type="text" 
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">CTC / Year</label>
                  <input 
                    type="text" 
                    value={formData.ctc}
                    onChange={(e) => setFormData({ ...formData, ctc: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {editingAlumnus ? (submitting ? 'Updating...' : 'Update Record') : (submitting ? 'Saving...' : 'Save Alumnus')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
