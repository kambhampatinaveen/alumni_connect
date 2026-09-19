import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter } from '../ui/dialog';
import { requestMentorship } from '../../api/mentorshipApi';
import { getAlumni } from '../../api/alumniApi';
import { PlusCircle, GraduationCap } from 'lucide-react';

export default function RequestMentorshipButton({ alumniId: initialAlumniId, onSuccess }) {
  const [open, setOpen] = useState(false);
  const [alumniList, setAlumniList] = useState([]);
  const [selectedAlumniId, setSelectedAlumniId] = useState(initialAlumniId || '');
  const [domain, setDomain] = useState('Placements');
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const domains = [
    'Placements',
    'Higher Studies',
    'Software Development',
    'Career Guidance',
    'Entrepreneurship'
  ];

  // Fetch alumni mentors if not pre-provided
  useEffect(() => {
    if (open && !initialAlumniId) {
      async function loadMentors() {
        try {
          const res = await getAlumni();
          const list = res.data?.data?.items || res.data?.data || [];
          setAlumniList(Array.isArray(list) ? list : []);
          if (Array.isArray(list) && list.length > 0 && !selectedAlumniId) {
            setSelectedAlumniId(list[0].userId?._id || list[0].userId || list[0]._id);
          }
        } catch (err) {
          console.error('Failed to load mentors list', err);
        }
      }
      loadMentors();
    }
  }, [open, initialAlumniId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    const targetAlumniId = initialAlumniId || selectedAlumniId;
    if (!targetAlumniId) {
      setError('Please select an alumni mentor.');
      return;
    }

    if (!goal.trim()) {
      setError('Please provide your mentorship goal or focus area.');
      return;
    }

    try {
      setLoading(true);
      await requestMentorship({
        alumniId: targetAlumniId,
        domain,
        goal: goal.trim()
      });
      setSuccess('Mentorship request sent successfully!');
      window.dispatchEvent(new CustomEvent('refresh-notifications'));
      setTimeout(() => {
        setOpen(false);
        setGoal('');
        setSuccess('');
        if (onSuccess) onSuccess();
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send mentorship request');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Button
        onClick={() => setOpen(true)}
        className="bg-purple-600 hover:bg-purple-700 flex items-center gap-1.5 text-xs font-semibold"
      >
        <PlusCircle className="w-4 h-4" /> Request Mentorship
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-purple-600" />
            Request 1-on-1 Mentorship
          </DialogTitle>
          <DialogDescription>
            Connect with an experienced alumni mentor for career guidance, mock interviews, or domain mastery.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogContent className="space-y-4">
            {success && (
              <Alert variant="success">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Mentor Dropdown (shown if alumniId not passed directly) */}
            {!initialAlumniId && (
              <div className="space-y-1.5">
                <Label>Select Alumni Mentor</Label>
                {alumniList.length === 0 ? (
                  <p className="text-xs text-slate-400 py-1">Loading alumni mentors...</p>
                ) : (
                  <Select
                    value={selectedAlumniId}
                    onChange={(e) => setSelectedAlumniId(e.target.value)}
                    required
                  >
                    {alumniList.map((al) => {
                      const uId = al.userId?._id || al.userId || al._id;
                      const name = al.name || al.userId?.name || 'Alumni Mentor';
                      const role = al.role || al.designation || (al.jobRole ? `${al.jobRole} @ ${al.company || 'Tech'}` : 'Alumni');
                      return (
                        <option key={String(uId)} value={String(uId)}>
                          {name} ({role})
                        </option>
                      );
                    })}
                  </Select>
                )}
              </div>
            )}

            {/* Mentorship Domain */}
            <div className="space-y-1.5">
              <Label>Mentorship Domain</Label>
              <Select value={domain} onChange={(e) => setDomain(e.target.value)} required>
                {domains.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
            </div>

            {/* Mentorship Goal */}
            <div className="space-y-1.5">
              <Label>Goal / Focus Area</Label>
              <Input
                required
                placeholder="e.g. Placement preparation and full-stack project code review"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
              />
            </div>
          </DialogContent>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 font-semibold"
            >
              {loading ? 'Sending Request...' : 'Send Request'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
