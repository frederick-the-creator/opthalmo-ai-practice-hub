import React, { useEffect, useState } from "react";
import { useAuth } from "@/supabase/AuthProvider";
import { fetchRoundsByCandidate, fetchRoomByRoundId, fetchCasebyCaseId } from "@/supabase/data";
import type { PracticeRound, Case, Profile, PracticeRoomWithProfiles } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";

const AssessmentHistory: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rounds, setRounds] = useState<PracticeRound[]>([]);
  const [roomsById, setRoomsById] = useState<Record<string, PracticeRoomWithProfiles>>({});
  const [casesById, setCasesById] = useState<Record<string, Case>>({});
  const [dialogState, setDialogState] = useState<{ open: boolean; round: PracticeRound | null }>({ open: false, round: null });

  const { user } = useAuth();

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const userId = user?.id ?? null;
        if (!userId) {
          setRounds([]);
          setRoomsById({});
          setCasesById({});
          setLoading(false);
          return;
        }

        // Fetch rounds for the current user
        const userRounds = await fetchRoundsByCandidate(userId);
        setRounds(userRounds);

        // Build unique maps so we don't refetch the same room/case repeatedly
        const uniqueRoomIdToRoundId = new Map<string, string>();
        for (const r of userRounds) {
          const rid = (r.roomId as string) || '';
          if (rid && !uniqueRoomIdToRoundId.has(rid)) uniqueRoomIdToRoundId.set(rid, r.id);
        }
        const uniqueCaseIds = Array.from(new Set(userRounds.map(r => r.caseBriefId).filter(Boolean) as string[]));

        // Fetch rooms by a representative roundId for each room_id
        const fetchedRooms = await Promise.all(
          Array.from(uniqueRoomIdToRoundId.values()).map(async (roundId) => {
            const room = await fetchRoomByRoundId(roundId);
            return room ?? null;
          })
        );
        const roomsMap: Record<string, PracticeRoomWithProfiles> = {} as any;
        for (const r of fetchedRooms) if (r) roomsMap[r.id] = r;
        setRoomsById(roomsMap);

        // Fetch case briefs by case id
        const fetchedCases = await Promise.all(
          uniqueCaseIds.map(async (caseId) => {
            const c = await fetchCasebyCaseId(caseId);
            return c ?? null;
          })
        );
        const casesMap: Record<string, any> = {};
        for (const c of fetchedCases) if (c) casesMap[c.id] = c;
        setCasesById(casesMap);
      } catch (e: any) {
        setError(e?.message || "Failed to load assessments");
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  const handleOpenAssessment = (round: PracticeRound) => {
    setDialogState({ open: true, round });
  };

  const getHostAndGuestProfiles = (room: PracticeRoomWithProfiles, userId: string | null) => {
    const hostProfile = (room as any).hostProfile || null;
    const guestProfile = (room as any).guestProfile || null;
    const hostName = hostProfile ? `${hostProfile.firstName || ''} ${hostProfile.lastName || ''}`.trim() || 'Unknown' : 'Unknown';
    let guestName: string;
    if (guestProfile) {
      if (userId && room.guestId === userId) guestName = 'You';
      else guestName = `${guestProfile.firstName || ''} ${guestProfile.lastName || ''}`.trim() || 'Unknown';
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
        ) : rounds.length === 0 ? (
          <li className="p-4 text-gray-500 text-center">No rounds found.</li>
        ) : (
          [...rounds]
            .sort((a, b) => {
              const ra = roomsById[a.roomId as string];
              const rb = roomsById[b.roomId as string];
              const da = ra?.datetimeUtc ? new Date(ra.datetimeUtc as string).getTime() : 0;
              const db = rb?.datetimeUtc ? new Date(rb.datetimeUtc as string).getTime() : 0;
              return db - da;
            })
            .map((round) => {
            const room = roomsById[round.roomId as string];
            const caseBrief = casesById[round.caseBriefId as string];
            const { hostName, guestName, hostAvatar } = room ? getHostAndGuestProfiles(room, user?.id ?? null) : { hostName: 'Unknown', guestName: 'Unknown', hostAvatar: 'U' };
            const hasAssessment = Boolean(round?.assessment);
            const caseName = caseBrief?.caseName || caseBrief?.caseNameInternal || 'Unknown Case';
            const caseType = caseBrief?.type || 'Unknown';
            return (
              <li key={round.id} className="flex items-center justify-between p-4">
                <div className="flex items-center">
                  <Avatar>
                    <AvatarFallback>{hostAvatar}</AvatarFallback>
                  </Avatar>
                  <div className="ml-3">
                    <p className="font-medium">{caseName}</p>
                    <p className="text-sm text-gray-600">Type: {caseType}</p>
                    <div className="flex text-sm text-gray-500">
                      <span>Host: {hostName}</span>
                      <span className="mx-2">•</span>
                      <span>Guest: {guestName}</span>
                      <span className="mx-2">•</span>
                      <span>{room?.datetimeUtc ? new Date(room.datetimeUtc as string).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Unknown date'}</span>
                      {room?.stage === 'Finished' && <span className="ml-2 text-green-600">Finished</span>}
                    </div>
                  </div>
                </div>
                {hasAssessment ? (
                  <Dialog open={dialogState.open && dialogState.round?.id === round.id} onOpenChange={(open) => setDialogState((prev) => ({ ...prev, open }))}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-primary" onClick={() => handleOpenAssessment(round)}>
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
                          const dialogRoom = dialogState.round?.roomId ? roomsById[dialogState.round.roomId as string] : null;
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
                                    Interview • {dialogRoom?.datetimeUtc ? new Date(dialogRoom.datetimeUtc as string).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Unknown date'}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <div className="flex justify-end gap-2">
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
                                        </div>
                                        <div className="flex gap-2">
                                          {d?.insufficient_evidence && (
                                            <Badge variant="destructive">Insufficient evidence</Badge>
                                          )}
                                          {Array.isArray(d?.red_flags) && d.red_flags.length > 0 && (
                                            <Badge variant="destructive">Red flags</Badge>
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


