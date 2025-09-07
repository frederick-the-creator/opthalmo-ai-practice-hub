import React, { useEffect, useState } from "react";
import QuickActions from "@/components/dashboard/QuickActions";
import { supabase } from "@/supabase/client";
import type { Tables } from "@/supabase/dbTypes";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function CompleteProfileForm({ userId, onComplete, prefill }: { userId: string, onComplete: () => void, prefill?: { firstName?: string, lastName?: string, trainingLevel?: string } }) {
  const [firstName, setFirstName] = useState(prefill?.firstName || "");
  const [lastName, setLastName] = useState(prefill?.lastName || "");
  const [trainingLevel, setTrainingLevel] = useState(prefill?.trainingLevel || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const { error: profileInsertError } = await supabase.from('profiles').insert({
      user_id: userId,
      first_name: firstName,
      last_name: lastName,
      training_level: trainingLevel,
    });
    if (!profileInsertError) {
      localStorage.removeItem('pendingProfile');
      onComplete();
    } else if (profileInsertError.code === '23505') { // duplicate key
      localStorage.removeItem('pendingProfile');
      onComplete();
    } else {
      setError(profileInsertError.message);
    }
    setIsLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Complete Your Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">First Name</label>
          <input className="w-full border rounded px-3 py-2" value={firstName} onChange={e => setFirstName(e.target.value)} required />
        </div>
        <div>
          <label className="block mb-1 font-medium">Last Name</label>
          <input className="w-full border rounded px-3 py-2" value={lastName} onChange={e => setLastName(e.target.value)} required />
        </div>
        <div>
          <label className="block mb-1 font-medium">Training Level</label>
          <Select onValueChange={setTrainingLevel} value={trainingLevel} required>
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
        {error && <div className="text-red-600">{error}</div>}
        <button type="submit" className="w-full bg-primary text-white py-2 rounded" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
}

type Profile = Tables<"profiles">;

const Dashboard: React.FC = () => {
  const [profileStatus, setProfileStatus] = useState<'loading' | 'complete' | 'incomplete'>('loading');
  const [userId, setUserId] = useState<string | null>(null);
  const [prefill, setPrefill] = useState<{ firstName?: string, lastName?: string, trainingLevel?: string } | undefined>(undefined);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    async function checkProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
      if (user) {
        const { data: fetchedProfile, error: profileFetchError } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name, avatar, training_level')
          .eq('user_id', user.id)
          .maybeSingle();
        if (fetchedProfile) {
          setProfile(fetchedProfile);
          setProfileStatus('complete');
        } else if (profileFetchError && profileFetchError.code === "PGRST116") {
          // No profile exists
          const pendingProfile = localStorage.getItem('pendingProfile');
          if (pendingProfile) {
            try {
              setPrefill(JSON.parse(pendingProfile));
            } catch {}
          }
          setProfileStatus('incomplete');
        } else {
          setProfileStatus('complete'); // fallback
        }
      }
    }
    checkProfile();
  }, []);

  if (profileStatus === 'loading') return null;
  if (profileStatus === 'incomplete' && userId) {
    return <CompleteProfileForm userId={userId} onComplete={() => setProfileStatus('complete')} prefill={prefill} />;
  }

  // Mock data
  // const stats = {
  //   stationsDone: 24,
  //   stationsWeak: 7,
  //   progress: 68,
  //   weeklyPractice: 4,
  // };

  // const weakAreas = [
  //   { topic: "Diabetic Retinopathy", score: 3.2 },
  //   { topic: "Glaucoma Assessment", score: 3.5 },
  //   { topic: "Breaking Bad News", score: 4.0 },
  // ];

  // const recentSessions = [
  //   { 
  //     id: 1, 
  //     type: "Clinical", 
  //     topic: "Cataract Assessment", 
  //     date: "Yesterday", 
  //     score: 7.8,
  //     partner: "Sarah T." 
  //   },
  //   { 
  //     id: 2, 
  //     type: "Communication", 
  //     topic: "Explaining Surgery Risks", 
  //     date: "3 days ago", 
  //     score: 6.5,
  //     partner: "AI Practice" 
  //   },
  //   { 
  //     id: 3, 
  //     type: "Clinical", 
  //     topic: "Retinal Detachment", 
  //     date: "5 days ago", 
  //     score: 8.2,
  //     partner: "Michael B." 
  //   },
  // ];

  // const upcomingReminders = [
  //   { id: 1, text: "Practice Communication Skills", category: "suggestion" as const },
  //   { id: 2, text: "Review your recent practice sessions", category: "action" as const },
  //   { id: 3, text: "Sam invited you to practice", category: "invitation" as const },
  // ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Welcome Back{profile?.first_name ? `, ${profile.first_name}` : ''}</h1>
        {/* <p className="text-gray-600">Here's your interview preparation progress</p> */}
      </div>

      {/* <StatsOverview stats={stats} /> */}
      <QuickActions />

      {/* <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <WeakAreas areas={weakAreas} />
        <RecentSessions sessions={recentSessions} />
        <Notifications reminders={upcomingReminders} />
      </div> */}
    </div>
  );
};

export default Dashboard;
