import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { startRecording, stopRecording, assessCandidatePerformance } from '@/lib/api';
import { Play } from 'lucide-react';

type InterviewControlsProps = {
  room: any | null;
  round: any | null;
  caseBriefs: any[] | null;
  stage: string;
  onStartCase?: () => Promise<void> | void;
  canStart?: boolean;
  onFinishCase?: () => void;
};

const InterviewControls: React.FC<InterviewControlsProps> = ({ room, round, caseBriefs, stage, onStartCase, canStart, onFinishCase }) => {
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
  const [editingTimer, setEditingTimer] = useState(false);
  const timerInputRef = useRef<HTMLInputElement | null>(null);
  const [timerInputError, setTimerInputError] = useState<string | null>(null);
  const [hasStoppedRecording, setHasStoppedRecording] = useState(false);
  const [startLoading, setStartLoading] = useState(false);

  const roomUrl = room?.room_url ?? null
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

  const parseTimeInput = (value: string) => {
    const match = value.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    const min = parseInt(match[1], 10);
    const sec = parseInt(match[2], 10);
    if (isNaN(min) || isNaN(sec) || sec > 59) return null;
    return min * 60 + sec;
  };

  const handleTimerInputSubmit = (e?: React.FormEvent | React.FocusEvent) => {
    if (e) e.preventDefault();
    if (timerInputRef.current) {
      const value = timerInputRef.current.value;
      const seconds = parseTimeInput(value);
      if (seconds !== null) {
        setTimer(seconds);
        setTimerInputError(null);
        setEditingTimer(false);
        return;
      } else {
        setTimerInputError('Please enter time as MM:SS');
      }
    }
  };

  useEffect(() => {
    if (editingTimer && timerInputRef.current) {
      timerInputRef.current.focus();
      timerInputRef.current.select();
    }
  }, [editingTimer]);

  const handleStartRecording = async () => {
    setRecordingLoading(true);
    setRecordingError(null);
    setRecordingSuccess(null);
    setStopError(null);
    setStopSuccess(null);
    try {
      const result = await startRecording({ room_url: roomUrl });
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
    if (!room?.room_url || !room?.id) return;
    try {
      const roundCase = caseBriefs.find(c => c.id === round?.case_brief_id)
      await assessCandidatePerformance({ room_url: room.room_url, roomId: room.id, roundId: round.id, case_name: roundCase.case_name});
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
      const result = await stopRecording({ room_url: roomUrl, roomId: roomId });
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

  if (stage === "Prep") {
    return (
      <div className="w-full mt-6">
        <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
          <Button
            className={`flex items-center gap-2 text-lg px-6 py-3 ${startLoading ? 'btn-disabled' : ''}`}
            onClick={handleStartCaseClick}
            disabled={!canStart || startLoading}
            aria-disabled={startLoading}
          >
            <Play className="w-5 h-5 mr-2" /> {startLoading ? 'Starting...' : 'Start Case'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mt-6">
      <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
        <div
          className="text-2xl font-mono text-black cursor-pointer"
          onClick={() => {
            if (!timerActive && !recordingLoading && !stopLoading) setEditingTimer(true);
          }}
        >
          {editingTimer ? (
            <form onSubmit={handleTimerInputSubmit} style={{ display: 'inline' }}>
              <input
                ref={timerInputRef}
                type="text"
                defaultValue={formatTimer(timer)}
                onBlur={handleTimerInputSubmit}
                maxLength={5}
                className="w-20 text-2xl font-mono text-center border border-primary rounded px-1"
                disabled={timerActive || recordingLoading || stopLoading}
                aria-label="Set timer in MM:SS"
              />
            </form>
          ) : (
            <>Timer: {formatTimer(timer)}</>
          )}
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
            ? () => onFinishCase?.()
            : handleStartRecording;
          const disabled = isStarting || isStopping;
          const label = isStarting
            ? 'Starting Recording...'
            : isStopping
            ? 'Stopping...'
            : showStop
            ? 'Stop Recording'
            : showFinish
            ? 'Finish Case'
            : 'Start Recording';
          const variant = showStop ? 'destructive' : showFinish ? 'default' : 'secondary';
          return (
            <Button className="text-lg" onClick={onClick} disabled={disabled} variant={variant as any}>
              {label}
            </Button>
          );
        })()}
      </div>
      {(recordingError || recordingSuccess || stopError || stopSuccess || (editingTimer && timerInputError)) && (
        <div className="mt-2 text-center">
          {editingTimer && timerInputError && (
            <div className="text-red-500 text-xs">{timerInputError}</div>
          )}
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

