const SURNAMES = ["陳", "李", "黃", "梁", "張", "吳", "何", "周", "林", "鄭", "馬", "胡", "郭", "蔡", "楊", "許", "鄧", "羅", "葉", "謝"];
const G1 = ["嘉", "詩", "俊", "曉", "柏", "穎", "志", "美", "國", "詠", "文", "雅", "家", "浩", "天", "安", "樂", "心", "宇", "晴"];
const G2 = ["豪", "敏", "傑", "彤", "希", "琳", "明", "儀", "強", "詩", "軒", "婷", "華", "欣", "朗", "晴", "誠", "恩", "樂", "瑤"];
const TITLES = ["老師", "老師", "老師", "主任"];
const SUBJECTS = ["中文", "英文", "數學", "物理", "化學", "生物", "歷史", "地理", "公民", "體育", "視覺藝術", "資訊科技"];
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
const GRADES = [1, 2, 3, 4, 5, 6] as const;
const LETTERS = ["A", "B", "C", "D"] as const;
const GRADE_LABEL = ["", "中一", "中二", "中三", "中四", "中五", "中六"];

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

export type Policy = {
  id: string;
  title: string;
  started: string;
  metric: string;
  before: number[];
  after: number[];
  note: string;
};

export const FEATURED_CLASS = "3b";
export const FEATURED_STUDENT = "chan-ka-ho";
export const FEATURED_TEACHER = "t-mei-yi";

function classId(grade: number, letter: string) {
  return `${grade}${letter.toLowerCase()}`;
}

function className(grade: number, letter: string) {
  return `${GRADE_LABEL[grade]}${letter}`;
}

