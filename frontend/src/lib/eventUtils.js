/**
 * Reusable event utilities for dynamic status calculation, registration, and creator checks.
 *
 * Rules:
 * UPCOMING: Show events whose start date/time is in the future.
 * ONGOING: Show an event that is currently active according to the event date and start/end time.
 * COMPLETED: Show events whose scheduled end time has already passed.
 *
 * All status values returned in uppercase ('UPCOMING', 'ONGOING', 'COMPLETED') for consistency.
 */

export function parseTimeString(timeStr) {
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

export function getEventStartAndEndTime(event) {
  if (!event || !event.date) return null;
  const rawDate = new Date(event.date);
  if (isNaN(rawDate.getTime())) return null;

  let year, month, day;
  if (typeof event.date === 'string') {
    const datePart = event.date.split('T')[0];
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

  const { startHour, startMin, endHour, endMin } = parseTimeString(event.time);

  const startDate = new Date(year, month, day, startHour, startMin, 0, 0);
  const endDate = new Date(year, month, day, endHour, endMin, 0, 0);

  return { startDate, endDate };
}

export function getEventStatus(event) {
  if (!event) return 'UPCOMING';
  if (event.status === 'CANCELLED') return 'CANCELLED';

  const range = getEventStartAndEndTime(event);
  if (!range) {
    if (event.status && ['UPCOMING', 'ONGOING', 'COMPLETED'].includes(event.status.toUpperCase())) {
      return event.status.toUpperCase();
    }
    return 'UPCOMING';
  }

  const now = new Date();
  if (now < range.startDate) {
    return 'UPCOMING';
  } else if (now <= range.endDate) {
    return 'ONGOING';
  } else {
    return 'COMPLETED';
  }
}

export function isEventActiveToday(event) {
  return getEventStatus(event) === 'ONGOING';
}

export function isUserEventCreator(event, currentUser) {
  if (!event || !currentUser) return false;
  const currentUserId = String(currentUser.id || currentUser._id || '');
  const currentUserEmail = (currentUser.email || '').toLowerCase().trim();

  if (event.isCreator) return true;

  const creatorId = String(event.createdBy?._id || event.createdBy?.id || event.createdBy || event.creatorId || '');
  const creatorEmail = (event.createdBy?.email || event.creatorEmail || '').toLowerCase().trim();

  if (currentUserId && creatorId && currentUserId === creatorId) return true;
  if (currentUserEmail && creatorEmail && currentUserEmail === creatorEmail) return true;

  return false;
}

export function isUserRegistered(event, currentUser) {
  if (!event || !currentUser) return false;
  if (event.isRegistered) return true;

  const currentUserId = String(currentUser.id || currentUser._id || '');
  const currentUserEmail = (currentUser.email || '').toLowerCase().trim();

  if (Array.isArray(event.participants)) {
    return event.participants.some(p => {
      if (!p) return false;
      const pId = String(p._id || p.id || p || '');
      const pEmail = (p.email || p.user?.email || '').toLowerCase().trim();
      return (currentUserId && pId === currentUserId) || (currentUserEmail && pEmail === currentUserEmail);
    });
  }

  return false;
}
