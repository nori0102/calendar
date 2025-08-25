/**
 * カレンダーの表示モード
 */
export type CalendarView = "month" | "week" | "day" | "agenda";

/**
 * カレンダーイベントの型定義
 */
export interface CalendarEvent {
  /** イベントの一意識別子 */
  id: string;
  /** イベントのタイトル */
  title: string;
  /** イベントの詳細説明（オプション） */
  description?: string;
  /** イベントの開始日時 */
  start: Date;
  /** イベントの終了日時 */
  end: Date;
  /** 終日イベントかどうか（オプション） */
  allDay?: boolean;
  /** イベントの表示色（オプション） */
  color?: EventColor;
  /** イベントのラベル（オプション） */
  label?: string;
  /** イベントの開催場所（オプション） */
  location?: string;
}

/**
 * イベントの表示色の種類
 */
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
