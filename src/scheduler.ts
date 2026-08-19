import {
  FEATURED_CLASS,
  FEATURED_TEACHER,
  PERIODS,
  WEEKDAYS,
  classById,
  roomFor,
  school,
  type Assignment,
  type Lesson,
} from "./school";

export type ScheduleInput = {
  assignments: Assignment[];
  busy: Record<string, string[]>;
};

export type Unplaced = {
  classId: string;
  subject: string;
  teacherId: string;
  hours: number;
};

export type ScheduleResult = {
  lessons: Lesson[];
  unplaced: Unplaced[];
  placed: number;
  total: number;
};

function shuffle<T>(arr: T[], rand: () => number) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = a[i]!;
    a[i] = a[j]!;
    a[j] = tmp;
  }
  return a;
}

function mulberry(seed: number) {
  let a = seed || 1;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function autoSchedule(seed = 1, input?: ScheduleInput): ScheduleResult {
  const assignments = input?.assignments ?? school.assignments;
  const busySrc = input?.busy ?? school.busy;
  const days = WEEKDAYS.length;
  const periods = PERIODS.map((p) => p.n);
  const rand = mulberry(seed);
  const busy = new Map<string, Set<string>>();
  for (const [id, keys] of Object.entries(busySrc)) {
    busy.set(id, new Set(keys));
  }

  const grid = new Map<string, Lesson | null>();
  const teacherAt = new Map<string, string>();

  function cellKey(classId: string, day: number, period: number) {
    return `${classId}-${day}-${period}`;
  }
  function teachKey(day: number, period: number) {
    return `${day}-${period}`;
  }

  function isBusy(teacherId: string, day: number, period: number) {
    return busy.get(teacherId)?.has(`${day}-${period}`) ?? false;
  }

  function teacherConflict(teacherId: string, day: number, period: number) {
    if (isBusy(teacherId, day, period)) return true;
    return teacherAt.get(`${teacherId}-${teachKey(day, period)}`) !== undefined;
  }

  function slotOpen(classId: string, day: number, period: number) {
    return !grid.get(cellKey(classId, day, period));
  }

  function dayHasSubject(classId: string, day: number, subject: string) {
    for (const period of periods) {
      const hit = grid.get(cellKey(classId, day, period));
      if (hit?.subject === subject) return true;
    }
    return false;
  }

  function put(classId: string, day: number, period: number, subject: string, teacherId: string) {
    const klass = classById(classId);
    const lesson: Lesson = {
      id: `l-${classId}-${day}-${period}`,
      classId,
      teacherId,
      subject,
      day,
      period,
      room: roomFor(subject, klass?.name ?? classId),
    };
    grid.set(cellKey(classId, day, period), lesson);
    teacherAt.set(`${teacherId}-${teachKey(day, period)}`, classId);
  }

  function findPeriod(classId: string, teacherId: string, day: number) {
    const start = Math.floor(rand() * periods.length);
    for (let j = 0; j < periods.length; j++) {
      const period = periods[(start + j) % periods.length]!;
      if (slotOpen(classId, day, period) && !teacherConflict(teacherId, day, period)) return period;
    }
    return -1;
  }

  function placeAnywhere(classId: string, subject: string, teacherId: string) {
    const start = Math.floor(rand() * days);
    for (let i = 0; i < days; i++) {
      const day = (start + i) % days;
      const period = findPeriod(classId, teacherId, day);
      if (period !== -1) {
        put(classId, day, period, subject, teacherId);
        return true;
      }
    }
    return false;
  }

  function placeSpread(classId: string, subject: string, teacherId: string) {
    for (const day of shuffle(Array.from({ length: days }, (_, i) => i), rand)) {
      if (dayHasSubject(classId, day, subject)) continue;
      const period = findPeriod(classId, teacherId, day);
      if (period !== -1) {
        put(classId, day, period, subject, teacherId);
        return true;
      }
    }
    return placeAnywhere(classId, subject, teacherId);
  }

  const math = assignments.find((a) => a.classId === FEATURED_CLASS && a.subject === "數學" && a.hours > 0);
  if (math && slotOpen(FEATURED_CLASS, 1, 3) && !teacherConflict(FEATURED_TEACHER, 1, 3)) {
    put(FEATURED_CLASS, 1, 3, "數學", FEATURED_TEACHER);
  }

  const prePlaced = new Map<string, number>();
  for (const lesson of grid.values()) {
    if (!lesson) continue;
    const key = `${lesson.classId}-${lesson.subject}-${lesson.teacherId}`;
    prePlaced.set(key, (prePlaced.get(key) ?? 0) + 1);
  }

  const units: { classId: string; subject: string; teacherId: string }[] = [];
  let total = 0;
  for (const a of assignments) {
    const key = `${a.classId}-${a.subject}-${a.teacherId}`;
    const remain = Math.max(0, a.hours - (prePlaced.get(key) ?? 0));
    total += a.hours;
    for (let i = 0; i < remain; i++) units.push({ classId: a.classId, subject: a.subject, teacherId: a.teacherId });
  }

  const failed: { classId: string; subject: string; teacherId: string }[] = [];
  for (const unit of shuffle(units, rand)) {
    if (!placeSpread(unit.classId, unit.subject, unit.teacherId)) failed.push(unit);
  }

  for (const unit of failed) {
    const alts = school.teachers.filter(
      (t) => t.subject === unit.subject && t.state !== "請假" && t.state !== "公幹" && t.id !== unit.teacherId,
    );
    for (const t of shuffle(alts, rand)) {
      if (placeSpread(unit.classId, unit.subject, t.id)) break;
    }
  }

  const lessons = [...grid.values()].filter((l): l is Lesson => l !== null);
  const placedCount = new Map<string, number>();
  for (const l of lessons) {
    const key = `${l.classId}-${l.subject}`;
    placedCount.set(key, (placedCount.get(key) ?? 0) + 1);
  }

  const unplaced: Unplaced[] = [];
  for (const a of assignments) {
    const key = `${a.classId}-${a.subject}`;
    const diff = a.hours - (placedCount.get(key) ?? 0);
    if (diff > 0) unplaced.push({ classId: a.classId, subject: a.subject, teacherId: a.teacherId, hours: diff });
  }

  return {
    lessons,
    unplaced,
    placed: lessons.length,
    total,
  };
}
