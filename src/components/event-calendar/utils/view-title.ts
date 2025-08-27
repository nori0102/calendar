import { format, startOfWeek, endOfWeek, isSameMonth, addDays } from "date-fns";
import { ja } from "date-fns/locale";
import { CalendarView, AgendaDaysToShow } from "@/components/event-calendar";
import { Fragment, createElement, ReactNode } from "react";

export function getViewTitle(currentDate: Date, view: CalendarView): ReactNode {
  if (view === "month") {
    return format(currentDate, "yyyy年M月", { locale: ja });
  }

  if (view === "week") {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    const end = endOfWeek(currentDate, { weekStartsOn: 0 });
    return isSameMonth(start, end)
      ? format(start, "yyyy年M月", { locale: ja })
      : `${format(start, "yyyy年M月", { locale: ja })} 〜 ${format(
          end,
          "M月",
          { locale: ja }
        )}`;
  }

  if (view === "day") {
    return createElement(Fragment, null,
      createElement("span", { className: "min-md:hidden" },
        format(currentDate, "M月d日 (E)", { locale: ja })
      ),
      createElement("span", { className: "max-md:hidden" },
        format(currentDate, "yyyy年M月d日 (EEEE)", { locale: ja })
      )
    );
  }

  if (view === "agenda") {
    const start = currentDate;
    const end = addDays(currentDate, AgendaDaysToShow - 1);
    return isSameMonth(start, end)
      ? format(start, "yyyy年M月", { locale: ja })
      : `${format(start, "yyyy年M月", { locale: ja })} 〜 ${format(
          end,
          "M月",
          { locale: ja }
        )}`;
  }

  return format(currentDate, "yyyy年M月", { locale: ja });
}
