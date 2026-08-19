import { GRADE_LABEL, school, type Policy } from "./school";

export type PolicyAnswer = {
  text: string;
  policy: Policy | null;
  showGrades: boolean;
  focusGrade: number | null;
};

export function mean(xs: number[]) {
  return Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10;
}

export function pctDrop(before: number, after: number) {
  if (before === 0) return 0;
  return Math.round((1 - after / before) * 100);
}

const GRADE_WORD: Record<string, number> = {
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  "1": 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
};

function parseGrade(q: string) {
  const m = q.match(/中\s*([一二三四五六1-6])/);
  if (m) return GRADE_WORD[m[1]!] ?? null;
  return null;
}

function pickPolicy(q: string): Policy | null {
  if (/遲到|操行|遲到率/.test(q)) return school.policies.find((p) => p.id === "late-conduct") ?? null;
  if (/欠交|填報|功課|作業/.test(q)) return school.policies.find((p) => p.id === "homework-once") ?? null;
  if (/跑操|病假|早會/.test(q)) return school.policies.find((p) => p.id === "morning-run") ?? null;
  return null;
}

function wantsGrades(q: string) {
  return /年級|各級|分年|細分|每一|每個年級|中[一二三四五六1-6]/.test(q);
}

function avgPair(p: Policy, grade: number | null) {
  const src = grade ? p.byGrade.find((x) => x.grade === grade) : null;
  const before = mean(src ? src.before : p.before);
  const after = mean(src ? src.after : p.after);
  return { before, after, drop: pctDrop(before, after), who: grade ? GRADE_LABEL[grade] : "全校" };
}

function gradeLines(p: Policy, focus: number | null) {
  if (p.id === "morning-run") {
    const g3 = p.byGrade.find((x) => x.grade === 3)!;
    return `這項只試點中三：病假月均 ${mean(g3.before)} → ${mean(g3.after)}。其他年級未納入，數列幾乎沒動，不能當成全校效果。`;
  }
  const rows = [...p.byGrade].sort(
    (a, b) => pctDrop(mean(b.before), mean(b.after)) - pctDrop(mean(a.before), mean(a.after)),
  );
  const best = rows[0]!;
  const worst = rows[rows.length - 1]!;
  let extra = `分年級看，${GRADE_LABEL[best.grade]}降幅最大（月均 ${mean(best.before)} → ${mean(best.after)}，少 ${pctDrop(mean(best.before), mean(best.after))}%），${GRADE_LABEL[worst.grade]}最小（${mean(worst.before)} → ${mean(worst.after)}，少 ${pctDrop(mean(worst.before), mean(worst.after))}%）。`;
  if (focus) {
    const row = p.byGrade.find((x) => x.grade === focus)!;
    extra = `${GRADE_LABEL[focus]}月均 ${mean(row.before)} → ${mean(row.after)}。${extra}`;
  }
  return extra;
}

export function askPolicy(q: string): PolicyAnswer {
  const focusGrade = parseGrade(q);
  const policy = pickPolicy(q);

  if (!policy) {
    return {
      text: "目前可對照的校策有三項：遲到納入操行、欠交功課一次輸入、中三早會跑操試點。問推行前後的數字即可，例如「遲到納入操行後有沒有改善」。",
      policy: null,
      showGrades: false,
      focusGrade: null,
    };
  }

  const useGrade = policy.id === "morning-run" && !focusGrade ? 3 : focusGrade;
  const s = avgPair(policy, useGrade);
  const title = policy.title.replace(/（.*）/, "");
  const showGrades = wantsGrades(q) || policy.id === "late-conduct" || policy.id === "morning-run";
  const head =
    s.drop > 3
      ? `有改善。${title}自 ${policy.started} 起，${s.who}「${policy.metric}」由月均 ${s.before} 降至 ${s.after}，約少 ${s.drop}%。六個月走勢持續向下，不是單月波動。`
      : `${title}自 ${policy.started} 起，${s.who}月均 ${s.before} → ${s.after}，變化約 ${s.drop}%。`;

  return {
    text: `${head} ${showGrades ? gradeLines(policy, focusGrade) : "若要看各年級，可以直接問「分年級看遲到」。"}`,
    policy,
    showGrades,
    focusGrade,
  };
}
