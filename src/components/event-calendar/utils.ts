"use client";

import { isSameDay } from "date-fns";

import type { CalendarEvent, EventColor } from "@/components/event-calendar";

/**
 * # 色クラス取得
 * イベントの色（`EventColor`）に応じて Tailwind ユーティリティを返す。
 *
 * @param color - イベントの色。未指定時は `"sky"`。
 * @returns 色とダークモードに対応したクラス文字列
 * @remarks
 * - 返却値は背景・ホバー・文字色・影まで含む一括スタイル。
 * - 未知の色が来た場合も `"sky"` にフォールバック。
 */
export function getEventColorClasses(color?: EventColor | string): string {
  const eventColor = color || "sky";

  switch (eventColor) {
    case "sky":
      return "bg-blue-200/50 hover:bg-blue-200/40 text-blue-900/90 dark:bg-blue-400/25 dark:hover:bg-blue-400/20 dark:text-blue-200 shadow-blue-700/8";
    case "violet":
      return "bg-violet-200/50 hover:bg-violet-200/40 text-violet-900/90 dark:bg-violet-400/25 dark:hover:bg-violet-400/20 dark:text-violet-200 shadow-violet-700/8";
    case "rose":
      return "bg-rose-200/50 hover:bg-rose-200/40 text-rose-900/90 dark:bg-rose-400/25 dark:hover:bg-rose-400/20 dark:text-rose-200 shadow-rose-700/8";
    case "emerald":
      return "bg-emerald-200/50 hover:bg-emerald-200/40 text-emerald-900/90 dark:bg-emerald-400/25 dark:hover:bg-emerald-400/20 dark:text-emerald-200 shadow-emerald-700/8";
    case "orange":
      return "bg-orange-200/50 hover:bg-orange-200/40 text-orange-900/90 dark:bg-orange-400/25 dark:hover:bg-orange-400/20 dark:text-orange-200 shadow-orange-700/8";
    default:
      return "bg-blue-200/50 hover:bg-blue-200/40 text-blue-900/90 dark:bg-blue-400/25 dark:hover:bg-blue-400/20 dark:text-blue-200 shadow-blue-700/8";
  }
}

/**
 * # 角丸クラス取得（マルチデイ表示用）
 * スパンの先頭/末尾/中日かで角丸と幅の補正クラスを返す。
 *
 * @param isFirstDay - スパンの最初の日か
 * @param isLastDay - スパンの最後の日か
 * @returns 角丸と微調整のためのクラス
 * @remarks
 * - `not-in-data-[slot=popover-content]:...` は月ビュー内の幅合わせ用の補正。
 */
export function getBorderRadiusClasses(
  isFirstDay: boolean,
  isLastDay: boolean
): string {
  if (isFirstDay && isLastDay) {
    return "rounded";
  } else if (isFirstDay) {
    return "rounded-l rounded-r-none not-in-data-[slot=popover-content]:w-[calc(100%+5px)]";
  } else if (isLastDay) {
    return "rounded-r rounded-l-none not-in-data-[slot=popover-content]:w-[calc(100%+4px)] not-in-data-[slot=popover-content]:-translate-x-[4px]";
  } else {
    return "rounded-none not-in-data-[slot=popover-content]:w-[calc(100%+9px)] not-in-data-[slot=popover-content]:-translate-x-[4px]";
  }
}

/**
 * # マルチデイ判定
 * イベントが終日または日付をまたぐかどうかを判定。
 *
 * @param event - 対象イベント
 * @returns マルチデイなら `true`
 * @remarks
 * - シンプルに「日付（day）が異なるか」を見る。タイムゾーンの境界を厳密に扱う必要があれば拡張を検討。
 */
export function isMultiDayEvent(event: CalendarEvent): boolean {
  const eventStart = new Date(event.start);
  const eventEnd = new Date(event.end);
  return event.allDay || eventStart.getDate() !== eventEnd.getDate();
}

/**
 * # 指定日の開始イベント一覧
 * その日 **に開始する** イベントのみを抽出して開始時刻順に並べる。
 *
 * @param events - 全イベント
 * @param day - 対象日
 * @returns 指定日に開始するイベント（昇順）
 */
export function getEventsForDay(
  events: CalendarEvent[],
  day: Date
): CalendarEvent[] {
  return events
    .filter((event) => {
      const eventStart = new Date(event.start);
      return isSameDay(day, eventStart);
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

/**
 * # イベントの表示順ソート
 * マルチデイ（終日含む）を先に、その後に開始時刻昇順で並べ替え。
 *
 * @param events - 並べ替え対象
 * @returns 望ましい表示順にソートされた配列
 */
export function sortEvents(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((a, b) => {
    const aIsMultiDay = isMultiDayEvent(a);
    const bIsMultiDay = isMultiDayEvent(b);

    if (aIsMultiDay && !bIsMultiDay) return -1;
    if (!aIsMultiDay && bIsMultiDay) return 1;

    return new Date(a.start).getTime() - new Date(b.start).getTime();
  });
}

/**
 * # 指定日をまたぐ（が、当日開始ではない）イベント
 * いわゆるスパン中日・最終日の表示用に、**その日が中間または終了**となるマルチデイイベントを抽出。
 *
 * @param events - 全イベント
 * @param day - 対象日
 * @returns 当日がスパン途中/終了のイベント
 * @remarks
 * - 当日開始のものは含めない（開始日は `getEventsForDay` 側で扱う前提）。
 */
export function getSpanningEventsForDay(
  events: CalendarEvent[],
  day: Date
): CalendarEvent[] {
  return events.filter((event) => {
    if (!isMultiDayEvent(event)) return false;

    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);

    return (
      !isSameDay(day, eventStart) &&
      (isSameDay(day, eventEnd) || (day > eventStart && day < eventEnd))
    );
  });
}

/**
 * # 指定日に見えるすべてのイベント
 * 当日開始・当日終了・当日がスパン中日のいずれかに該当するイベントを抽出。
 *
 * @param events - 全イベント
 * @param day - 対象日
 * @returns 当日に可視なイベント
 */
export function getAllEventsForDay(
  events: CalendarEvent[],
  day: Date
): CalendarEvent[] {
  return events.filter((event) => {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    return (
      isSameDay(day, eventStart) ||
      isSameDay(day, eventEnd) ||
      (day > eventStart && day < eventEnd)
    );
  });
}

/**
 * # アジェンダ用：指定日の全イベント（開始時刻順）
 * `getAllEventsForDay` と同じ抽出条件で、表示用に昇順ソートしたもの。
 *
 * @param events - 全イベント
 * @param day - 対象日
 * @returns 当日に可視なイベント（開始時刻昇順）
 */
export function getAgendaEventsForDay(
  events: CalendarEvent[],
  day: Date
): CalendarEvent[] {
  return events
    .filter((event) => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      return (
        isSameDay(day, eventStart) ||
        isSameDay(day, eventEnd) ||
        (day > eventStart && day < eventEnd)
      );
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

/**
 * # 日時に時間を加算
 *
 * @param date - 基準日時
 * @param hours - 加算する時間数（負値で減算も可）
 * @returns 加算後の新しい `Date`
 * @example
 * ```ts
 * addHoursToDate(new Date("2025-08-09T09:00:00"), 2) // -> 11:00
 * ```
 */
export function addHoursToDate(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}
