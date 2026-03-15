import { useState } from "react";
import { LoaderCircle, Shield } from "lucide-react";

interface LoginScreenProps {
  username: string;
  busy: boolean;
  error: string | null;
  onLogin: (password: string) => Promise<void>;
}

export function LoginScreen({ username, busy, error, onLogin }: LoginScreenProps) {
  const [password, setPassword] = useState("");

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[420px] items-center px-4 py-8">
      <div className="panel w-full p-6 sm:p-8">
        <div className="label">Protected Dashboard</div>
        <div className="mt-4 flex items-center gap-3">
          <div className="rounded-2xl border border-accent/20 bg-accent/10 p-3">
            <Shield className="h-5 w-5 text-accent/90" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white">Sign in to PiOne</h1>
            <p className="mt-1 text-sm text-slate-400">Authentication is enabled for this dashboard.</p>
          </div>
        </div>

        <form
          className="mt-8 grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            await onLogin(password);
          }}
        >
          <label className="grid gap-2">
            <span className="label">Username</span>
            <input className="input" value={username} readOnly />
          </label>
          <label className="grid gap-2">
            <span className="label">Password</span>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoFocus
            />
          </label>
          {error ? (
            <div className="rounded-[20px] border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}
          <button className="button-primary" type="submit" disabled={busy}>
            {busy ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
