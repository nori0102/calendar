import { CalendarEvent } from "@/components/event-calendar";
import {
  LazyEventDialog as EventDialog,
  LazyAISuggestionDialog as AISuggestionDialog,
  LazyEventCreationChoiceDialog as EventCreationChoiceDialog
} from "@/components/event-calendar/lazy-components";

/**
 * AI提案で選択された提案の情報を表す型
 */
interface SuggestionData {
  /** イベントタイトル */
  title: string;
  /** イベントの詳細説明 */
  description: string;
  /** イベントの開催場所 */
  location: string;
}

/**
 * 時間情報を表す型
 */
interface TimeInfo {
  /** 開始時刻（HH:MM形式） */
  startTime: string;
  /** 終了時刻（HH:MM形式） */
  endTime: string;
}

/**
 * カレンダーダイアログコンポーネントのProps型定義
 */
interface CalendarDialogsProps {
  // === イベント作成選択ダイアログ関連 ===
  /** イベント作成選択ダイアログの表示状態 */
  isChoiceDialogOpen: boolean;
  /** 選択された日時（null の場合は現在時刻を使用） */
  selectedDateTime: Date | null;
  /** イベント作成選択ダイアログを閉じる時のコールバック */
  onChoiceDialogClose: () => void;
  /** 手動作成が選択された時のコールバック */
  onManualCreate: () => void;
  /** AI作成が選択された時のコールバック */
  onAICreate: () => void;

  // === AI提案ダイアログ関連 ===
  /** AI提案ダイアログの表示状態 */
  isAISuggestionOpen: boolean;
  /** AI提案ダイアログを閉じる時のコールバック */
  onAISuggestionClose: () => void;
  /** AI提案が選択された時のコールバック */
  onSuggestionSelect: (
    suggestion: SuggestionData,
    timeInfo: TimeInfo
  ) => void;
  /** AI提案ダイアログから手動作成に切り替える時のコールバック */
  onAIToManualCreate: () => void;

  // === イベント編集ダイアログ関連 ===
  /** イベント編集ダイアログの表示状態 */
  isEventDialogOpen: boolean;
  /** 編集対象のイベント（新規作成時はnull） */
  selectedEvent: CalendarEvent | null;
  /** イベント編集ダイアログを閉じる時のコールバック */
  onEventDialogClose: () => void;
  /** イベント保存時のコールバック */
  onEventSave: (event: CalendarEvent) => void;
  /** イベント削除時のコールバック */
  onEventDelete: (eventId: string) => void;
}

