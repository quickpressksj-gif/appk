import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Loader2, MailCheck, Shield } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { requestPasswordReset } from "../api/auth";
import { adminRoutes } from "../navigation/admin-routes";
import { adminHead } from "../lib/head";

export const Route = createFileRoute("/forgot-password")({
  head: () => adminHead("Reset password", "Request a password reset link for your QuickPress admin account."),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const reset = useMutation({
    mutationFn: requestPasswordReset,
    onSuccess: () => toast.success("Reset link sent"),
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : "Password reset is not available yet."),
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!email) {
      toast.error("Enter your work email");
      return;
    }
    reset.mutate(email);
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
            <p className="text-sm text-muted-foreground">Account recovery</p>
          </div>
        </div>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Forgot password</CardTitle>
            <CardDescription>We'll email a secure reset link to your staff address.</CardDescription>
          </CardHeader>
          <CardContent>
            {reset.isError ? (
              <div className="space-y-4 text-center">
                <p className="text-sm text-muted-foreground">
                  {reset.error instanceof Error ? reset.error.message : "Password reset is not available yet."}
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link to={adminRoutes.auth}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to sign in
                  </Link>
                </Button>
              </div>
            ) : reset.isSuccess ? (
              <div className="space-y-4 text-center">
                <MailCheck className="mx-auto h-10 w-10 text-secondary" />
                <p className="text-sm text-muted-foreground">
                  If <span className="font-medium text-foreground">{reset.data.email}</span> belongs to a
                  QuickPress admin, a reset link is on its way.
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link to={adminRoutes.auth}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to sign in
                  </Link>
                </Button>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={submit}>
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Work email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@quickpress.in"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={reset.isPending}>
                  {reset.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Send reset link
                </Button>
                <Button asChild variant="ghost" className="w-full">
                  <Link to={adminRoutes.auth}>Back to sign in</Link>
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}