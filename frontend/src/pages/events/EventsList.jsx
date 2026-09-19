import React, { useEffect, useState } from 'react';
import { getEvents, createEvent, participate, deleteEvent } from '../../api/eventApi';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select } from '../../components/ui/select';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter } from '../../components/ui/dialog';
import { useAuth } from '../../lib/auth';
import Header from '../../components/admin/Header';
import {
  CalendarDays, MapPin, Users, PlusCircle, Search,
  Calendar, Clock, CheckCircle, Trash2, Video
} from 'lucide-react';
import { DatePicker } from '../../components/ui/calendar';
import { getEventStatus, isUserRegistered, isUserEventCreator } from '../../lib/eventUtils';

export default function EventsList({ onBack, onToggleSidebar }) {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  // Detail Modal State
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');

  // Registration Confirmation Dialog State
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [eventToRegister, setEventToRegister] = useState(null);

  // Host Event Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [eventTime, setEventTime] = useState('10:00');
  const [form, setForm] = useState({
    name: '',
    type: 'Technical Workshop',
    mode: 'Online',
    location: '',
    meetingLink: '',
    description: ''
  });

  async function fetchEvents() {
    try {
      setLoading(true);
      const res = await getEvents();
      setEvents(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load events', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEvents();
    const handleFocus = () => fetchEvents();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const upcomingCount = events.filter((ev) => getEventStatus(ev) === 'UPCOMING').length;
  const ongoingCount = events.filter((ev) => getEventStatus(ev) === 'ONGOING').length;
  const completedCount = events.filter((ev) => getEventStatus(ev) === 'COMPLETED').length;
  const registeredCount = events.filter((ev) => isUserRegistered(ev, user)).length;
  const notRegisteredCount = events.filter((ev) => !isUserRegistered(ev, user)).length;

  const filterOptions = [
    { key: 'all', label: `All Events (${events.length})` },
    { key: 'upcoming', label: `Upcoming (${upcomingCount})` },
    { key: 'ongoing', label: `Ongoing (${ongoingCount})` },
    { key: 'completed', label: `Completed (${completedCount})` },
    { key: 'registered', label: `Registered (${registeredCount})` },
    { key: 'notRegistered', label: `Not Registered (${notRegisteredCount})` }
  ];

  const eventTypes = [
    'Technical Workshop',
    'Career Guidance',
    'Webinar',
    'Networking'
  ];

  const handleOpenCreateModal = () => {
    setForm({
      name: '',
      type: 'Technical Workshop',
      mode: 'Online',
      location: '',
      meetingLink: '',
      description: ''
    });
    setEventDate(new Date().toISOString().split('T')[0]);
    setEventTime('10:00');
    setCreateError('');
    setCreateModalOpen(true);
  };

  async function handleCreateEvent(e) {
    e.preventDefault();
    setCreateError('');

    if (!form.name.trim() || !eventDate || !eventTime) {
      setCreateError('Event title, date, and time are required.');
      return;
    }

    const eventMode = form.mode || 'Online';
    if (eventMode === 'Online') {
      if (!form.meetingLink?.trim()) {
        setCreateError('Meeting Link is required for Online events.');
        return;
      }
      try {
        const parsedUrl = new URL(form.meetingLink.trim());
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
          throw new Error();
        }
      } catch (err) {
        setCreateError('Meeting link must be a valid HTTP or HTTPS URL (e.g. https://meet.google.com/...).');
        return;
      }
    } else {
      if (!form.location?.trim()) {
        setCreateError('Meeting Location / Venue is required for Offline events.');
        return;
      }
    }

    const combinedDateTime = `${eventDate}T${eventTime}`;
    const eventDateObj = new Date(combinedDateTime);
    if (isNaN(eventDateObj.getTime())) {
      setCreateError('Please provide a valid date and time.');
      return;
    }

    if (eventDateObj < new Date()) {
      setCreateError('Event date and time cannot be in the past. Please select today or a future date and time.');
      return;
    }

    try {
      setCreating(true);
      await createEvent({
        name: form.name.trim(),
        title: form.name.trim(),
        type: form.type,
        mode: eventMode,
        location: eventMode === 'Offline' ? form.location.trim() : 'Online',
        meetingLink: eventMode === 'Online' ? form.meetingLink.trim() : '',
        description: form.description.trim(),
        date: combinedDateTime,
        time: eventTime
      });
      setCreateModalOpen(false);
      setForm({
        name: '',
        type: 'Technical Workshop',
        mode: 'Online',
        location: '',
        meetingLink: '',
        description: ''
      });
      fetchEvents();
    } catch (err) {
      setCreateError(err.response?.data?.message || err.response?.data?.error || 'Could not create event');
    } finally {
      setCreating(false);
    }
  }

  // Open Event Details Modal
  const handleOpenDetailModal = (ev) => {
    setSelectedEvent(ev);
    setActionMessage('');
    setActionError('');
    setDetailModalOpen(true);
  };

  // Step 4 of Registration Flow: Open Confirmation Dialog
  const handleInitiateRegister = (ev) => {
    setEventToRegister(ev || selectedEvent);
    setConfirmModalOpen(true);
  };

  // Step 5 of Registration Flow: Confirm & Save to MongoDB
  const handleConfirmRegistration = async () => {
    const target = eventToRegister || selectedEvent;
    if (!target) return;
    const eventId = target.id || target._id;

    try {
      setActionLoading(true);
      setActionError('');
      setActionMessage('');
      const res = await participate(eventId);
      setActionMessage('Registration completed successfully.');
      setConfirmModalOpen(false);

      // Update selected event state
      const updatedItem = res.data?.data;
      if (updatedItem) {
        setSelectedEvent(updatedItem);
      } else {
        setSelectedEvent((prev) =>
          prev
            ? {
                ...prev,
                isRegistered: true,
                participantCount: (prev.participantCount || 0) + 1
              }
            : prev
        );
      }

      await fetchEvents();
    } catch (err) {
      setActionError(err.response?.data?.message || err.response?.data?.error || 'Failed to register for event');
      setConfirmModalOpen(false);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Event (Admin or Creator)
  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to remove this event?')) return;
    try {
      setActionLoading(true);
      await deleteEvent(eventId);
      setDetailModalOpen(false);
      fetchEvents();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to delete event');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredEvents = events.filter((ev) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (ev.name && ev.name.toLowerCase().includes(q)) ||
      (ev.title && ev.title.toLowerCase().includes(q)) ||
      (ev.location && ev.location.toLowerCase().includes(q)) ||
      (ev.description && ev.description.toLowerCase().includes(q)) ||
      (ev.type && ev.type.toLowerCase().includes(q));

    const status = getEventStatus(ev);
    const isRegistered = isUserRegistered(ev, user);

    let matchesFilter = true;
    if (selectedType === 'all') {
      matchesFilter = true;
    } else if (selectedType === 'upcoming') {
      matchesFilter = status === 'UPCOMING';
    } else if (selectedType === 'ongoing') {
      matchesFilter = status === 'ONGOING';
    } else if (selectedType === 'completed') {
      matchesFilter = status === 'COMPLETED';
    } else if (selectedType === 'registered') {
      matchesFilter = isRegistered;
    } else if (selectedType === 'notRegistered') {
      matchesFilter = !isRegistered;
    }

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex-1 min-w-0 bg-[#EBF3FA] pb-16 min-h-screen">
      <Header
        title={user?.role === 'admin' ? 'Manage Events & Workshops' : 'Events & Workshops'}
        subtitle={
          user?.role === 'admin'
            ? 'Create, publish, and administer campus workshops and networking events'
            : 'Join tech workshops, mock interview sessions, and campus networking meets hosted by alumni'
        }
        onBack={onBack}
        onToggleSidebar={onToggleSidebar}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search events by title, topic, location..."
      />

      <main className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <CalendarDays className="w-6 h-6 text-[#0F4C81]" />
              Alumni & Campus Events Schedule
            </h2>
          </div>

          {(user?.role === 'alumni' || user?.role === 'admin') && (
            <Button
              onClick={handleOpenCreateModal}
              className="bg-[#0F4C81] hover:bg-[#1E3A8A] flex items-center gap-1.5 text-xs font-semibold cursor-pointer text-white rounded-xl shadow-sm"
            >
              <PlusCircle className="w-4 h-4 text-amber-300" /> Host an Event
            </Button>
          )}
        </div>

        {/* Filter Chips & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap gap-1.5 p-1 bg-white rounded-2xl border border-slate-200 shadow-sm">
            {filterOptions.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setSelectedType(opt.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedType === opt.key
                    ? 'bg-[#0F4C81] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search events by name or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 text-xs bg-white rounded-xl"
            />
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredEvents.length === 0 ? (
          <Card className="text-center py-16 border-dashed">
            <CardContent className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <CalendarDays className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-slate-800">No events found</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                No campus sessions currently match your filter criteria. Check back soon for newly published meetups.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((e) => {
              const eId = e.id || e._id;
              const dateObj = new Date(e.date);
              const status = getEventStatus(e);
              const isEventCreator = isUserEventCreator(e, user);
              const isRegistered = isUserRegistered(e, user);

              return (
                <Card
                  key={eId}
                  className="overflow-hidden border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
                  onClick={() => handleOpenDetailModal(e)}
                >
                  <div>
                    {/* Card Header */}
                    <div className="p-5 pb-3">
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-[#0F4C81] border border-blue-100">
                            {e.type}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                            {e.mode || (e.meetingLink ? 'Online' : 'Offline')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {status === 'COMPLETED' ? (
                            <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                              ✓ COMPLETED
                            </span>
                          ) : status === 'ONGOING' ? (
                            <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 animate-pulse">
                              ● ONGOING
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              UPCOMING
                            </span>
                          )}
                          {isEventCreator && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                              Created by You
                            </span>
                          )}
                        </div>
                      </div>

                      <h2 className="text-base font-bold text-slate-900 group-hover:text-[#0F4C81] transition-colors line-clamp-2">
                        {e.name || e.title}
                      </h2>
                    </div>

                    <CardContent className="px-5 pb-4 space-y-3">
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {e.description || 'No description provided.'}
                      </p>

                      <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {dateObj.toLocaleDateString(undefined, {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                            {e.time && ` • ${e.time}`}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate">
                            {e.mode === 'Offline' ? (e.location || 'Campus Venue') : 'Online Virtual Meet'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-medium text-slate-700">
                            {e.participantCount !== undefined ? e.participantCount : (e.participants?.length || 0)} Registered Attendees
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </div>

                  {/* Card Action Button (Always visible, non-empty) */}
                  <div className="p-5 pt-0">
                    <button
                      type="button"
                      onClick={(evt) => {
                        evt.stopPropagation();
                        handleOpenDetailModal(e);
                      }}
                      className={`w-full h-10 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                        status === 'COMPLETED'
                          ? 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                          : isRegistered
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-600'
                          : isEventCreator
                          ? 'bg-blue-50 text-[#0F4C81] border border-blue-200 hover:bg-blue-100'
                          : 'bg-[#0F4C81] hover:bg-[#1E3A8A] text-white border border-[#0F4C81]'
                      }`}
                    >
                      {status === 'COMPLETED' ? (
                        <span className="flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-slate-500" />
                          ✓ Completed
                        </span>
                      ) : isRegistered ? (
                        <span className="flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-white" />
                          ✓ Registered (See Details)
                        </span>
                      ) : isEventCreator ? (
                        <span>Created by You (View Details)</span>
                      ) : (
                        <span>See Details & Register</span>
                      )}
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* ======================================================== */}
        {/* EVENT DETAILS & REGISTRATION MODAL                       */}
        {/* ======================================================== */}
        {selectedEvent && (
          <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
            <DialogHeader>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {selectedEvent.type}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                    Mode: {selectedEvent.mode || (selectedEvent.meetingLink ? 'Online' : 'Offline')}
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-semibold">
                  {getEventStatus(selectedEvent) === 'COMPLETED'
                    ? '✓ Event Completed'
                    : getEventStatus(selectedEvent) === 'ONGOING'
                    ? '● Happening Now'
                    : 'Status: Upcoming'}
                </span>
              </div>
              <DialogTitle className="text-lg font-bold text-slate-900 mt-2">
                {selectedEvent.name || selectedEvent.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Organized by {selectedEvent.createdBy?.name || selectedEvent.creatorName || 'Alumni Community'}
              </DialogDescription>
            </DialogHeader>

            <DialogContent className="space-y-4">
              {actionMessage && (
                <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  {actionMessage}
                </div>
              )}

              {actionError && (
                <Alert variant="destructive">
                  <AlertDescription>{actionError}</AlertDescription>
                </Alert>
              )}

              <p className="text-xs text-slate-700 leading-relaxed">
                {selectedEvent.description || 'No detailed overview provided for this event.'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="space-y-1">
                  <span className="text-slate-400 font-medium">Date & Time</span>
                  <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    {new Date(selectedEvent.date).toLocaleDateString(undefined, {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                    {selectedEvent.time && <span>at {selectedEvent.time}</span>}
                  </div>
                </div>

                {selectedEvent.mode === 'Offline' ? (
                  <div className="space-y-1">
                    <span className="text-slate-400 font-medium">Meeting Location / Venue</span>
                    <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="truncate">{selectedEvent.location || 'Campus Auditorium'}</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <span className="text-slate-400 font-medium">Online Meeting</span>
                    <div className="text-xs font-semibold text-slate-800 flex items-center gap-2 flex-wrap">
                      <Video className="w-3.5 h-3.5 text-indigo-600" />
                      {(() => {
                        const eventStatus = getEventStatus(selectedEvent);
                        const isRegistered = isUserRegistered(selectedEvent, user);
                        const isCreator = isUserEventCreator(selectedEvent, user);
                        const isAdmin = user?.role === 'admin';

                        if (eventStatus === 'COMPLETED') {
                          return (
                            <span className="text-slate-500 italic">
                              Event ended • No meeting access available
                            </span>
                          );
                        }

                        if (eventStatus === 'ONGOING') {
                          if (isRegistered || isCreator || isAdmin) {
                            if (selectedEvent.meetingLink) {
                              return (
                                <a
                                  href={selectedEvent.meetingLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#0F4C81] hover:bg-[#1E3A8A] text-white text-xs font-bold transition shadow-xs cursor-pointer"
                                >
                                  <Video className="w-3 h-3 text-amber-300" />
                                  <span>Join Meeting</span>
                                </a>
                              );
                            }
                            return <span className="text-slate-500 italic">Meeting link will open shortly</span>;
                          } else {
                            return (
                              <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px] font-medium">
                                Registration required to access the meeting
                              </span>
                            );
                          }
                        }

                        // UPCOMING
                        if (isRegistered || isCreator || isAdmin) {
                          return (
                            <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px] font-medium flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              Meeting link will be available when the event starts
                            </span>
                          );
                        } else {
                          return (
                            <span className="text-slate-500 italic text-[11px]">
                              Register to access the online meeting link when the event starts
                            </span>
                          );
                        }
                      })()}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-600 bg-purple-50/50 p-2.5 rounded-xl border border-purple-100">
                <Users className="w-4 h-4 text-purple-600" />
                <span className="font-semibold text-purple-900">
                  {selectedEvent.participantCount !== undefined ? selectedEvent.participantCount : (selectedEvent.participants?.length || 0)} participants registered
                </span>
              </div>
            </DialogContent>

            <DialogFooter className="flex flex-wrap items-center justify-between gap-2">
              <div>
                {(user?.role === 'admin' || selectedEvent.createdBy === user?.id || selectedEvent.createdBy?._id === user?.id) && (
                  <Button
                    type="button"
                    variant="danger"
                    disabled={actionLoading}
                    onClick={() => handleDeleteEvent(selectedEvent.id || selectedEvent._id)}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Event
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => setDetailModalOpen(false)}>
                  Close
                </Button>

                {getEventStatus(selectedEvent) === 'COMPLETED' ? (
                  <Button disabled className="bg-slate-100 text-slate-500 cursor-not-allowed text-xs font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-slate-400" />
                    ✓ Event Completed
                  </Button>
                ) : isUserRegistered(selectedEvent, user) ? (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    ✓ Registered
                  </span>
                ) : isUserEventCreator(selectedEvent, user) && user?.role !== 'admin' ? (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-50 text-[#0F4C81] border border-blue-200 shadow-xs">
                    Created by You
                  </span>
                ) : (
                  <Button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleInitiateRegister(selectedEvent)}
                    className="bg-[#0F4C81] hover:bg-[#0d3d68] text-white text-xs font-bold shadow-sm cursor-pointer"
                  >
                    {actionLoading ? 'Registering...' : 'Register for Event'}
                  </Button>
                )}
              </div>
            </DialogFooter>
          </Dialog>
        )}

        {/* ======================================================== */}
        {/* REGISTRATION CONFIRMATION MODAL                          */}
        {/* ======================================================== */}
        <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              Confirm Event Registration
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Are you sure you want to register for this event?
            </DialogDescription>
          </DialogHeader>

          <DialogContent className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <p className="text-xs text-slate-500 font-medium">Event Title:</p>
              <h4 className="text-sm font-bold text-slate-900">
                {eventToRegister?.name || eventToRegister?.title || selectedEvent?.name || selectedEvent?.title}
              </h4>
              <div className="flex items-center gap-2 text-xs text-slate-600 pt-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>
                  {(eventToRegister?.date || selectedEvent?.date) &&
                    new Date(eventToRegister?.date || selectedEvent?.date).toLocaleDateString(undefined, {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  {(eventToRegister?.time || selectedEvent?.time) && ` at ${eventToRegister?.time || selectedEvent?.time}`}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Once registered, your seat will be reserved and you will receive access to event updates and meeting information.
            </p>
          </DialogContent>

          <DialogFooter className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={actionLoading}
              onClick={() => setConfirmModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={actionLoading}
              onClick={handleConfirmRegistration}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs cursor-pointer"
            >
              {actionLoading ? 'Registering...' : 'Confirm Registration'}
            </Button>
          </DialogFooter>
        </Dialog>

        {/* ======================================================== */}
        {/* HOST EVENT MODAL (ADMIN & ALUMNI ONLY)                   */}
        {/* ======================================================== */}
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-emerald-600" />
              Host a Campus Event or Workshop
            </DialogTitle>
            <DialogDescription>
              Publish a session for students and alumni to share industry insights and technical mastery.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateEvent}>
            <DialogContent className="space-y-4">
              {createError && (
                <Alert variant="destructive">
                  <AlertDescription>{createError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label>Event Title</Label>
                <Input
                  required
                  placeholder="e.g. Masterclass: Scalable Backend Architecture in Node.js"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Event Category / Type</Label>
                  <Select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  >
                    {eventTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Event Date & Time</Label>
                  <div className="grid grid-cols-5 gap-2">
                    <div className="col-span-3">
                      <DatePicker
                        value={eventDate}
                        onChange={(d) => setEventDate(d)}
                        minDate={new Date()}
                        theme="emerald"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="time"
                        value={eventTime}
                        onChange={(e) => setEventTime(e.target.value)}
                        required
                        className="px-2 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Event Mode *</Label>
                <Select
                  value={form.mode || 'Online'}
                  onChange={(e) => setForm({ ...form, mode: e.target.value })}
                >
                  <option value="Online">Online</option>
                  <option value="Offline">Offline</option>
                </Select>
              </div>

              {form.mode === 'Offline' ? (
                <div className="space-y-1.5">
                  <Label>Meeting Location / Venue *</Label>
                  <Input
                    required
                    placeholder="e.g. Main Campus Auditorium, KIET Seminar Hall, Conference Room 2"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label>Meeting Link *</Label>
                  <Input
                    type="url"
                    required
                    placeholder="e.g. https://meet.google.com/abc-defg-hij or https://zoom.us/j/123456"
                    value={form.meetingLink}
                    onChange={(e) => setForm({ ...form, meetingLink: e.target.value })}
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Description & Overview</Label>
                <Textarea
                  rows={3}
                  placeholder="Key topics to be covered, target audience, and prerequisites..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </DialogContent>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={creating}
                className="bg-emerald-600 hover:bg-emerald-700 font-semibold text-white cursor-pointer"
              >
                {creating ? 'Publishing Event...' : 'Publish Event'}
              </Button>
            </DialogFooter>
          </form>
        </Dialog>
      </main>
    </div>
  );
}
