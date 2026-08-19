const SURNAMES = ["陳", "李", "黃", "梁", "張", "吳", "何", "周", "林", "鄭", "馬", "胡", "郭", "蔡", "楊", "許", "鄧", "羅", "葉", "謝"];
const G1 = ["嘉", "詩", "俊", "曉", "柏", "穎", "志", "美", "國", "詠", "文", "雅", "家", "浩", "天", "安", "樂", "心", "宇", "晴"];
const G2 = ["豪", "敏", "傑", "彤", "希", "琳", "明", "儀", "強", "詩", "軒", "婷", "華", "欣", "朗", "晴", "誠", "恩", "樂", "瑤"];
export const SUBJECTS = ["中文", "英文", "數學", "物理", "化學", "生物", "歷史", "地理", "公民", "體育", "視覺藝術", "資訊科技"];
const UNIVERSITIES = [
  "澳門大學",
  "澳門理工大學",
  "澳門科技大學",
  "香港大學",
  "香港中文大學",
  "香港科技大學",
  "台灣大學",
  "北京大學",
  "復旦大學",
  "英國倫敦大學學院",
];
const LETTERS = ["甲", "乙", "丙"] as const;
export const GRADE_LABEL = ["", "中一", "中二", "中三", "中四", "中五", "中六"];
export const GRADE_TERMS = [
  "中一上",
  "中一下",
  "中二上",
  "中二下",
  "中三上",
  "中三下",
  "中四上",
  "中四下",
  "中五上",
  "中五下",
  "中六上",
] as const;
export const GRADE_SUBJECTS = SUBJECTS;

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function rng(seed: number) {
  let a = seed || 1;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rand: () => number, arr: readonly T[]) {
  return arr[Math.floor(rand() * arr.length)]!;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function splitMonths(totals: number[], weights: number[]) {
  return totals.map((n) => {
    const parts = weights.map((w, i) => (i === weights.length - 1 ? 0 : Math.round(n * w)));
    parts[parts.length - 1] = n - parts.slice(0, -1).reduce((a, b) => a + b, 0);
    return parts;
  });
}

function zipByGrade(before: number[], after: number[], wBefore: number[], wAfter: number[]): GradeSeries[] {
  const b = splitMonths(before, wBefore);
  const a = splitMonths(after, wAfter);
  return [1, 2, 3, 4, 5, 6].map((grade, gi) => ({
    grade,
    before: b.map((row) => row[gi]!),
    after: a.map((row) => row[gi]!),
  }));
}

function personName(rand: () => number) {
  return pick(rand, SURNAMES) + pick(rand, G1) + pick(rand, G2);
}

export type TeacherState = "上課中" | "空堂" | "請假" | "公幹" | "會議";

export type Klass = {
  id: string;
  name: string;
  grade: number;
  letter: string;
  teacherId: string;
  size: number;
  male: number;
  female: number;
  attendance: number;
  late: number;
  missingHomework: number;
  awards: number;
  capacity: number;
  homeroomHistory: { year: string; teacherId: string }[];
};

export type Student = {
  id: string;
  name: string;
  studentNo: string;
  gender: "男" | "女";
  classId: string;
  attendance: number;
  average: number;
  missingHomework: number;
  conduct: "優良" | "穩定" | "需關注";
  enrolled: string;
  awards: number;
  health: "良好" | "需觀察" | "長期病假";
  isMonitorCandidate?: boolean;
};

export type Teacher = {
  id: string;
  name: string;
  title: string;
  subject: string;
  state: TeacherState;
  detail: string;
  homeroomClassId?: string;
  years: number;
  training: number;
  awards: number;
  homeroomScore: number;
};

export const WEEKDAYS = ["一", "二", "三", "四", "五"] as const;
export const PERIODS = [
  { n: 1, time: "08:15–08:55" },
  { n: 2, time: "09:05–09:45" },
  { n: 3, time: "09:55–10:35" },
  { n: 4, time: "10:45–11:25" },
  { n: 5, time: "13:15–13:55" },
  { n: 6, time: "14:05–14:45" },
  { n: 7, time: "14:55–15:35" },
  { n: 8, time: "15:45–16:25" },
] as const;

export type Lesson = {
  id: string;
  classId: string;
  teacherId: string;
  subject: string;
  day: number;
  period: number;
  room: string;
};

export type Assignment = {
  classId: string;
  subject: string;
  teacherId: string;
  hours: number;
};

export function curriculumFor(grade: number): { subject: string; hours: number }[] {
  return grade <= 3
    ? [
        { subject: "中文", hours: 7 },
        { subject: "英文", hours: 7 },
        { subject: "數學", hours: 7 },
        { subject: "生物", hours: 2 },
        { subject: "物理", hours: 2 },
        { subject: "化學", hours: 2 },
        { subject: "歷史", hours: 2 },
        { subject: "地理", hours: 2 },
        { subject: "公民", hours: 2 },
        { subject: "體育", hours: 2 },
        { subject: "視覺藝術", hours: 2 },
        { subject: "資訊科技", hours: 2 },
        { subject: "班會", hours: 1 },
      ]
    : [
        { subject: "中文", hours: 6 },
        { subject: "英文", hours: 6 },
        { subject: "數學", hours: 6 },
        { subject: "物理", hours: 4 },
        { subject: "化學", hours: 4 },
        { subject: "生物", hours: 3 },
        { subject: "歷史", hours: 2 },
        { subject: "地理", hours: 2 },
        { subject: "公民", hours: 2 },
        { subject: "體育", hours: 2 },
        { subject: "視覺藝術", hours: 1 },
        { subject: "資訊科技", hours: 2 },
      ];
}

export function roomFor(subject: string, klassName: string) {
  if (subject === "體育") return "操場";
  if (subject === "視覺藝術") return "美勞室";
  if (subject === "資訊科技") return "電腦室";
  return `${klassName}課室`;
}

export type Graduate = {
  year: number;
  studentName: string;
  university: string;
  className: string;
  tutorId: string;
};

export type Resource = {
  id: string;
  subject: string;
  title: string;
  kind: "教案" | "課件" | "試題" | "校本教材";
  owner: string;
  year: string;
  leftoverFrom?: string;
};

export type GradeSeries = {
  grade: number;
  before: number[];
  after: number[];
};

export type Policy = {
  id: string;
  title: string;
  started: string;
  metric: string;
  before: number[];
  after: number[];
  note: string;
  byGrade: GradeSeries[];
};

export type StudentTermGrade = { term: string; rank: number } & Record<string, number | string>;

export const FEATURED_CLASS = "6b";
export const FEATURED_STUDENT = "chan-ka-ho";
export const FEATURED_TEACHER = "t-mei-yi";

function classId(_grade: number, letter: string) {
  const map: Record<string, string> = { 甲: "a", 乙: "b", 丙: "c" };
  return `6${map[letter] ?? letter.toLowerCase()}`;
}

function className(_grade: number, letter: string) {
  return `高三${letter}`;
}

const COVER: Record<string, string> = {
  中文: "t-chi-ming",
  英文: "t-wing-yan",
  數學: FEATURED_TEACHER,
  物理: "t-ho-hin",
  化學: "t-ya-ting",
  生物: "t-chi-keung",
  歷史: "t-si-lam",
  地理: "t-si-lam",
  公民: "t-kwok-keung",
  體育: "t-kwok-ho",
  視覺藝術: "t-sum-ching",
  資訊科技: "t-sum-ching",
};

function build() {
  const teachers: Teacher[] = [
    {
      id: FEATURED_TEACHER,
      name: "李美儀老師",
      title: "老師",
      subject: "數學",
      state: "上課中",
      detail: "高三乙 數學 · 第 3 節",
      homeroomClassId: FEATURED_CLASS,
      years: 8,
      training: 12,
      awards: 3,
      homeroomScore: 78,
    },
    {
      id: "t-chi-ming",
      name: "陳志明主任",
      title: "主任",
      subject: "中文",
      state: "請假",
      detail: "病假 · 今日全日",
      years: 18,
      training: 14,
      awards: 5,
      homeroomScore: 71,
    },
    {
      id: "t-kwok-keung",
      name: "黃國強老師",
      title: "老師",
      subject: "公民",
      state: "公幹",
      detail: "教育局會議 09:00–12:00",
      years: 11,
      training: 9,
      awards: 2,
      homeroomScore: 66,
    },
    {
      id: "t-wing-yan",
      name: "吳詠恩老師",
      title: "老師",
      subject: "英文",
      state: "上課中",
      detail: "高三甲 英文 · 第 2 節",
      homeroomClassId: "6a",
      years: 7,
      training: 8,
      awards: 1,
      homeroomScore: 74,
    },
    {
      id: "t-ho-hin",
      name: "張浩軒老師",
      title: "老師",
      subject: "物理",
      state: "上課中",
      detail: "高三丙 物理 · 第 4 節",
      years: 9,
      training: 6,
      awards: 2,
      homeroomScore: 69,
    },
    {
      id: "t-ya-ting",
      name: "林雅婷老師",
      title: "老師",
      subject: "化學",
      state: "空堂",
      detail: "本科組備課",
      years: 5,
      training: 7,
      awards: 1,
      homeroomScore: 72,
    },
    {
      id: "t-chi-keung",
      name: "周志強老師",
      title: "老師",
      subject: "生物",
      state: "上課中",
      detail: "高三乙 生物 · 第 5 節",
      years: 13,
      training: 10,
      awards: 3,
      homeroomScore: 70,
    },
    {
      id: "t-si-lam",
      name: "何詩琳老師",
      title: "老師",
      subject: "歷史",
      state: "會議",
      detail: "科組會議 14:00–15:30",
      years: 10,
      training: 11,
      awards: 2,
      homeroomScore: 73,
    },
    {
      id: "t-kwok-ho",
      name: "鄭國豪老師",
      title: "老師",
      subject: "體育",
      state: "上課中",
      detail: "高三丙 體育 · 第 6 節",
      homeroomClassId: "6c",
      years: 6,
      training: 4,
      awards: 0,
      homeroomScore: 64,
    },
    {
      id: "t-sum-ching",
      name: "蔡心晴老師",
      title: "老師",
      subject: "資訊科技",
      state: "上課中",
      detail: "高三甲 資訊科技 · 第 7 節",
      years: 4,
      training: 5,
      awards: 1,
      homeroomScore: 68,
    },
  ];

  const homeroomByLetter: Record<(typeof LETTERS)[number], string> = {
    甲: "t-wing-yan",
    乙: FEATURED_TEACHER,
    丙: "t-kwok-ho",
  };

  const classes: Klass[] = [];
  const students: Student[] = [];

  for (const letter of LETTERS) {
    const id = classId(6, letter);
    const r = rng(hash(id));
    const size = 12;
    const male = letter === "乙" ? 7 : 6;
    const teacherId = homeroomByLetter[letter];
    const attendance = id === FEATURED_CLASS ? 92.3 : clamp(94.8 + r() * 3.2, 94.8, 98.1);
    classes.push({
      id,
      name: className(6, letter),
      grade: 6,
      letter,
      teacherId,
      size,
      male,
      female: size - male,
      attendance: Math.round(attendance * 10) / 10,
      late: 2 + Math.floor(r() * 6),
      missingHomework: 3 + Math.floor(r() * 8),
      awards: Math.floor(r() * 5),
      capacity: 42,
      homeroomHistory: [
        { year: "2023", teacherId: teachers[Math.floor(r() * teachers.length)]!.id },
        { year: "2024", teacherId: teachers[Math.floor(r() * teachers.length)]!.id },
        { year: "2025", teacherId },
      ],
    });
  }

  const featured: Student = {
    id: FEATURED_STUDENT,
    name: "陳嘉豪",
    studentNo: "20200315",
    gender: "男",
    classId: FEATURED_CLASS,
    attendance: 96.8,
    average: 78.4,
    missingHomework: 6,
    conduct: "穩定",
    enrolled: "2020年9月",
    awards: 4,
    health: "良好",
    isMonitorCandidate: true,
  };
  students.push(featured);

  for (const klass of classes) {
    const already = students.filter((s) => s.classId === klass.id).length;
    for (let n = already; n < klass.size; n++) {
      const sid = `${klass.id}-s${n}`;
      const r = rng(hash(sid));
      const gender: "男" | "女" = n < klass.male ? "男" : "女";
      const average = clamp(48 + r() * 47, 42, 95);
      const attendance = clamp(91 + r() * 7.5, 91, 98.6);
      const missing = Math.floor(r() * r() * 14);
      const conduct: Student["conduct"] = missing > 8 || attendance < 93.5 ? "需關注" : average > 85 ? "優良" : "穩定";
      students.push({
        id: sid,
        name: personName(r),
        studentNo: `2020${String(hash(sid) % 10000).padStart(4, "0")}`,
        gender,
        classId: klass.id,
        attendance: Math.round(attendance * 10) / 10,
        average: Math.round(average * 10) / 10,
        missingHomework: missing,
        conduct,
        enrolled: "2020年9月",
        awards: Math.floor(r() * r() * 6),
        health: r() > 0.93 ? "需觀察" : r() > 0.985 ? "長期病假" : "良好",
        isMonitorCandidate: r() > 0.88,
      });
    }
  }

  const leaveTeachers = teachers.filter((t) => t.state === "請假" || t.state === "公幹" || t.state === "會議");

  function teacherFor(klass: Klass, subject: string) {
    if (klass.id === FEATURED_CLASS && subject === "數學") return FEATURED_TEACHER;
    return COVER[subject] ?? klass.teacherId;
  }

  const assignments: Assignment[] = [];
  for (const klass of classes) {
    for (const row of curriculumFor(klass.grade)) {
      assignments.push({
        classId: klass.id,
        subject: row.subject,
        teacherId: teacherFor(klass, row.subject),
        hours: row.hours,
      });
    }
  }

  const busy: Record<string, string[]> = {
    "t-chi-ming": PERIODS.map((p) => `1-${p.n}`),
    "t-kwok-keung": ["1-1", "1-2", "1-3", "1-4"],
    "t-si-lam": ["1-6", "1-7"],
    [FEATURED_TEACHER]: ["4-8"],
  };

  const graduates: Graduate[] = [];
  for (const year of [2023, 2024, 2025]) {
    for (let i = 0; i < 8; i++) {
      const r = rng(year * 1000 + i);
      graduates.push({
        year,
        studentName: personName(r),
        university: pick(r, UNIVERSITIES),
        className: className(6, pick(r, LETTERS)),
        tutorId: pick(r, teachers).id,
      });
    }
  }

  const resources: Resource[] = [];
  let rid = 0;
  for (const subject of SUBJECTS) {
    for (let i = 0; i < 2; i++) {
      const r = rng(hash(subject) + i);
      const leftover = r() > 0.7;
      resources.push({
        id: `r${rid++}`,
        subject,
        title: `${subject}${pick(r, ["單元", "總複習", "公開課", "校本"])}${1 + Math.floor(r() * 6)}`,
        kind: pick(r, ["教案", "課件", "試題", "校本教材"] as const),
        owner: "廣大中學" + subject + "科組",
        year: String(2022 + Math.floor(r() * 4)),
        leftoverFrom: leftover ? personName(r) + "老師（已離職）" : undefined,
      });
    }
  }

  const lateBefore = [186, 192, 178, 201, 188, 174];
  const lateAfter = [161, 148, 139, 132, 128, 121];
  const hwBefore = [95, 98, 92, 101, 97, 94];
  const hwAfter = [58, 52, 49, 47, 46, 44];
  const runBefore = [42, 39, 44, 40, 38, 41];
  const runAfter = [36, 34, 33, 31, 30, 29];

  const policies: Policy[] = [
    {
      id: "late-conduct",
      title: "遲到納入操行（2024-09 起）",
      started: "2024-09",
      metric: "全校月均遲到次數",
      before: lateBefore,
      after: lateAfter,
      note: "推行後六個月，遲到由每月約 190 次降至約 120 次。",
      byGrade: zipByGrade(lateBefore, lateAfter, [0.21, 0.19, 0.18, 0.16, 0.15, 0.11], [0.16, 0.17, 0.18, 0.18, 0.17, 0.14]),
    },
    {
      id: "homework-once",
      title: "欠交功課一次輸入、班主任與科任共享（2025-02 起）",
      started: "2025-02",
      metric: "班主任每週填報分鐘",
      before: hwBefore,
      after: hwAfter,
      note: "重複抄寫減少，班主任每週填報時間約降一半。",
      byGrade: zipByGrade(hwBefore, hwAfter, [0.17, 0.17, 0.17, 0.17, 0.16, 0.16], [0.17, 0.17, 0.16, 0.17, 0.16, 0.17]),
    },
    {
      id: "morning-run",
      title: "早會後十分鐘跑操（2025-04 試點中三）",
      started: "2025-04",
      metric: "中三病假人次／月",
      before: runBefore,
      after: runAfter,
      note: "試點班病假略降，尚未推至全校。",
      byGrade: [1, 2, 3, 4, 5, 6].map((grade) => {
        if (grade === 3) return { grade, before: runBefore, after: runAfter };
        const base = 24 + grade * 4;
        const flat = [base, base + 1, base - 1, base + 2, base, base - 1];
        return { grade, before: flat, after: [...flat] };
      }),
    },
  ];

  return { teachers, classes, students, assignments, busy, graduates, resources, policies, leaveTeachers };
}

export const school = build();

export const cockpit = {
  dateLabel: "2026年8月18日（二）",
  updated: "2 分鐘前更新",
  studentAttendance: 95.4,
  attendanceDelta: -0.8,
  absent: 2,
  late: 3,
  teachersIn: school.teachers.filter((t) => t.state !== "請假" && t.state !== "公幹").length,
  teachersTotal: school.teachers.length,
  leave: school.teachers.filter((t) => t.state === "請假").length,
  errand: school.teachers.filter((t) => t.state === "公幹").length,
  meeting: school.teachers.filter((t) => t.state === "會議").length,
  newRecords: "86",
  historySince: "2019 學年",
};

export const schoolAttendance30 = Array.from({ length: 30 }, (_, i) => {
  const r = rng(4400 + i);
  return Math.round((94.8 + r() * 2.6) * 10) / 10;
});
export const schoolAverageLine = 96.0;

export function teacherById(id: string) {
  return school.teachers.find((t) => t.id === id);
}

export function classById(id: string) {
  return school.classes.find((c) => c.id === id);
}

export function studentById(id: string) {
  return school.students.find((s) => s.id === id);
}

export function studentsInClass(classId: string) {
  return school.students.filter((s) => s.classId === classId);
}

export function abnormalClasses() {
  return school.classes.filter((c) => c.attendance < 94).sort((a, b) => a.attendance - b.attendance);
}

export function exceptionTeachers() {
  return school.teachers.filter((t) => t.state === "請假" || t.state === "公幹" || t.state === "會議");
}

export type TodayMark = {
  id: string;
  name: string;
  classId: string;
  className: string;
  note: string;
};

function marks(rows: { id: string; note: string }[]): TodayMark[] {
  return rows.flatMap((row) => {
    const s = studentById(row.id);
    const klass = s ? classById(s.classId) : undefined;
    if (!s || !klass) return [];
    return [{ id: s.id, name: s.name, classId: s.classId, className: klass.name, note: row.note }];
  });
}

export function todayAbsentees() {
  return marks([
    { id: "6a-s3", note: "病假已補條" },
    { id: "6c-s7", note: "家事" },
  ]);
}

export function todayLates() {
  return marks([
    { id: "6b-s4", note: "第一節 · 校巴延誤" },
    { id: "6a-s8", note: "第一節" },
    { id: "6c-s2", note: "第一節" },
  ]);
}

export function heatmapCells(id: string) {
  const r = rng(hash(id + "heat"));
  return Array.from({ length: 126 }, () => {
    const v = r();
    return v > 0.92 ? 0 : v > 0.55 ? 3 : v > 0.3 ? 2 : 1;
  });
}

const FEATURED_SCORES: Record<string, number[]> = {
  中文: [72, 74, 75, 77, 76, 78, 79, 80, 81, 80, 82],
  英文: [68, 70, 71, 73, 74, 75, 76, 77, 76, 78, 79],
  數學: [81, 84, 82, 86, 88, 85, 87, 89, 88, 90, 91],
  物理: [74, 76, 73, 78, 79, 80, 81, 80, 82, 83, 84],
  化學: [70, 71, 72, 74, 73, 75, 76, 77, 78, 77, 79],
  生物: [73, 74, 75, 76, 77, 76, 78, 79, 80, 81, 80],
  歷史: [69, 70, 72, 71, 73, 74, 75, 74, 76, 77, 78],
  地理: [71, 72, 70, 73, 74, 75, 74, 76, 77, 76, 78],
  公民: [76, 77, 78, 79, 78, 80, 81, 80, 82, 83, 82],
  體育: [82, 83, 81, 84, 85, 84, 86, 85, 87, 86, 88],
  視覺藝術: [80, 81, 79, 82, 83, 84, 83, 85, 84, 86, 85],
  資訊科技: [77, 78, 79, 80, 81, 80, 82, 83, 84, 83, 85],
};

export function studentGrades(id: string): StudentTermGrade[] {
  if (id === FEATURED_STUDENT) {
    return GRADE_TERMS.map((term, i) => {
      const row: StudentTermGrade = { term, rank: Math.max(1, 18 - i) };
      for (const subject of GRADE_SUBJECTS) row[subject] = FEATURED_SCORES[subject]![i]!;
      return row;
    });
  }
  const r = rng(hash(id + "g"));
  const base = studentById(id)?.average ?? 75;
  return GRADE_TERMS.map((term, i) => {
    const row: StudentTermGrade = { term, rank: Math.max(1, Math.round(28 - i * 2 - r() * 8)) };
    for (const subject of GRADE_SUBJECTS) {
      const drift = (GRADE_SUBJECTS.indexOf(subject) % 5) - 2;
      row[subject] = Math.round(clamp(base + drift + r() * 8 + i * 0.4, 40, 96));
    }
    return row;
  });
}

export function studentTimeline(id: string) {
  if (id === FEATURED_STUDENT) {
    return [
      { date: "2025-09", title: "升讀高三乙，班主任李美儀", kind: "info" as const },
      { date: "2024-11", title: "獲全澳中學生數學競賽三等獎", kind: "good" as const },
      { date: "2024-10", title: "連續 3 次欠交數學作業", kind: "watch" as const },
      { date: "2024-05", title: "家長會：在家使用手機時間過長", kind: "watch" as const },
      { date: "2023-12", title: "擔任班級圖書管理員", kind: "good" as const },
      { date: "2021-06", title: "中一下學期成績進步獎", kind: "good" as const },
      { date: "2020-09", title: "入學，編入中一丙", kind: "info" as const },
    ];
  }
  const s = studentById(id);
  const r = rng(hash(id + "tl"));
  const items: { date: string; title: string; kind: "good" | "watch" | "info" }[] = [
    { date: s?.enrolled.replace("年9月", "-09") ?? "2020-09", title: `入學，編入 ${classById(s?.classId ?? "")?.name ?? ""}`, kind: "info" },
  ];
  if (s && s.awards > 0) items.push({ date: "2024-06", title: `校內獎項 ${s.awards} 項`, kind: "good" });
  if (s && s.missingHomework > 5) items.push({ date: "2025-03", title: `欠交功課累計 ${s.missingHomework} 件`, kind: "watch" });
  if (s && s.conduct === "優良") items.push({ date: "2025-01", title: "操行優良嘉許", kind: "good" });
  if (r() > 0.5) items.push({ date: "2024-12", title: "家長短會：溫習時間安排", kind: "info" });
  return items.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function parentNotes(id: string) {
  if (id === FEATURED_STUDENT) {
    return [
      {
        date: "2024-05-18",
        who: "陳先生、陳太",
        how: "家長會面談",
        summary: "在家使用手機時間過長，晚上溫習難以集中。",
        follow: "平日手機至 21:30，兩週後再談。",
      },
      {
        date: "2023-12-08",
        who: "陳太",
        how: "電話",
        summary: "擔任圖書管理員後放學略遲。",
        follow: "無需特別跟進。",
      },
    ];
  }
  const r = rng(hash(id + "p"));
  if (r() > 0.55) return [];
  return [
    {
      date: "2025-01-16",
      who: "家長",
      how: r() > 0.5 ? "面談" : "電話",
      summary: pick(r, ["溫習習慣", "朋輩相處", "睡眠不足", "選科意向"]),
      follow: pick(r, ["兩週後再聯絡", "轉介輔導組", "觀察即可"]),
    },
  ];
}

export function attendanceLog(id: string) {
  const r = rng(hash(id + "al"));
  const n = Math.floor(r() * 5);
  return Array.from({ length: n }, (_, i) => ({
    date: `2025-${String(3 + (i % 6)).padStart(2, "0")}-${String(2 + i * 3).padStart(2, "0")}`,
    type: r() > 0.5 ? "遲到" : "缺席",
    note: pick(r, ["第一節", "病假已補條", "校巴延誤", "家事"]),
  }));
}

export function healthNotes(id: string) {
  const s = studentById(id);
  const r = rng(hash(id + "h"));
  return {
    height: 148 + Math.floor(r() * 32),
    weight: 38 + Math.floor(r() * 28),
    sickDays: s?.health === "長期病假" ? 18 : Math.floor(r() * 8),
    peExcuse: r() > 0.9,
    counsel: s?.health === "需觀察" || r() > 0.92,
  };
}

export function conductRecords(id: string) {
  const r = rng(hash(id + "c"));
  const n = 2 + Math.floor(r() * 5);
  return Array.from({ length: n }, (_, i) => ({
    date: `2024-${String(9 + (i % 4)).padStart(2, "0")}-${String(4 + i * 2).padStart(2, "0")}`,
    text: pick(r, ["遲到", "欠交功課", "課堂嘉許", "服務紀錄", "儀容提醒", "比賽表現"]),
    kind: r() > 0.55 ? ("good" as const) : ("watch" as const),
  }));
}

export function classSubjectAverages(classId: string) {
  const r = rng(hash(classId + "avg"));
  return SUBJECTS.slice(0, 6).map((subject) => ({
    subject,
    classAvg: Math.round(68 + r() * 16),
    gradeAvg: Math.round(70 + r() * 12),
  }));
}

export function teacherTraining(id: string) {
  const r = rng(hash(id + "tr"));
  const n = 4 + Math.floor(r() * 8);
  return Array.from({ length: n }, (_, i) => ({
    date: `${2021 + (i % 5)}-${String(1 + (i % 9)).padStart(2, "0")}`,
    title: pick(r, ["校本教研", "差異化教學", "班級經營", "STEM 工作坊", "正向教育", "評估素養", "資訊科技教學"]),
    hours: 3 + Math.floor(r() * 12),
  }));
}

export function teacherAwards(id: string) {
  const r = rng(hash(id + "aw"));
  const n = Math.floor(r() * 5);
  return Array.from({ length: n }, (_, i) => ({
    date: `${2020 + i}`,
    title: pick(r, ["優秀班主任", "教學設計獎", "帶隊比賽指導", "科組貢獻獎"]),
  }));
}

export const SUBJECT_LIST = SUBJECTS;
export const UNIVERSITY_LIST = UNIVERSITIES;
export const GRADE_LABELS = GRADE_LABEL;
