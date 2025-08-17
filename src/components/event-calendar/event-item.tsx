"use client";

import { useMemo } from "react";
import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { differenceInMinutes, format, getMinutes, isPast } from "date-fns";
import { Calendar } from "lucide-react";

import {
  getBorderRadiusClasses,
  getEventColorClasses,
  type CalendarEvent,
} from "@/components/event-calendar";
import { cn } from "@/lib/utils";

/**
 * 分が 0 の場合は「h a」、そうでない場合は「h:mm a」で時刻をフォーマットする関数。
 * 例: 9am, 9:15am
 */
const formatTimeWithOptionalMinutes = (date: Date) => {
  return format(date, getMinutes(date) === 0 ? "ha" : "h:mma").toLowerCase();
};

/**
 * イベントが祝日かどうかを判定する関数
 */
const isHolidayEvent = (event: CalendarEvent): boolean => {
  return event.id.startsWith('holiday-');
};

interface EventWrapperProps {
  /** イベントデータ */
  event: CalendarEvent;
  /** マルチデイイベントの最初の日かどうか */
  isFirstDay?: boolean;
  /** マルチデイイベントの最後の日かどうか */
  isLastDay?: boolean;
  /** ドラッグ中かどうか */
  isDragging?: boolean;
  /** クリック時のハンドラ */
  onClick?: (e: React.MouseEvent) => void;
  /** 追加クラス */
  className?: string;
  /** 子要素（イベントの表示内容） */
  children: React.ReactNode;
  /** ドラッグ中の仮想的な現在時刻 */
  currentTime?: Date;
  /** DnD のイベントリスナー */
  dndListeners?: SyntheticListenerMap;
  /** DnD の属性 */
  dndAttributes?: DraggableAttributes;
  /** マウス押下時のハンドラ */
  onMouseDown?: (e: React.MouseEvent) => void;
  /** タッチ開始時のハンドラ */
  onTouchStart?: (e: React.TouchEvent) => void;
}

/**
 * EventWrapper
 * イベント表示の外枠部分を担当する共通コンポーネント。
 * 色、角丸、ドラッグ時の見た目、過去イベント表示などを制御する。
 */
function EventWrapper({
  event,
  isFirstDay = true,
  isLastDay = true,
  isDragging,
  onClick,
  className,
  children,
  currentTime,
  dndListeners,
  dndAttributes,
  onMouseDown,
  onTouchStart,
}: EventWrapperProps) {
  // ドラッグ中の場合は currentTime からイベントの終了時間を算出
  const displayEnd = currentTime
    ? new Date(
        new Date(currentTime).getTime() +
          (new Date(event.end).getTime() - new Date(event.start).getTime())
      )
    : new Date(event.end);

  const isEventInPast = isPast(displayEnd);
  const isHoliday = isHolidayEvent(event);

  // 祝日の場合はクリックイベントを無効化
  const handleClick = (e: React.MouseEvent) => {
    if (isHoliday) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onClick?.(e);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isHoliday) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onMouseDown?.(e);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isHoliday) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onTouchStart?.(e);
  };

  return (
    <button
      className={cn(
        "focus-visible:border-ring focus-visible:ring-ring/50 flex h-full w-full overflow-hidden px-1 text-left font-medium backdrop-blur-md transition outline-none select-none focus-visible:ring-[3px] data-dragging:cursor-grabbing data-dragging:shadow-lg data-past-event:line-through sm:px-2",
        getEventColorClasses(event.color),
        getBorderRadiusClasses(isFirstDay, isLastDay),
        isHoliday && "cursor-default",
        className
      )}
      data-dragging={isDragging || undefined}
      data-past-event={isEventInPast || undefined}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      {...(isHoliday ? {} : dndListeners)}
      {...(isHoliday ? {} : dndAttributes)}
    >
      {children}
    </button>
  );
}

interface EventItemProps {
  /** イベントデータ */
  event: CalendarEvent;
  /** 表示ビュー（month, week, day, agenda） */
  view: "month" | "week" | "day" | "agenda";
  /** ドラッグ中かどうか */
  isDragging?: boolean;
  /** クリック時のハンドラ */
  onClick?: (e: React.MouseEvent) => void;
  /** 時刻を表示するかどうか */
  showTime?: boolean;
  /** ドラッグ中の仮想的な現在時刻 */
  currentTime?: Date;
  /** マルチデイイベントの最初の日かどうか */
  isFirstDay?: boolean;
  /** マルチデイイベントの最後の日かどうか */
  isLastDay?: boolean;
  /** 子要素（任意の表示内容） */
  children?: React.ReactNode;
  /** 追加クラス */
  className?: string;
  /** DnD のイベントリスナー */
  dndListeners?: SyntheticListenerMap;
  /** DnD の属性 */
  dndAttributes?: DraggableAttributes;
  /** マウス押下時のハンドラ */
  onMouseDown?: (e: React.MouseEvent) => void;
  /** タッチ開始時のハンドラ */
  onTouchStart?: (e: React.TouchEvent) => void;
}

/**
 * EventItem
 * カレンダーの各ビューに応じてイベントの見た目を切り替えて表示するコンポーネント。
 * - month: 1行に簡易表示
 * - week/day: 時間や長さによって1行/2行表示を切替
 * - agenda: 詳細表示（時間・場所・説明など）
 */
