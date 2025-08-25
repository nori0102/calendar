"use client";

import { useState } from "react";
import { useCalendarContext } from "@/contexts/calendar-context";
import { CalendarDndProvider, CalendarView } from "@/components/event-calendar";
import { CalendarHeader } from "@/components/event-calendar/calendar-header";
import { CalendarViews } from "@/components/event-calendar/calendar-views";
import { CalendarDialogs } from "@/components/event-calendar/calendar-dialogs";
import { useEventHandlers } from "@/hooks/calendar/use-event-handlers";
import { useNavigation } from "@/hooks/calendar/use-navigation";
import { useKeyboardShortcuts } from "@/hooks/calendar/use-keyboard-shortcuts";
import { getViewTitle } from "@/components/event-calendar/utils/view-title";
import { CALENDAR_CSS_VARIABLES } from "@/components/event-calendar/constants";
import { EventCalendarProps } from "@/types/calendar";
import { useLocalStorage } from "@/hooks/use-local-storage";

/**
 * カレンダー UI のルートコンポーネント。
 * 月/週/日/アジェンダの各ビューを切り替え、イベントの追加・更新・削除をハンドリングします。
 *
 * - **ビュー切替**: ヘッダーのドロップダウンまたはキーボード（M/W/D/A）。
 * - **ナビゲーション**: 前/次/今日 ボタンで基準日を移動。
 * - **作成**: 空き枠クリックまたは「新しいイベント」から作成ダイアログを開く（5分刻みにスナップ）。
 * - **編集**: イベントクリックで編集ダイアログ、DnD で時間/日付移動（`CalendarDndProvider` 経由）。
 * - **通知**: 追加/更新/削除/移動時に `sonner` でトースト表示。
 *
 * @remarks
 * - 日付状態は共有の {@link useCalendarContext} を利用（親で `CalendarProvider` が必要）。
 * - DnD の処理は {@link CalendarDndProvider} 内で完結。ドロップ時は `onEventUpdate` が呼ばれます。
 * - ビュー別のヘッダタイトル（`viewTitle`）は `date-fns` で整形。ローカライズが必要なら `format` に `locale` を渡してください。
 * - スタイルは CSS 変数 `--event-height` / `--event-gap` / `--week-cells-height` をルート要素に設定し、子コンポーネントで参照します。
 *
 * @keyboard
 * - `M` = 月, `W` = 週, `D` = 日, `A` = 予定（入力中やダイアログ表示中は無効）
 */

export function EventCalendar({
  events = [],
  onEventAdd,
  onEventUpdate,
  onEventDelete,
  className,
  initialView = "month",
}: EventCalendarProps) {
  const { currentDate, setCurrentDate } = useCalendarContext();
  const [view, setView] = useLocalStorage<CalendarView>("calendar-view", initialView);

  const {
    isEventDialogOpen,
    selectedEvent,
    isChoiceDialogOpen,
    isAISuggestionOpen,
    selectedDateTime,
    handleEventSelect,
    handleEventCreate,
    handleManualCreate,
    handleAICreate,
    handleChoiceDialogClose,
    handleAISuggestionClose,
    handleAIToManualCreate,
    handleSuggestionSelect,
    handleEventSave,
    handleEventDelete,
    handleEventUpdate,
    handleNewEventClick,
    setIsEventDialogOpen,
    setSelectedEvent,
  } = useEventHandlers({ events, onEventAdd, onEventUpdate, onEventDelete });

  const { handlePrevious, handleNext, handleToday } = useNavigation({
    currentDate,
    setCurrentDate,
    view,
  });

  const viewTitle = getViewTitle(currentDate, view);

  useKeyboardShortcuts({
    isEventDialogOpen,
    isChoiceDialogOpen,
    isAISuggestionOpen,
    setView,
  });


  return (
    <div
      className="flex has-data-[slot=month-view]:flex-1 flex-col rounded-lg"
      style={CALENDAR_CSS_VARIABLES}
    >
      {/* DnD（ドラッグ＆ドロップ）の提供範囲を定義 */}
      <CalendarDndProvider onEventUpdate={handleEventUpdate}>
        <CalendarHeader
          viewTitle={viewTitle}
          view={view}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onToday={handleToday}
          onViewChange={setView}
          onNewEvent={handleNewEventClick}
          className={className}
        />

        <CalendarViews
          view={view}
          currentDate={currentDate}
          events={events}
          onEventSelect={handleEventSelect}
          onEventCreate={handleEventCreate}
        />

        <CalendarDialogs
          isChoiceDialogOpen={isChoiceDialogOpen}
          selectedDateTime={selectedDateTime}
          onChoiceDialogClose={handleChoiceDialogClose}
          onManualCreate={handleManualCreate}
          onAICreate={handleAICreate}
          isAISuggestionOpen={isAISuggestionOpen}
          onAISuggestionClose={handleAISuggestionClose}
          onSuggestionSelect={handleSuggestionSelect}
          onAIToManualCreate={handleAIToManualCreate}
          isEventDialogOpen={isEventDialogOpen}
          selectedEvent={selectedEvent}
          onEventDialogClose={() => {
            setIsEventDialogOpen(false);
            setSelectedEvent(null);
          }}
          onEventSave={handleEventSave}
          onEventDelete={handleEventDelete}
        />
      </CalendarDndProvider>
    </div>
  );
}
