import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Props {
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
  selectedTime: string;
  setSelectedTime: (time: string) => void;
  sessionType: string;
  setSessionType: (type: string) => void;
  scheduleError: string | null;
  scheduling: boolean;
  onSchedule: () => void;
  isPrivate: boolean;
  setIsPrivate: (val: boolean) => void;
}

const SchedulePanel: React.FC<Props> = ({
  selectedDate,
  setSelectedDate,
  selectedTime,
  setSelectedTime,
  sessionType,
  setSessionType,
  scheduleError,
  scheduling,
  onSchedule,
  isPrivate,
  setIsPrivate,
}) => {
  const timeOptions = React.useMemo(() => {
    const options: string[] = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const hourString = String(hour).padStart(2, "0");
        const minuteString = String(minute).padStart(2, "0");
        options.push(`${hourString}:${minuteString}`);
      }
    }
    return options;
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Schedule Practice Session</CardTitle>
        <CardDescription>
          Select a date, time, and session type to schedule a session
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Date</Label>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            fromDate={new Date()}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="time">Time</Label>
          <Select value={selectedTime} onValueChange={setSelectedTime}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select time" />
            </SelectTrigger>
            <SelectContent>
              {timeOptions.map((time) => (
                <SelectItem key={time} value={time}>
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Session Type</Label>
          <Select value={sessionType} onValueChange={setSessionType}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select session type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Clinical">Clinical Station</SelectItem>
              <SelectItem value="Communication">Communication Station</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <input
            id="private-session"
            type="checkbox"
            checked={isPrivate}
            onChange={e => setIsPrivate(e.target.checked)}
            className="form-checkbox h-4 w-4 text-primary"
          />
          <Label htmlFor="private-session">Private Session</Label>
        </div>
        {scheduleError && <div className="text-red-500 text-sm">{scheduleError}</div>}
        <Button className="w-full bg-primary" onClick={onSchedule} disabled={scheduling}>
          {scheduling ? "Scheduling..." : "Schedule Session"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default SchedulePanel;
