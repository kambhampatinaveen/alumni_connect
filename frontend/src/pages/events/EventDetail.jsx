import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getEventById, participate, deleteEvent } from '../../api/eventApi';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter } from '../../components/ui/dialog';
import { useAuth } from '../../lib/auth';
import {
  MapPin, Users, Calendar, ArrowLeft,
  CheckCircle, Trash2, Video, Clock
} from 'lucide-react';
import { getEventStatus, isUserRegistered, isUserEventCreator } from '../../lib/eventUtils';

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Confirmation modal state
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const res = await getEventById(id);
      setEvent(res.data?.data);
    } catch (err) {
      setError('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const userRegistered = isUserRegistered(event, user);
  const isEventCreator = isUserEventCreator(event, user);
  const isCreatorOrAdmin = user?.role === 'admin' || isEventCreator;
  const status = getEventStatus(event);

  const handleInitiateRegister = () => {
    if (status === 'COMPLETED') {
      setError('This event has already been completed.');
      return;
    }
    setConfirmModalOpen(true);
  };

  const handleConfirmRegister = async () => {
    try {
      setActionLoading(true);
      setError('');
      setMessage('');
      await participate(id);
      setMessage('Registration completed successfully.');
      setConfirmModalOpen(false);
      await fetchEvent();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Could not register for event');
      setConfirmModalOpen(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await deleteEvent(id);
      navigate('/events');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete event');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">Event not found.</p>
        <Link to="/events" className="text-indigo-600 font-semibold mt-2 inline-block">
          Back to Events
        </Link>
      </div>
    );
  }

  const dateObj = new Date(event.date);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <Link
        to="/events"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to All Events
      </Link>

      {message && (
        <Alert variant="success">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Event Details Card */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-900 p-6 flex items-end">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 text-white backdrop-blur-md">
            {event.type}
          </span>
        </div>

        <CardContent className="p-6 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b pb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                {event.name || event.title}
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Hosted by: <strong className="text-slate-700">{event.createdBy?.name || event.creatorName || 'Campus Faculty'}</strong>
                {event.createdBy?.role && ` (${event.createdBy.role})`}
              </p>
            </div>

            {/* Registration Action Button / Completed Status / Created by You */}
            <div className="flex items-center gap-3">
              {status === 'COMPLETED' ? (
                <Button
                  disabled
                  variant="outline"
                  className="text-xs font-semibold px-5 py-2.5 bg-slate-100 text-slate-500 border border-slate-200 cursor-not-allowed opacity-90 flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4 text-slate-400" />
                  ✓ Completed
                </Button>
              ) : userRegistered ? (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  ✓ Registered
                </span>
              ) : isEventCreator && user?.role !== 'admin' ? (
                <span className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-50 text-[#0F4C81] border border-blue-200 text-xs font-bold">
                  Created by You
                </span>
              ) : (
                <Button
                  onClick={handleInitiateRegister}
                  disabled={actionLoading}
                  className="text-xs font-semibold px-5 py-2.5 bg-[#0F4C81] hover:bg-[#1E3A8A] text-white cursor-pointer shadow-sm"
                >
                  <CheckCircle className="w-4 h-4 mr-1.5" />
                  {actionLoading ? 'Registering...' : 'Register to Attend'}
                </Button>
              )}

              {isCreatorOrAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  className="text-xs text-red-600 hover:bg-red-50 border-red-200 cursor-pointer"
                  title="Delete Event"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Quick Details Chips */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <Calendar className="w-5 h-5 text-indigo-600 flex-shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Date & Time</span>
                <p className="text-xs font-bold text-slate-800">
                  {dateObj.toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                  {event.time && ` • ${event.time}`}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <MapPin className="w-5 h-5 text-indigo-600 flex-shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Mode & Venue</span>
                <p className="text-xs font-bold text-slate-800 truncate">
                  {event.mode === 'Offline' ? (event.location || 'Campus Venue') : 'Online Virtual Meet'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <Users className="w-5 h-5 text-indigo-600 flex-shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Attendees</span>
                <p className="text-xs font-bold text-slate-800">
                  {event.participantCount !== undefined ? event.participantCount : (event.participants?.length || 0)} Registered
                </p>
              </div>
            </div>
          </div>

          {/* Online Meeting Section (Secure Visibility) */}
          {event.mode !== 'Offline' && (
            <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Online Meeting Access</h4>
                  <p className="text-[11px] text-slate-500">
                    {status === 'COMPLETED'
                      ? 'Event has ended. Meeting access is closed.'
                      : status === 'ONGOING'
                      ? userRegistered || isEventCreator || user?.role === 'admin'
                        ? 'Event is happening now! Click Join Meeting to participate.'
                        : 'Registration required to access the meeting link.'
                      : userRegistered || isEventCreator || user?.role === 'admin'
                      ? 'Meeting link will be available when the event starts.'
                      : 'Register to access the meeting link when the event starts.'}
                  </p>
                </div>
              </div>

              <div>
                {status === 'ONGOING' && (userRegistered || isEventCreator || user?.role === 'admin') && event.meetingLink && (
                  <a
                    href={event.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0F4C81] hover:bg-[#1E3A8A] text-white text-xs font-bold transition shadow-sm"
                  >
                    <Video className="w-3.5 h-3.5 text-amber-300" />
                    <span>Join Meeting</span>
                  </a>
                )}
                {status === 'UPCOMING' && (userRegistered || isEventCreator || user?.role === 'admin') && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                    <Clock className="w-3 h-3 text-slate-400" />
                    Available on event day
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Event Description */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">About this Event</h3>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/60 p-5 rounded-2xl border border-slate-100">
              {event.description || 'No detailed description provided.'}
            </p>
          </div>

          {/* Registered Participants Roster */}
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-400" />
                Registered Participants ({event.participants?.length || 0})
              </h3>
            </div>

            {event.participants?.length === 0 ? (
              <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-xl text-center">
                No participants registered yet. Be the first to register!
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {event.participants.map((p, idx) => {
                  const u = p.user || p || {};
                  return (
                    <div
                      key={p._id || idx}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                          {u.name ? u.name.charAt(0).toUpperCase() : 'P'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{u.name || 'Participant'}</p>
                          <p className="text-[10px] text-slate-400">{u.email}</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-200/80 text-slate-700">
                        {u.role || 'Member'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
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
            <h4 className="text-sm font-bold text-slate-900">{event.name || event.title}</h4>
            <div className="flex items-center gap-2 text-xs text-slate-600 pt-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>
                {dateObj.toLocaleDateString(undefined, {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
                {event.time && ` at ${event.time}`}
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Once registered, your seat will be reserved and you will receive meeting and schedule details.
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
            onClick={handleConfirmRegister}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs cursor-pointer"
          >
            {actionLoading ? 'Registering...' : 'Confirm Registration'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
