import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/supabase/client";
import { fetchRoomsForUser, fetchRoundsByCandidate } from "@/supabase/data";
import type { Room, Round } from "@/supabase/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";

const AssessmentHistory: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roundsByRoom, setRoundsByRoom] = useState<Record<string, Round[]>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [dialogState, setDialogState] = useState<{ open: boolean; roomId: string | null; round: Round | null }>({ open: false, roomId: null, round: null });

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id ?? null;
        setCurrentUserId(userId);
        if (!userId) {
          setRooms([]);
          setRoundsByRoom({});
          setLoading(false);
          return;
        }
        const [userRooms, userRounds] = await Promise.all([
          fetchRoomsForUser(userId),
          fetchRoundsByCandidate(userId),
        ]);

        // Sort rooms by datetime_utc desc (fetch already desc, but ensure)
        const sortedRooms = [...userRooms].sort((a, b) => new Date(b.datetime_utc).getTime() - new Date(a.datetime_utc).getTime());
        setRooms(sortedRooms);

        const grouped: Record<string, Round[]> = {};
        for (const r of userRounds) {
          const key = r.room_id as unknown as string;
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(r);
        }
        setRoundsByRoom(grouped);
      } catch (e: any) {
        setError(e?.message || "Failed to load assessments");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleOpenAssessment = (roomId: string) => {
    const rounds = roundsByRoom[roomId] || [];
    // Select the round where current user is the candidate (there will be at most one)
    const round = rounds.find(r => r.candidate_id === currentUserId) || rounds[0] || null;
    setDialogState({ open: true, roomId, round });
  };

  const getHostAndGuestProfiles = (room: Room, userId: string | null) => {
    const hostProfile = (room as any).host_profile || null;
    const guestProfile = (room as any).guest_profile || null;
    const hostName = hostProfile ? `${hostProfile.first_name || ''} ${hostProfile.last_name || ''}`.trim() || 'Unknown' : 'Unknown';
    let guestName: string;
    if (guestProfile) {
      if (userId && room.guest_id === userId) guestName = 'You';
      else guestName = `${guestProfile.first_name || ''} ${guestProfile.last_name || ''}`.trim() || 'Unknown';
    } else {
      guestName = 'No Guest';
    }
    const hostAvatar = hostProfile?.avatar || (hostName ? hostName[0] : 'U');
    return { hostName, guestName, hostAvatar };
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Assessment History</h1>
      <ul className="divide-y">
        {loading ? (
          <li className="p-4 text-gray-500 text-center">Loading...</li>
        ) : error ? (
          <li className="p-4 text-red-500 text-center">{error}</li>
        ) : rooms.length === 0 ? (
          <li className="p-4 text-gray-500 text-center">No interviews found.</li>
        ) : (
          rooms.map((room) => {
            const { hostName, guestName, hostAvatar } = getHostAndGuestProfiles(room, currentUserId);
            const rounds = roundsByRoom[room.id] || [];
            const candidateRound = rounds.find(r => r.candidate_id === currentUserId) || rounds[0] || null;
            const hasAssessment = Boolean(candidateRound?.assessment);
            return (
              <li key={room.id} className="flex items-center justify-between p-4">
                <div className="flex items-center">
                  <Avatar>
                    <AvatarFallback>{hostAvatar}</AvatarFallback>
                  </Avatar>
                  <div className="ml-3">
                    <p className="font-medium">{hostName}</p>
                    <p className="text-sm text-gray-600">Guest: {guestName}</p>
                    <div className="flex text-sm text-gray-500">
                      <span>{room.type}</span>
                      <span className="mx-2">•</span>
                      <span>{new Date(room.datetime_utc).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      {room.stage === 'Finished' && <span className="ml-2 text-green-600">Finished</span>}
                    </div>
                  </div>
                </div>
                {hasAssessment ? (
                  <Dialog open={dialogState.open && dialogState.roomId === room.id} onOpenChange={(open) => setDialogState((prev) => ({ ...prev, open }))}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-primary" onClick={() => handleOpenAssessment(room.id)}>
                        Show Assessment
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl p-0">
                      <DialogHeader className="px-6 pt-6">
                        <DialogTitle>Assessment</DialogTitle>
                      </DialogHeader>
                      <ScrollArea className="max-h-[70vh] px-6 pb-6">
                        {(() => {
                          const assessment: any = dialogState.round?.assessment || null;
                          if (!assessment) return null;
                          const percentage = Math.round(
                            assessment?.totals?.percentage ?? (
                              assessment?.max_total ? ((assessment?.totals?.total_score || 0) / (assessment.max_total || 1)) * 100 : 0
                            )
                          );
                          const dims: any[] = Array.isArray(assessment?.dimensions) ? assessment.dimensions : [];
                          const hasInsufficient = dims.some((d: any) => d?.insufficient_evidence);
                          const hasRedFlags = dims.some((d: any) => Array.isArray(d?.red_flags) && d.red_flags.length > 0);
                          return (
                            <div className="space-y-4">
                              {/* Overview */}
                              <div className="flex items-center justify-between">
                                <div>
                                  <h2 className="text-lg font-semibold">Assessment Overview</h2>
                                  <p className="text-sm text-muted-foreground">
                                    {room.type} • {new Date(room.datetime_utc).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <div className="text-2xl font-bold">{percentage}%</div>
                                  <div className="text-xs text-muted-foreground">
                                    {(assessment?.totals?.total_score ?? 0)} / {(assessment?.max_total ?? 0)}
                                  </div>
                                  <div className="flex justify-end gap-2 mt-2">
                                    {hasInsufficient && (
                                      <Badge variant="destructive">Insufficient evidence</Badge>
                                    )}
                                    {hasRedFlags && (
                                      <Badge variant="destructive">Red flags</Badge>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Overall feedback */}
                              <div className="border rounded p-3 space-y-2">
                                <div className="font-medium">Summary</div>
                                <p className="text-sm">{assessment?.overall_feedback?.summary}</p>
                                <div className="grid md:grid-cols-2 gap-4">
                                  <div>
                                    <div className="font-medium text-sm mb-1">Keep doing</div>
                                    <ul className="list-disc pl-5 text-sm">
                                      {(assessment?.overall_feedback?.keep_doing ?? []).map((x: string, i: number) => (
                                        <li key={i}>{x}</li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div>
                                    <div className="font-medium text-sm mb-1">Priorities for next time</div>
                                    <ul className="list-disc pl-5 text-sm">
                                      {(assessment?.overall_feedback?.priorities_for_next_time ?? []).map((x: string, i: number) => (
                                        <li key={i}>{x}</li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </div>

                              {/* Dimensions */}
                              <Accordion type="single" collapsible className="w-full">
                                {dims.map((d: any, i: number) => (
                                  <AccordionItem key={i} value={`dim-${i}`}>
                                    <AccordionTrigger>
                                      <div className="flex items-center justify-between w-full">
                                        <div className="text-left">
                                          <div className="font-medium">{d?.name}</div>
                                          <div className="text-xs text-muted-foreground">
                                            Raw {d?.raw_score_0_to_100 ?? 0} • Weighted {d?.weighted_score ?? 0}
                                          </div>
                                        </div>
                                        <div className="flex gap-2">
                                          {d?.insufficient_evidence && (
                                            <Badge variant="destructive">Insufficient evidence</Badge>
                                          )}
                                          {Array.isArray(d?.red_flags) && d.red_flags.length > 0 && (
                                            <Badge variant="destructive">{d.red_flags.length} red flag{d.red_flags.length > 1 ? 's' : ''}</Badge>
                                          )}
                                        </div>
                                      </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                      <div className="grid md:grid-cols-3 gap-4 pt-2">
                                        <div>
                                          <div className="font-medium text-sm mb-1">Evidence</div>
                                          <ul className="list-disc pl-5 text-sm">
                                            {(d?.evidence ?? []).map((x: string, j: number) => <li key={j}>{x}</li>)}
                                          </ul>
                                        </div>
                                        <div>
                                          <div className="font-medium text-sm mb-1">Strengths</div>
                                          <ul className="list-disc pl-5 text-sm">
                                            {(d?.strengths ?? []).map((x: string, j: number) => <li key={j}>{x}</li>)}
                                          </ul>
                                        </div>
                                        <div>
                                          <div className="font-medium text-sm mb-1">Improvements</div>
                                          <ul className="list-disc pl-5 text-sm">
                                            {(d?.improvements ?? []).map((x: string, j: number) => <li key={j}>{x}</li>)}
                                          </ul>
                                        </div>
                                      </div>
                                    </AccordionContent>
                                  </AccordionItem>
                                ))}
                              </Accordion>

                              
                            </div>
                          );
                        })()}
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <Button size="sm" variant="outline" className="border-gray-300" disabled>
                    No Assessment Available
                  </Button>
                )}
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
};

export default AssessmentHistory;


