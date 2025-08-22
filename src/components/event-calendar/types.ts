export type CalendarView = "month" | "week" | "day" | "agenda";

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  color?: EventColor;
  label?: string;
  location?: string;
}

export type EventColor = "blue" | "orange" | "violet" | "rose" | "emerald";

export interface EventCalendarProps {
  /** 描画対象のイベント配列 */
  events?: CalendarEvent[];
  /** 追加（作成ダイアログの保存時 or 直接作成） */
  onEventAdd?: (event: CalendarEvent) => void;
  /** 更新（編集ダイアログ保存 or DnD での移動） */
  onEventUpdate?: (event: CalendarEvent) => void;
  /** 削除（編集ダイアログから） */
  onEventDelete?: (eventId: string) => void;
  /** ルート要素に付与する追加クラス */
  className?: string;
  /** 初期表示ビュー（既定: "month"） */
  initialView?: CalendarView;
}
