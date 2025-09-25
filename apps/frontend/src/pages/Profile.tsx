import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/supabase/client";
import type { Tables } from "@/supabase/dbTypes";
import { fetchProfile } from "@/supabase/data";

type ProfileRow = Tables<"profiles">;

const trainingLevelItems = [
  { value: "medical-student", label: "Medical Student" },
  { value: "foundation", label: "Foundation Doctor" },
  { value: "st1-applicant", label: "ST1 Applicant" },
  { value: "st1", label: "ST1" },
  { value: "st2", label: "ST2" },
  { value: "st3", label: "ST3" },
  { value: "st4-and-above", label: "ST4 and above" },
];

const Profile: React.FC = () => {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingEmail, setChangingEmail] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [trainingLevel, setTrainingLevel] = useState<string>("");

  const [newEmail, setNewEmail] = useState("");
  const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!isMounted) return;
        setUserId(user?.id || null);
        setUserEmail(user?.email || "");
        if (user?.id) {
          const profile = await fetchProfile(user.id);
          if (!isMounted) return;
          if (profile) {
            setFirstName(profile.first_name || "");
            setLastName(profile.last_name || "");
            setTrainingLevel((profile as ProfileRow).training_level || "");
          }
        }
      } catch (_err) {
        // noop
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const profileChanged = useMemo(() => {
    return Boolean(firstName || lastName || trainingLevel);
  }, [firstName, lastName, trainingLevel]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSavingProfile(true);
    try {
      // Try update; if no row exists, insert
      const { error: updateError } = await supabase
        .from("profiles")
        .upsert({
          user_id: userId,
          first_name: firstName,
          last_name: lastName,
          training_level: trainingLevel,
        }, { onConflict: "user_id" });
      if (updateError) throw updateError;
      toast({ title: "Profile updated" });
    } catch (err: any) {
      toast({ title: "Failed to update profile", description: err?.message || String(err), variant: "destructive" });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail) return;
    if (!newEmail) {
      toast({ title: "Enter a new email", variant: "destructive" });
      return;
    }
    setChangingEmail(true);
    try {
      // Reauthenticate with current password if provided to reduce chance of reauth errors
      if (currentPasswordForEmail) {
        const { error: reauthError } = await supabase.auth.signInWithPassword({ email: userEmail, password: currentPasswordForEmail });
        if (reauthError) throw reauthError;
      }
      const { data, error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      // Supabase may send a confirmation email
      toast({ title: "Email update initiated", description: "Check your inbox to confirm the change." });
      setNewEmail("");
      setCurrentPasswordForEmail("");
    } catch (err: any) {
      toast({ title: "Failed to update email", description: err?.message || String(err), variant: "destructive" });
    } finally {
      setChangingEmail(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail) return;
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
      if (currentPassword) {
        const { error: reauthError } = await supabase.auth.signInWithPassword({ email: userEmail, password: currentPassword });
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
          <CardDescription>Update your name and training level.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSaveProfile}>
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Jane" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Training level</Label>
              <Select value={trainingLevel || undefined} onValueChange={setTrainingLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your training level" />
                </SelectTrigger>
                <SelectContent>
                  {trainingLevelItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          <CardDescription>Current email: {userEmail || "-"}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleChangeEmail}>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="newEmail">New email</Label>
              <Input id="newEmail" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="jane@example.com" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="currentPasswordForEmail">Current password (recommended)</Label>
              <Input id="currentPasswordForEmail" type="password" value={currentPasswordForEmail} onChange={(e) => setCurrentPasswordForEmail(e.target.value)} placeholder="••••••••" />
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
              <Label htmlFor="currentPassword">Current password (recommended)</Label>
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


