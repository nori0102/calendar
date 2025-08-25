"use client";

import { useEffect, useState } from "react";
import { useCalendarContext } from "@/contexts/calendar-context";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

/**
 * サイドバー用のミニカレンダー
 *
 * - 共有コンテキスト（`useCalendarContext`）の `currentDate` / `setCurrentDate` を使って
 *   アプリ全体の表示基準日をコントロールする軽量カレンダー。
 * - 月送りは内部状態 `calendarMonth` で保持し、日付選択時に `currentDate` を更新。
 *
 * 主な挙動:
 * - `currentDate` が外部で変更された場合にも `calendarMonth` を追従させて表示を同期。
 * - 日付をクリックすると `setCurrentDate(date)` を呼び出し、メインビューをその日に移動。
 *
 * @param className - ラッパー要素に付与する追加クラス名
 */
interface SidebarCalendarProps {
  className?: string;
}

export default function SidebarCalendar({ className }: SidebarCalendarProps) {
  // 共有カレンダーコンテキストから、表示基準日と更新関数を取得
  const { currentDate, setCurrentDate } = useCalendarContext();

  // カレンダーの表示月（見出し用）。基準日とは独立して月送りできるよう分離。
  const [calendarMonth, setCalendarMonth] = useState<Date>(currentDate);

  // 外部の currentDate が変わったら表示月も同期
  useEffect(() => {
    setCalendarMonth(currentDate);
  }, [currentDate]);

  // 日付選択時のハンドラ（未選択時は何もしない）
  const handleSelect = (date: Date | undefined) => {
    if (date) {
      setCurrentDate(date);
    }
  };

  return (
    <div className={cn("w-full flex justify-center", className)}>
      <Calendar
        mode="single"
        selected={currentDate}
        onSelect={handleSelect}
        month={calendarMonth}
        onMonthChange={setCalendarMonth}
        classNames={{
          day_button:
            "transition-none! hover:not-in-data-selected:bg-sidebar-accent group-[.range-middle]:group-data-selected:bg-sidebar-accent text-sidebar-foreground",
          today: "*:after:transition-none",
          outside: "data-selected:bg-sidebar-accent/50",
        }}
      />
    </div>
  );
}
