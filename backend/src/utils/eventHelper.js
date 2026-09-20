/**
 * Event timing, status calculation, and authorization sanitization helpers
 */

function parseTimeString(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') {
    return { startHour: 10, startMin: 0, endHour: 12, endMin: 0 };
  }

  // Normalize and split on " - ", " – ", " — ", " to "
  const parts = timeStr.split(/\s*(?:–|—|-|to)\s*/i);

  function parseSingleTime(str) {
    if (!str) return null;
    const clean = str.trim();
    // 12-hour AM/PM: e.g. "10:00 AM", "2:30 PM", "2 PM", "02:00 PM"
    const match12 = clean.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
    if (match12) {
      let h = parseInt(match12[1], 10);
      const m = match12[2] ? parseInt(match12[2], 10) : 0;
      const meridiem = match12[3] ? match12[3].toUpperCase() : null;
      if (meridiem === 'PM' && h < 12) h += 12;
      if (meridiem === 'AM' && h === 12) h = 0;
      return { hour: h, min: m };
    }
    // 24-hour: e.g. "14:00", "09:30"
    const match24 = clean.match(/^(\d{1,2}):(\d{2})$/);
    if (match24) {
      return { hour: parseInt(match24[1], 10), min: parseInt(match24[2], 10) };
    }
    return null;
  }

  const startParsed = parseSingleTime(parts[0]);
  const endParsed = parts[1] ? parseSingleTime(parts[1]) : null;

  const startHour = startParsed ? startParsed.hour : 10;
  const startMin = startParsed ? startParsed.min : 0;

  let endHour;
  let endMin;
  if (endParsed) {
    endHour = endParsed.hour;
    endMin = endParsed.min;
    if (endHour < startHour && endHour < 12) {
      endHour += 12;
    }
  } else {
    // Default duration: 2 hours
    endHour = startHour + 2;
    endMin = startMin;
  }

  return { startHour, startMin, endHour, endMin };
}

function getEventStartAndEndTime(ev) {
  if (!ev || !ev.date) return null;
  const rawDate = new Date(ev.date);
  if (isNaN(rawDate.getTime())) return null;

  let year, month, day;
  if (typeof ev.date === 'string') {
    const datePart = ev.date.split('T')[0];
    const parts = datePart.split('-').map(Number);
    if (parts.length === 3) {
      year = parts[0];
      month = parts[1] - 1;
      day = parts[2];
    }
  }
  if (!year) {
    year = rawDate.getFullYear();
    month = rawDate.getMonth();
    day = rawDate.getDate();
  }

  const { startHour, startMin, endHour, endMin } = parseTimeString(ev.time);

  const startDate = new Date(year, month, day, startHour, startMin, 0, 0);
  const endDate = new Date(year, month, day, endHour, endMin, 0, 0);

  return { startDate, endDate };
}

function calculateEventStatus(ev) {
  if (!ev) return 'UPCOMING';
  if (ev.status === 'CANCELLED') return 'CANCELLED';
  const range = getEventStartAndEndTime(ev);
  if (!range) return 'UPCOMING';

  const now = new Date();
  if (now < range.startDate) {
    return 'UPCOMING';
  } else if (now <= range.endDate) {
    return 'ONGOING';
  } else {
    return 'COMPLETED';
  }
}

function sanitizeEventForUser(ev, user) {
  const item = ev.toJSON ? ev.toJSON() : { ...ev };
  item.status = calculateEventStatus(ev);

  const userIdStr = user?.id || user?._id ? (user.id || user._id).toString() : '';
  const isCreator = Boolean(
    userIdStr &&
    ev.createdBy &&
    (ev.createdBy._id || ev.createdBy).toString() === userIdStr
  );
  const isAdmin = Boolean(user && user.role === 'admin');
  const isRegistered = Boolean(
    userIdStr &&
    Array.isArray(ev.participants) &&
    ev.participants.some(p => (p._id || p).toString() === userIdStr)
  );

  item.isRegistered = isRegistered;
  item.isCreator = isCreator;

  const isOngoing = item.status === 'ONGOING';
  const rawMeetingLink = (ev.meetingLink || item.meetingLink || '').trim();
  const hasLink = Boolean(item.mode === 'Online' && rawMeetingLink);

  item.hasMeetingLink = hasLink;

  // Authorization check for meeting link:
  // Admin or Creator can always access meetingLink
  // For strict test events [TEST EVENT]: registered user can only access when event is ONGOING
  // For standard events: registered user can view meetingLink
  const isTestEvent = Boolean(
    (ev.name && ev.name.includes('[TEST EVENT]')) ||
    (item.name && item.name.includes('[TEST EVENT]')) ||
    (item.title && item.title.includes('[TEST EVENT]'))
  );

  const canAccessMeetingLink = isCreator || isAdmin || (isOngoing && isRegistered) || (!isTestEvent && isRegistered);

  if (item.mode === 'Online') {
    if (canAccessMeetingLink && rawMeetingLink) {
      item.meetingLink = rawMeetingLink;
      item.canJoinMeeting = Boolean(isOngoing);
    } else {
      item.meetingLink = '';
      item.canJoinMeeting = false;
    }
  } else {
    item.meetingLink = '';
    item.canJoinMeeting = false;
  }

  return item;
}

module.exports = {
  parseTimeString,
  getEventStartAndEndTime,
  calculateEventStatus,
  sanitizeEventForUser
};
