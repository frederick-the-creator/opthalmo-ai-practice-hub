import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Minus } from 'lucide-react';
import { startRecording, stopRecording, assessCandidatePerformance } from '@/lib/api';

type InterviewControlsProps = {
  room: any | null;
  round: any | null;
  caseBriefs: any[] | null;
  onStartCase?: () => Promise<void> | void;
  canStart?: boolean;
  onFinishRound?: () => void;
};

const InterviewControls: React.FC<InterviewControlsProps> = ({ room, round, caseBriefs, onStartCase, canStart, onFinishRound }) => {
  const [recording, setRecording] = useState<null | any>(null);
  const [recordingLoading, setRecordingLoading] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [recordingSuccess, setRecordingSuccess] = useState<string | null>(null);
  const [stopLoading, setStopLoading] = useState(false);
  const [stopError, setStopError] = useState<string | null>(null);
  const [stopSuccess, setStopSuccess] = useState<string | null>(null);
  const [timer, setTimer] = useState(8 * 60); // 8 minutes in seconds
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  // Timer adjustments are now controlled via +/- buttons (no direct typing)
  const [hasStoppedRecording, setHasStoppedRecording] = useState(false);
  const [startLoading, setStartLoading] = useState(false);

  const roomUrl = room?.roomUrl ?? null
  const roomId = room?.id ?? null

  useEffect(() => {
    if (timerActive && timer > 0) {
      timerRef.current = setInterval(() => {
        setTimer(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive]);

  useEffect(() => {
    if (timer === 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setTimerActive(false);
      if (!stopLoading && !recordingLoading) {
        handleStopRecording();
      }
    }
  }, [timer]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const incrementTimerByMinute = () => {
    if (!timerActive && !recordingLoading && !stopLoading) {
      setTimer(prev => prev + 60);
    }
  };

  const decrementTimerByMinute = () => {
    if (!timerActive && !recordingLoading && !stopLoading) {
      setTimer(prev => Math.max(0, prev - 60));
    }
  };

  const handleStartRecording = async () => {
    setRecordingLoading(true);
    setRecordingError(null);
    setRecordingSuccess(null);
    setStopError(null);
    setStopSuccess(null);
    try {
      const result = await startRecording({ roomUrl });
      setRecording(result.recording);
      setRecordingSuccess('Recording started!');
      setTimerActive(true);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || err.message || 'Failed to start recording';
      if (errorMsg.toLowerCase().includes('not-found')) {
        setRecordingError('You must join the call to start recording.');
      } else {
        setRecordingError(errorMsg);
      }
    } finally {
      setRecordingLoading(false);
    }
  };

  const submitAssessment = async () => {
    if (!room?.roomUrl || !room?.id) return;
    try {
      const roundCase = caseBriefs.find(c => c.id === round?.caseBriefId)
      await assessCandidatePerformance({ roomUrl: room.roomUrl, roomId: room.id, roundId: round.id, caseName: roundCase.caseName});
    } catch (e) {
      // Non-blocking: user is navigating away; errors can be surfaced via toasts if desired
      console.error('Failed to start transcription', e);
    }
  };


  const handleStopRecording = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setTimerActive(false);
    setStopLoading(true);
    setStopError(null);
    setStopSuccess(null);
    setRecordingError(null);
    setRecordingSuccess(null);
    try {
      await stopRecording({ roomUrl, roomId: roomId });
      setStopSuccess('Recording stopped.');
      setHasStoppedRecording(true);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || err.message || 'Failed to stop recording';
      if (errorMsg.toLowerCase().includes('not-found')) {
        setStopError('You must join the call to stop recording.');
      } else {
        setStopError(errorMsg);
      }
    } finally {
      setStopLoading(false);
    }
    await submitAssessment();
  };

  const handleStartCaseClick = async () => {
    if (!onStartCase) return;
    setStartLoading(true);
    try {
      await onStartCase();
    } finally {
      setStartLoading(false);
    }
  };

  if ((room?.stage ?? "Prep") === "Prep") {
    return (
      <div className="w-full mt-6">
        <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
          <Button
            className={`flex items-center gap-2 text-lg px-6 py-3 ${startLoading ? 'btn-disabled' : ''}`}
            onClick={handleStartCaseClick}
            disabled={!canStart || startLoading}
            aria-disabled={startLoading}
          >
          Start Case
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mt-6">
      <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
        <div className="flex items-center gap-2">
          <div className="text-2xl font-mono text-black" aria-live="polite" aria-atomic="true">
            {formatTimer(timer)}
          </div>
          <div className="flex flex-col gap-1">
            <Button
              size="icon"
              className="h-6 w-6"
              onClick={incrementTimerByMinute}
              disabled={timerActive || recordingLoading || stopLoading}
              aria-label="Increase timer by 1 minute"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              className="h-6 w-6"
              onClick={decrementTimerByMinute}
              disabled={timerActive || recordingLoading || stopLoading}
              aria-label="Decrease timer by 1 minute"
            >
              <Minus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {(() => {
          const isRecordingActive = timerActive || (!!recording && !hasStoppedRecording);
          const isStarting = recordingLoading;
          const isStopping = stopLoading;
          const showStop = isRecordingActive || isStopping;
          const showFinish = !isStarting && !isStopping && hasStoppedRecording;
          const onClick = showStop
            ? handleStopRecording
            : showFinish
            ? () => onFinishRound?.()
            : handleStartRecording;
          const disabled = isStarting || isStopping;
          const label = isStarting
            ? 'Starting Recording...'
            : isStopping
            ? 'Stopping...'
            : showStop
            ? 'Stop Recording'
            : showFinish
            ? 'Finish Round'
            : 'Start Recording';
          const variant = showStop ? 'destructive' : showFinish ? 'default' : 'secondary';
          return (
            <Button className="text-lg" onClick={onClick} disabled={disabled} variant={variant as any}>
              {label}
            </Button>
          );
        })()}
        <Button className="text-lg" onClick={() => onFinishRound?.()}>Temp Finish Round</Button>
      </div>
      {(recordingError || recordingSuccess || stopError || stopSuccess) && (
        <div className="mt-2 text-center">
          {recordingError && <div className="text-red-500 text-sm">{recordingError}</div>}
          {recordingSuccess && <div className="text-green-600 text-sm">{recordingSuccess}</div>}
          {stopError && <div className="text-red-500 text-sm">{stopError}</div>}
          {stopSuccess && <div className="text-green-600 text-sm">{stopSuccess}</div>}
        </div>
      )}
    </div>
  );
};

export default InterviewControls;

