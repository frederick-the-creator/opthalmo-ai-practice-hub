import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/supabase/client";
import { Link, useNavigate } from "react-router-dom";

const ResetPassword: React.FC = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthFromUrl = async () => {
      try {
        const url = new URL(window.location.href);
        const hasCodeParam = !!url.searchParams.get('code');
        const errorDescription = url.searchParams.get('error_description');

        if (errorDescription) {
          toast({ title: 'Authentication error', description: errorDescription, variant: 'destructive' });
        }

        if (hasCodeParam) {
          const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (error) {
            toast({ title: 'Authentication failed', description: error.message, variant: 'destructive' });
          } else {
            window.history.replaceState({}, document.title, `${url.origin}${url.pathname}`);
          }
        } else if (url.hash) {
          const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          if (accessToken && refreshToken) {
            try {
              const { error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              if (error) {
                toast({ title: 'Authentication failed', description: error.message, variant: 'destructive' });
              }
            } catch (_e) {
              // ignore errors; downstream checks will handle
            }
          }
          window.history.replaceState({}, document.title, `${url.origin}${url.pathname}${url.search}`);
        }
      } catch (_err) {
        // ignore URL parsing errors
      }
    };

    (async () => {
      await handleAuthFromUrl();
      const { data: { session } } = await supabase.auth.getSession();
      setHasSession(!!session);
    })();
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast({
        title: "Reset failed",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    toast({ title: "Password updated", description: "You can now log in." });
    setIsLoading(false);
    navigate("/login");
  };

  if (hasSession === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>
              This link is invalid or expired. Request a new password reset below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/forgot-password" className="w-full">
              <Button className="w-full bg-primary">Request new reset link</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>
            Enter a new password for your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-primary" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;


