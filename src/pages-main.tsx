import { useMemo, useState, useSyncExternalStore } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { GroupedBars, LineChart } from "./charts";
import { useRole } from "./layout";
import {
  FEATURED_CLASS,
  PERIODS,
  WEEKDAYS,
  abnormalClasses,
  classById,
  cockpit,
  exceptionTeachers,
  school,
  schoolAttendance30,
  schoolAverageLine,
  teacherById,
} from "./school";
import {
  clashCount,
  clashes,
  freeTeachersFor,
  getLessons,
  reassignLesson,
  subscribeTimetable,
  swapLessons,
} from "./timetable-store";

export function CockpitPage() {
  const clashesN = useSyncExternalStore(subscribeTimetable, clashCount, clashCount);
  const exceptions = exceptionTeachers();
  const shownExceptions = exceptions.slice(0, 8);
  const low = abnormalClasses();
  const { role } = useRole();

  return (
    <>
      <h1 className="large-title">早上好</h1>
      <p className="subtitle">{cockpit.updated} · 全校 {school.students.length} 人</p>

      <div className="hero">
        <div className="hero-num">{cockpit.studentAttendance}%</div>
        <div className="hero-label">全校出勤</div>
        <div className="hero-note">
          較昨日 {cockpit.attendanceDelta}% · 缺席 {cockpit.absent} 人
        </div>
        <div className="pills">
          <span className="pill">
            教師在校 {cockpit.teachersIn}/{cockpit.teachersTotal}
          </span>
          <span className="pill">請假 {cockpit.leave}</span>
          <span className="pill">公幹 {cockpit.errand}</span>
          <span className="pill">會議 {cockpit.meeting}</span>
        </div>
      </div>

      <p className="group-label">需要處理</p>
      <div className="group">
        <Link to="/classes?sort=attendance" className="row">
          <span className="row-icon alert">!</span>
          <span className="row-body">
            <span className="row-title">出勤偏低班級</span>
            <span className="row-sub">{low.map((c) => `${c.name} ${c.attendance}%`).join(" · ")}</span>
          </span>
          <span className="row-trail">{low.length}</span>
          <span className="chevron">›</span>
        </Link>
        {role !== "教師" && (
          <Link to="/schedule" className="row">
            <span className="row-icon inbox">▦</span>
            <span className="row-body">
              <span className="row-title">排課</span>
              <span className="row-sub">{clashesN ? "教師同時段撞堂，可改派或對調" : "本週課表已排妥"}</span>
            </span>
            <span className="row-trail">{clashesN}</span>
            <span className="chevron">›</span>
          </Link>
        )}
      </div>

      <p className="group-label">教師例外（{exceptions.length} / {school.teachers.length}）</p>
      <div className="group">
        {shownExceptions.map((t) =>
          role === "教師" ? (
            <div key={t.id} className="row">
              <span className="row-body">
                <span className="row-title">{t.name}</span>
                <span className="row-sub">{t.detail}</span>
              </span>
              <span className="row-trail">{t.state}</span>
            </div>
          ) : (
            <Link key={t.id} to={`/teacher/${t.id}`} className="row">
              <span className="row-body">
                <span className="row-title">{t.name}</span>
                <span className="row-sub">{t.detail}</span>
              </span>
              <span className="row-trail">{t.state}</span>
              <span className="chevron">›</span>
            </Link>
          ),
        )}
        {role !== "教師" && (
          <Link to="/teachers" className="row">
            <span className="row-body">
              <span className="row-title">全部教師狀態</span>
              <span className="row-sub">上課、空堂、請假、公幹、會議</span>
            </span>
            <span className="chevron">›</span>
          </Link>
        )}
      </div>

      <p className="group-label">近 30 日出勤</p>
      <div className="card">
        <LineChart values={schoolAttendance30} min={92} max={98} reference={schoolAverageLine} />
        <p className="caption">虛線為校平均 {schoolAverageLine}%</p>
      </div>
    </>
  );
}

