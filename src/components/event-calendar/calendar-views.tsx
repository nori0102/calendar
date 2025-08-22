import {
  AgendaView,
  CalendarEvent,
  CalendarView,
  DayView,
  MonthView,
  WeekView,
} from "@/components/event-calendar";

interface CalendarViewsProps {
  view: CalendarView;
  currentDate: Date;
  events: CalendarEvent[];
  onEventSelect: (event: CalendarEvent) => void;
  onEventCreate: (startTime: Date) => void;
}

export function CalendarViews({
  view,
  currentDate,
  events,
  onEventSelect,
  onEventCreate,
}: CalendarViewsProps) {
  return (
    <div className="flex flex-1 flex-col">
      {view === "month" && (
        <MonthView
          currentDate={currentDate}
          events={events}
          onEventSelect={onEventSelect}
          onEventCreate={onEventCreate}
        />
      )}
      {view === "week" && (
        <WeekView
          currentDate={currentDate}
          events={events}
          onEventSelect={onEventSelect}
          onEventCreate={onEventCreate}
        />
      )}
      {view === "day" && (
        <DayView
          currentDate={currentDate}
          events={events}
          onEventSelect={onEventSelect}
          onEventCreate={onEventCreate}
        />
      )}
      {view === "agenda" && (
        <AgendaView
          currentDate={currentDate}
          events={events}
          onEventSelect={onEventSelect}
        />
      )}
    </div>
  );
}