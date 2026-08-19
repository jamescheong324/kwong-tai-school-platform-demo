import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { GroupedBars } from "./charts";
import { AskBar, Turn } from "./ask";
import { askPolicy, mean, pctDrop, type PolicyAnswer } from "./policy-agent";
import {
  FEATURED_CLASS,
  GRADE_LABEL,
  PERIODS,
  WEEKDAYS,
  classById,
  school,
  teacherById,
  type Lesson,
} from "./school";
import {
  clashes,
  getAssignments,
  getBusy,
  getLessons,
  getUnplaced,
  runAutoSchedule,
  scheduleStats,
  setHours,
  subscribeTimetable,
  swapLessons,
  toggleBusy,
} from "./timetable-store";

const POLICY_QS = [
  "遲到納入操行後，遲到有沒有改善？",
  "欠交一次輸入，班主任填報時間少了多少？",
  "中三跑操試點，病假有沒有下降？",
];

export function PolicyPage() {
  const [q, setQ] = useState(POLICY_QS[0]!);
  const [a, setA] = useState<PolicyAnswer | null>(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setA(askPolicy(POLICY_QS[0]!));
      setBusy(false);
    }, 280);
    return () => window.clearTimeout(t);
  }, []);

  function ask(text: string) {
    if (busy) return;
    setQ(text);
    setA(null);
    setBusy(true);
    window.setTimeout(() => {
      setA(askPolicy(text));
      setBusy(false);
    }, 280);
  }

  return (
    <>
      <h1 className="large-title">策略分析</h1>
      <AskBar
        placeholder={POLICY_QS[0]}
        suggestions={POLICY_QS}
        active={q}
        busy={busy}
        onAsk={ask}
      />
      <Turn question={q} pending={busy || !a}>
        {a && <PolicyResult a={a} />}
      </Turn>
    </>
  );
}

