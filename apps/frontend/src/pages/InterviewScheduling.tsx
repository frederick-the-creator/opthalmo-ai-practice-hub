import React from "react";
import { useNavigate } from "react-router-dom";
import { useInterviewScheduling } from "../hooks/useInterviewScheduling";
import RoomListPanel from "../components/interviewScheduling/RoomListPanel";
import SchedulePanel from "../components/interviewScheduling/SchedulePanel";

const InterviewScheduling: React.FC = () => {
  const {
    rooms, loading, error,
    selectedDate, setSelectedDate,
    selectedTime, setSelectedTime,
    scheduling, scheduleError,
    handleAcceptInvitation, handleScheduleRoom,
    isPrivate, setIsPrivate,
  } = useInterviewScheduling();
  const navigate = useNavigate();

  // Handler for joining a room
  const handleJoin = (room: any) => {
    if (room.room_url) {
      navigate(`/interview-practice-room?roomUrl=${encodeURIComponent(room.room_url)}&roomId=${room.id}`);
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
          <RoomListPanel
            rooms={rooms}
            loading={loading}
            error={error}
            onAccept={handleAcceptInvitation}
            onJoin={handleJoin}
          />
        </div>
        <SchedulePanel
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          selectedTime={selectedTime}
          setSelectedTime={setSelectedTime}
          scheduleError={scheduleError}
          scheduling={scheduling}
          onSchedule={handleScheduleRoom}
          isPrivate={isPrivate}
          setIsPrivate={setIsPrivate}
        />
      </div>
    </div>
  );
};

export default InterviewScheduling;
