"use client";

import { ja } from "date-fns/locale";
import { useEffect, useMemo, useState } from "react";
import { useCalendarContext } from "./calendar-context";
import {
  addDays,
  addMonths,
  addWeeks,
  endOfWeek,
  format,
  isSameMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  addHoursToDate,
  AgendaDaysToShow,
  AgendaView,
  CalendarDndProvider,
  CalendarEvent,
  CalendarView,
  DayView,
  EventDialog,
  EventGap,
  EventHeight,
  MonthView,
  WeekCellsHeight,
  WeekView,
} from "@/components/event-calendar";
import { EventCreationChoiceDialog } from "@/components/event-calendar/event-creation-choice-dialog";
import { AISuggestionDialog } from "@/components/event-calendar/ai-suggestion-dialog";
import { cn } from "@/lib/utils";
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
// import Participants from "@/components/participants";

/**
 * カレンダー UI のルートコンポーネント。
 * 月/週/日/アジェンダの各ビューを切り替え、イベントの追加・更新・削除をハンドリングします。
 *
 * - **ビュー切替**: ヘッダーのドロップダウンまたはキーボード（M/W/D/A）。
 * - **ナビゲーション**: 前/次/今日 ボタンで基準日を移動。
 * - **作成**: 空き枠クリックまたは「新しいイベント」から作成ダイアログを開く（5分刻みにスナップ）。
 * - **編集**: イベントクリックで編集ダイアログ、DnD で時間/日付移動（`CalendarDndProvider` 経由）。
 * - **通知**: 追加/更新/削除/移動時に `sonner` でトースト表示。
 *
 * @remarks
 * - 日付状態は共有の {@link useCalendarContext} を利用（親で `CalendarProvider` が必要）。
 * - DnD の処理は {@link CalendarDndProvider} 内で完結。ドロップ時は `onEventUpdate` が呼ばれます。
 * - ビュー別のヘッダタイトル（`viewTitle`）は `date-fns` で整形。ローカライズが必要なら `format` に `locale` を渡してください。
 * - スタイルは CSS 変数 `--event-height` / `--event-gap` / `--week-cells-height` をルート要素に設定し、子コンポーネントで参照します。
 *
 * @keyboard
 * - `M` = 月, `W` = 週, `D` = 日, `A` = 予定（入力中やダイアログ表示中は無効）
 *
 * @example
 * ```tsx
 * <CalendarProvider>
 *   <EventCalendar
 *     events={events}
 *     onEventAdd={(e) => setEvents([...events, e])}
 *     onEventUpdate={(e) => setEvents(events.map(x => x.id === e.id ? e : x))}
 *     onEventDelete={(id) => setEvents(events.filter(x => x.id !== id))}
 *     initialView="month"
 *   />
 * </CalendarProvider>
 * ```
 */
export interface EventCalendarProps {
  /** 描画対象のイベント配列 */
  events?: CalendarEvent[];
  /** 追加（作成ダイアログの保存時 or 直接作成） */
  onEventAdd?: (event: CalendarEvent) => void;
  /** 更新（編集ダイアログ保存 or DnD での移動） */
  onEventUpdate?: (event: CalendarEvent) => void;
  /** 削除（編集ダイアログから） */
  onEventDelete?: (eventId: string) => void;
  /** ルート要素に付与する追加クラス */
  className?: string;
  /** 初期表示ビュー（既定: "month"） */
  initialView?: CalendarView;
}

