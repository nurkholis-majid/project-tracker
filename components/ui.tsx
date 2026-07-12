"use client";

import { JIRA_BROWSE, META, labelOf } from "@/lib/types";
import type { ReactNode } from "react";

/* ---------------------------------------------------------------- badge */
export function Badge({ v, onClick }: { v?: string | null; onClick?: () => void }) {
  const key = v ?? "-";
  const m = META[key] ?? { label: key, icon: "•", tone: "bg-mist-100 text-ink-700 ring-mist-200" };
  const cls = `inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${m.tone}`;

  if (!onClick) return <span className={cls}>{m.icon} {m.label}</span>;
  return (
    <button onClick={onClick} className={cls + " transition hover:brightness-95"} title="Klik untuk ganti">
      {m.icon} {m.label}
    </button>
  );
}

export const BAR_TONE: Record<string, string> = {
  Requirement: "bg-mist-400",
  Development: "bg-sun-500",
  "User Testing": "bg-sky-400",
  Deploy: "bg-ocean-600",
  Hold: "bg-alert-500",
};

/* ---------------------------------------------------------------- atoms */
export const Label = ({ children }: { children: ReactNode }) => (
  <div className="text-[10px] font-semibold uppercase tracking-widest text-mist-600">{children}</div>
);

export const inputCls =
  "w-full rounded-lg border border-mist-200 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-mist-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200";

export function Btn({
  children, onClick, tone = "ghost", type = "button", disabled, className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: "solid" | "accent" | "ghost" | "danger";
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}) {
  const tones = {
    solid:  "bg-ocean-600 text-white hover:bg-ocean-700 shadow-sm",
    accent: "bg-sun-500 font-semibold text-ink-900 hover:bg-sun-600 hover:text-white shadow-sm",
    ghost:  "bg-white text-ink-700 ring-1 ring-inset ring-mist-200 hover:bg-mist-50",
    danger: "bg-white text-alert-600 ring-1 ring-inset ring-alert-200 hover:bg-alert-100",
  } as const;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-3 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${tones[tone]} ${className}`}
    >
      {children}
    </button>
  );
}

export const Field = ({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) => (
  <div className="flex flex-col gap-1">
    <Label>{label}</Label>
    {children}
    {hint && <p className="text-xs text-mist-600">{hint}</p>}
  </div>
);

/** Dropdown dengan label ramah. Nilai yang dikirim tetap nilai mentah database. */
export function Select({
  value, onChange, options, className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls + " " + className}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

/** Opsi dropdown dari daftar status mentah, otomatis pakai label + simbol. */
export const optionsOf = (values: readonly string[]) =>
  values.map((v) => ({ value: v, label: `${META[v]?.icon ?? ""} ${labelOf(v)}`.trim() }));

export function Modal({
  title, subtitle, onClose, children, wide,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-900/50 p-3 sm:p-6">
      <div className={`mt-4 w-full ${wide ? "max-w-4xl" : "max-w-xl"} rounded-2xl bg-white shadow-card`}>
        <div className="flex items-start justify-between gap-4 border-b border-mist-200 px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-ink-900">{title}</h3>
            {subtitle && <p className="mt-0.5 text-xs text-mist-600">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-lg px-2 py-1 text-mist-400 hover:bg-mist-50 hover:text-ink-900"
          >
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export const FormActions = ({ onClose, onSave, saveLabel = "Simpan" }: {
  onClose: () => void; onSave: () => void; saveLabel?: string;
}) => (
  <div className="flex justify-end gap-2 border-t border-mist-100 pt-4">
    <Btn onClick={onClose}>Batal</Btn>
    <Btn tone="solid" onClick={onSave}>{saveLabel}</Btn>
  </div>
);

/* ---------------------------------------------------------------- table */
export const Th = ({ children, className = "" }: { children?: ReactNode; className?: string }) => (
  <th className={`border-b border-mist-200 bg-mist-50 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-mist-600 ${className}`}>
    {children}
  </th>
);

export const Td = ({ children, className = "" }: { children?: ReactNode; className?: string }) => (
  <td className={`border-b border-mist-100 px-3 py-2.5 align-top text-sm text-ink-700 ${className}`}>
    {children}
  </td>
);

export const Card = ({ children }: { children: ReactNode }) => (
  <div className="overflow-x-auto rounded-2xl border border-mist-200 bg-white shadow-card">{children}</div>
);

export const EmptyRow = ({ cols, msg, icon = "🗂️" }: { cols: number; msg: string; icon?: string }) => (
  <tr>
    <td colSpan={cols} className="px-3 py-14 text-center">
      <div className="text-2xl">{icon}</div>
      <p className="mt-2 text-sm text-mist-600">{msg}</p>
    </td>
  </tr>
);

export const RowActions = ({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) => (
  <div className="flex gap-1">
    <button onClick={onEdit} title="Ubah" className="rounded-md px-2 py-1 text-xs text-mist-600 hover:bg-mist-50 hover:text-ocean-600">
      ✏️
    </button>
    <button onClick={onDelete} title="Hapus" className="rounded-md px-2 py-1 text-xs text-mist-400 hover:bg-alert-100 hover:text-alert-600">
      🗑️
    </button>
  </div>
);

/** Satu sel bisa memuat beberapa key Jira, dipisah koma. */
export function JiraLink({ k }: { k?: string | null }) {
  if (!k) return <span className="text-xs text-mist-400">—</span>;
  const keys = k.split(",").map((x) => x.trim()).filter(Boolean);
  return (
    <div className="flex flex-wrap gap-x-2 gap-y-0.5">
      {keys.map((key) => (
        <a
          key={key}
          href={JIRA_BROWSE + key}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-xs text-ocean-600 underline decoration-ocean-200 underline-offset-2 hover:decoration-ocean-600"
        >
          {key}
        </a>
      ))}
    </div>
  );
}

export function PageHead({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">{title}</h1>
        {sub && <p className="mt-1 text-sm text-mist-600">{sub}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </header>
  );
}

export function Metric({ v, k, icon, accent }: { v: number | string; k: string; icon?: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 shadow-card ${accent ? "border-sun-300 bg-sun-100" : "border-mist-200 bg-white"}`}>
      <div className="flex items-baseline gap-2">
        <span className={`text-3xl font-semibold tabular-nums ${accent ? "text-sun-700" : "text-ink-900"}`}>{v}</span>
        {icon && <span className="text-lg">{icon}</span>}
      </div>
      <div className={`mt-1 text-[10px] font-semibold uppercase tracking-widest ${accent ? "text-sun-700" : "text-mist-600"}`}>
        {k}
      </div>
    </div>
  );
}

export const Progress = ({ pct, tone = "bg-ocean-600" }: { pct: number; tone?: string }) => (
  <div className="h-1.5 w-full overflow-hidden rounded-full bg-mist-100">
    <div className={`h-full rounded-full ${tone} transition-all`} style={{ width: `${Math.min(100, pct)}%` }} />
  </div>
);

export const ErrorBar = ({ msg }: { msg: string }) =>
  msg ? (
    <div className="mb-4 flex items-start gap-2 rounded-xl border border-alert-200 bg-alert-100 px-3 py-2 text-sm text-alert-600">
      <span>⚠️</span>
      <span>{msg}</span>
    </div>
  ) : null;

export const Loading = () => (
  <div className="flex h-64 flex-col items-center justify-center gap-2 text-mist-400">
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-mist-200 border-t-ocean-600" />
    <p className="text-sm">Sebentar, lagi ngambil data…</p>
  </div>
);
