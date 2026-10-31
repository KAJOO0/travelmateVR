// Minimal iCalendar (RFC 5545) export for bookings and itineraries.
export interface IcsEvent { uid: string; title: string; start: string; end?: string; time?: string; durationHours?: number; location?: string; description?: string }

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/[,;]/g, m => `\\${m}`);
const ymd = (iso: string) => iso.slice(0, 10).replace(/-/g, '');

function stamp(date: string, time: string): string {
  return `${ymd(date)}T${time.replace(':', '')}00`;
}

export function buildIcs(events: IcsEvent[], calName = 'TravelMateVR'): string {
  const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Mates Technologies Limited//TravelMateVR//EN', 'CALSCALE:GREGORIAN', `X-WR-CALNAME:${esc(calName)}`];
  for (const e of events) {
    lines.push('BEGIN:VEVENT', `UID:${e.uid}@travelmatevr.com`, `DTSTAMP:${now}`);
    if (e.time) {
      const start = new Date(`${e.start}T${e.time}:00`);
      const end = new Date(start.getTime() + (e.durationHours ?? 2) * 3600000);
      lines.push(`DTSTART:${stamp(e.start, e.time)}`, `DTEND:${stamp(end.toISOString().slice(0, 10), end.toTimeString().slice(0, 5))}`);
    } else {
      const endDay = new Date(new Date(e.end ?? e.start).getTime() + 86400000).toISOString().slice(0, 10);
      lines.push(`DTSTART;VALUE=DATE:${ymd(e.start)}`, `DTEND;VALUE=DATE:${ymd(endDay)}`);
    }
    lines.push(`SUMMARY:${esc(e.title)}`);
    if (e.location) lines.push(`LOCATION:${esc(e.location)}`);
    if (e.description) lines.push(`DESCRIPTION:${esc(e.description)}`);
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadFile(name: string, content: string, type = 'text/calendar;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
