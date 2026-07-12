"use client";

import { JIRA_BROWSE } from "@/lib/types";
import type { ReactNode } from "react";

/* -------------------------------------------------- tone map (status) */
const TONE: Record<string, string> = {
  Requirement: "bg-slate-100 text-slate-700 ring-slate-300",
  Development: "bg-amber-100 text-amber-800 ring-amber-300",
  "User Testing": "bg-violet-100 text-violet-800 ring-violet-300",
  Deploy: "bg-emerald-100 text-emerald-800 ring-emerald-300",
  Hold: "bg-rose-100 text-rose-800 ring-rose-300",
  Todo: "bg-slate-100 text-slate-600 ring-slate-300",
  "In Dev": "bg-amber-100 text-amber-800 ring-amber-300",
  Done: "bg-emerald-100 text-emerald-800 ring-emerald-300",
  "Merging to UAT": "bg-sky-100 text-sky-800 ring-sky-300",
  Deployed: "bg-emerald-100 text-emerald-800 ring-emerald-300",
  "-": "bg-slate-50 text-slate-400 ring-slate-200",
};

export const BAR_TONE: Record<string, string> = {
  Requirement: "bg-slate-400",
  Development: "bg-amber-500",
  "User Testing": "bg-violet-500",
  Deploy: "bg-emerald-500",
  Hold: "bg-rose-400",
};

export function Badge({ v }: { v: string | null | undefined }) {
  const k = v || "-";
  return (
    <span
      className={`inline-block whitespace-nowrap rounded px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
        TONE[k] ?? "bg-slate-100 text-slate-600 ring-slate-300"
      }`}
    >
      {k}
    </span>
  );
}

/* ------------------------------------------------------------ atoms */
export const Label = ({ children }: { children: ReactNode }) => (
  <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{children}</div>
);

export const inputCls =
  "w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500";

export function Btn({
  children,
  onClick,
  tone = "ghost",
  type = "button",
  disabled,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: "solid" | "accent" | "ghost" | "danger";
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}) {
  const tones = {
    solid: "bg-slate-900 text-white hover:bg-slate-700",
    accent: "bg-amber-500 font-semibold text-slate-900 hover:bg-amber-400",
    ghost: "bg-white text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50",
    danger: "bg-white text-rose-600 ring-1 ring-inset ring-rose-200 hover:bg-rose-50",
  } as const;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${tones[tone]} ${className}`}
    >
      {children}
    </button>
  );
}

export const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex flex-col gap-1">
    <Label>{label}</Label>
    {children}
  </div>
);

export function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4">
      <div className={`mt-8 w-full ${wide ? "max-w-3xl" : "max-w-xl"} rounded-lg bg-white shadow-xl`}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider">{title}</h3>
          <button onClick={onClose} aria-label="Tutup" className="text-slate-400 hover:text-slate-900">
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export const FormActions = ({ onClose, onSave }: { onClose: () => void; onSave: () => void }) => (
  <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
    <Btn onClick={onClose}>Batal</Btn>
    <Btn tone="solid" onClick={onSave}>
      Simpan
    </Btn>
  </div>
);

/* ------------------------------------------------------------ table */
export const Th = ({ children, className = "" }: { children?: ReactNode; className?: string }) => (
  <th
    className={`border-b border-slate-200 bg-slate-50 px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-500 ${className}`}
  >
    {children}
  </th>
);

export const Td = ({ children, className = "" }: { children?: ReactNode; className?: string }) => (
  <td className={`border-b border-slate-100 px-3 py-2 align-top text-sm text-slate-700 ${className}`}>
    {children}
  </td>
);

export const Card = ({ children }: { children: ReactNode }) => (
  <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">{children}</div>
);

export const EmptyRow = ({ cols, msg }: { cols: number; msg: string }) => (
  <tr>
    <td colSpan={cols} className="px-3 py-12 text-center text-sm text-slate-400">
      {msg}
    </td>
  </tr>
);

export const RowActions = ({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) => (
  <div className="flex gap-2">
    <button onClick={onEdit} className="text-xs text-slate-500 underline underline-offset-2 hover:text-slate-900">
      Ubah
    </button>
    <button onClick={onDelete} className="text-xs text-slate-400 underline underline-offset-2 hover:text-rose-600">
      Hapus
    </button>
  </div>
);

export function JiraLink({ k }: { k?: string | null }) {
  if (!k) return <span className="text-xs text-slate-300">—</span>;
  return (
    <a
      href={JIRA_BROWSE + k}
      target="_blank"
      rel="noreferrer"
      className="font-mono text-xs text-sky-700 underline decoration-sky-200 underline-offset-2 hover:decoration-sky-600"
    >
      {k}
    </a>
  );
}

export function PageHead({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {sub && <p className="mt-0.5 text-sm text-slate-500">{sub}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </header>
  );
}

export function Metric({ v, k, accent }: { v: number | string; k: string; accent?: boolean }) {
  return (
    <div className={`rounded-lg border bg-white p-4 ${accent ? "border-amber-300" : "border-slate-200"}`}>
      <div className={`text-3xl font-semibold tabular-nums ${accent ? "text-amber-600" : "text-slate-900"}`}>
        {v}
      </div>
      <div className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">{k}</div>
    </div>
  );
}

export const ErrorBar = ({ msg }: { msg: string }) =>
  msg ? (
    <div className="mb-4 rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{msg}</div>
  ) : null;

export const Loading = () => (
  <div className="flex h-64 items-center justify-center text-sm text-slate-400">Memuat data…</div>
);