function build() {
  const teachers: Teacher[] = [];
  const classes: Klass[] = [];
  const students: Student[] = [];

  const featuredTeacher: Teacher = {
    id: FEATURED_TEACHER,
    name: "李美儀老師",
    title: "老師",
    subject: "數學",
    state: "上課中",
    detail: "中三B 數學 · 第 3 節",
    homeroomClassId: FEATURED_CLASS,
    years: 8,
    training: 12,
    awards: 3,
    homeroomScore: 78,
  };
  teachers.push(featuredTeacher);

  const extraTeachers = [
    { id: "t-kwok-keung", name: "黃國強老師", subject: "公民", state: "公幹" as TeacherState, detail: "教育局會議 09:00–12:00" },
    { id: "t-chi-ming", name: "陳志明主任", subject: "中文", state: "請假" as TeacherState, detail: "病假 · 代課吳老師" },
  ];
  for (const t of extraTeachers) {
    const r = rng(hash(t.id));
    teachers.push({
      ...t,
      title: t.name.includes("主任") ? "主任" : "老師",
      years: 6 + Math.floor(r() * 16),
      training: 4 + Math.floor(r() * 18),
      awards: Math.floor(r() * 6),
      homeroomScore: 55 + Math.floor(r() * 40),
    });
  }

  while (teachers.length < 92) {
    const i = teachers.length;
    const r = rng(1000 + i * 97);
    const name = personName(r) + pick(r, TITLES);
    const states: TeacherState[] = [
      ...Array(70).fill("上課中"),
      ...Array(12).fill("空堂"),
      ...Array(5).fill("請假"),
      ...Array(3).fill("公幹"),
      ...Array(2).fill("會議"),
    ];
    const state = states[Math.floor(r() * states.length)] as TeacherState;
    const subject = pick(r, SUBJECTS);
    const detail =
      state === "上課中"
        ? `${className(1 + Math.floor(r() * 6), pick(r, LETTERS))} ${subject} · 第 ${1 + Math.floor(r() * 8)} 節`
        : state === "空堂"
          ? "本科組備課"
          : state === "請假"
            ? pick(r, ["病假", "事假", "婚假"]) + " · 已安排代課"
            : state === "公幹"
              ? pick(r, ["教育局會議", "校外比賽帶隊", "聯校教研"]) + " 全日"
              : "科組會議 14:00–15:30";
    teachers.push({
      id: `t-${i}`,
      name,
      title: name.endsWith("主任") ? "主任" : "老師",
      subject,
      state,
      detail,
      years: 1 + Math.floor(r() * 24),
      training: Math.floor(r() * 20),
      awards: Math.floor(r() * 7),
      homeroomScore: 50 + Math.floor(r() * 45),
    });
  }

  let homeroomIdx = 4;
  for (const grade of GRADES) {
    for (const letter of LETTERS) {
      const id = classId(grade, letter);
      const r = rng(hash(id));
      const size = 36 + Math.floor(r() * 7);
      const male = 16 + Math.floor(r() * 8);
      const teacher =
        id === FEATURED_CLASS ? featuredTeacher : teachers[homeroomIdx++ % teachers.length]!;
      if (id !== FEATURED_CLASS) teacher.homeroomClassId = id;
      const attendance = id === FEATURED_CLASS ? 92.3 : clamp(93.2 + r() * 5.1, 93.2, 98.4);
      classes.push({
        id,
        name: className(grade, letter),
        grade,
        letter,
        teacherId: teacher.id,
        size,
        male,
        female: size - male,
        attendance: Math.round(attendance * 10) / 10,
        late: 4 + Math.floor(r() * 22),
        missingHomework: 6 + Math.floor(r() * 28),
        awards: Math.floor(r() * 9),
        capacity: 42,
        homeroomHistory: [
          { year: String(2022 + grade - 3), teacherId: teachers[Math.floor(r() * 40)]!.id },
          { year: String(2023 + grade - 3), teacherId: teachers[Math.floor(r() * 40)]!.id },
          { year: String(2024 + grade - 3), teacherId: teacher.id },
        ],
      });
    }
  }

  const featured: Student = {
    id: FEATURED_STUDENT,
    name: "陳嘉豪",
    studentNo: "20230315",
    gender: "男",
    classId: FEATURED_CLASS,
    attendance: 96.8,
    average: 78.4,
    missingHomework: 6,
    conduct: "穩定",
    enrolled: "2023年9月",
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
      const entryYear = 2026 - klass.grade;
      students.push({
        id: sid,
        name: personName(r),
        studentNo: `${entryYear}${String(hash(sid) % 10000).padStart(4, "0")}`,
        gender,
        classId: klass.id,
        attendance: Math.round(attendance * 10) / 10,
        average: Math.round(average * 10) / 10,
        missingHomework: missing,
        conduct,
        enrolled: `${entryYear}年9月`,
        awards: Math.floor(r() * r() * 6),
        health: r() > 0.93 ? "需觀察" : r() > 0.985 ? "長期病假" : "良好",
        isMonitorCandidate: r() > 0.88,
      });
    }
  }

  const leaveTeachers = teachers.filter((t) => t.state === "請假" || t.state === "公幹" || t.state === "會議");
  const bySubject = new Map<string, Teacher[]>();
  for (const t of teachers) {
    const list = bySubject.get(t.subject) ?? [];
    list.push(t);
    bySubject.set(t.subject, list);
  }

  function subjectLoad(grade: number) {
    const load: [string, number][] =
      grade <= 3
        ? [
            ["中文", 7],
            ["英文", 7],
            ["數學", 7],
            ["生物", 2],
            ["物理", 2],
            ["化學", 2],
            ["歷史", 2],
            ["地理", 2],
            ["公民", 2],
            ["體育", 2],
            ["視覺藝術", 2],
            ["資訊科技", 2],
            ["班會", 1],
          ]
        : [
            ["中文", 6],
            ["英文", 6],
            ["數學", 6],
            ["物理", 4],
            ["化學", 4],
            ["生物", 3],
            ["歷史", 2],
            ["地理", 2],
            ["公民", 2],
            ["體育", 2],
            ["視覺藝術", 1],
            ["資訊科技", 2],
          ];
    const slots: string[] = [];
    for (const [subject, n] of load) for (let i = 0; i < n; i++) slots.push(subject);
    return slots;
  }

  function roomFor(subject: string, klassName: string) {
    if (subject === "體育") return "操場";
    if (subject === "視覺藝術") return "美勞室";
    if (subject === "資訊科技") return "電腦室";
    if (subject === "班會") return `${klassName}課室`;
    return `${klassName}課室`;
  }

  function teacherFor(klass: Klass, subject: string) {
    if (subject === "班會") return klass.teacherId;
    if (klass.id === FEATURED_CLASS && subject === "數學") return FEATURED_TEACHER;
    const pool = bySubject.get(subject) ?? teachers;
    const r = rng(hash(klass.id + subject));
    return pick(r, pool).id;
  }

  function pinSubject(slots: string[], day: number, period: number, subject: string) {
    const idx = day * PERIODS.length + (period - 1);
    const j = slots.indexOf(subject);
    if (j >= 0 && idx !== j) {
      const tmp = slots[idx]!;
      slots[idx] = slots[j]!;
      slots[j] = tmp;
    }
  }

  const lessons: Lesson[] = [];
  for (const klass of classes) {
    const slots = subjectLoad(klass.grade);
    if (klass.id === FEATURED_CLASS) pinSubject(slots, 1, 3, "數學");
    for (let i = 0; i < slots.length; i++) {
      const subject = slots[i]!;
      const day = Math.floor(i / PERIODS.length);
      const period = (i % PERIODS.length) + 1;
      lessons.push({
        id: `l-${klass.id}-${day}-${period}`,
        classId: klass.id,
        teacherId: teacherFor(klass, subject),
        subject,
        day,
        period,
        room: roomFor(subject, klass.name),
      });
    }
  }

  for (let i = 0; i < 5; i++) {
    const r = rng(9100 + i);
    const candidates = lessons.filter((l) => l.subject !== "班會" && l.subject !== "體育");
    const a = candidates[Math.floor(r() * candidates.length)]!;
    const b = lessons.find(
      (l) => l.classId !== a.classId && l.day === a.day && l.period === a.period && l.teacherId !== a.teacherId,
    );
    if (b) b.teacherId = a.teacherId;
  }

  const graduates: Graduate[] = [];
  for (const year of [2023, 2024, 2025]) {
    for (let i = 0; i < 118; i++) {
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
    for (let i = 0; i < 8; i++) {
      const r = rng(hash(subject) + i);
      const leftover = r() > 0.82;
      resources.push({
        id: `r${rid++}`,
        subject,
        title: `${subject}${pick(r, ["單元", "總複習", "公開課", "校本"])}${1 + Math.floor(r() * 6)}`,
        kind: pick(r, ["教案", "課件", "試題", "校本教材"] as const),
        owner: leftover ? "廣大中學" + subject + "科組" : "廣大中學" + subject + "科組",
        year: String(2020 + Math.floor(r() * 6)),
        leftoverFrom: leftover ? personName(r) + "老師（已離職）" : undefined,
      });
    }
  }

  const policies: Policy[] = [
    {
      id: "late-conduct",
      title: "遲到納入操行（2024-09 起）",
      started: "2024-09",
      metric: "全校月均遲到次數",
      before: [186, 192, 178, 201, 188, 174],
      after: [161, 148, 139, 132, 128, 121],
      note: "推行後六個月，遲到由每月約 190 次降至約 120 次。",
    },
    {
      id: "homework-once",
      title: "欠交功課一次輸入、班主任與科任共享（2025-02 起）",
      started: "2025-02",
      metric: "班主任每週填報分鐘",
      before: [95, 98, 92, 101, 97, 94],
      after: [58, 52, 49, 47, 46, 44],
      note: "重複抄寫減少，班主任每週填報時間約降一半。",
    },
    {
      id: "morning-run",
      title: "早會後十分鐘跑操（2025-04 試點中三）",
      started: "2025-04",
      metric: "中三病假人次／月",
      before: [42, 39, 44, 40, 38, 41],
      after: [36, 34, 33, 31, 30, 29],
      note: "試點班病假略降，尚未推至全校。",
    },
  ];

  return { teachers, classes, students, lessons, graduates, resources, policies, leaveTeachers };
}

