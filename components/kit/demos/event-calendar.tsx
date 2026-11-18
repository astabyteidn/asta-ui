"use client";

import { useState } from "react";
import { EventCalendar, type EventCalendarItem } from "@/components/kit/event-calendar";

// Dates are built around today so the demo never looks empty.
const at = (offset: number) => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + offset);
};

const EVENTS: EventCalendarItem[] = [
  { id: "e1", title: "Design review", date: at(0), time: "10:00", accent: true, note: "Room 2" },
  { id: "e2", title: "Lunch with Sekar", date: at(0), time: "12:30" },
  { id: "e3", title: "Ship v2.4", date: at(0), time: "16:00" },
  { id: "e4", title: "Hiring sync", date: at(1), time: "09:30" },
  { id: "e5", title: "Quarterly planning", date: at(3), time: "All day", accent: true },
  { id: "e6", title: "Dentist", date: at(4), time: "08:15" },
  { id: "e7", title: "Customer call", date: at(-2), time: "14:00", note: "Video" },
  { id: "e8", title: "Team dinner", date: at(6), time: "19:00" },
  { id: "e9", title: "Invoice run", date: at(9), time: "11:00" },
  { id: "e10", title: "Offsite", date: at(13), time: "All day", accent: true },
  { id: "e11", title: "Offsite", date: at(14), time: "All day", accent: true },
  { id: "e12", title: "Retro", date: at(-6), time: "15:30" },
  { id: "e13", title: "Board update", date: at(20), time: "10:00" },
  { id: "e14", title: "Roadmap draft due", date: at(-11), time: "17:00" },
];

export default function EventCalendarDemo() {
  const [opened, setOpened] = useState("");
  return (
    <div className="flex min-h-[420px] w-full flex-col items-center justify-center gap-3 p-4 sm:p-8">
      <div className="w-full max-w-[880px]">
        <EventCalendar events={EVENTS} onEventClick={(e) => setOpened(e.title)} />
      </div>
      <p className="h-4 text-[12.5px] text-mute" aria-live="polite">
        {opened ? `Opened ${opened}` : "Click a day, or focus the grid and use the arrow keys. Page Up and Down change the month."}
      </p>
    </div>
  );
}
