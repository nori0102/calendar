"use client";

import { useEffect, useState } from "react";
import { endOfWeek, isSameDay, isWithinInterval, startOfWeek } from "date-fns";
import { StartHour, EndHour } from "@/components/event-calendar/constants";

/**
 * 現在時刻インジケーター（いまの時間を示す横ライン等）の
 * 「縦位置（%）」と「表示可否」を計算して返すカスタムフック。
 *
 * - `StartHour` と `EndHour`（例: 7〜24時）で定義された“表示時間帯”の中で、
 *   現在時刻がどの位置にあるか（0〜100%）を算出します。
 * - `view` が `"day"` のときは `currentDate` と「今日」が同じ日の場合のみ可視。
 * - `view` が `"week"` のときは `currentDate` を含む週に「今日」が含まれていれば可視。
 * - 値は1分ごとに更新されます。
 *
 * @remarks
 * - 週の開始曜日は `weekStartsOn: 0`（日曜始まり）で判定しています。
 *   月曜始まりにしたい場合は `weekStartsOn: 1` に変更してください。
 * - インジケーターの描画は本フックの返り値をもとにUI側で行ってください
 *   （例：絶対配置のライン要素に `top: ${currentTimePosition}%` を適用）。
 * - 現在時刻が `StartHour` 未満または `EndHour` を超える場合は、
 *   `currentTimePosition` が 0%未満/100%超になる可能性があります。
 *   必要に応じてUI側でクリップしてください。
 *
 * @param currentDate - カレンダーで「いま表示している」基準日
 * @param view - 表示モード（`"day"` | `"week"`）
 *
 * @returns オブジェクト
 * - `currentTimePosition`：現在時刻インジケーターの縦位置（0〜100の数値、単位は%）
 * - `currentTimeVisible`：インジケーターを表示すべきかどうかのフラグ
 */
export function useCurrentTimeIndicator(
  currentDate: Date,
  view: "day" | "week"
) {
  const [currentTimePosition, setCurrentTimePosition] = useState<number>(0);
  const [currentTimeVisible, setCurrentTimeVisible] = useState<boolean>(false);

  useEffect(() => {
    const calculateTimePosition = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();

      // 表示時間帯（StartHour〜EndHour）の総分数
      const totalSpanMinutes = (EndHour - StartHour) * 60;

      // StartHour基準で現在時刻が何分経過したか
      const totalMinutesFromStart = (hours - StartHour) * 60 + minutes;

      // 0〜100% に正規化（UI側でクリップする想定）
      const position = (totalMinutesFromStart / totalSpanMinutes) * 100;

      // ビューごとの表示判定
      let isVisible = false;

      if (view === "day") {
        isVisible = isSameDay(now, currentDate);
      } else {
        const start = startOfWeek(currentDate, { weekStartsOn: 0 });
        const end = endOfWeek(currentDate, { weekStartsOn: 0 });
        isVisible = isWithinInterval(now, { start, end });
      }

      setCurrentTimePosition(position);
      setCurrentTimeVisible(isVisible);
    };

    // 初期計算
    calculateTimePosition();

    // 毎分更新
    const interval = setInterval(calculateTimePosition, 60_000);
    return () => clearInterval(interval);
  }, [currentDate, view]);

  return { currentTimePosition, currentTimeVisible };
}
