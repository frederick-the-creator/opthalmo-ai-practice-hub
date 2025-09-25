import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { supabase } from '@/supabase/client';
import { fetchProfile } from '@/supabase/data';

const CompleteProfile: React.FC = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [trainingLevel, setTrainingLevel] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("You must be logged in to complete your profile.");
      setIsLoading(false);
      return;
    }
    // Check if profile exists first
    const existingProfile = await fetchProfile(user.id);
    if (!existingProfile) {
      const { error: profileError } = await supabase.from('profiles').insert({
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
        training_level: trainingLevel,
      });
      if (profileError) {
        setError(profileError.message);
        setIsLoading(false);
        return;
      }
    }
    // Notify the app that the profile has been updated so listeners can refresh
    window.dispatchEvent(new Event('profileUpdated'));
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Complete Your Profile</CardTitle>
          <CardDescription>Enter your details to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="trainingLevel">Training Level</Label>
              <Select onValueChange={setTrainingLevel} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select your training level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medical-student">Medical Student</SelectItem>
                  <SelectItem value="foundation">Foundation Doctor</SelectItem>
                  <SelectItem value="st1-applicant">ST1 Applicant</SelectItem>
                  <SelectItem value="st1">ST1</SelectItem>
                  <SelectItem value="st2">ST2</SelectItem>
                  <SelectItem value="st3">ST3</SelectItem>
                  <SelectItem value="st4-and-above">ST4 and above</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <Button type="submit" className="w-full bg-primary mt-6" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Profile"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-600">
            You must complete your profile to continue.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CompleteProfile; 