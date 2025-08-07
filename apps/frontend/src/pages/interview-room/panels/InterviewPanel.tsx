import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import Brief from '../briefs/Brief';
import { startRecording, stopRecording } from '@/lib/api';

type InterviewPanelProps = {
  session: any;
  cases: any[];
  role: 'host' | 'guest' | null;
  isCandidate: boolean;
  updating?: boolean;
  onFinishCase: () => void;
  onBack: () => void;
};

const InterviewPanel: React.FC<InterviewPanelProps> = ({ session, cases, role, isCandidate, onFinishCase }) => {
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

  // Start timer when timerActive is set to true
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

  // Stop timer when it reaches 0 and trigger stop recording
  useEffect(() => {
    if (timer === 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setTimerActive(false);
      // Only trigger stop if not already loading/stopping
      if (!stopLoading && !recordingLoading) {
        handleStopRecording();
      }
    }
  }, [timer]);

  // Format timer as MM:SS
  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Parse MM:SS string to seconds
  const parseTimeInput = (value: string) => {
    const match = value.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    const min = parseInt(match[1], 10);
    const sec = parseInt(match[2], 10);
    if (isNaN(min) || isNaN(sec) || sec > 59) return null;
    return min * 60 + sec;
  };

  // Handle timer input submit
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
    // Don't close input if invalid
  };

  // Focus input when editing
  useEffect(() => {
    if (editingTimer && timerInputRef.current) {
      timerInputRef.current.focus();
      timerInputRef.current.select();
    }
  }, [editingTimer]);

  const foundCase = cases.find(c => c.id === session?.case_id);

  const handleStartRecording = async () => {
    setRecordingLoading(true);
    setRecordingError(null);
    setRecordingSuccess(null);
    setStopError(null);
    setStopSuccess(null);
    try {
      const result = await startRecording({ room_url: session?.room_url });
      setRecording(result.recording);
      setRecordingSuccess('Recording started!');
      setTimerActive(true); // Only start the timer, do not reset
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
      const result = await stopRecording({ room_url: session?.room_url, sessionId: session?.id });
      setStopSuccess('Recording stopped.');
      setHasStoppedRecording(true); // Prevent further stops
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
  };

  if (isCandidate) {
    return (
      <div className="flex flex-col h-[calc(100vh-14rem)] max-md:mt-10 max-md:max-w-full">
        <div className="gap-3 w-full text-xs leading-6 text-white max-w-[462px] max-md:max-w-full flex-shrink-0">
          <div className="gap-2.5 self-stretch w-full text-3xl font-medium leading-none text-slate-950 max-md:max-w-full">
            {foundCase?.case_name}
          </div>
        </div>
        <div className="flex-1 mt-8 max-w-full text-black w-[462px] overflow-y-auto">
          <Brief
            title="Candidate Brief"
            markdown={foundCase?.candidate_brief ?? null}
            placeholder={!session?.case_id ? 'Select a case to view the candidate brief.' : 'No candidate brief available for this case.'}
          />
          {/* Only the host sees the Proceed and Recording buttons */}
          {role === 'host' && (
            <div className="flex flex-col items-center mt-8 gap-4">
              <div className="mb-2 text-2xl font-mono text-primary cursor-pointer" onClick={() => {
                if (!timerActive && !recordingLoading && !stopLoading) setEditingTimer(true);
              }}>
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
                {editingTimer && timerInputError && (
                  <div className="text-red-500 text-xs mt-1">{timerInputError}</div>
                )}
              </div>
              <div className="flex gap-2 w-full justify-center">
                <Button
                  className="w-64 text-lg"
                  onClick={handleStartRecording}
                  disabled={recordingLoading || stopLoading}
                  variant="secondary"
                >
                  {recordingLoading ? 'Starting Recording...' : 'Start Recording'}
                </Button>
                <Button
                  className="w-64 text-lg"
                  onClick={handleStopRecording}
                  disabled={stopLoading || recordingLoading || hasStoppedRecording}
                  variant="destructive"
                >
                  {stopLoading ? 'Stopping...' : 'Stop Recording'}
                </Button>
              </div>
              {recordingError && <div className="text-red-500 text-sm mt-2">{recordingError}</div>}
              {recordingSuccess && <div className="text-green-600 text-sm mt-2">{recordingSuccess}</div>}
              {stopError && <div className="text-red-500 text-sm mt-2">{stopError}</div>}
              {stopSuccess && <div className="text-green-600 text-sm mt-2">{stopSuccess}</div>}
              <Button
                className="w-64 text-lg mt-4"
                onClick={onFinishCase}
              >
                Finish Case
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }
  // Interviewer/Actor view
  return (
    <div className="flex flex-col h-[calc(100vh-14rem)] max-md:mt-10 max-md:max-w-full">
      <div className="gap-3 w-full text-xs leading-6 text-white max-w-[462px] max-md:max-w-full flex-shrink-0">
        <div className="gap-2.5 self-stretch w-full text-3xl font-medium leading-none text-slate-950 max-md:max-w-full">
        {foundCase?.case_name}
        </div>
      </div>
      <div className="flex-1 mt-8 max-w-full text-black w-[462px] overflow-y-auto">
        <Brief
          title="Actor Brief"
          markdown={foundCase?.actor_brief ?? null}
          placeholder={!session?.case_id ? 'Select a case to view the actor brief.' : 'No actor brief available for this case.'}
        />
        <Brief
          title="MarkScheme"
          markdown={foundCase?.markscheme ?? null}
          placeholder={!session?.case_id ? 'Select a case to view the markscheme.' : 'No markscheme available for this case.'}
        />
        {/* Only the host sees the Proceed and Recording buttons */}
        {role === 'host' && (
          <div className="flex flex-col items-center mt-8 gap-4">
            <div className="mb-2 text-2xl font-mono text-primary cursor-pointer" onClick={() => {
              if (!timerActive && !recordingLoading && !stopLoading) setEditingTimer(true);
            }}>
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
              {editingTimer && timerInputError && (
                <div className="text-red-500 text-xs mt-1">{timerInputError}</div>
              )}
            </div>
            <div className="flex gap-2 w-full justify-center">
              <Button
                className="w-64 text-lg"
                onClick={handleStartRecording}
                disabled={recordingLoading || stopLoading}
                variant="secondary"
              >
                {recordingLoading ? 'Starting Recording...' : 'Start Recording'}
              </Button>
              <Button
                className="w-64 text-lg"
                onClick={handleStopRecording}
                disabled={stopLoading || recordingLoading || hasStoppedRecording}
                variant="destructive"
              >
                {stopLoading ? 'Stopping...' : 'Stop Recording'}
              </Button>
            </div>
            {recordingError && <div className="text-red-500 text-sm mt-2">{recordingError}</div>}
            {recordingSuccess && <div className="text-green-600 text-sm mt-2">{recordingSuccess}</div>}
            {stopError && <div className="text-red-500 text-sm mt-2">{stopError}</div>}
            {stopSuccess && <div className="text-green-600 text-sm mt-2">{stopSuccess}</div>}
            <Button
              className="w-64 text-lg mt-4"
              onClick={onFinishCase}
            >
              Finish Case
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewPanel; 