import { school, type Assignment, type Lesson } from "./school";
import { autoSchedule, type Unplaced } from "./scheduler";

let assignments: Assignment[] = [];
let busy: Record<string, string[]> = {};
let items: Lesson[] = [];
let leftover: Unplaced[] = [];
let stats = { total: 0, placed: 0 };
let ready = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function cloneBusy(src: Record<string, string[]>) {
  return Object.fromEntries(Object.entries(src).map(([id, keys]) => [id, [...keys]]));
}

function leftoverFrom(list: Assignment[]): Unplaced[] {
  return list.filter((a) => a.hours > 0).map((a) => ({ ...a }));
}

function totalHours(list: Assignment[]) {
  return list.reduce((s, a) => s + a.hours, 0);
}

export function hydrateTimetable() {
  if (ready) return;
  assignments = school.assignments.map((a) => ({ ...a }));
  busy = cloneBusy(school.busy);
  items = [];
  leftover = leftoverFrom(assignments);
  stats = { total: totalHours(assignments), placed: 0 };
  ready = true;
}

function apply(result: ReturnType<typeof autoSchedule>) {
  items = result.lessons;
  leftover = result.unplaced;
  stats = { total: result.total, placed: result.placed };
  emit();
}

export function runAutoSchedule(seed = Date.now()) {
  apply(autoSchedule(seed, { assignments, busy }));
}

export function getLessons() {
  return items;
}

export function getUnplaced() {
  return leftover;
}

export function scheduleStats() {
  return stats;
}

export function getAssignments() {
  return assignments;
}

export function getBusy() {
  return busy;
}

export function setHours(classId: string, subject: string, hours: number) {
  const n = Math.max(0, Math.min(8, Math.round(hours)));
  assignments = assignments.map((a) => (a.classId === classId && a.subject === subject ? { ...a, hours: n } : a));
  if (items.length === 0) leftover = leftoverFrom(assignments);
  stats = { ...stats, total: totalHours(assignments) };
  emit();
}

export function toggleBusy(teacherId: string, day: number, period: number) {
  const key = `${day}-${period}`;
  const cur = new Set(busy[teacherId] ?? []);
  if (cur.has(key)) cur.delete(key);
  else cur.add(key);
  busy = { ...busy, [teacherId]: [...cur] };
  emit();
}

export function unplacedCount() {
  return leftover.reduce((s, u) => s + u.hours, 0);
}

export function subscribeTimetable(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export type Clash = {
  key: string;
  teacherId: string;
  day: number;
  period: number;
  lessons: Lesson[];
};

export function clashes(list = items): Clash[] {
  const map = new Map<string, Lesson[]>();
  for (const l of list) {
    const key = `${l.teacherId}-${l.day}-${l.period}`;
    const row = map.get(key) ?? [];
    row.push(l);
    map.set(key, row);
  }
  return [...map.entries()]
    .filter(([, row]) => row.length > 1)
    .map(([key, lessons]) => ({
      key,
      teacherId: lessons[0]!.teacherId,
      day: lessons[0]!.day,
      period: lessons[0]!.period,
      lessons,
    }));
}

export function clashCount() {
  return unplacedCount();
}

export function swapLessons(idA: string, idB: string) {
  const a = items.find((l) => l.id === idA);
  const b = items.find((l) => l.id === idB);
  if (!a || !b || a.classId !== b.classId) return;
  items = items.map((l) => {
    if (l.id === a.id) return { ...l, subject: b.subject, teacherId: b.teacherId, room: b.room };
    if (l.id === b.id) return { ...l, subject: a.subject, teacherId: a.teacherId, room: a.room };
    return l;
  });
  emit();
}

export function freeTeachersFor(lesson: Lesson) {
  return freeAt(lesson.day, lesson.period, lesson.subject).filter((t) => t.id !== lesson.teacherId);
}

export function freeAt(day: number, period: number, subject?: string) {
  const busyNow = new Set(
    items.filter((l) => l.day === day && l.period === period).map((l) => l.teacherId),
  );
  return school.teachers.filter((t) => {
    if (busyNow.has(t.id)) return false;
    if (busy[t.id]?.includes(`${day}-${period}`)) return false;
    if (t.state === "請假" || t.state === "公幹") return false;
    if (subject && t.subject !== subject) return false;
    return true;
  });
}

export function loadFor(teacherId: string) {
  return items.filter((l) => l.teacherId === teacherId).length;
}

export function reassignLesson(id: string, teacherId: string) {
  items = items.map((l) => (l.id === id ? { ...l, teacherId } : l));
  emit();
}
