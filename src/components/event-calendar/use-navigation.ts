import { addDays, addMonths, addWeeks, subMonths, subWeeks } from "date-fns";
import { CalendarView, AgendaDaysToShow } from "@/components/event-calendar";

interface UseNavigationProps {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  view: CalendarView;
}

export function useNavigation({ currentDate, setCurrentDate, view }: UseNavigationProps) {
  const handlePrevious = () => {
    if (view === "month") setCurrentDate(subMonths(currentDate, 1));
    else if (view === "week") setCurrentDate(subWeeks(currentDate, 1));
    else if (view === "day") setCurrentDate(addDays(currentDate, -1));
    else if (view === "agenda")
      setCurrentDate(addDays(currentDate, -AgendaDaysToShow));
  };

  const handleNext = () => {
    if (view === "month") setCurrentDate(addMonths(currentDate, 1));
    else if (view === "week") setCurrentDate(addWeeks(currentDate, 1));
    else if (view === "day") setCurrentDate(addDays(currentDate, 1));
    else if (view === "agenda")
      setCurrentDate(addDays(currentDate, AgendaDaysToShow));
  };

  const handleToday = () => setCurrentDate(new Date());

  return {
    handlePrevious,
    handleNext,
    handleToday,
  };
}