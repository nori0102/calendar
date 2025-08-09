"use client";

import { useEffect, useMemo, useRef } from "react";
import { format, isSameDay } from "date-fns";
import { XIcon } from "lucide-react";

import { EventItem, type CalendarEvent } from "@/components/event-calendar";

interface EventsPopupProps {
  /** 表示する日付 */
  date: Date;
  /** 選択日のイベント一覧 */
  events: CalendarEvent[];
  /** ポップアップの位置（px単位） */
  position: { top: number; left: number };
  /** 閉じる時のコールバック */
  onClose: () => void;
  /** イベント選択時のコールバック */
  onEventSelect: (event: CalendarEvent) => void;
}

/**
 * EventsPopup
 *
 * カレンダーで日付をクリックした時に、
 * その日のイベント一覧を表示するポップアップコンポーネント。
 *
 * 主な機能:
 * - クリック外で閉じる
 * - ESCキーで閉じる
 * - 画面外にはみ出さないように位置を自動調整
 * - イベントクリックで選択＆ポップアップ閉鎖
 */
export function EventsPopup({
  date,
  events,
  position,
  onClose,
  onEventSelect,
}: EventsPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  /**
   * 外側クリックでポップアップを閉じる
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  /**
   * ESCキーでポップアップを閉じる
   */
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscKey);
    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [onClose]);

  /**
   * イベントクリック時の処理
   */
  const handleEventClick = (event: CalendarEvent) => {
    onEventSelect(event);
    onClose();
  };

  /**
   * 表示位置の自動調整
   * - ビューポート外にはみ出す場合は位置を修正
   */
  const adjustedPosition = useMemo(() => {
    const positionCopy = { ...position };

    if (popupRef.current) {
      const rect = popupRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      if (positionCopy.left + rect.width > viewportWidth) {
        positionCopy.left = Math.max(0, viewportWidth - rect.width);
      }
      if (positionCopy.top + rect.height > viewportHeight) {
        positionCopy.top = Math.max(0, viewportHeight - rect.height);
      }
    }

    return positionCopy;
  }, [position]);

  return (
    <div
      ref={popupRef}
      className="bg-background absolute z-50 max-h-96 w-80 overflow-auto rounded-md border shadow-lg"
      style={{
        top: `${adjustedPosition.top}px`,
        left: `${adjustedPosition.left}px`,
      }}
    >
      {/* ヘッダー部分（日付と閉じるボタン） */}
      <div className="bg-background sticky top-0 flex items-center justify-between border-b p-3">
        <h3 className="font-medium">{format(date, "d MMMM yyyy")}</h3>
        <button
          onClick={onClose}
          className="hover:bg-muted rounded-full p-1"
          aria-label="Close"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>

      {/* イベントリスト */}
      <div className="space-y-2 p-3">
        {events.length === 0 ? (
          <div className="text-muted-foreground py-2 text-sm">No events</div>
        ) : (
          events.map((event) => {
            const eventStart = new Date(event.start);
            const eventEnd = new Date(event.end);
            const isFirstDay = isSameDay(date, eventStart);
            const isLastDay = isSameDay(date, eventEnd);

            return (
              <div
                key={event.id}
                className="cursor-pointer"
                onClick={() => handleEventClick(event)}
              >
                <EventItem
                  event={event}
                  view="agenda"
                  isFirstDay={isFirstDay}
                  isLastDay={isLastDay}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
