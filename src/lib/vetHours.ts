// Clinic opening-hours helpers.
// Stored shape (jsonb on vet_doctors.opening_hours):
//   { "mon": "09:00-13:00,16:00-19:00", "tue": "09:00-13:00", "sun": "closed" }
// Missing days are treated as "hours not provided" rather than closed.

export const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type DayKey = (typeof DAY_KEYS)[number];

export const DAY_LABELS: Record<DayKey, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

export type Slot = { startMin: number; endMin: number };
export type DayHours = { day: DayKey; label: string; closed: boolean; slots: Slot[]; raw: string | null };

function toMinutes(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 24 || min > 59) return null;
  return h * 60 + min;
}

export function formatMinutes(total: number): string {
  const h24 = Math.floor(total / 60) % 24;
  const min = total % 60;
  const suffix = h24 < 12 ? "AM" : "PM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(min).padStart(2, "0")} ${suffix}`;
}

function parseDay(day: DayKey, raw: unknown): DayHours | null {
  if (typeof raw !== "string" || raw.trim() === "") return null;
  const value = raw.trim();
  if (/^closed$/i.test(value)) {
    return { day, label: DAY_LABELS[day], closed: true, slots: [], raw: value };
  }
  const slots: Slot[] = [];
  for (const part of value.split(",")) {
    const [from, to] = part.split("-");
    if (!from || !to) continue;
    const startMin = toMinutes(from);
    const endMin = toMinutes(to);
    if (startMin == null || endMin == null || endMin <= startMin) continue;
    slots.push({ startMin, endMin });
  }
  if (slots.length === 0) return null;
  return { day, label: DAY_LABELS[day], closed: false, slots, raw: value };
}

/** Returns null when the clinic has not provided any usable hours. */
export function parseOpeningHours(value: unknown): DayHours[] | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const days = DAY_KEYS.map((d) => parseDay(d, record[d])).filter((d): d is DayHours => d !== null);
  return days.length > 0 ? days : null;
}

export function dayKeyFor(date = new Date()): DayKey {
  // JS: 0 = Sunday
  return DAY_KEYS[(date.getDay() + 6) % 7];
}

export function todayHours(hours: DayHours[] | null, date = new Date()): DayHours | null {
  if (!hours) return null;
  const key = dayKeyFor(date);
  return hours.find((h) => h.day === key) ?? null;
}

/** true / false when hours are known for today, null when unknown. */
export function isOpenNow(hours: DayHours[] | null, date = new Date()): boolean | null {
  const today = todayHours(hours, date);
  if (!today) return null;
  if (today.closed) return false;
  const now = date.getHours() * 60 + date.getMinutes();
  return today.slots.some((s) => now >= s.startMin && now < s.endMin);
}

export function describeDay(day: DayHours): string {
  if (day.closed) return "Closed";
  return day.slots.map((s) => `${formatMinutes(s.startMin)} – ${formatMinutes(s.endMin)}`).join(", ");
}

/** Booking slots (30 min) available for a given date, respecting clinic hours. */
export function slotsForDate(hours: DayHours[] | null, date: Date, stepMin = 30): string[] {
  const day = todayHours(hours, date);
  if (!day || day.closed) return [];
  const out: string[] = [];
  const isToday = new Date().toDateString() === date.toDateString();
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  for (const slot of day.slots) {
    for (let t = slot.startMin; t + stepMin <= slot.endMin; t += stepMin) {
      if (isToday && t <= nowMin) continue;
      out.push(`${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`);
    }
  }
  return out;
}
