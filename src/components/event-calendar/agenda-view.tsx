"use client";

import { useMemo } from "react";
import { RiCalendarEventLine } from "@remixicon/react";
import { addDays, format, isToday } from "date-fns";
import { ja } from "date-fns/locale";
import { motion } from "framer-motion";

import {
  AgendaDaysToShow,
  CalendarEvent,
  EventItem,
  getAgendaEventsForDay,
} from "@/components/event-calendar";

/**
 * アジェンダビューコンポーネントのProps型定義
 */
interface AgendaViewProps {
  /** 表示の起点となる日付 */
  currentDate: Date;
  /** 表示するイベントの配列 */
  events: CalendarEvent[];
  /** イベントが選択された時のコールバック関数 */
  onEventSelect: (event: CalendarEvent) => void;
}

/**
 * カレンダーのアジェンダ（リスト）表示を行うコンポーネント
 *
 * 指定された日付から一定期間のイベントを日付順にリスト表示します。
 * イベントがない期間は表示されず、イベントが全くない場合は
 * 「イベントが見つかりません」というメッセージを表示します。
 *
 * @param props - コンポーネントのプロパティ
 * @param props.currentDate - 表示開始日（この日を起点にAgendaDaysToShow日数分表示）
 * @param props.events - 表示対象のイベント配列
 * @param props.onEventSelect - イベントクリック時のコールバック関数
 *
 * @example
 * ```tsx
 * const handleEventSelect = (event: CalendarEvent) => {
 *   console.log('選択されたイベント:', event.title);
 * };
 *
 * <AgendaView
 *   currentDate={new Date('2025-08-25')}
 *   events={eventList}
 *   onEventSelect={handleEventSelect}
 * />
 * ```
 *
 * @example
 * 表示例：
 * ```
 * 8月25日 月曜日
 * ├── 午前10:00 - 会議A
 * └── 午後2:00 - 打ち合わせ
 *
 * 8月27日 水曜日
 * └── 午前9:00 - プレゼンテーション
 * ```
 */
export function AgendaView({
  currentDate,
  events,
  onEventSelect,
}: AgendaViewProps) {
  /**
   * 表示対象の日付配列を生成
   *
   * currentDateから連続するAgendaDaysToShow日数分の日付を作成
   *
   * 依存配列にcurrentDateを指定することで、起点日が変更された時のみ再計算される
   */
  const days = useMemo(() => {
    // console.log("アジェンダビュー更新:", currentDate.toISOString());

    return Array.from({ length: AgendaDaysToShow }, (_, i) =>
      addDays(new Date(currentDate), i)
    );
  }, [currentDate]);

  /**
   * イベントクリック時のハンドラー
   * イベントバブリングを停止し、親コンポーネントのコールバックを実行
   *
   * @param event - クリックされたイベント
   * @param e - Reactのマウスイベント
   */
  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation(); // 親要素へのイベント伝播を停止
    console.log("アジェンダビューでイベントがクリックされました:", event);
    onEventSelect(event);
  };

  /**
   * 表示期間内にイベントが存在するかをチェック
   * 全ての日について、その日にイベントがあるかを確認し、
   * 1つでもイベントがある場合はtrueを返す
   */
  const hasEvents = days.some(
    (day) => getAgendaEventsForDay(events, day).length > 0
  );

  return (
    <motion.div 
      className="px-4 sm:px-6 lg:px-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {!hasEvents ? (
        /* イベントが存在しない場合の空状態表示 */
        <div
          className="flex min-h-[70svh] flex-col items-center justify-center "
          role="status"
          aria-live="polite"
        >
          <RiCalendarEventLine
            size={32}
            className="text-muted-foreground/50 mb-2"
            aria-hidden
          />
          <h3 className="text-xl  font-bold mb-1">イベントが見つかりません</h3>
          <p className="text-muted-foreground">
            この期間にはスケジュールされたイベントがありません。
          </p>
        </div>
      ) : (
        /* イベントが存在する場合の日付別リスト表示 */
        days.map((day) => {
          /**
           * 特定の日のイベントを取得
           * イベントがない日は表示をスキップ
           */
          const dayEvents = getAgendaEventsForDay(events, day);
          if (dayEvents.length === 0) return null;

          return (
            <div
              key={day.toDateString()}
              className="border-border/70 relative my-12 border-t"
            >
              {/* 日付ヘッダー（例: 8月25日 月曜日） */}
              <span
                className={`bg-background absolute -top-3 left-0 flex h-6 items-center  sm:pe-4 sm:text-xs ${
                  isToday(day) ? "text-primary font-semibold" : ""
                }`}
                data-today={isToday(day) || undefined}
              >
                {format(day, "M月d日 EEEE", { locale: ja })}
              </span>

              {/* その日のイベント一覧 */}
              <div className="mt-6 space-y-2">
                {dayEvents.map((event, index) => (
                  <motion.div
                    key={`${event.id}-agenda-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 25,
                      delay: index * 0.05
                    }}
                  >
                    <EventItem
                      event={event}
                      view="agenda"
                      onClick={(e) => handleEventClick(event, e)}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </motion.div>
  );
}
