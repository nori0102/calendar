import { CalendarEvent, EventDialog } from "@/components/event-calendar";
import { EventCreationChoiceDialog } from "@/components/event-calendar/event-creation-choice-dialog";
import { AISuggestionDialog } from "@/components/event-calendar/ai-suggestion-dialog";

interface CalendarDialogsProps {
  // Choice Dialog
  isChoiceDialogOpen: boolean;
  selectedDateTime: Date | null;
  onChoiceDialogClose: () => void;
  onManualCreate: () => void;
  onAICreate: () => void;

  // AI Suggestion Dialog
  isAISuggestionOpen: boolean;
  onAISuggestionClose: () => void;
  onSuggestionSelect: (
    suggestion: { title: string; description: string; location: string },
    timeInfo: { startTime: string; endTime: string }
  ) => void;
  onAIToManualCreate: () => void;

  // Event Dialog
  isEventDialogOpen: boolean;
  selectedEvent: CalendarEvent | null;
  onEventDialogClose: () => void;
  onEventSave: (event: CalendarEvent) => void;
  onEventDelete: (eventId: string) => void;
}

export function CalendarDialogs({
  isChoiceDialogOpen,
  selectedDateTime,
  onChoiceDialogClose,
  onManualCreate,
  onAICreate,
  isAISuggestionOpen,
  onAISuggestionClose,
  onSuggestionSelect,
  onAIToManualCreate,
  isEventDialogOpen,
  selectedEvent,
  onEventDialogClose,
  onEventSave,
  onEventDelete,
}: CalendarDialogsProps) {
  return (
    <>
      <EventCreationChoiceDialog
        isOpen={isChoiceDialogOpen}
        selectedDate={selectedDateTime || new Date()}
        selectedTime={selectedDateTime || undefined}
        onClose={onChoiceDialogClose}
        onManualCreate={onManualCreate}
        onAICreate={onAICreate}
      />

      <AISuggestionDialog
        isOpen={isAISuggestionOpen}
        selectedDate={selectedDateTime || new Date()}
        selectedTime={selectedDateTime || undefined}
        onClose={onAISuggestionClose}
        onSuggestionSelect={onSuggestionSelect}
        onManualCreate={onAIToManualCreate}
      />

      <EventDialog
        event={selectedEvent}
        isOpen={isEventDialogOpen}
        onClose={onEventDialogClose}
        onSave={onEventSave}
        onDelete={onEventDelete}
      />
    </>
  );
}