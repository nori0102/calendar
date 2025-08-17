"use client";

import { useMemo } from "react";
import { RiCalendarEventLine } from "@remixicon/react";
import { addDays, format, isToday } from "date-fns";
import { ja } from "date-fns/locale";

import {
  AgendaDaysToShow,
  CalendarEvent,
  EventItem,
  getAgendaEventsForDay,
} from "@/components/event-calendar";

interface AgendaViewProps {
  /**
   * アジェンダの起点となる日付。
   * この日付を含む「連続 N 日分（`AgendaDaysToShow`）」のイベントを表示します。
   */
  currentDate: Date;
  /** 表示対象となる全イベント配列 */
  events: CalendarEvent[];
  /** ユーザーがイベントをクリックしたときのハンドラ */
  onEventSelect: (event: CalendarEvent) => void;
}

/**
 * リスト形式（アジェンダ）のカレンダー表示コンポーネント。
 *
 * - `currentDate` を先頭として `AgendaDaysToShow` 日分を表示します。
 * - 各日について `getAgendaEventsForDay` で該当イベントを抽出し、`EventItem` で描画します。
 * - 対象期間にイベントが 1 件もなければ空状態（アイコン＋メッセージ）を表示します。
 *
 * @remarks
 * - 日付ラベルは `date-fns/format` の `"M月d日 EEEE"` を使用しています（例: `8月5日 火曜日`）。
 *   ローカライズが必要なら `format` に `locale` を渡すか、アプリ全体の i18n 設計に合わせて調整してください。
 * - `key` には `toDateString()` を使用し、タイムゾーンによる揺らぎを減らしています。
 * - 期間計算は単純に `currentDate + i 日` で行っています。週区切り等の要件があればここをカスタマイズしてください。
 *
 * @example
 * ```tsx
 * <AgendaView
 *   currentDate={new Date()}
 *   events={allEvents}
 *   onEventSelect={(evt) => setSelectedEvent(evt)}
 * />
 * ```
 */
export function AgendaView({
  currentDate,
  events,
  onEventSelect,
}: AgendaViewProps) {
  // 表示対象となる連続日付（currentDate から AgendaDaysToShow 日ぶん）
  const days = useMemo(() => {
    // デバッグ用ログ（必要に応じて削除可）
    console.log("Agenda view updating with date:", currentDate.toISOString());
    return Array.from({ length: AgendaDaysToShow }, (_, i) =>
      addDays(new Date(currentDate), i)
    );
  }, [currentDate]);

  // イベントクリック時：親へ通知しつつ、セルのクリック等へバブルしない
  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Agenda view event clicked:", event);
    onEventSelect(event);
  };

  // 対象期間に一つでもイベントがあるか
  const hasEvents = days.some(
    (day) => getAgendaEventsForDay(events, day).length > 0
  );

  return (
    <div className="border-border/70 border-t ps-4">
      {!hasEvents ? (
        <div
          className="flex min-h-[70svh] flex-col items-center justify-center py-16 text-center"
          role="status"
          aria-live="polite"
        >
          <RiCalendarEventLine
            size={32}
            className="text-muted-foreground/50 mb-2"
            aria-hidden
          />
          <h3 className="text-lg font-medium">イベントが見つかりません</h3>
          <p className="text-muted-foreground">
            この期間にはスケジュールされたイベントがありません。
          </p>
        </div>
      ) : (
        days.map((day) => {
          const dayEvents = getAgendaEventsForDay(events, day);
          if (dayEvents.length === 0) return null;

          return (
            <div
              key={day.toDateString()}
              className="border-border/70 relative my-12 border-t"
            >
              <span
                className="bg-background absolute -top-3 left-0 flex h-6 items-center pe-4 text-[10px] uppercase data-today:font-medium sm:pe-4 sm:text-xs"
                data-today={isToday(day) || undefined}
              >
                {format(day, "M月d日 EEEE", { locale: ja })}
              </span>
              <div className="mt-6 space-y-2">
                {dayEvents.map((event) => (
                  <EventItem
                    key={event.id}
                    event={event}
                    view="agenda"
                    onClick={(e) => handleEventClick(event, e)}
                  />
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