/**
 * カレンダー関連のダイアログをまとめて管理するコンテナコンポーネント
 *
 * カレンダーアプリケーションで使用される3つの主要ダイアログを統合管理します：
 * 1. EventCreationChoiceDialog - 手動作成 vs AI作成の選択
 * 2. AISuggestionDialog - AI によるイベント提案
 * 3. EventDialog - イベントの詳細表示・編集・削除
 *
 * 遅延読み込み（Lazy Loading）を使用してパフォーマンスを最適化し、
 * 各ダイアログ間の状態管理とフローの連携を担当します。
 *
 * @param props - コンポーネントのプロパティ
 *
 * @example
 * ```tsx
 * const CalendarApp = () => {
 *   // ダイアログの状態管理
 *   const [isChoiceDialogOpen, setIsChoiceDialogOpen] = useState(false);
 *   const [isAISuggestionOpen, setIsAISuggestionOpen] = useState(false);
 *   const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
 *   const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null);
 *   const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
 *
 *   // イベント作成の流れ
 *   const handleCellClick = (date: Date) => {
 *     setSelectedDateTime(date);
 *     setIsChoiceDialogOpen(true); // 選択ダイアログを表示
 *   };
 *
 *   const handleAICreate = () => {
 *     setIsChoiceDialogOpen(false);
 *     setIsAISuggestionOpen(true); // AI提案ダイアログを表示
 *   };
 *
 *   const handleSuggestionSelect = (suggestion, timeInfo) => {
 *     setIsAISuggestionOpen(false);
 *     // 提案からイベントを作成
 *     const newEvent = createEventFromSuggestion(suggestion, timeInfo);
 *     setSelectedEvent(newEvent);
 *     setIsEventDialogOpen(true); // イベント編集ダイアログを表示
 *   };
 *
 *   return (
 *     <>
 *       <Calendar onCellClick={handleCellClick} />
 *
 *       <CalendarDialogs
 *         // 選択ダイアログ
 *         isChoiceDialogOpen={isChoiceDialogOpen}
 *         selectedDateTime={selectedDateTime}
 *         onChoiceDialogClose={() => setIsChoiceDialogOpen(false)}
 *         onManualCreate={() => {
 *           setIsChoiceDialogOpen(false);
 *           setIsEventDialogOpen(true);
 *         }}
 *         onAICreate={handleAICreate}
 *
 *         // AI提案ダイアログ
 *         isAISuggestionOpen={isAISuggestionOpen}
 *         onAISuggestionClose={() => setIsAISuggestionOpen(false)}
 *         onSuggestionSelect={handleSuggestionSelect}
 *         onAIToManualCreate={() => {
 *           setIsAISuggestionOpen(false);
 *           setIsEventDialogOpen(true);
 *         }}
 *
 *         // イベント編集ダイアログ
 *         isEventDialogOpen={isEventDialogOpen}
 *         selectedEvent={selectedEvent}
 *         onEventDialogClose={() => setIsEventDialogOpen(false)}
 *         onEventSave={(event) => {
 *           saveEvent(event);
 *           setIsEventDialogOpen(false);
 *         }}
 *         onEventDelete={(eventId) => {
 *           deleteEvent(eventId);
 *           setIsEventDialogOpen(false);
 *         }}
 *       />
 *     </>
 *   );
 * };
 * ```
 *
 * @example
 * ダイアログフローの例：
 * ```
 * ユーザーがカレンダーセルをクリック
 *           ↓
 * EventCreationChoiceDialog を表示
 *           ↓
 * 「AI作成」を選択
 *           ↓
 * AISuggestionDialog を表示
 *           ↓
 * 提案を選択
 *           ↓
 * EventDialog を表示（提案内容で初期化）
 *           ↓
 * 保存してイベント作成完了
 * ```
 *
 * @remarks
 * - 遅延読み込み（Lazy Loading）により、初期バンドルサイズを削減
 * - selectedDateTime が null の場合は自動的に現在時刻を使用
 * - 各ダイアログは独立して動作し、Props drilling を最小化
 * - エラーハンドリングは各子コンポーネントで個別に実装
 *
 * @see {@link LazyEventDialog} - イベント編集ダイアログ
 * @see {@link LazyAISuggestionDialog} - AI提案ダイアログ
 * @see {@link LazyEventCreationChoiceDialog} - 作成方法選択ダイアログ
 */
export function CalendarDialogs({
  isChoiceDialogOpen,
  selectedDateTime,
  onChoiceDialogClose,
  onManualCreate,
  onAICreate,
  isAISuggestionOpen,
  onAISuggestionClose,
  onSuggestionSelect,
  onAIToManualCreate,
  isEventDialogOpen,
  selectedEvent,
  onEventDialogClose,
  onEventSave,
  onEventDelete,
}: CalendarDialogsProps) {
  return (
    <>
      {/* イベント作成方法選択ダイアログ */}
      {/* 手動作成 or AI作成の選択肢を提供 */}
      <EventCreationChoiceDialog
        isOpen={isChoiceDialogOpen}
        selectedDate={selectedDateTime || new Date()}
        selectedTime={selectedDateTime || undefined}
        onClose={onChoiceDialogClose}
        onManualCreate={onManualCreate}
        onAICreate={onAICreate}
      />

      {/* AI提案ダイアログ */}
      {/* 時間・場所などの条件を設定してAI提案を取得・選択 */}
      <AISuggestionDialog
        isOpen={isAISuggestionOpen}
        selectedDate={selectedDateTime || new Date()}
        selectedTime={selectedDateTime || undefined}
        onClose={onAISuggestionClose}
        onSuggestionSelect={onSuggestionSelect}
        onManualCreate={onAIToManualCreate}
      />

      {/* イベント詳細・編集ダイアログ */}
      {/* イベントの作成・編集・削除を行う */}
      <EventDialog
        event={selectedEvent}
        isOpen={isEventDialogOpen}
        onClose={onEventDialogClose}
        onSave={onEventSave}
        onDelete={onEventDelete}
      />
    </>
  );
}