export function SchedulePage() {
  const lessons = useSyncExternalStore(subscribeTimetable, getLessons, getLessons);
  const clashList = useMemo(() => clashes(lessons), [lessons]);
  const clashKeys = useMemo(() => {
    const set = new Set<string>();
    for (const c of clashList) {
      for (const l of c.lessons) set.add(l.id);
    }
    return set;
  }, [clashList]);
  const [mode, setMode] = useState<"class" | "teacher">("class");
  const [classId, setClassId] = useState(FEATURED_CLASS);
  const [teacherId, setTeacherId] = useState(school.classes.find((c) => c.id === FEATURED_CLASS)?.teacherId ?? school.teachers[0]!.id);
  const [picked, setPicked] = useState<string | null>(null);

  const gridLessons = useMemo(() => {
    if (mode === "class") return lessons.filter((l) => l.classId === classId);
    return lessons.filter((l) => l.teacherId === teacherId);
  }, [lessons, mode, classId, teacherId]);

  const bySlot = useMemo(() => {
    const map = new Map<string, typeof gridLessons>();
    for (const l of gridLessons) {
      const key = `${l.day}-${l.period}`;
      const row = map.get(key) ?? [];
      row.push(l);
      map.set(key, row);
    }
    return map;
  }, [gridLessons]);

  function onCell(id: string) {
    if (mode !== "class") return;
    if (!picked) {
      setPicked(id);
      return;
    }
    if (picked === id) {
      setPicked(null);
      return;
    }
    swapLessons(picked, id);
    setPicked(null);
  }

  const shownTeacher = teacherById(teacherId);

  return (
    <>
      <h1 className="large-title">排課</h1>
      <p className="subtitle">
        {school.classes.length} 班本週課表 · {clashList.length} 處撞堂
        {mode === "class" ? " · 點兩格可對調" : ""}
      </p>

      {clashList.length > 0 && (
        <>
          <p className="group-label">同時段撞堂</p>
          <div className="group">
            {clashList.map((c) => {
              const teacher = teacherById(c.teacherId);
              const names = c.lessons.map((l) => classById(l.classId)?.name).join("、");
              const victim = c.lessons.find((l) => l.classId !== FEATURED_CLASS) ?? c.lessons[1]!;
              const alts = freeTeachersFor(victim);
              return (
                <div key={c.key} className="approval">
                  <div>
                    <div className="kind">週{WEEKDAYS[c.day]}第 {c.period} 節</div>
                    <div className="row-title">{teacher?.name}</div>
                    <div className="row-sub">{names} 同一時間</div>
                  </div>
                  {alts[0] ? (
                    <div className="actions">
                      <button
                        type="button"
                        className="btn primary"
                        onClick={() => {
                          reassignLesson(victim.id, alts[0]!.id);
                          setClassId(victim.classId);
                          setMode("class");
                        }}
                      >
                        改派 {alts[0].name.replace(/老師|主任/g, "")}
                      </button>
                    </div>
                  ) : (
                    <span className="status no">暫無空堂可改派</span>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="segmented">
        <button type="button" className={mode === "class" ? "on" : ""} onClick={() => { setMode("class"); setPicked(null); }}>
          按班級
        </button>
        <button type="button" className={mode === "teacher" ? "on" : ""} onClick={() => { setMode("teacher"); setPicked(null); }}>
          按教師
        </button>
      </div>
      <div className="toolbar">
        {mode === "class" ? (
          <select className="grow" value={classId} onChange={(e) => { setClassId(e.target.value); setPicked(null); }}>
            {school.classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        ) : (
          <select className="grow" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
            {school.teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} · {t.subject}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="card tt-card">
        {mode === "teacher" && (
          <p className="caption" style={{ margin: "0 0 12px" }}>
            {shownTeacher?.name} · {shownTeacher?.subject} · 本週 {gridLessons.length} 節
          </p>
        )}
        <div className="tt-scroll">
          <table className="tt">
            <thead>
              <tr>
                <th>節次</th>
                {WEEKDAYS.map((d) => (
                  <th key={d}>週{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map((p) => (
                <tr key={p.n}>
                  <th>
                    <span className="tt-period">第 {p.n} 節</span>
                    <span className="tt-time">{p.time}</span>
                  </th>
                  {WEEKDAYS.map((_, day) => {
                    const slot = bySlot.get(`${day}-${p.n}`) ?? [];
                    if (slot.length === 0) {
                      return (
                        <td key={day} className="tt-empty">
                          空堂
                        </td>
                      );
                    }
                    if (slot.length > 1) {
                      return (
                        <td key={day}>
                          <div className="tt-cell clash">
                            <span className="tt-sub">同時兩班</span>
                            <span className="tt-who">
                              {slot.map((l) => classById(l.classId)?.name).join("／")}
                            </span>
                          </div>
                        </td>
                      );
                    }
                    const main = slot[0]!;
                    const clash = clashKeys.has(main.id);
                    const on = picked === main.id;
                    const klass = classById(main.classId);
                    const teacher = teacherById(main.teacherId);
                    return (
                      <td key={day}>
                        <button
                          type="button"
                          className={`tt-cell${clash ? " clash" : ""}${on ? " on" : ""}`}
                          disabled={mode !== "class"}
                          onClick={() => onCell(main.id)}
                        >
                          <span className="tt-sub">{main.subject}</span>
                          <span className="tt-who">
                            {mode === "class" ? teacher?.name.replace(/老師|主任/g, "") : klass?.name}
                          </span>
                          <span className="tt-room">{main.room}</span>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export function ClassesPage() {
  const { role } = useRole();
  const [params] = useSearchParams();
  const sort = params.get("sort");
  const list = useMemo(() => {
    let rows = [...school.classes];
    if (role === "教師") rows = rows.filter((c) => c.id === FEATURED_CLASS);
    if (sort === "attendance") rows.sort((a, b) => a.attendance - b.attendance);
    else rows.sort((a, b) => a.grade - b.grade || a.letter.localeCompare(b.letter));
    return rows;
  }, [role, sort]);

  return (
    <>
      <h1 className="large-title">班級</h1>
      <p className="subtitle">{list.length} 班 · 點進去看出勤、交接與班長評選</p>
      <div className="group">
        <table>
          <thead>
            <tr>
              <th>班別</th>
              <th>班主任</th>
              <th>人數</th>
              <th>出勤</th>
              <th>遲到</th>
              <th>欠交</th>
              <th>剩餘學位</th>
            </tr>
          </thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.id}>
                <td>
                  <Link to={`/class/${c.id}`}>{c.name}</Link>
                </td>
                <td>{teacherById(c.teacherId)?.name}</td>
                <td className="num">{c.size}</td>
                <td className="num">{c.attendance}%</td>
                <td className="num">{c.late}</td>
                <td className="num">{c.missingHomework}</td>
                <td className="num">{c.capacity - c.size}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function TeachersPage() {
  const [q, setQ] = useState("");
  const [state, setState] = useState("全部");
  const [page, setPage] = useState(0);
  const filtered = school.teachers.filter((t) => {
    if (state !== "全部" && t.state !== state) return false;
    if (q && !t.name.includes(q) && !t.subject.includes(q)) return false;
    return true;
  });
  const pageSize = 20;
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const rows = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const counts = {
    上課中: school.teachers.filter((t) => t.state === "上課中").length,
    空堂: school.teachers.filter((t) => t.state === "空堂").length,
    請假: school.teachers.filter((t) => t.state === "請假").length,
    公幹: school.teachers.filter((t) => t.state === "公幹").length,
    會議: school.teachers.filter((t) => t.state === "會議").length,
  };

  return (
    <>
      <h1 className="large-title">教師</h1>
      <p className="subtitle">
        {school.teachers.length} 人 · 上課中 {counts.上課中} · 空堂 {counts.空堂} · 請假 {counts.請假} · 公幹 {counts.公幹} · 會議 {counts.會議}
      </p>
      <div className="toolbar">
        <input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="搜尋姓名或科目" />
        <select value={state} onChange={(e) => { setState(e.target.value); setPage(0); }}>
          <option>全部</option>
          <option>上課中</option>
          <option>空堂</option>
          <option>請假</option>
          <option>公幹</option>
          <option>會議</option>
        </select>
      </div>
      <div className="group">
        {rows.map((t) => (
          <Link key={t.id} to={`/teacher/${t.id}`} className="row">
            <span className="row-body">
              <span className="row-title">{t.name}</span>
              <span className="row-sub">
                {t.subject} · {t.detail}
              </span>
            </span>
            <span className="row-trail">{t.state}</span>
            <span className="chevron">›</span>
          </Link>
        ))}
      </div>
      <Pager page={page} pages={pages} total={filtered.length} onPage={setPage} />
    </>
  );
}

export function StudentsPage() {
  const { role } = useRole();
  const [q, setQ] = useState("");
  const [grade, setGrade] = useState("全部");
  const [page, setPage] = useState(0);
  const filtered = school.students.filter((s) => {
    if (role === "教師" && s.classId !== FEATURED_CLASS) return false;
    const k = classById(s.classId);
    if (grade !== "全部" && String(k?.grade) !== grade) return false;
    if (q && !s.name.includes(q) && !s.studentNo.includes(q)) return false;
    return true;
  });
  const pageSize = 25;
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const rows = filtered.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <>
      <h1 className="large-title">學生</h1>
      <p className="subtitle">{filtered.length} 人符合</p>
      <div className="toolbar">
        <input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="姓名或學號" />
        <select value={grade} onChange={(e) => { setGrade(e.target.value); setPage(0); }}>
          <option>全部</option>
          <option value="1">中一</option>
          <option value="2">中二</option>
          <option value="3">中三</option>
          <option value="4">中四</option>
          <option value="5">中五</option>
          <option value="6">中六</option>
        </select>
      </div>
      <div className="group">
        <table>
          <thead>
            <tr>
              <th>姓名</th>
              <th>學號</th>
              <th>班別</th>
              <th>出勤</th>
              <th>平均</th>
              <th>品行</th>
              <th>健康</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id}>
                <td>
                  <Link to={`/student/${s.id}`}>{s.name}</Link>
                </td>
                <td className="num">{s.studentNo}</td>
                <td>{classById(s.classId)?.name}</td>
                <td className="num">{s.attendance}%</td>
                <td className="num">{s.average}</td>
                <td>{s.conduct}</td>
                <td>{s.health}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager page={page} pages={pages} total={filtered.length} onPage={setPage} />
    </>
  );
}

export function Pager({
  page,
  pages,
  total,
  onPage,
}: {
  page: number;
  pages: number;
  total: number;
  onPage: (n: number) => void;
}) {
  return (
    <div className="pager">
      <button type="button" className="btn" disabled={page === 0} onClick={() => onPage(page - 1)}>
        上一頁
      </button>
      <span>
        {page + 1} / {pages} · {total} 筆
      </span>
      <button type="button" className="btn" disabled={page >= pages - 1} onClick={() => onPage(page + 1)}>
        下一頁
      </button>
    </div>
  );
}

export function AdmissionsPage() {
  const byGrade = [1, 2, 3, 4, 5, 6].map((g) => {
    const rows = school.classes.filter((c) => c.grade === g);
    const size = rows.reduce((s, c) => s + c.size, 0);
    const cap = rows.reduce((s, c) => s + c.capacity, 0);
    return { g, size, cap, left: cap - size, rows };
  });
  return (
    <>
      <h1 className="large-title">招生學位</h1>
      <p className="subtitle">各年級／班剩餘學位，不必再逐個系統登入</p>
      <div className="stats">
        {byGrade.map((x) => (
          <div className="stat" key={x.g}>
            <dt>中{["", "一", "二", "三", "四", "五", "六"][x.g]}</dt>
            <dd>{x.left}</dd>
          </div>
        ))}
      </div>
      <div className="group">
        <table>
          <thead>
            <tr>
              <th>班別</th>
              <th>在讀</th>
              <th>學額</th>
              <th>剩餘</th>
            </tr>
          </thead>
          <tbody>
            {school.classes.map((c) => (
              <tr key={c.id}>
                <td>
                  <Link to={`/class/${c.id}`}>{c.name}</Link>
                </td>
                <td className="num">{c.size}</td>
                <td className="num">{c.capacity}</td>
                <td className="num">{c.capacity - c.size}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function AdvancementPage() {
  const [uni, setUni] = useState("全部");
  const [year, setYear] = useState("全部");
  const [page, setPage] = useState(0);
  const filtered = school.graduates.filter((g) => {
    if (uni !== "全部" && g.university !== uni) return false;
    if (year !== "全部" && String(g.year) !== year) return false;
    return true;
  });
  const pageSize = 20;
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const rows = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const unis = Array.from(new Set(school.graduates.map((g) => g.university)));

  return (
    <>
      <h1 className="large-title">升學追溯</h1>
      <p className="subtitle">
        {school.graduates.length} 筆歷屆出路 · 查院校可拉出學生、原班與導師
      </p>
      <div className="toolbar">
        <select value={year} onChange={(e) => { setYear(e.target.value); setPage(0); }}>
          <option>全部</option>
          <option>2025</option>
          <option>2024</option>
          <option>2023</option>
        </select>
        <select value={uni} onChange={(e) => { setUni(e.target.value); setPage(0); }}>
          <option>全部</option>
          {unis.map((u) => (
            <option key={u}>{u}</option>
          ))}
        </select>
      </div>
      <div className="group">
        <table>
          <thead>
            <tr>
              <th>年份</th>
              <th>學生</th>
              <th>院校</th>
              <th>原班</th>
              <th>導師</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((g, i) => (
              <tr key={g.studentName + g.year + i}>
                <td className="num">{g.year}</td>
                <td>{g.studentName}</td>
                <td>{g.university}</td>
                <td>{g.className}</td>
                <td>
                  <Link to={`/teacher/${g.tutorId}`}>{teacherById(g.tutorId)?.name}</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager page={page} pages={pages} total={filtered.length} onPage={setPage} />
    </>
  );
}

export function PolicyPage() {
  return (
    <>
      <h1 className="large-title">策略成效</h1>
      <p className="subtitle">用遲到、填報時間、病假驗證政策，而不是印象</p>
      {school.policies.map((p) => (
        <section key={p.id}>
          <p className="group-label">{p.title}</p>
          <div className="card">
            <p className="caption" style={{ margin: "0 0 8px" }}>
              {p.metric} · {p.note}
            </p>
            <GroupedBars
              rows={p.before.map((b, i) => ({
                label: `M${i + 1}`,
                a: b,
                b: p.after[i] ?? b,
              }))}
            />
            <p className="caption">藍為推行前六個月，灰為推行後六個月</p>
          </div>
        </section>
      ))}
    </>
  );
}

export function ReportsPage() {
  const gradeAvg = [1, 2, 3, 4, 5, 6].map((g) => {
    const ss = school.students.filter((s) => classById(s.classId)?.grade === g);
    const avg = ss.reduce((a, s) => a + s.average, 0) / ss.length;
    const att = ss.reduce((a, s) => a + s.attendance, 0) / ss.length;
    return { g, avg: Math.round(avg * 10) / 10, att: Math.round(att * 10) / 10, n: ss.length };
  });
  return (
    <>
      <h1 className="large-title">報表</h1>
      <p className="subtitle">全校走勢與年級對照</p>
      <p className="group-label">近 30 日出勤</p>
      <div className="card">
        <LineChart values={schoolAttendance30} min={92} max={98} reference={schoolAverageLine} />
      </div>
      <p className="group-label">各年級現況</p>
      <div className="group">
        <table>
          <thead>
            <tr>
              <th>年級</th>
              <th>人數</th>
              <th>平均分</th>
              <th>出勤</th>
            </tr>
          </thead>
          <tbody>
            {gradeAvg.map((r) => (
              <tr key={r.g}>
                <td>中{["", "一", "二", "三", "四", "五", "六"][r.g]}</td>
                <td className="num">{r.n}</td>
                <td className="num">{r.avg}</td>
                <td className="num">{r.att}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="group-label">年級平均分</p>
      <div className="card">
        <GroupedBars
          rows={gradeAvg.map((r) => ({
            label: ["", "一", "二", "三", "四", "五", "六"][r.g]!,
            a: r.avg,
            b: 75,
          }))}
        />
        <p className="caption">藍為該年級平均，灰為全校參考線 75</p>
      </div>
    </>
  );
}

export function ResourcesPage() {
  const [subject, setSubject] = useState("全部");
  const subjects = Array.from(new Set(school.resources.map((r) => r.subject)));
  const rows = school.resources.filter((r) => subject === "全部" || r.subject === subject);
  return (
    <>
      <h1 className="large-title">科組資源</h1>
      <p className="subtitle">
        {school.resources.length} 件校本資產 · 歸屬學校，不隨老師離職帶走
      </p>
      <div className="toolbar">
        <select value={subject} onChange={(e) => setSubject(e.target.value)}>
          <option>全部</option>
          {subjects.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className="group">
        {rows.map((r) => (
          <div key={r.id} className="item" style={{ flexDirection: "column", alignItems: "flex-start" }}>
            <span className="item-name">
              {r.subject} · {r.kind} · {r.title}
            </span>
            <span className="item-state">
              {r.owner} · {r.year}
              {r.leftoverFrom ? ` · 原作者 ${r.leftoverFrom}` : ""}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
