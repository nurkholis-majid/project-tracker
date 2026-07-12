"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Btn, Field, inputCls } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const signIn = async () => {
    setBusy(true);
    setError("");
    const { error } = await supabase().auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setError("Email atau password salah.");
      return;
    }
    router.push("/");
    router.refresh();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-8">
        <div className="font-mono text-xs tracking-widest text-amber-600">SQUAD LSS</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Delivery Tracker</h1>
        <p className="mt-1 text-sm text-slate-500">Masuk pakai akun tim.</p>

        <div className="mt-6 space-y-4">
          <Field label="Email">
            <input
              className={inputCls}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && signIn()}
            />
          </Field>
          <Field label="Password">
            <input
              className={inputCls}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && signIn()}
            />
          </Field>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <Btn tone="solid" onClick={signIn} disabled={busy} className="w-full">
            {busy ? "Memproses…" : "Masuk"}
          </Btn>
          <p className="text-xs text-slate-400">
            Belum punya akun? Minta admin Supabase menambahkan lewat Authentication → Users.
          </p>
        </div>
      </div>
    </main>
  );
}
