import React, { useState, useEffect } from 'react';
import Header from '../../components/admin/Header';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorAlert from '../../components/ui/ErrorAlert';
import EmptyState from '../../components/ui/EmptyState';
import { getEvents, addEvent, updateEvent, deleteEvent } from '../../api/managementApi';
import { Calendar, Plus, MapPin, Users, Trash2, Edit2, X, Tag } from 'lucide-react';
import { getEventStatus, isUserRegistered, isUserEventCreator } from '../../lib/eventUtils';
import { useAuth } from '../../lib/auth';

export default function ManageEvents({ onBack, onToggleSidebar }) {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    type: 'Technical Workshop',
    mode: 'Online',
    date: new Date().toISOString().split('T')[0],
    location: '',
    meetingLink: '',
    maxCapacity: 300,
    description: ''
  });

  const loadEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getEvents();
      const eventsArray = res.data?.data || res.data || [];
      setEvents(Array.isArray(eventsArray) ? eventsArray : []);
    } catch (err) {
      setError(err.message || 'Failed to load events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleOpenAdd = () => {
    setEditingEvent(null);
    setFormData({
      title: '',
      type: 'Technical Workshop',
      mode: 'Online',
      date: new Date().toISOString().split('T')[0],
      location: '',
      meetingLink: '',
      maxCapacity: 250,
      description: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingEvent(item);
    setFormData({
      title: item.title || item.name || '',
      type: item.type || 'Technical Workshop',
      mode: item.mode || (item.meetingLink ? 'Online' : 'Offline'),
      date: item.date ? item.date.split('T')[0] : '',
      location: item.location || '',
      meetingLink: item.meetingLink || '',
      maxCapacity: item.maxCapacity || item.capacity || 250,
      description: item.description || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const mode = formData.mode || 'Online';
      if (mode === 'Online' && (!formData.meetingLink || !formData.meetingLink.trim())) {
        alert('Meeting link is required for Online events.');
        return;
      }
      if (mode === 'Offline' && (!formData.location || !formData.location.trim())) {
        alert('Meeting location/venue is required for Offline events.');
        return;
      }

      const payload = {
        name: formData.title,
        title: formData.title,
        type: formData.type,
        mode: mode,
        date: formData.date,
        location: mode === 'Offline' ? formData.location.trim() : 'Online',
        meetingLink: mode === 'Online' ? formData.meetingLink.trim() : '',
        maxCapacity: formData.maxCapacity,
        description: formData.description
      };

      if (editingEvent) {
        const id = editingEvent.id || editingEvent._id;
        await updateEvent(id, payload);
      } else {
        await addEvent(payload);
      }
      setIsModalOpen(false);
      loadEvents();
    } catch (err) {
      alert(`Operation failed: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to cancel and remove this event?')) return;
    try {
      await deleteEvent(id);
      loadEvents();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const upcomingCount = events.filter((ev) => getEventStatus(ev) === 'UPCOMING').length;
  const ongoingCount = events.filter((ev) => getEventStatus(ev) === 'ONGOING').length;
  const completedCount = events.filter((ev) => getEventStatus(ev) === 'COMPLETED').length;
  const registeredCount = events.filter((ev) => isUserRegistered(ev, user)).length;
  const notRegisteredCount = events.filter((ev) => !isUserRegistered(ev, user)).length;

  const filteredEvents = events.filter((ev) => {
    const status = getEventStatus(ev);
    if (statusFilter === 'all') return true;
    if (statusFilter === 'upcoming') return status === 'UPCOMING';
    if (statusFilter === 'ongoing') return status === 'ONGOING';
    if (statusFilter === 'completed') return status === 'COMPLETED';
    if (statusFilter === 'registered') return isUserRegistered(ev, user);
    if (statusFilter === 'notRegistered') return !isUserRegistered(ev, user);
    return true;
  });

  return (
    <div className="flex-1 min-w-0 bg-[#EBF3FA] pb-16 min-h-screen">
      <Header 
        title="Manage Alumni Events" 
        subtitle="Organize conferences, career bootcamps, workshops and networking sessions" 
        onBack={onBack}
        onToggleSidebar={onToggleSidebar}
      />

      <main className="p-6 space-y-6 max-w-[1600px] mx-auto">
        {/* Actions & Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500">Event Status Filter:</span>
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
              {[
                { key: 'all', label: 'All Events' },
                { key: 'upcoming', label: `Upcoming (${upcomingCount})` },
                { key: 'ongoing', label: `Ongoing (${ongoingCount})` },
                { key: 'completed', label: `Completed (${completedCount})` },
                { key: 'registered', label: `Registered (${registeredCount})` },
                { key: 'notRegistered', label: `Not Registered (${notRegisteredCount})` }
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setStatusFilter(opt.key)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    statusFilter === opt.key 
                      ? 'bg-[#0F4C81] text-white shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleOpenAdd}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0F4C81] hover:bg-[#1E3A8A] text-white text-xs font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-300" />
            Create Event
          </button>
        </div>

        {/* Content Table / Cards */}
        {loading ? (
          <LoadingSpinner message="Loading events schedule..." />
        ) : error ? (
          <ErrorAlert message={error} onRetry={loadEvents} />
        ) : filteredEvents.length === 0 ? (
          <EmptyState title="No Events Found" description="There are no events matching your filter criteria." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredEvents.map((event) => {
              const eventId = event.id || event._id;
              const status = getEventStatus(event);
              const attendees = event.attendeesCount ?? event.participantCount ?? (event.participants?.length || 0);
              const capacity = event.maxCapacity || event.capacity || 100;
              const eventDateStr = event.date ? new Date(event.date).toLocaleDateString(undefined, {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              }) : 'TBD';

              return (
                <div
                  key={eventId}
                  className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-sm hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-[#0F4C81] text-xs font-semibold border border-blue-100">
                        <Tag className="w-3 h-3" />
                        {event.type || 'Workshop'}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {status === 'COMPLETED' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200">
                            ✓ COMPLETED
                          </span>
                        ) : status === 'ONGOING' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                            ● ONGOING
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Upcoming
                          </span>
                        )}
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[#0F4C81] border border-blue-200">
                          Created by You
                        </span>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug">
                      {event.title || event.name}
                    </h3>

                    <div className="space-y-1.5 text-xs text-slate-600 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#0F4C81] shrink-0" />
                        <span>{eventDateStr}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-purple-600 shrink-0" />
                        <span>{event.location || 'Virtual Meet'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          <strong className="text-slate-900">{attendees}</strong> registered / {capacity} capacity
                        </span>
                      </div>
                    </div>

                    {/* Attendance Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mb-4">
                      <div
                        className="bg-[#0F4C81] h-1.5 rounded-full"
                        style={{ width: `${Math.min(100, Math.round((attendees / capacity) * 100))}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="text-[11px] text-slate-400 font-mono">ID: {String(eventId).slice(-6)}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(event)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(eventId)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                        title="Delete Event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal for Add / Edit */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">
                  {editingEvent ? 'Edit Event Details' : 'Create New Event'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Event Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Event Category</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                    >
                      <option value="Technical Workshop">Technical Workshop</option>
                      <option value="Conference">Conference</option>
                      <option value="Networking">Networking</option>
                      <option value="Career Guidance">Career Guidance</option>
                      <option value="Webinar">Webinar</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Event Mode</label>
                    <select
                      value={formData.mode || 'Online'}
                      onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                    >
                      <option value="Online">Online</option>
                      <option value="Offline">Offline</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Max Capacity</label>
                    <input
                      type="number"
                      required
                      value={formData.maxCapacity}
                      onChange={(e) => setFormData({ ...formData, maxCapacity: parseInt(e.target.value, 10) || 100 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                    >
                    </input>
                  </div>
                </div>

                {formData.mode === 'Offline' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Meeting Location / Venue *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Main Auditorium, KIET Block B"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Meeting Link *</label>
                    <input
                      type="url"
                      required
                      placeholder="e.g. https://meet.google.com/abc-defg-hij"
                      value={formData.meetingLink}
                      onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Description (Optional)</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F4C81] resize-none"
                    placeholder="Provide event details or instructions..."
                  />
                </div>

                <div className="justify-end gap-2 pt-4 border-t border-slate-100 flex">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#0F4C81] hover:bg-[#1E3A8A] text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm"
                  >
                    {editingEvent ? 'Save Changes' : 'Publish Event'}
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