function PolicyResult({ a }: { a: PolicyAnswer }) {
  const p = a.policy;
  return (
    <div className="card">
      <p className="agent-text">{a.text}</p>
      {p && (
        <>
          <div className="stats" style={{ marginTop: 16 }}>
            <div className="stat">
              <dt>推行前月均</dt>
              <dd>{mean(p.before)}</dd>
            </div>
            <div className="stat">
              <dt>推行後月均</dt>
              <dd>{mean(p.after)}</dd>
            </div>
            <div className="stat">
              <dt>變化</dt>
              <dd>−{pctDrop(mean(p.before), mean(p.after))}%</dd>
            </div>
          </div>
          <GroupedBars
            rows={p.before.map((b, i) => ({
              label: `M${i + 1}`,
              a: b,
              b: p.after[i] ?? b,
            }))}
          />
          <p className="caption">藍為推行前六個月，灰為推行後六個月 · {p.metric}</p>
          {a.showGrades && (
            <table>
              <thead>
                <tr>
                  <th>年級</th>
                  <th>推行前月均</th>
                  <th>推行後月均</th>
                  <th>降幅</th>
                </tr>
              </thead>
              <tbody>
                {p.byGrade.map((g) => {
                  const b = mean(g.before);
                  const after = mean(g.after);
                  const drop = pctDrop(b, after);
                  const on = a.focusGrade === g.grade;
                  return (
                    <tr key={g.grade} className={on ? "hl" : undefined}>
                      <td>{GRADE_LABEL[g.grade]}</td>
                      <td className="num">{b}</td>
                      <td className="num">{after}</td>
                      <td className="num">{drop}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}

export function SchedulePage() {
  const lessons = useSyncExternalStore(subscribeTimetable, getLessons, getLessons);
  const leftover = useSyncExternalStore(subscribeTimetable, getUnplaced, getUnplaced);
  const stats = useSyncExternalStore(subscribeTimetable, scheduleStats, scheduleStats);
  const rows = useSyncExternalStore(subscribeTimetable, getAssignments, getAssignments);
  const blocked = useSyncExternalStore(subscribeTimetable, getBusy, getBusy);
  const [classId, setClassId] = useState(FEATURED_CLASS);
  const [teacherId, setTeacherId] = useState(school.teachers[0]!.id);
  const [hoursClassId, setHoursClassId] = useState(FEATURED_CLASS);
  const [running, setRunning] = useState(false);

  function run() {
    if (running) return;
    setRunning(true);
    window.setTimeout(() => {
      runAutoSchedule();
      setRunning(false);
    }, 700);
  }

  const miss = leftover.reduce((s, u) => s + u.hours, 0);
  const hourRows = rows.filter((a) => a.classId === hoursClassId);
  const blockedKeys = new Set(blocked[teacherId] ?? []);

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="large-title">排課</h1>
        </div>
        <button type="button" className="btn primary" disabled={running} onClick={run}>
          {running ? "排課中…" : "自動排課"}
        </button>
      </div>

      <p className="group-label">教師不可排課時間</p>
      <div className="card">
        <div className="toolbar" style={{ marginBottom: 12 }}>
          <select className="grow" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
            {school.teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} · {t.subject}
              </option>
            ))}
          </select>
        </div>
        <div className="slot-grid">
          <span />
          {WEEKDAYS.map((d) => (
            <span key={d} className="slot-head">
              週{d}
            </span>
          ))}
          {PERIODS.flatMap((p) => [
            <span key={`h-${p.n}`} className="slot-head">
              第 {p.n}
            </span>,
            ...WEEKDAYS.map((_, day) => {
              const on = blockedKeys.has(`${day}-${p.n}`);
              return (
                <button
                  key={`${day}-${p.n}`}
                  type="button"
                  className={`slot-cell${on ? " blocked" : ""}`}
                  onClick={() => toggleBusy(teacherId, day, p.n)}
                >
                  {on ? "不可" : "可排"}
                </button>
              );
            }),
          ])}
        </div>
        <p className="caption">點格子切換。紅格不會排給這位老師。</p>
      </div>

      <p className="group-label">班級所需堂數</p>
      <div className="card">
        <div className="toolbar" style={{ marginBottom: 12 }}>
          <select className="grow" value={hoursClassId} onChange={(e) => setHoursClassId(e.target.value)}>
            {school.classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <table>
          <thead>
            <tr>
              <th>科目</th>
              <th>教師</th>
              <th>週節數</th>
            </tr>
          </thead>
          <tbody>
            {hourRows.map((a) => (
              <tr key={a.subject}>
                <td>{a.subject}</td>
                <td>{teacherById(a.teacherId)?.name}</td>
                <td>
                  <input
                    className="hours-in"
                    type="number"
                    min={0}
                    max={8}
                    value={a.hours}
                    onChange={(e) => setHours(a.classId, a.subject, Number(e.target.value))}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="caption">每班一週最多 40 節。改完後再按自動排課。</p>
      </div>

      <div className="stats">
        <div className="stat">
          <dt>應排</dt>
          <dd>{stats.total}</dd>
        </div>
        <div className="stat">
          <dt>已排</dt>
          <dd>{stats.placed}</dd>
        </div>
        <div className="stat">
          <dt>未排</dt>
          <dd>{miss}</dd>
        </div>
      </div>

      {leftover.length > 0 && lessons.length > 0 && (
        <>
          <p className="group-label">未排入</p>
          <div className="group">
            {leftover.map((u) => (
              <div key={`${u.classId}-${u.subject}-${u.teacherId}`} className="item">
                <span className="item-name">
                  {classById(u.classId)?.name} {u.subject}
                </span>
                <span className="item-state">
                  {teacherById(u.teacherId)?.name} · {u.hours} 節
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="toolbar">
        <select className="grow" value={classId} onChange={(e) => setClassId(e.target.value)}>
          {school.classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="card tt-card">
        <TimetableGrid lessons={lessons} classId={classId} />
      </div>
    </>
  );
}

function TimetableGrid({ lessons, classId }: { lessons: Lesson[]; classId: string }) {
  const [picked, setPicked] = useState<string | null>(null);
  const clashKeys = useMemo(() => {
    const set = new Set<string>();
    for (const c of clashes(lessons)) for (const l of c.lessons) set.add(l.id);
    return set;
  }, [lessons]);
  const gridLessons = lessons.filter((l) => l.classId === classId);
  const bySlot = new Map<string, Lesson>();
  for (const l of gridLessons) bySlot.set(`${l.day}-${l.period}`, l);

  function onCell(id: string) {
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

  return (
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
                const main = bySlot.get(`${day}-${p.n}`);
                if (!main) {
                  return (
                    <td key={day} className="tt-empty">
                      空堂
                    </td>
                  );
                }
                const teacher = teacherById(main.teacherId);
                return (
                  <td key={day}>
                    <button
                      type="button"
                      className={`tt-cell${clashKeys.has(main.id) ? " clash" : ""}${picked === main.id ? " on" : ""}`}
                      onClick={() => onCell(main.id)}
                    >
                      <span className="tt-sub">{main.subject}</span>
                      <span className="tt-who">{teacher?.name.replace(/老師|主任/g, "")}</span>
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