export function EventCalendar({
  events = [],
  onEventAdd,
  onEventUpdate,
  onEventDelete,
  className,
  initialView = "month",
}: EventCalendarProps) {
  // 共有カレンダー状態（基準日）
  const { currentDate, setCurrentDate } = useCalendarContext();

  /** 現在のビュー */
  const [view, setView] = useState<CalendarView>(initialView);

  /** イベントダイアログの開閉状態と選択イベント */
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  /** 選択中のイベント（編集用） */
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  
  /** 中間選択ダイアログの状態 */
  const [isChoiceDialogOpen, setIsChoiceDialogOpen] = useState(false);
  /** AI提案ダイアログの状態 */
  const [isAISuggestionOpen, setIsAISuggestionOpen] = useState(false);
  /** 選択された日時（イベント作成用） */
  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null);
  const { open } = useSidebar();

  // ビュー切替のキーボードショートカット（入力中/ダイアログ時は無効）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 入力中やダイアログが開いている場合は無視
      if (
        isEventDialogOpen ||
        isChoiceDialogOpen ||
        isAISuggestionOpen ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        return;
      }
      // M/W/D/A キーでビュー切替
      switch (e.key.toLowerCase()) {
        case "m":
          setView("month");
          break;
        case "w":
          setView("week");
          break;
        case "d":
          setView("day");
          break;
        case "a":
          setView("agenda");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEventDialogOpen, isChoiceDialogOpen, isAISuggestionOpen]);

  // ナビゲーション: 前へ
  const handlePrevious = () => {
    if (view === "month") setCurrentDate(subMonths(currentDate, 1));
    else if (view === "week") setCurrentDate(subWeeks(currentDate, 1));
    else if (view === "day") setCurrentDate(addDays(currentDate, -1));
    else if (view === "agenda")
      setCurrentDate(addDays(currentDate, -AgendaDaysToShow));
  };

  // ナビゲーション: 次へ
  const handleNext = () => {
    if (view === "month") setCurrentDate(addMonths(currentDate, 1));
    else if (view === "week") setCurrentDate(addWeeks(currentDate, 1));
    else if (view === "day") setCurrentDate(addDays(currentDate, 1));
    else if (view === "agenda")
      setCurrentDate(addDays(currentDate, AgendaDaysToShow));
  };

  // Today へ
  const handleToday = () => setCurrentDate(new Date());

  // イベント選択（編集ダイアログを開く）
  const handleEventSelect = (event: CalendarEvent) => {
    console.log("Event selected:", event);
    setSelectedEvent(event); // 選択イベントを設定
    setIsEventDialogOpen(true); // イベントダイアログを開く
  };

  // 空き枠クリックで新規作成（5分刻みにスナップ）
  const handleEventCreate = (startTime: Date) => {
    console.log("Creating new event at:", startTime);
    const minutes = startTime.getMinutes();
    const remainder = minutes % 5;
    if (remainder !== 0) {
      startTime.setMinutes(
        remainder < 2.5 ? minutes - remainder : minutes + (5 - remainder)
      );
      startTime.setSeconds(0);
      startTime.setMilliseconds(0);
    }
    
    // 中間選択ダイアログを表示
    setSelectedDateTime(startTime);
    setIsChoiceDialogOpen(true);
  };

  // 手動作成を選択した場合（既存の動作）
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

  // AI提案を選択した場合
  const handleAICreate = () => {
    console.log("AI suggestion selected");
    setIsChoiceDialogOpen(false);
    setIsAISuggestionOpen(true);
  };

  // 中間選択ダイアログを閉じる
  const handleChoiceDialogClose = () => {
    setIsChoiceDialogOpen(false);
    setSelectedDateTime(null);
  };

  // AI提案ダイアログを閉じる
  const handleAISuggestionClose = () => {
    setIsAISuggestionOpen(false);
    setSelectedDateTime(null);
  };

  // AI提案から手動作成に移行
  const handleAIToManualCreate = () => {
    setIsAISuggestionOpen(false);
    handleManualCreate();
  };

  // AI提案を選択してイベント作成  
  const handleSuggestionSelect = (
    suggestion: { title: string; description: string; location: string },
    timeInfo: { startTime: string; endTime: string }
  ) => {
    if (!selectedDateTime) return;
    
    // 指定された時間でイベントの開始・終了時刻を作成
    const baseDate = selectedDateTime;
    const [startHour, startMin] = timeInfo.startTime.split(':').map(Number);
    const [endHour, endMin] = timeInfo.endTime.split(':').map(Number);
    
    const startDate = new Date(baseDate);
    startDate.setHours(startHour, startMin, 0, 0);
    
    const endDate = new Date(baseDate);
    endDate.setHours(endHour, endMin, 0, 0);
    
    // 終了時刻が開始時刻より前の場合、翌日とする
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

  // ダイアログ保存（新規 or 既存）
  const handleEventSave = (event: CalendarEvent) => {
    if (event.id) {
      // 既存イベントの更新
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

  // ダイアログから削除
  const handleEventDelete = (eventId: string) => {
    const deletedEvent = events.find((e) => e.id === eventId);
    onEventDelete?.(eventId);
    setIsEventDialogOpen(false);
    setSelectedEvent(null);
    if (deletedEvent) {
      toast(`${deletedEvent.title}：削除`, {
        description: format(new Date(deletedEvent.start), "yyyy年MM月dd日"),
        position: "bottom-right",
      });
    }
  };

  // DnD による移動（CalendarDndProvider から呼ばれる）
  const handleEventUpdate = (updatedEvent: CalendarEvent) => {
    onEventUpdate?.(updatedEvent);
    toast(` ${updatedEvent.title}：移動`, {
      description: format(new Date(updatedEvent.start), "yyyy年MM月dd日"),
      position: "bottom-right",
    });
  };

  // ヘッダータイトル（ビューごとに表示）
  const viewTitle = useMemo(() => {
    if (view === "month") {
      return format(currentDate, "yyyy年M月", { locale: ja });
    } else if (view === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 }); // 週の始まり(日曜日)
      const end = endOfWeek(currentDate, { weekStartsOn: 0 }); // 週の終わり(土曜日)
      return isSameMonth(start, end) // 同じ月であればtrue
        ? format(start, "yyyy年M月", { locale: ja })
        : `${format(start, "yyyy年M月", { locale: ja })} 〜 ${format(
            end,
            "M月",
            { locale: ja }
          )}`;
    } else if (view === "day") {
      //画面幅に応じて表示内容を切り替え
      return (
        <>
          <span className="min-md:hidden">
            {format(currentDate, "M月d日 (E)", { locale: ja })}
          </span>
          <span className="max-md:hidden">
            {format(currentDate, "yyyy年M月d日 (EEEE)", { locale: ja })}
          </span>
        </>
      );
    } else if (view === "agenda") {
      const start = currentDate;
      const end = addDays(currentDate, AgendaDaysToShow - 1);
      return isSameMonth(start, end)
        ? format(start, "yyyy年M月", { locale: ja })
        : `${format(start, "M月", { locale: ja })} 〜 ${format(
            end,
            "yyyy年M月",
            { locale: ja }
          )}`;
    } else {
      // デフォルト
      return format(currentDate, "yyyy年M月", { locale: ja });
    }
  }, [currentDate, view]);

  return (
    <div
      className="flex has-data-[slot=month-view]:flex-1 flex-col rounded-lg"
      style={
        {
          "--event-height": `${EventHeight}px`,
          "--event-gap": `${EventGap}px`,
          "--week-cells-height": `${WeekCellsHeight}px`,
        } as React.CSSProperties
      }
    >
      {/* DnD（ドラッグ＆ドロップ）の提供範囲を定義 */}
      <CalendarDndProvider onEventUpdate={handleEventUpdate}>
        {/* Header */}
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
            {/* <Participants /> */}
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center sm:gap-2 max-sm:order-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="max-sm:size-8"
                  onClick={handlePrevious}
                  aria-label="Previous"
                >
                  <ChevronLeftIcon size={16} aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="max-sm:size-8"
                  onClick={handleNext}
                  aria-label="Next"
                >
                  <ChevronRightIcon size={16} aria-hidden="true" />
                </Button>
              </div>
              <Button
                className="max-sm:h-8 max-sm:px-2.5!"
                onClick={handleToday}
              >
                今日
              </Button>
            </div>

            <div className="flex items-center justify-between gap-2">
              <Button
                variant="outline"
                className="max-sm:h-8 max-sm:px-2.5!"
                onClick={() => {
                  setSelectedEvent(null);
                  setIsEventDialogOpen(true);
                }}
              >
                新しいイベント
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="gap-1.5 max-sm:h-8 max-sm:px-2! max-sm:gap-1"
                  >
                    <span className="capitalize">{view}</span>
                    <ChevronDownIcon
                      className="-me-1 opacity-60"
                      size={16}
                      aria-hidden="true"
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-32">
                  <DropdownMenuItem onClick={() => setView("month")}>
                    月 <DropdownMenuShortcut>M</DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setView("week")}>
                    週 <DropdownMenuShortcut>W</DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setView("day")}>
                    日 <DropdownMenuShortcut>D</DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setView("agenda")}>
                    予定 <DropdownMenuShortcut>A</DropdownMenuShortcut>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <ThemeToggle />
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col">
          {view === "month" && (
            <MonthView
              currentDate={currentDate}
              events={events}
              onEventSelect={handleEventSelect}
              onEventCreate={handleEventCreate}
            />
          )}
          {view === "week" && (
            <WeekView
              currentDate={currentDate}
              events={events}
              onEventSelect={handleEventSelect}
              onEventCreate={handleEventCreate}
            />
          )}
          {view === "day" && (
            <DayView
              currentDate={currentDate}
              events={events}
              onEventSelect={handleEventSelect}
              onEventCreate={handleEventCreate}
            />
          )}
          {view === "agenda" && (
            <AgendaView
              currentDate={currentDate}
              events={events}
              onEventSelect={handleEventSelect}
            />
          )}
        </div>

        {/* Dialogs */}
        <EventCreationChoiceDialog
          isOpen={isChoiceDialogOpen}
          selectedDate={selectedDateTime || new Date()}
          selectedTime={selectedDateTime || undefined}
          onClose={handleChoiceDialogClose}
          onManualCreate={handleManualCreate}
          onAICreate={handleAICreate}
        />
        
        <AISuggestionDialog
          isOpen={isAISuggestionOpen}
          selectedDate={selectedDateTime || new Date()}
          selectedTime={selectedDateTime || undefined}
          onClose={handleAISuggestionClose}
          onSuggestionSelect={handleSuggestionSelect}
          onManualCreate={handleAIToManualCreate}
        />
        
        <EventDialog
          event={selectedEvent}
          isOpen={isEventDialogOpen}
          onClose={() => {
            setIsEventDialogOpen(false);
            setSelectedEvent(null);
          }}
          onSave={handleEventSave}
          onDelete={handleEventDelete}
        />
      </CalendarDndProvider>
    </div>
  );
}
