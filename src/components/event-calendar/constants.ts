/** イベントの高さ (px) */
export const EventHeight = 24;

/** イベント間の縦方向のギャップ (px) - 月表示での間隔を制御 */
export const EventGap = 4;

/** 週・日表示での時間セルの高さ (px) - 時間表示のスケールを制御 */
export const WeekCellsHeight = 72;

/** アジェンダビューで表示する日数 */
export const AgendaDaysToShow = 30;

/** 週・日表示の開始時間 (0時開始) */
export const StartHour = 0;

/** 週・日表示の終了時間 (24時終了) */
export const EndHour = 24;

/** デフォルトの開始時間 月表示時(9時) */
export const DefaultStartHour = 9;

/** デフォルトの終了時間 月表示時(10時) */
export const DefaultEndHour = 10;

/** カレンダーのスタイリング用CSS変数 */
export const CALENDAR_CSS_VARIABLES = {
  "--event-height": `${EventHeight}px`,
  "--event-gap": `${EventGap}px`,
  "--week-cells-height": `${WeekCellsHeight}px`,
} as React.CSSProperties;
