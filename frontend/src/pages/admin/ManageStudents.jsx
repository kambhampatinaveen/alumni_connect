import React, { useState, useEffect } from 'react';
import Header from '../../components/admin/Header';
import { getStudents, addStudent, updateStudent, deleteStudent } from '../../api/studentApi';
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit2, 
  X, 
  Check, 
  Download,
  GraduationCap,
  Mail,
  RefreshCw,
  MessageSquare
} from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorAlert from '../../components/ui/ErrorAlert';
import EmptyState from '../../components/ui/EmptyState';
import { validatePhoneNumber, sanitizePhoneInput } from '../../lib/validation';

export default function ManageStudents({ onBack, onToggleSidebar }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [modalError, setModalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'AID',
    batch: '2025',
    gpa: '3.8',
    pin: '',
    status: 'ACTIVE'
  });

  const loadStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getStudents();
      setStudents(res.data?.data || res.data || []);
    } catch (err) {
      console.error('Failed to load students:', err);
      setError('Unable to load student records from backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setModalError('');
    setFormData({
      name: '',
      email: '',
      phone: '',
      department: 'AID',
      batch: '2025',
      gpa: '3.8',
      pin: '',
      status: 'ACTIVE'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (student) => {
    setEditingStudent(student);
    setModalError('');
    setFormData({
      name: student.name || '',
      email: student.email || '',
      phone: student.phone || '',
      department: student.department || 'AID',
      batch: student.batch || '2025',
      gpa: student.gpa || '',
      pin: '',
      status: student.status || 'ACTIVE'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!formData.name || !formData.name.trim()) {
      setModalError('Student Name is required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email.trim())) {
      setModalError('Please enter a valid email address.');
      return;
    }

    const phoneError = validatePhoneNumber(formData.phone);
    if (phoneError) {
      setModalError(phoneError);
      return;
    }

    if (!editingStudent && (!formData.pin || String(formData.pin).trim().length < 4)) {
      setModalError('Login PIN is required and must be at least 4 digits.');
      return;
    }

    if (editingStudent && formData.pin && String(formData.pin).trim().length < 4) {
      setModalError('Login PIN must be at least 4 digits.');
      return;
    }

    const allowedDepts = ['AID', 'CSD', 'CSC', 'CSM', 'CAI'];
    if (!allowedDepts.includes(formData.department)) {
      setModalError('Department must be AID, CSD, CSC, CSM, or CAI.');
      return;
    }

    if (!formData.batch || !String(formData.batch).trim()) {
      setModalError('Class Year is required.');
      return;
    }

    const gpa = Number(formData.gpa);
    if (!Number.isFinite(gpa) || gpa < 0 || gpa > 10) {
      setModalError('GPA must be a number between 0 and 10.');
      return;
    }

    try {
      setSubmitting(true);
      if (editingStudent) {
        const studentId = editingStudent.id || editingStudent._id;
        const payload = { ...formData };
        if (!payload.pin) delete payload.pin; // don't overwrite with empty string if not changed
        await updateStudent(studentId, payload);
        setSuccessMessage('Student details updated successfully.');
      } else {
        await addStudent(formData);
        setSuccessMessage('Student registered successfully.');
      }
      setIsModalOpen(false);
      await loadStudents();
    } catch (err) {
      console.error('Student save error:', err);
      const errMsg = err.response?.data?.error || err.message || 'Unable to register student. Please try again.';
      setModalError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this student record?')) return;
    try {
      await deleteStudent(id);
      await loadStudents();
    } catch (err) {
      console.error('Student delete error:', err);
      alert(`Delete failed: ${err.response?.data?.error || err.message || 'Unable to delete student.'}`);
    }
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch = 
      (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.email || '').toLowerCase().includes(search.toLowerCase());
    const matchesDept = deptFilter === 'all' || s.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="flex-1 min-w-0 bg-[#EBF3FA] pb-16 min-h-screen">
      <Header 
        title="Manage Student Directory" 
        subtitle="Oversee current student enrollments, mentorship requests, and GPA records" 
        onBack={onBack}
        onToggleSidebar={onToggleSidebar}
      />

      <main className="p-6 space-y-6 max-w-[1600px] mx-auto">
        {/* Success Alert Banner */}
        {successMessage && (
          <div className="p-3.5 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-2xl border border-emerald-200 flex items-center justify-between shadow-xs">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              {successMessage}
            </span>
            <button
              onClick={() => setSuccessMessage('')}
              className="text-emerald-600 hover:text-emerald-900 cursor-pointer font-bold px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Search & Actions Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
          <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search students by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/50"
              />
            </div>

            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="bg-white border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 font-semibold focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/50 cursor-pointer"
            >
              <option value="all">All Departments</option>
              <option value="AID">AID</option>
              <option value="CSD">CSD</option>
              <option value="CSC">CSC</option>
              <option value="CSM">CSM</option>
              <option value="CAI">CAI</option>
            </select>
          </div>

          <button
            onClick={handleOpenAdd}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0F4C81] hover:bg-[#1E3A8A] text-white text-xs font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-300" />
            Add Student
          </button>
        </div>

        {/* Content Table */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F4C81]"></div>
          </div>
        ) : error ? (
          <ErrorAlert message={error} onRetry={loadStudents} />
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <GraduationCap className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <h3 className="font-bold text-slate-800 text-sm">No Student Records Found</h3>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your search criteria or register a new student.</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider bg-slate-50/70">
                    <th className="py-3.5 px-4">Student Name & Email</th>
                    <th className="py-3.5 px-4">Department & Class</th>
                    <th className="py-3.5 px-4 text-center">GPA</th>
                    <th className="py-3.5 px-4 text-center">Login PIN</th>
                    <th className="py-3.5 px-4 text-center">Mentorship Requests</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((item) => {
                    const itemId = item.id || item._id;
                    const isInactive = (item.status || '').toUpperCase() === 'INACTIVE';
                    return (
                      <tr key={itemId} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 text-sm">{item.name}</div>
                          <div className="text-slate-400 text-[11px]">{item.email}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-slate-700 font-medium">{item.department}</div>
                          <div className="text-slate-400 text-[11px]">Expected Graduation {item.batch}</div>
                        </td>
                        <td className="py-3.5 px-4 text-center font-extrabold text-[#0F4C81]">
                          {item.gpa || 'N/A'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-500 font-mono text-[11px] font-bold tracking-widest" title="PIN is securely hashed">
                            ••••••
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-[#0F4C81] border border-blue-100">
                            <MessageSquare className="w-3 h-3" /> {item.mentorshipRequests || 0}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                            isInactive
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {item.status || 'ACTIVE'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 text-slate-500 hover:text-[#0F4C81] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Student"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(itemId)}
                              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Student"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal for Add / Edit */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">
                  {editingStudent ? 'Edit Student Details' : 'Add New Student'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {modalError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-xl border border-red-200">
                  {modalError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Student Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter full student name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. student@college.edu"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      inputMode="numeric"
                      maxLength={10}
                      pattern="[0-9]{10}"
                      placeholder="Enter 10-digit phone number"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: sanitizePhoneInput(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {editingStudent ? 'Update PIN (Optional)' : 'Login PIN Number *'}
                    </label>
                    <input
                      type="text"
                      required={!editingStudent}
                      placeholder="e.g. 123456"
                      value={formData.pin || ''}
                      onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Class Year *</label>
                    <input
                      type="text"
                      required
                      value={formData.batch}
                      onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Department *</label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                    >
                      <option value="AID">AID</option>
                      <option value="CSD">CSD</option>
                      <option value="CSC">CSC</option>
                      <option value="CSM">CSM</option>
                      <option value="CAI">CAI</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">GPA *</label>
                    <input
                      type="text"
                      required
                      value={formData.gpa}
                      onChange={(e) => setFormData({ ...formData, gpa: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-[#0F4C81] hover:bg-[#1E3A8A] text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    {submitting
                      ? (editingStudent ? 'Saving Changes...' : 'Registering Student...')
                      : (editingStudent ? 'Save Changes' : 'Register Student')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
