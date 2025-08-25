"use client";

import { useEffect, useState } from "react";
import { endOfWeek, isSameDay, isWithinInterval, startOfWeek } from "date-fns";
import { StartHour, EndHour } from "@/components/event-calendar/constants";

/**
 * カレンダーの現在時刻インジケーターの位置と表示状態を管理するカスタムフック
 *
 * @param currentDate - カレンダーで表示している現在の日付
 * @param view - カレンダーの表示形式（"day" | "week"）
 * @returns 現在時刻の位置（パーセンテージ）と表示状態を含むオブジェクト
 *
 * @example
 * ```tsx
 * const { currentTimePosition, currentTimeVisible } = useCurrentTimeIndicator(
 *   new Date(),
 *   "week"
 * );
 *
 * // 現在時刻インジケーターを表示
 * {currentTimeVisible && (
 *   <div
 *     style={{ top: `${currentTimePosition}%` }}
 *     className="current-time-indicator"
 *   />
 * )}
 * ```
 */
export function useCurrentTimeIndicator(
  currentDate: Date,
  view: "day" | "week"
) {
  /** 現在時刻の位置をパーセンテージで表す（0-100） */
  const [currentTimePosition, setCurrentTimePosition] = useState<number>(0);

  /** 現在時刻インジケーターが表示されるべきかどうか */
  const [currentTimeVisible, setCurrentTimeVisible] = useState<boolean>(false);

  useEffect(() => {
    /**
     * 現在時刻の位置と表示状態を計算する関数
     *
     * 計算ロジック：
     * 1. 現在の時刻（時間・分）を取得
     * 2. StartHourからの経過分数を計算
     * 3. 全体の時間スパン（EndHour - StartHour）に対する割合を計算
     * 4. ビュータイプ（day/week）に応じて表示可否を判定
     */
    const calculateTimePosition = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();

      // カレンダーの全体時間スパン（分）
      // = (18 - 8) * 60
      // = 10 * 60
      // = 600分 (8時〜18時の10時間)
      const totalSpanMinutes = (EndHour - StartHour) * 60;

      // StartHourからの経過分数
      // = (13 - 8) * 60 + 30
      // = 5 * 60 + 30
      // = 300 + 30
      // = 330分 (8時から330分経過)
      const totalMinutesFromStart = (hours - StartHour) * 60 + minutes;

      // 位置をパーセンテージで計算（0-100）
      // = (330 / 600) * 100
      // = 0.55 * 100
      // = 55% (カレンダーの上から55%の位置)
      const position = (totalMinutesFromStart / totalSpanMinutes) * 100;

      let isVisible = false;

      if (view === "day") {
        // 日表示：現在日と表示日が同じ場合のみ表示
        isVisible = isSameDay(now, currentDate);
      } else {
        // 週表示：現在日が表示週の範囲内にある場合のみ表示(週の開始曜日は日曜日)
        const start = startOfWeek(currentDate, { weekStartsOn: 0 });
        const end = endOfWeek(currentDate, { weekStartsOn: 0 });
        isVisible = isWithinInterval(now, { start, end });
      }

      setCurrentTimePosition(position);
      setCurrentTimeVisible(isVisible);
    };

    // 初回計算
    calculateTimePosition();

    // 1分ごとに位置を更新
    // 60_000ms = 60秒 = 1分
    const interval = setInterval(calculateTimePosition, 60_000);

    return () => clearInterval(interval);
  }, [currentDate, view]);

  return {
    /** 現在時刻の位置（パーセンテージ、0-100） */
    currentTimePosition,
    /** インジケーターが表示されるべきかどうか */
    currentTimeVisible
  };
}
