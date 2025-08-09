/**
 * Calendar Component Entry Point
 *
 * ここでは event-calendar 配下のコンポーネント/フック/ユーティリティ/型を集約エクスポートします。
 * - このファイル自体はクライアント指定しません（"use client" なし）。
 * - クライアントが必要な各コンポーネントは **各ファイル側** に "use client" を置いてください。
 */

// Component exports
export { AgendaView } from "./agenda-view";
export { DayView } from "./day-view";
export { DraggableEvent } from "./draggable-event";
export { DroppableCell } from "./droppable-cell";
export { EventDialog } from "./event-dialog";
export { EventItem } from "./event-item";
export { EventsPopup } from "./events-popup";
export { EventCalendar } from "./event-calendar";
export { MonthView } from "./month-view";
export { WeekView } from "./week-view";
export { CalendarDndProvider, useCalendarDnd } from "./calendar-dnd-context";

// Constants and utilities
export * from "./constants";
export * from "./utils";

// Hooks
export * from "./hooks/use-current-time-indicator";
export * from "./hooks/use-event-visibility";

// Types
export type { CalendarEvent, CalendarView, EventColor } from "./types";
