import { school, type Lesson } from "./school";

let items: Lesson[] = [];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function hydrateTimetable(seeds: Lesson[]) {
  if (items.length === 0) items = seeds.map((l) => ({ ...l }));
}

export function getLessons() {
  return items;
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
  return clashes().length;
}

export function lessonAt(classId: string, day: number, period: number) {
  return items.find((l) => l.classId === classId && l.day === day && l.period === period);
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
  const busy = new Set(
    items.filter((l) => l.day === lesson.day && l.period === lesson.period).map((l) => l.teacherId),
  );
  return school.teachers.filter(
    (t) => t.subject === lesson.subject && t.id !== lesson.teacherId && !busy.has(t.id),
  );
}

export function reassignLesson(id: string, teacherId: string) {
  items = items.map((l) => (l.id === id ? { ...l, teacherId } : l));
  emit();
}
