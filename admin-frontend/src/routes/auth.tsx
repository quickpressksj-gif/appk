import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Shield } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/shared/ui/input-otp";
import { Checkbox } from "@/shared/ui/checkbox";
import {
  adminLogin,
  adminLoginWithGoogle,
  rememberAdminLogin,
  restoreAdminSession,
  verifyTwoFactor,
} from "../api/auth";
import { adminRoutes } from "../navigation/admin-routes";
import { adminHead } from "../lib/head";

export const Route = createFileRoute("/auth")({
  head: () => adminHead("Sign in", "Secure sign in for QuickPress platform administrators."),
  component: AuthPage,
});

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="mr-2 h-4 w-4">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.9-.1-1.5-.2-2.2H12v4.1h6.6a5.7 5.7 0 0 1-2.4 3.7v3h3.8c2.3-2.1 3.5-5.2 3.5-8.6Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.8-3c-1.1.7-2.4 1.2-4.1 1.2-3.1 0-5.8-2.1-6.8-5H1.3v3.1A12 12 0 0 0 12 24Z"
      />
      <path fill="#FBBC05" d="M5.2 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l3.9-3.1Z" />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.3.6 4.5 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l3.9 3.1c1-2.9 3.7-4.9 6.8-4.9Z"
      />
    </svg>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("meera@quickpress.in");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"credentials" | "2fa">("credentials");
  const [remember, setRemember] = useState(true);

  // Auto login: a stored admin JWT with a live Firebase user skips sign in.
  useEffect(() => {
    let active = true;
    void restoreAdminSession()
      .then((session) => {
        if (active && session) navigate({ to: adminRoutes.dashboard });
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [navigate]);

  const google = useMutation({
    mutationFn: async () => {
      rememberAdminLogin(remember);
      return adminLoginWithGoogle();
    },
    onSuccess: () => {
      toast.success("Signed in with Google");
      navigate({ to: adminRoutes.dashboard });
    },
    onError: (error: unknown) =>
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : "Google sign-in could not be completed.",
      ),
  });

  const login = useMutation({
    mutationFn: async (input: { email: string; password: string }) => {
      rememberAdminLogin(remember);
      return adminLogin(input);
    },
    onSuccess: (session) => {
      if (session.twoFactorRequired) {
        setStep("2fa");
        toast.success("Verification code sent to your authenticator");
      } else {
        navigate({ to: adminRoutes.dashboard });
      }
    },
    onError: () => toast.error("Could not sign in. Check your credentials."),
  });

  const verify = useMutation({
    mutationFn: verifyTwoFactor,
    onSuccess: (result) => {
      if (result.verified) {
        toast.success("Welcome back");
        navigate({ to: adminRoutes.dashboard });
      } else {
        toast.error("Invalid code. Enter the 6-digit code.");
      }
    },
  });

  function submitCredentials(event: FormEvent) {
    event.preventDefault();
    if (!email || !password) {
      toast.error("Enter your email and password");
      return;
    }
    login.mutate({ email, password });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-cta">
            <Shield className="h-5 w-5" />
          </span>
          <div>
            <p className="text-base font-semibold text-foreground">QuickPress Admin</p>
            <p className="text-sm text-muted-foreground">Operations console</p>
          </div>
        </div>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>{step === "credentials" ? "Sign in" : "Two-factor verification"}</CardTitle>
            <CardDescription>
              {step === "credentials"
                ? "Use your QuickPress staff account to continue."
                : "Enter the 6-digit code from your authenticator app."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "credentials" ? (
              <form className="space-y-4" onSubmit={submitCredentials}>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@quickpress.in"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link
                      to={adminRoutes.forgotPassword}
                      className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={remember}
                    onCheckedChange={(checked) => setRemember(checked === true)}
                  />
                  <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground">
                    Keep me signed in on this device
                  </Label>
                </div>
                <Button type="submit" className="w-full" disabled={login.isPending}>
                  {login.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Continue
                </Button>

                <div className="flex items-center gap-3">
                  <span className="h-px flex-1 bg-border" />
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    or
                  </span>
                  <span className="h-px flex-1 bg-border" />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={google.isPending}
                  onClick={() => google.mutate()}
                >
                  {google.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <GoogleGlyph />
                  )}
                  Continue with Google
                </Button>
              </form>
            ) : (
              <div className="space-y-5">
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={code} onChange={setCode}>
                    <InputOTPGroup>
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot key={i} index={i} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button
                  className="w-full"
                  disabled={verify.isPending}
                  onClick={() => verify.mutate({ code })}
                >
                  {verify.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Verify & sign in
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => setStep("credentials")}>
                  Back to sign in
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Protected area. All administrator activity is logged.
        </p>
      </div>
    </div>
  );
}
