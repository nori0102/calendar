import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { addHoursToDate, CalendarEvent } from "@/components/event-calendar";

interface UseEventHandlersProps {
  events: CalendarEvent[];
  onEventAdd?: (event: CalendarEvent) => void;
  onEventUpdate?: (event: CalendarEvent) => void;
  onEventDelete?: (eventId: string) => void;
}

export function useEventHandlers({
  events,
  onEventAdd,
  onEventUpdate,
  onEventDelete,
}: UseEventHandlersProps) {
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isChoiceDialogOpen, setIsChoiceDialogOpen] = useState(false);
  const [isAISuggestionOpen, setIsAISuggestionOpen] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null);

  const handleEventSelect = (event: CalendarEvent) => {
    console.log("Event selected:", event);
    setSelectedEvent(event);
    setIsEventDialogOpen(true);
  };

  const handleEventCreate = (startTime: Date) => {
    console.log("Creating new event at:", startTime);
    const minutes = startTime.getMinutes();
    const remainder = minutes % 10;
    if (remainder !== 0) {
      startTime.setMinutes(
        remainder < 5 ? minutes - remainder : minutes + (10 - remainder)
      );
      startTime.setSeconds(0);
      startTime.setMilliseconds(0);
    }

    setSelectedDateTime(startTime);
    setIsChoiceDialogOpen(true);
  };

  const handleManualCreate = () => {
    if (!selectedDateTime) return;

    const newEvent: CalendarEvent = {
      id: "",
      title: "",
      start: selectedDateTime,
      end: addHoursToDate(selectedDateTime, 1),
      allDay: false,
    };
    setSelectedEvent(newEvent);
    setIsChoiceDialogOpen(false);
    setIsEventDialogOpen(true);
  };

  const handleAICreate = () => {
    console.log("AI suggestion selected");
    setIsChoiceDialogOpen(false);
    setIsAISuggestionOpen(true);
  };

  const handleChoiceDialogClose = () => {
    setIsChoiceDialogOpen(false);
    setSelectedDateTime(null);
  };

  const handleAISuggestionClose = () => {
    setIsAISuggestionOpen(false);
    setSelectedDateTime(null);
  };

  const handleAIToManualCreate = () => {
    setIsAISuggestionOpen(false);
    handleManualCreate();
  };

  const handleSuggestionSelect = (
    suggestion: { title: string; description: string; location: string },
    timeInfo: { startTime: string; endTime: string }
  ) => {
    if (!selectedDateTime) return;

    const baseDate = selectedDateTime;
    const [startHour, startMin] = timeInfo.startTime.split(':').map(Number);
    const [endHour, endMin] = timeInfo.endTime.split(':').map(Number);

    const startDate = new Date(baseDate);
    startDate.setHours(startHour, startMin, 0, 0);

    const endDate = new Date(baseDate);
    endDate.setHours(endHour, endMin, 0, 0);

    if (endDate <= startDate) {
      endDate.setDate(endDate.getDate() + 1);
    }

    const newEvent: CalendarEvent = {
      id: "",
      title: suggestion.title,
      description: suggestion.description,
      start: startDate,
      end: endDate,
      allDay: false,
      location: suggestion.location,
    };
    setSelectedEvent(newEvent);
    setIsAISuggestionOpen(false);
    setIsEventDialogOpen(true);
  };

  const handleEventSave = (event: CalendarEvent) => {
    if (event.id) {
      onEventUpdate?.(event);
      toast(` ${event.title}： 更新`, {
        description: format(new Date(event.start), "yyyy年MM月dd日"),
        position: "bottom-right",
      });
    } else {
      onEventAdd?.({
        ...event,
        id: Math.random().toString(36).substring(2, 11),
      });
      toast(` ${event.title}： 追加`, {
        description: format(new Date(event.start), "yyyy年MM月dd日"),
        position: "bottom-right",
      });
    }
    setIsEventDialogOpen(false);
    setSelectedEvent(null);
  };

  const handleEventDelete = (eventId: string) => {
    const deletedEvent = events.find((e) => e.id === eventId);
    onEventDelete?.(eventId);
    setIsEventDialogOpen(false);
    setSelectedEvent(null);
    if (deletedEvent) {
      toast(` ${deletedEvent.title}：削除`, {
        description: format(new Date(deletedEvent.start), "yyyy年MM月dd日"),
        position: "bottom-right",
      });
    }
  };

  const handleEventUpdate = (updatedEvent: CalendarEvent) => {
    onEventUpdate?.(updatedEvent);
    toast(` ${updatedEvent.title}：移動`, {
      description: format(new Date(updatedEvent.start), "yyyy年MM月dd日"),
      position: "bottom-right",
    });
  };

  const handleNewEventClick = () => {
    setSelectedEvent(null);
    setIsEventDialogOpen(true);
  };

  return {
    // State
    isEventDialogOpen,
    selectedEvent,
    isChoiceDialogOpen,
    isAISuggestionOpen,
    selectedDateTime,

    // Handlers
    handleEventSelect,
    handleEventCreate,
    handleManualCreate,
    handleAICreate,
    handleChoiceDialogClose,
    handleAISuggestionClose,
    handleAIToManualCreate,
    handleSuggestionSelect,
    handleEventSave,
    handleEventDelete,
    handleEventUpdate,
    handleNewEventClick,

    // State setters for dialog close handlers
    setIsEventDialogOpen,
    setSelectedEvent,
  };
}
