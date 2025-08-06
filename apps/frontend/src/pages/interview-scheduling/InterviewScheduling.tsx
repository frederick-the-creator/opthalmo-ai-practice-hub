import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { useInterviewScheduling } from "./useInterviewScheduling";
import SessionListPanel from "./panels/SessionListPanel";
import SchedulePanel from "./panels/SchedulePanel";
import InvitePanel from "./panels/InvitePanel";

const InterviewPractice: React.FC = () => {
  const {
    sessions, loading, error, currentUserId,
    selectedDate, setSelectedDate,
    selectedTime, setSelectedTime,
    sessionType, setSessionType,
    scheduling, scheduleError,
    handleAcceptInvitation, handleScheduleSession,
    handleCopyLink, copied,
    isPrivate, setIsPrivate,
  } = useInterviewScheduling();
  const navigate = useNavigate();

  // Handler for joining a session
  const handleJoin = (session: any) => {
    if (session.room_url) {
      navigate(`/interview-practice-room?roomUrl=${encodeURIComponent(session.room_url)}&sessionId=${session.id}`);
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Interview Practice</h1>
          <p className="text-gray-600">Practice clinical and communication stations</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SessionListPanel
            sessions={sessions}
            loading={loading}
            error={error}
            currentUserId={currentUserId}
            onAccept={handleAcceptInvitation}
            onJoin={handleJoin}
          />
        </div>
        <SchedulePanel
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          selectedTime={selectedTime}
          setSelectedTime={setSelectedTime}
          sessionType={sessionType}
          setSessionType={setSessionType}
          scheduleError={scheduleError}
          scheduling={scheduling}
          onSchedule={handleScheduleSession}
          isPrivate={isPrivate}
          setIsPrivate={setIsPrivate}
        />
      </div>
    </div>
  );
};

export default InterviewPractice;
