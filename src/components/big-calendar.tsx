"use client";

import { useMemo } from "react";
import { useCalendarContext } from "@/contexts/calendar-context";
import { useHolidays } from "@/hooks/use-holidays";
import { useLocalStorage } from "@/hooks/use-local-storage";

import {
  EventCalendar,
  type CalendarEvent,
  type EventColor,
} from "@/components/event-calendar";

/**
 * カレンダーの「色カテゴリ」データ
 * - id: 識別子
 * - name: 表示名
 * - color: イベントカラー（UIテーマで定義済みの EventColor 型）
 * - isActive: デフォルトで表示するかどうか
 */
export const etiquettes = [
  {
    id: "my-events",
    name: "個人的なイベント",
    color: "emerald" as EventColor,
    isActive: true,
  },
  {
    id: "marketing-team",
    name: "マーケティング",
    color: "orange" as EventColor,
    isActive: true,
  },
  {
    id: "interviews",
    name: "面接",
    color: "violet" as EventColor,
    isActive: true,
  },
  {
    id: "events-planning",
    name: "イベント企画",
    color: "blue" as EventColor,
    isActive: true,
  },
  {
    id: "japanese-holidays",
    name: "日本の祝日",
    color: "rose" as EventColor,
    isActive: true,
  },
];


const sampleEvents: CalendarEvent[] = [];

/**
 * カレンダー表示コンポーネント
 * - イベント追加 / 更新 / 削除のハンドラを内部に持つ
 * - カラーの表示/非表示は `useCalendarContext` の状態に依存
 */
export default function Component() {
  const [events, setEvents] = useLocalStorage<CalendarEvent[]>("calendar-events", sampleEvents);
  const { isColorVisible } = useCalendarContext();
  const { holidays } = useHolidays();

  /**
   * 祝日をCalendarEventに変換
   */
  const holidayEvents: CalendarEvent[] = useMemo(() => {
    return holidays.map((holiday) => ({
      id: `holiday-${holiday.date}`,
      title: holiday.name,
      description: `日本の祝日: ${holiday.name}`,
      start: holiday.dateObject,
      end: holiday.dateObject,
      allDay: true,
      color: "rose" as EventColor,
      location: undefined,
    }));
  }, [holidays]);

  /**
   * 全イベント（サンプル + 祝日）
   */
  const allEvents = useMemo(() => {
    return [...events, ...holidayEvents];
  }, [events, holidayEvents]);

  /**
   * 現在表示すべきイベント（色フィルタ適用後）
   */
  const visibleEvents = useMemo(() => {
    return allEvents.filter((event) => isColorVisible(event.color));
  }, [allEvents, isColorVisible]);

  /**
   * 新規イベント追加
   */
  const handleEventAdd = (event: CalendarEvent) => {
    setEvents(prev => [...prev, event]);
  };

  /**
   * イベント更新
   */
  const handleEventUpdate = (updatedEvent: CalendarEvent) => {
    setEvents(prev =>
      prev.map((event) =>
        event.id === updatedEvent.id ? updatedEvent : event
      )
    );
  };

  /**
   * イベント削除（祝日は削除不可）
   */
  const handleEventDelete = (eventId: string) => {
    // 祝日の削除を防ぐ
    if (eventId.startsWith('holiday-')) {
      console.warn('祝日は削除できません');
      return;
    }
    setEvents(prev => prev.filter((event) => event.id !== eventId));
  };

  return (
    <EventCalendar
      events={visibleEvents}
      onEventAdd={handleEventAdd}
      onEventUpdate={handleEventUpdate}
      onEventDelete={handleEventDelete}
      initialView="week" // 初期表示は週ビュー
    />
  );
}
