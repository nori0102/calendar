"use client";

import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { CalendarView } from "@/components/event-calendar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import ThemeToggle from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

interface CalendarHeaderProps {
  viewTitle: React.ReactNode;
  view: CalendarView;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewChange: (view: CalendarView) => void;
  onNewEvent: () => void;
  className?: string;
}

export function CalendarHeader({
  viewTitle,
  view,
  onPrevious,
  onNext,
  onToday,
  onViewChange,
  onNewEvent,
  className,
}: CalendarHeaderProps) {
  const { open } = useSidebar();

  const viewLabels = {
    month: "月",
    week: "週",
    day: "日",
    agenda: "予定"
  } as const;

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-5 sm:px-4",
        className
      )}
    >
      <div className="flex sm:flex-col max-sm:items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5">
          <SidebarTrigger
            data-state={open ? "invisible" : "visible"}
            className="peer size-7 text-muted-foreground/80 hover:text-foreground/80 hover:bg-transparent! sm:-ms-1.5 lg:data-[state=invisible]:opacity-0 lg:data-[state=invisible]:pointer-events-none transition-opacity ease-in-out duration-200"
            isOutsideSidebar
          />
          <h2 className="font-semibold text-xl lg:peer-data-[state=invisible]:-translate-x-7.5 transition-transform ease-in-out duration-300">
            {viewTitle}
          </h2>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center sm:gap-2 max-sm:order-1">
            <Button
              variant="ghost"
              size="icon"
              className="max-sm:size-8"
              onClick={onPrevious}
              aria-label="Previous"
            >
              <ChevronLeftIcon size={16} aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="max-sm:size-8"
              onClick={onNext}
              aria-label="Next"
            >
              <ChevronRightIcon size={16} aria-hidden="true" />
            </Button>
          </div>
          <Button
            className="max-sm:h-8 max-sm:px-2.5!"
            onClick={onToday}
          >
            今日
          </Button>
        </div>

        <div className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            className="max-sm:h-8 max-sm:px-2.5!"
            onClick={onNewEvent}
          >
            新しいイベント
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="gap-1.5 max-sm:h-8 max-sm:px-2! max-sm:gap-1"
              >
                <span>{viewLabels[view]}</span>
                <ChevronDownIcon
                  className="-me-1 opacity-60"
                  size={16}
                  aria-hidden="true"
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-32">
              <DropdownMenuItem onClick={() => onViewChange("month")}>
                月 <DropdownMenuShortcut>M</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onViewChange("week")}>
                週 <DropdownMenuShortcut>W</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onViewChange("day")}>
                日 <DropdownMenuShortcut>D</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onViewChange("agenda")}>
                予定 <DropdownMenuShortcut>A</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
