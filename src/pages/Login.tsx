import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Loader2, LogIn, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RestoreAccess } from "@/components/RestoreAccess";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

type Mode = "signin" | "signup";

export default function Login() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const next = new URLSearchParams(location.search).get("next");
  const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : "/subscription";

  if (!loading && user) return <Navigate to={safeNext} replace />;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin, data: { display_name: displayName.trim() } },
        });
        if (error) throw error;
        if (data.user) {
          await supabase.from("profiles").upsert({ id: data.user.id, display_name: displayName.trim() });
        }
        if (!data.session) {
          setMessage("Check your email to confirm your account, then sign in.");
          setMode("signin");
          return;
        }
      } else {
        console.log("[Login] Attempting sign-in for email:", email);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          console.error("[Login] Sign-in error:", error);
          throw error;
        }
        console.log("[Login] Sign-in successful");
      }
      navigate(safeNext, { replace: true });
    } catch (error) {
      console.error("[Login] Submit catch:", error);
      setMessage(error instanceof Error ? error.message : "Unable to continue.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-3rem)] grid place-items-center px-4 py-8">
      <Card className="w-full max-w-md border-border bg-card">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-primary text-primary-foreground"><Stethoscope className="h-6 w-6" /></div>
          <CardTitle>{mode === "signin" ? "Sign in to Clinical Tools" : "Create your account"}</CardTitle>
          <CardDescription>Your trial and Pro access stay with your account across devices.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {restoring ? (
            <RestoreAccess onCancel={() => setRestoring(false)} />
          ) : (
            <>
              <form className="space-y-4" onSubmit={submit}>
                {mode === "signup" && <div className="space-y-2"><Label htmlFor="display-name">Display name</Label><Input id="display-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={80} autoComplete="name" /></div>}
                <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></div>
                <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required autoComplete={mode === "signin" ? "current-password" : "new-password"} /></div>
                {message && <p role="status" className="rounded-md border border-border bg-muted p-3 text-sm text-foreground">{message}</p>}
                <Button className="w-full" disabled={busy}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}{mode === "signin" ? "Sign in" : "Create account"}</Button>
              </form>
              <Button type="button" variant="ghost" className="w-full" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMessage(null); }}>
                {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
              </Button>
              {mode === "signin" && (
                <Button type="button" variant="ghost" className="w-full" onClick={() => setRestoring(true)}>
                  Sign in with an email code
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}