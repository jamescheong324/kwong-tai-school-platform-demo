import { type FormEvent, type ReactNode, useState } from "react";

export function AskBar({
  placeholder,
  suggestions,
  active,
  busy,
  onAsk,
}: {
  placeholder: string;
  suggestions: string[];
  active?: string;
  busy?: boolean;
  onAsk: (q: string) => void;
}) {
  const [q, setQ] = useState("");

  function submit(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    onAsk(t);
    setQ("");
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    submit(q);
  }

  return (
    <>
      <form className="ask" onSubmit={onSubmit}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          disabled={busy}
        />
        <button type="submit" className="btn primary" disabled={busy || !q.trim()}>
          查
        </button>
      </form>
      <div className="suggest">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            className={`chip${active === s ? " on" : ""}`}
            disabled={busy}
            onClick={() => submit(s)}
          >
            {s}
          </button>
        ))}
      </div>
    </>
  );
}

export function Turn({
  question,
  pending,
  children,
}: {
  question: string;
  pending?: boolean;
  children?: ReactNode;
}) {
  return (
    <section className="turn">
      <p className="turn-q">{question}</p>
      {pending ? (
        <div className="card">
          <p className="caption" style={{ margin: 0 }}>
            對照中…
          </p>
        </div>
      ) : (
        children
      )}
    </section>
  );
}
