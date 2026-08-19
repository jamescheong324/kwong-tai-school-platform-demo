import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { GroupedBars, LineChart } from "./charts";
import { useRole } from "./layout";
import {
  FEATURED_CLASS,
  GRADE_LABEL,
  abnormalClasses,
  classById,
  cockpit,
  exceptionTeachers,
  school,
  schoolAttendance30,
  schoolAverageLine,
  teacherById,
  todayAbsentees,
  todayLates,
} from "./school";

export function CockpitPage() {
  const { role } = useRole();
  const exceptions = exceptionTeachers();
  const low = abnormalClasses().filter((c) => role !== "教師" || c.id === FEATURED_CLASS);
  const absent = todayAbsentees().filter((s) => role !== "教師" || s.classId === FEATURED_CLASS);
  const lates = todayLates().filter((s) => role !== "教師" || s.classId === FEATURED_CLASS);
  const week = schoolAttendance30.slice(-7);
  const mine = classById(FEATURED_CLASS);
  const attendance = role === "教師" ? (mine?.attendance ?? cockpit.studentAttendance) : cockpit.studentAttendance;
  const attendanceLabel = role === "教師" ? `${mine?.name}出勤` : "全校出勤";

  return (
    <>
      <h1 className="large-title">早上好</h1>
      <p className="subtitle">{cockpit.updated}</p>

      <div className="hero">
        <div className="hero-num">{attendance}%</div>
        <div className="hero-label">{attendanceLabel}</div>
        {role !== "教師" && (
          <div className="hero-note">
            較昨日 {cockpit.attendanceDelta}% · 全校 {school.students.length} 人
          </div>
        )}
      </div>

      <div className="stats">
        <div className="stat">
          <dt>缺席</dt>
          <dd>{role === "教師" ? absent.length : cockpit.absent}</dd>
        </div>
        <div className="stat">
          <dt>遲到</dt>
          <dd>{role === "教師" ? lates.length : cockpit.late}</dd>
        </div>
        {role !== "教師" && (
          <>
            <div className="stat">
              <dt>請假</dt>
              <dd>{cockpit.leave}</dd>
            </div>
            <div className="stat">
              <dt>公幹</dt>
              <dd>{cockpit.errand}</dd>
            </div>
            <div className="stat">
              <dt>會議</dt>
              <dd>{cockpit.meeting}</dd>
            </div>
          </>
        )}
      </div>

      <div className="day-grid">
        <div>
          <p className="group-label">今日缺席</p>
          <div className="group">
            {absent.length === 0 ? (
              <p className="caption" style={{ padding: "14px 16px", margin: 0 }}>
                沒有缺席
              </p>
            ) : (
              absent.map((s) => (
                <Link key={s.id} to={`/student/${s.id}`} className="row">
                  <span className="row-body">
                    <span className="row-title">{s.name}</span>
                    <span className="row-sub">
                      {s.className} · {s.note}
                    </span>
                  </span>
                  <span className="chevron">›</span>
                </Link>
              ))
            )}
          </div>
        </div>
        <div>
          <p className="group-label">今日遲到</p>
          <div className="group">
            {lates.length === 0 ? (
              <p className="caption" style={{ padding: "14px 16px", margin: 0 }}>
                沒有遲到
              </p>
            ) : (
              lates.map((s) => (
                <Link key={s.id} to={`/student/${s.id}`} className="row">
                  <span className="row-body">
                    <span className="row-title">{s.name}</span>
                    <span className="row-sub">
                      {s.className} · {s.note}
                    </span>
                  </span>
                  <span className="chevron">›</span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {low.length > 0 && (
        <>
          <p className="group-label">今日異常</p>
          <div className="group">
            {low.map((c) => (
              <Link key={c.id} to={`/class/${c.id}`} className="row">
                <span className="row-icon alert">!</span>
                <span className="row-body">
                  <span className="row-title">{c.name}</span>
                  <span className="row-sub">
                    出勤 {c.attendance}% · 班主任 {teacherById(c.teacherId)?.name}
                  </span>
                </span>
                <span className="row-trail">{c.attendance}%</span>
                <span className="chevron">›</span>
              </Link>
            ))}
          </div>
        </>
      )}

      {role !== "教師" && (
        <>
          <p className="group-label">教師不在校</p>
          <div className="group">
            {exceptions.map((t) => (
              <Link key={t.id} to={`/teacher/${t.id}`} className="row">
                <span className="row-body">
                  <span className="row-title">{t.name}</span>
                  <span className="row-sub">{t.detail}</span>
                </span>
                <span className="row-trail">{t.state}</span>
                <span className="chevron">›</span>
              </Link>
            ))}
          </div>
        </>
      )}

      <p className="group-label">近 7 日出勤</p>
      <div className="card">
        <LineChart values={week} min={92} max={98} reference={schoolAverageLine} />
        <p className="caption">虛線為校平均 {schoolAverageLine}%</p>
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
          <option value="6">高三</option>
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
  const grades = [...new Set(school.classes.map((c) => c.grade))].sort();
  const byGrade = grades.map((g) => {
    const rows = school.classes.filter((c) => c.grade === g);
    const size = rows.reduce((s, c) => s + c.size, 0);
    const cap = rows.reduce((s, c) => s + c.capacity, 0);
    return { g, size, cap, left: cap - size, rows };
  });
  return (
    <>
      <h1 className="large-title">招生學位</h1>
      <div className="stats">
        {byGrade.map((x) => (
          <div className="stat" key={x.g}>
            <dt>{x.g === 6 ? "高三" : GRADE_LABEL[x.g]}</dt>
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

export function ReportsPage() {
  const grades = [...new Set(school.classes.map((c) => c.grade))].sort();
  const gradeAvg = grades.map((g) => {
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
                <td>{r.g === 6 ? "高三" : `中${["", "一", "二", "三", "四", "五", "六"][r.g]}`}</td>
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
            label: r.g === 6 ? "高三" : ["", "一", "二", "三", "四", "五", "六"][r.g]!,
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
