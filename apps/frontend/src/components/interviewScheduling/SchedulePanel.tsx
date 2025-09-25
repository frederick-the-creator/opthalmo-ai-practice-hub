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

  // Ensure the selected time is centered when opening the dropdown
  const timeContentRef = React.useRef<HTMLDivElement | null>(null);
  const handleTimeOpenChange = (open: boolean) => {
    if (!open) return;
    // Wait for content to render, then center the selected item in the viewport
    requestAnimationFrame(() => {
      const contentEl = timeContentRef.current;
      if (!contentEl) return;
      const viewport = contentEl.querySelector(
        '[data-radix-select-viewport]'
      ) as HTMLElement | null;
      const selectedItem = contentEl.querySelector(
        '[data-state="checked"]'
      ) as HTMLElement | null;
      if (!viewport || !selectedItem) return;
      const targetScrollTop =
        selectedItem.offsetTop - viewport.clientHeight / 2 + selectedItem.offsetHeight / 2;
      viewport.scrollTop = Math.max(0, targetScrollTop);
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Schedule Practice Session</CardTitle>
        <CardDescription>
          Select a date and time to schedule a session
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
          <Select value={selectedTime} onValueChange={setSelectedTime} onOpenChange={handleTimeOpenChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select time" />
            </SelectTrigger>
            <SelectContent ref={timeContentRef}>
              {timeOptions.map((time) => (
                <SelectItem key={time} value={time}>
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Session type removed */}
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