export const school = build();

export const cockpit = {
  dateLabel: "2026年8月18日（二）",
  updated: "2 分鐘前更新",
  studentAttendance: 96.2,
  attendanceDelta: -0.8,
  absent: 41,
  teachersIn: school.teachers.filter((t) => t.state !== "請假" && t.state !== "公幹").length,
  teachersTotal: school.teachers.length,
  leave: school.teachers.filter((t) => t.state === "請假").length,
  errand: school.teachers.filter((t) => t.state === "公幹").length,
  meeting: school.teachers.filter((t) => t.state === "會議").length,
  newRecords: "1,247",
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
  return [...school.classes].sort((a, b) => a.attendance - b.attendance).slice(0, 6);
}

export function exceptionTeachers() {
  return school.teachers.filter((t) => t.state === "請假" || t.state === "公幹" || t.state === "會議");
}

export function heatmapCells(id: string) {
  const r = rng(hash(id + "heat"));
  return Array.from({ length: 126 }, () => {
    const v = r();
    return v > 0.92 ? 0 : v > 0.55 ? 3 : v > 0.3 ? 2 : 1;
  });
}

export function studentGrades(id: string) {
  if (id === FEATURED_STUDENT) {
    return [
      { term: "中一上", 中文: 72, 英文: 68, 數學: 81, 物理: 74, rank: 18 },
      { term: "中一下", 中文: 74, 英文: 70, 數學: 84, 物理: 76, rank: 14 },
      { term: "中二上", 中文: 75, 英文: 71, 數學: 82, 物理: 73, rank: 16 },
      { term: "中二下", 中文: 77, 英文: 73, 數學: 86, 物理: 78, rank: 12 },
      { term: "中三上", 中文: 76, 英文: 74, 數學: 88, 物理: 79, rank: 11 },
      { term: "中三下", 中文: 78, 英文: 75, 數學: 85, 物理: 80, rank: 10 },
    ];
  }
  const r = rng(hash(id + "g"));
  const base = studentById(id)?.average ?? 75;
  return ["中一上", "中一下", "中二上", "中二下", "中三上", "中三下"].map((term, i) => ({
    term,
    中文: Math.round(clamp(base - 6 + r() * 8 + i, 42, 95)),
    英文: Math.round(clamp(base - 8 + r() * 8 + i, 40, 95)),
    數學: Math.round(clamp(base - 2 + r() * 10 + i, 40, 96)),
    物理: Math.round(clamp(base - 5 + r() * 8 + i, 40, 94)),
    rank: Math.max(1, Math.round(28 - i * 2 - r() * 8)),
  }));
}

export function studentTimeline(id: string) {
  if (id === FEATURED_STUDENT) {
    return [
      { date: "2024-11", title: "獲全澳中學生數學競賽三等獎", kind: "good" as const },
      { date: "2024-10", title: "連續 3 次欠交數學作業", kind: "watch" as const },
      { date: "2024-09", title: "升讀中三B，班主任李美儀", kind: "info" as const },
      { date: "2024-05", title: "家長會：在家使用手機時間過長", kind: "watch" as const },
      { date: "2023-12", title: "擔任班級圖書管理員", kind: "good" as const },
      { date: "2023-06", title: "中一下學期成績進步獎", kind: "good" as const },
      { date: "2023-09", title: "入學，編入中一C", kind: "info" as const },
    ];
  }
  const s = studentById(id);
  const r = rng(hash(id + "tl"));
  const items: { date: string; title: string; kind: "good" | "watch" | "info" }[] = [
    { date: s?.enrolled.replace("年9月", "-09") ?? "2023-09", title: `入學，編入 ${classById(s?.classId ?? "")?.name ?? ""}`, kind: "info" },
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
