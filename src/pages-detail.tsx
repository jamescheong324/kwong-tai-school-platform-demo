import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { GroupedBars, LineChart } from "./charts";
import { useRole } from "./layout";
import {
  GRADE_SUBJECTS,
  GRADE_TERMS,
  attendanceLog,
  classById,
  classSubjectAverages,
  conductRecords,
  healthNotes,
  heatmapCells,
  parentNotes,
  studentById,
  studentGrades,
  studentTimeline,
  studentsInClass,
  teacherAwards,
  teacherById,
  teacherTraining,
  type Student,
} from "./school";

export function Class360Page() {
  const { id } = useParams();
  const klass = classById(id ?? "");
  const [tab, setTab] = useState<"list" | "grades" | "watch" | "monitor" | "handover">("list");
  if (!klass) return <Navigate to="/classes" replace />;
  const students = studentsInClass(klass.id);
  const teacher = teacherById(klass.teacherId);
  const watch = students.filter((s) => s.conduct === "需關注" || s.attendance < 94 || s.missingHomework > 8);
  const monitors = [...students]
    .map((s) => ({
      s,
      score: s.average + s.attendance - s.missingHomework * 2 + (s.conduct === "優良" ? 8 : 0) + (s.health === "良好" ? 4 : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((x) => x.s);

  return (
    <>
      <Link to="/classes" className="back">
        班級
      </Link>
      <h1 className="large-title">{klass.name}</h1>
      <p className="subtitle">
        {teacher?.name} · {klass.size} 人（男 {klass.male} / 女 {klass.female}）
      </p>
      <div className="stats">
        <div className="stat">
          <dt>本月出勤</dt>
          <dd>{klass.attendance}%</dd>
        </div>
        <div className="stat">
          <dt>遲到</dt>
          <dd>{klass.late}</dd>
        </div>
        <div className="stat">
          <dt>欠交</dt>
          <dd>{klass.missingHomework}</dd>
        </div>
        <div className="stat">
          <dt>獲獎</dt>
          <dd>{klass.awards}</dd>
        </div>
      </div>

      <div className="segmented">
        <button type="button" className={tab === "list" ? "on" : ""} onClick={() => setTab("list")}>
          學生
        </button>
        <button type="button" className={tab === "grades" ? "on" : ""} onClick={() => setTab("grades")}>
          成績
        </button>
        <button type="button" className={tab === "watch" ? "on" : ""} onClick={() => setTab("watch")}>
          關注
        </button>
        <button type="button" className={tab === "monitor" ? "on" : ""} onClick={() => setTab("monitor")}>
          班長評選
        </button>
        <button type="button" className={tab === "handover" ? "on" : ""} onClick={() => setTab("handover")}>
          交接
        </button>
      </div>

      {tab === "list" && (
        <div className="group">
          <table>
            <thead>
              <tr>
                <th>姓名</th>
                <th>出勤</th>
                <th>平均</th>
                <th>欠交</th>
                <th>品行</th>
                <th>健康</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td>
                    <Link to={`/student/${s.id}`}>{s.name}</Link>
                  </td>
                  <td className="num">{s.attendance}%</td>
                  <td className="num">{s.average}</td>
                  <td className="num">{s.missingHomework}</td>
                  <td>{s.conduct}</td>
                  <td>{s.health}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="caption">全班 {students.length} 人</p>
        </div>
      )}

      {tab === "grades" && (
        <div className="card">
          <GroupedBars
            rows={classSubjectAverages(klass.id).map((r) => ({
              label: r.subject,
              a: r.classAvg,
              b: r.gradeAvg,
            }))}
          />
          <p className="caption">藍為本班，灰為全級</p>
        </div>
      )}

      {tab === "watch" && (
        <div className="group">
          {watch.map((s) => (
            <Link key={s.id} to={`/student/${s.id}`} className="row">
              <span className="row-body">
                <span className="row-title">{s.name}</span>
                <span className="row-sub">
                  出勤 {s.attendance}% · 欠交 {s.missingHomework} · {s.conduct} · {s.health}
                </span>
              </span>
              <span className="chevron">›</span>
            </Link>
          ))}
        </div>
      )}

      {tab === "monitor" && (
        <div className="group">
          <p className="caption">依成績、出勤、欠交、品行、健康綜合排序，不是印象</p>
          {monitors.map((s, i) => (
            <Link key={s.id} to={`/student/${s.id}`} className="row">
              <span className="row-trail">{i + 1}</span>
              <span className="row-body">
                <span className="row-title">{s.name}</span>
                <span className="row-sub">
                  平均 {s.average} · 出勤 {s.attendance}% · 欠交 {s.missingHomework} · {s.conduct} · {s.health}
                </span>
              </span>
              <span className="chevron">›</span>
            </Link>
          ))}
        </div>
      )}

      {tab === "handover" && (
        <ol className="handover">
          {klass.homeroomHistory.map((h, i) => (
            <li key={h.year + h.teacherId}>
              <span className="when">{h.year} 學年</span>
              <Link to={`/teacher/${h.teacherId}`}>{teacherById(h.teacherId)?.name}</Link>
              {i === klass.homeroomHistory.length - 1 ? " · 現任" : ""}
            </li>
          ))}
        </ol>
      )}
    </>
  );
}

export function Student360Page() {
  const { id } = useParams();
  const student = studentById(id ?? "");
  if (!student) return <Navigate to="/students" replace />;
  return <StudentBody student={student} />;
}

function StudentBody({ student }: { student: Student }) {
  const [tab, setTab] = useState<"life" | "trend" | "attend" | "conduct" | "health" | "parent">("life");
  const [subject, setSubject] = useState(GRADE_SUBJECTS[2]!);
  const [pdfMsg, setPdfMsg] = useState("");
  const klass = classById(student.classId);
  const events = studentTimeline(student.id);
  const grades = studentGrades(student.id);
  const notes = parentNotes(student.id);
  const logs = attendanceLog(student.id);
  const heat = heatmapCells(student.id);
  const health = healthNotes(student.id);
  const conduct = conductRecords(student.id);

  return (
    <>
      <Link to={`/class/${student.classId}`} className="back">
        {klass?.name}
      </Link>
      <h1 className="large-title">{student.name}</h1>
      <p className="subtitle">
        {student.studentNo} · {klass?.name} · {student.enrolled}入學
      </p>
      <div className="stats">
        <div className="stat">
          <dt>平均</dt>
          <dd>{student.average}</dd>
        </div>
        <div className="stat">
          <dt>出勤</dt>
          <dd>{student.attendance}%</dd>
        </div>
        <div className="stat">
          <dt>獲獎</dt>
          <dd>{student.awards}</dd>
        </div>
        <div className="stat">
          <dt>欠交</dt>
          <dd>{student.missingHomework}</dd>
        </div>
      </div>

      <div className="segmented">
        <button type="button" className={tab === "life" ? "on" : ""} onClick={() => setTab("life")}>
          成長
        </button>
        <button type="button" className={tab === "trend" ? "on" : ""} onClick={() => setTab("trend")}>
          成績
        </button>
        <button type="button" className={tab === "attend" ? "on" : ""} onClick={() => setTab("attend")}>
          出勤
        </button>
        <button type="button" className={tab === "conduct" ? "on" : ""} onClick={() => setTab("conduct")}>
          品行
        </button>
        <button type="button" className={tab === "health" ? "on" : ""} onClick={() => setTab("health")}>
          身心健康
        </button>
        <button type="button" className={tab === "parent" ? "on" : ""} onClick={() => setTab("parent")}>
          家長
        </button>
      </div>

      {tab === "life" && (
        <div className="group">
          <ol className="timeline">
            {events.map((e) => (
              <li key={e.date + e.title}>
                <span className="when">{e.date}</span>
                <span>
                  <span className={`dot ${e.kind}`} />
                  {e.title}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {tab === "trend" && (
        <div className="card">
          <div className="suggest" style={{ marginBottom: 12 }}>
            {GRADE_SUBJECTS.map((s) => (
              <button
                key={s}
                type="button"
                className={`chip${subject === s ? " on" : ""}`}
                onClick={() => setSubject(s)}
              >
                {s}
              </button>
            ))}
          </div>
          <LineChart
            values={grades.map((g) => Number(g[subject]))}
            min={40}
            max={96}
          />
          <p className="caption">
            {subject} · {GRADE_TERMS[0]}至{GRADE_TERMS[GRADE_TERMS.length - 1]}
          </p>
          <div className="tt-scroll">
            <table>
              <thead>
                <tr>
                  <th>學期</th>
                  {GRADE_SUBJECTS.map((s) => (
                    <th key={s}>{s}</th>
                  ))}
                  <th>全級排名</th>
                </tr>
              </thead>
              <tbody>
                {grades.map((g) => (
                  <tr key={g.term}>
                    <td>{g.term}</td>
                    {GRADE_SUBJECTS.map((s) => (
                      <td key={s} className="num">
                        {g[s]}
                      </td>
                    ))}
                    <td className="num">{g.rank}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "attend" && (
        <div className="group">
          <div className="heat">
            {heat.map((v, i) => (
              <span key={i} className={`heat-cell lv${v}`} />
            ))}
          </div>
          {logs.length === 0 ? (
            <p className="caption">本學期沒有遲到或缺席紀錄</p>
          ) : (
            logs.map((l) => (
              <div key={l.date + l.type} className="item">
                <span className="item-name">
                  {l.date} · {l.type}
                </span>
                <span className="item-state">{l.note}</span>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "conduct" && (
        <div className="group">
          {conduct.map((c) => (
            <div key={c.date + c.text} className="item">
              <span className="item-name">{c.text}</span>
              <span className="item-state">{c.date}</span>
            </div>
          ))}
        </div>
      )}

      {tab === "health" && (
        <div className="group">
          <div className="item">
            <span className="item-name">身高 / 體重</span>
            <span className="item-state">
              {health.height} cm · {health.weight} kg
            </span>
          </div>
          <div className="item">
            <span className="item-name">本年病假</span>
            <span className="item-state">{health.sickDays} 日</span>
          </div>
          <div className="item">
            <span className="item-name">體育免跑</span>
            <span className="item-state">{health.peExcuse ? "有" : "無"}</span>
          </div>
          <div className="item">
            <span className="item-name">輔導紀錄</span>
            <span className="item-state">{health.counsel ? "有，僅校長／主任可見摘要" : "無"}</span>
          </div>
          <p className="caption">狀態：{student.health}</p>
        </div>
      )}

      {tab === "parent" && (
        <div className="group">
          {notes.length === 0 ? (
            <p className="caption">尚無家長面談紀錄</p>
          ) : (
            notes.map((n) => (
              <div key={n.date} className="item" style={{ flexDirection: "column", alignItems: "flex-start" }}>
                <span className="item-name">
                  {n.date} · {n.how}
                </span>
                <span className="item-state">
                  {n.who}。{n.summary} {n.follow}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      <div className="footer-action">
        <button type="button" className="btn" onClick={() => setPdfMsg("Demo 不產生檔案")}>
          匯出家長會摘要
        </button>
        {pdfMsg ? <span className="row-sub">{pdfMsg}</span> : null}
      </div>
    </>
  );
}

export function Teacher360Page() {
  const { id } = useParams();
  const { role } = useRole();
  const teacher = teacherById(id ?? "");
  const [tab, setTab] = useState<"now" | "train" | "award" | "homeroom">("now");
  if (!teacher) return <Navigate to="/teachers" replace />;
  const klass = teacher.homeroomClassId ? classById(teacher.homeroomClassId) : undefined;
  const training = teacherTraining(teacher.id);
  const awards = teacherAwards(teacher.id);

  return (
    <>
      <Link to="/teachers" className="back">
        教師
      </Link>
      <h1 className="large-title">{teacher.name}</h1>
      <p className="subtitle">
        {teacher.subject} · 任教 {teacher.years} 年 · {teacher.state}
      </p>
      <div className="stats">
        <div className="stat">
          <dt>培訓次數</dt>
          <dd>{teacher.training}</dd>
        </div>
        <div className="stat">
          <dt>獲獎</dt>
          <dd>{teacher.awards}</dd>
        </div>
        <div className="stat">
          <dt>班主任指數</dt>
          <dd>{teacher.homeroomScore}</dd>
        </div>
      </div>

      <div className="segmented">
        <button type="button" className={tab === "now" ? "on" : ""} onClick={() => setTab("now")}>
          此刻
        </button>
        <button type="button" className={tab === "train" ? "on" : ""} onClick={() => setTab("train")}>
          培訓
        </button>
        <button type="button" className={tab === "award" ? "on" : ""} onClick={() => setTab("award")}>
          獲獎
        </button>
        <button type="button" className={tab === "homeroom" ? "on" : ""} onClick={() => setTab("homeroom")}>
          班主任成效
        </button>
      </div>

      {tab === "now" && (
        <div className="group">
          <div className="item">
            <span className="item-name">狀態</span>
            <span className="item-state">{teacher.state}</span>
          </div>
          <div className="item">
            <span className="item-name">詳情</span>
            <span className="item-state">{teacher.detail}</span>
          </div>
          <div className="item">
            <span className="item-name">班主任班</span>
            <span className="item-state">
              {klass ? <Link to={`/class/${klass.id}`}>{klass.name}</Link> : "無"}
            </span>
          </div>
        </div>
      )}

      {tab === "train" && (
        <div className="group">
          {training.map((t) => (
            <div key={t.date + t.title} className="item">
              <span className="item-name">{t.title}</span>
              <span className="item-state">
                {t.date} · {t.hours} 小時
              </span>
            </div>
          ))}
        </div>
      )}

      {tab === "award" && (
        <div className="group">
          {awards.length === 0 ? (
            <p className="caption">尚無校內獲獎紀錄</p>
          ) : (
            awards.map((a) => (
              <div key={a.date + a.title} className="item">
                <span className="item-name">{a.title}</span>
                <span className="item-state">{a.date}</span>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "homeroom" && (
        <div className="group">
          <div className="item">
            <span className="item-name">班主任指數</span>
            <span className="item-state">{teacher.homeroomScore}／100</span>
          </div>
          {klass && (
            <>
              <div className="item">
                <span className="item-name">現任班級出勤</span>
                <span className="item-state">{klass.attendance}%</span>
              </div>
              <div className="item">
                <span className="item-name">遲到 / 欠交</span>
                <span className="item-state">
                  {klass.late} / {klass.missingHomework}
                </span>
              </div>
            </>
          )}
          {role === "校長" && (
            <p className="caption">
              {teacher.homeroomScore < 60
                ? "指數偏低，可考慮調整班主任委任。"
                : "指數尚可，維持觀察即可。此建議僅校長可見。"}
            </p>
          )}
        </div>
      )}
    </>
  );
}
