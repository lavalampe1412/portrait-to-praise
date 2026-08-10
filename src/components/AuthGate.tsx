import { useEffect, useState, type ReactNode } from "react";

const USERNAME = "user";
const PASSWORD = "123";
const STORAGE_KEY = "site-unlocked";

export function AuthGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY) === "true") {
      setUnlocked(true);
    }
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (username === USERNAME && password === PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, "true");
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
    }
  }

  if (unlocked) return <>{children}</>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 font-sans text-foreground">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-3 rounded-xl border border-border p-8"
      >
        <h1 className="text-center font-display text-2xl">Logg inn</h1>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Brukernavn"
          className="w-full rounded-lg border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-primary"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Passord"
          className="w-full rounded-lg border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-primary"
        />
        {error && <p className="text-sm text-destructive">Feil brukernavn eller passord.</p>}
        <button
          type="submit"
          className="w-full rounded-lg border border-primary bg-primary px-4 py-3 font-mono text-xs font-bold uppercase tracking-widest text-primary-foreground transition hover:bg-transparent hover:text-primary"
        >
          Logg inn
        </button>
      </form>
    </div>
  );
}