export function EventItem({
  event,
  view,
  isDragging,
  onClick,
  showTime,
  currentTime,
  isFirstDay = true,
  isLastDay = true,
  children,
  className,
  dndListeners,
  dndAttributes,
  onMouseDown,
  onTouchStart,
}: EventItemProps) {
  const eventColor = event.color;

  // 表示用開始時間
  const displayStart = useMemo(() => {
    return currentTime || new Date(event.start);
  }, [currentTime, event.start]);

  // 表示用終了時間
  const displayEnd = useMemo(() => {
    return currentTime
      ? new Date(
          new Date(currentTime).getTime() +
            (new Date(event.end).getTime() - new Date(event.start).getTime())
        )
      : new Date(event.end);
  }, [currentTime, event.start, event.end]);

  // イベントの長さ（分単位）
  const durationMinutes = useMemo(() => {
    return differenceInMinutes(displayEnd, displayStart);
  }, [displayStart, displayEnd]);

  // 時刻表示の組み立て
  const getEventTime = () => {
    if (event.allDay) return "終日";
    if (durationMinutes < 45) {
      return formatTimeWithOptionalMinutes(displayStart);
    }
    return `${formatTimeWithOptionalMinutes(
      displayStart
    )} - ${formatTimeWithOptionalMinutes(displayEnd)}`;
  };

  // Monthビュー
  if (view === "month") {
    return (
      <EventWrapper
        event={event}
        isFirstDay={isFirstDay}
        isLastDay={isLastDay}
        isDragging={isDragging}
        onClick={onClick}
        className={cn(
          "mt-[var(--event-gap)] h-[var(--event-height)] items-center text-[10px] sm:text-[13px]",
          className
        )}
        currentTime={currentTime}
        dndListeners={dndListeners}
        dndAttributes={dndAttributes}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      >
        {children || (
          <span className="truncate flex items-center gap-1">
            {isHolidayEvent(event) && (
              <Calendar className="h-3 w-3 shrink-0" />
            )}
            {!event.allDay && (
              <span className="truncate sm:text-xs font-normal opacity-70 uppercase">
                {formatTimeWithOptionalMinutes(displayStart)}{" "}
              </span>
            )}
            <span className="truncate">{event.title}</span>
          </span>
        )}
      </EventWrapper>
    );
  }

  // Week / Dayビュー
  if (view === "week" || view === "day") {
    return (
      <EventWrapper
        event={event}
        isFirstDay={isFirstDay}
        isLastDay={isLastDay}
        isDragging={isDragging}
        onClick={onClick}
        className={cn(
          "py-1",
          durationMinutes < 45 ? "items-center" : "flex-col",
          view === "week" ? "text-[10px] sm:text-[13px]" : "text-[13px]",
          className
        )}
        currentTime={currentTime}
        dndListeners={dndListeners}
        dndAttributes={dndAttributes}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      >
        {durationMinutes < 45 ? (
          <div className="truncate flex items-center gap-1">
            {isHolidayEvent(event) && (
              <Calendar className="h-3 w-3 shrink-0" />
            )}
            <span className="truncate">{event.title}</span>{" "}
            {showTime && (
              <span className="opacity-70">
                {formatTimeWithOptionalMinutes(displayStart)}
              </span>
            )}
          </div>
        ) : (
          <>
            <div className="truncate font-medium flex items-center gap-1">
              {isHolidayEvent(event) && (
                <Calendar className="h-3 w-3 shrink-0" />
              )}
              <span className="truncate">{event.title}</span>
            </div>
            {showTime && (
              <div className="truncate font-normal opacity-70 sm:text-xs uppercase">
                {getEventTime()}
              </div>
            )}
          </>
        )}
      </EventWrapper>
    );
  }

  // Agendaビュー
  const isHoliday = isHolidayEvent(event);

  // 祝日の場合はクリックイベントを無効化
  const handleAgendaClick = (e: React.MouseEvent) => {
    if (isHoliday) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onClick?.(e);
  };

  const handleAgendaMouseDown = (e: React.MouseEvent) => {
    if (isHoliday) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onMouseDown?.(e);
  };

  const handleAgendaTouchStart = (e: React.TouchEvent) => {
    if (isHoliday) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onTouchStart?.(e);
  };

  return (
    <button
      className={cn(
        "focus-visible:border-ring focus-visible:ring-ring/50 flex w-full flex-col gap-1 rounded p-2 text-left transition outline-none focus-visible:ring-[3px] data-past-event:line-through data-past-event:opacity-90",
        getEventColorClasses(eventColor),
        isHoliday && "cursor-default",
        className
      )}
      data-past-event={isPast(new Date(event.end)) || undefined}
      onClick={handleAgendaClick}
      onMouseDown={handleAgendaMouseDown}
      onTouchStart={handleAgendaTouchStart}
      {...(isHoliday ? {} : dndListeners)}
      {...(isHoliday ? {} : dndAttributes)}
    >
      <div className="text-sm font-medium flex items-center gap-1">
        {isHolidayEvent(event) && (
          <Calendar className="h-3 w-3 shrink-0" />
        )}
        <span className="truncate">{event.title}</span>
      </div>
      <div className="text-xs opacity-70">
        {event.allDay ? (
          <span>終日</span>
        ) : (
          <span className="uppercase">
            {formatTimeWithOptionalMinutes(displayStart)} -{" "}
            {formatTimeWithOptionalMinutes(displayEnd)}
          </span>
        )}
        {event.location && (
          <>
            <span className="px-1 opacity-35"> · </span>
            <span>{event.location}</span>
          </>
        )}
      </div>
      {event.description && (
        <div className="my-1 text-xs opacity-90">{event.description}</div>
      )}
    </button>
  );
}
