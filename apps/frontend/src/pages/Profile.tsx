import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/supabase/client";
import { useAuth } from "@/supabase/AuthProvider";
import { upsertProfile } from "@/supabase/data";


const Profile: React.FC = () => {
  const { toast } = useToast();
  const { user, userProfile, loading, reloadProfile } = useAuth();

  const [savingProfile, setSavingProfile] = useState(false);
  const [changingEmail, setChangingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");


  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const newFirstName = String(formData.get("firstName") || "");
    const newLastName = String(formData.get("lastName") || "");
    setSavingProfile(true);
    try {
      await upsertProfile(user.id, { first_name: newFirstName, last_name: newLastName });
      try { await reloadProfile(); } catch (_e) {}
      toast({ title: "Profile updated" });
    } catch (err: any) {
      toast({ title: "Failed to update profile", description: err?.message || String(err), variant: "destructive" });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!newEmail) {
      toast({ title: "Enter a new email", variant: "destructive" });
      return;
    }
    setChangingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser(
        { email: newEmail },
        { emailRedirectTo: `${window.location.origin}/dashboard?email_change=1` }
      );
      if (error) throw error;
      // Supabase may send a confirmation email
      toast({ title: "Email update initiated", description: "Check your inbox to confirm the change." });
      setNewEmail("");
    } catch (err: any) {
      toast({ title: "Failed to update email", description: err?.message || String(err), variant: "destructive" });
    } finally {
      setChangingEmail(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!newPassword || newPassword.length < 8) {
      toast({ title: "Password too short", description: "Use at least 8 characters.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    setChangingPassword(true);
    try {
      // Reauth if current password provided
      if (currentPassword && user?.email) {
        const { error: reauthError } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword });
        if (reauthError) throw reauthError;
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: "Password updated" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err: any) {
      toast({ title: "Failed to update password", description: err?.message || String(err), variant: "destructive" });
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) return null;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Profile</h2>
        <p className="text-gray-500">Manage your personal information and account settings.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal information</CardTitle>
          <CardDescription>Update your name.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSaveProfile}>
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" name="firstName" defaultValue={userProfile?.first_name || ""} placeholder="Jane" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" name="lastName" defaultValue={userProfile?.last_name || ""} placeholder="Doe" />
            </div>
            
            <div className="md:col-span-2">
              <Button type="submit" disabled={savingProfile}>{savingProfile ? "Saving..." : "Save changes"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change email</CardTitle>
          <CardDescription>Current email: {user?.email || "-"}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleChangeEmail}>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="newEmail">New email</Label>
              <Input id="newEmail" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="jane@example.com" />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={changingEmail}>{changingEmail ? "Updating..." : "Update email"}</Button>
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-gray-500">We may send a confirmation email to verify this change.</p>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
          <CardDescription>Use a strong password you haven’t used elsewhere.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleChangePassword}>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 8 characters" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmNewPassword">Confirm new password</Label>
              <Input id="confirmNewPassword" type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} placeholder="Re-enter password" />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={changingPassword}>{changingPassword ? "Updating..." : "Update password"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;


