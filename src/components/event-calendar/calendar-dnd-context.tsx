"use client";

import {
  createContext,
  useContext,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { addMinutes, differenceInMinutes } from "date-fns";

import { EventItem, type CalendarEvent } from "@/components/event-calendar";

/**
 * DnD 中に共有する状態の型。
 *
 * @remarks
 * - `activeEvent` はドラッグ対象のイベントオブジェクト
 * - `activeView` はドラッグ開始時のビュー（"month" | "week" | "day"）
 * - `currentTime` はドラッグ中の仮の開始日時（スナップ後）
 * - `eventHeight` / `multiDayWidth` は DragOverlay の見た目調整用
 * - `dragHandlePosition` はマルチデイの始端/終端ハンドル等の補助情報
 */
type CalendarDndContextType = {
  activeEvent: CalendarEvent | null;
  activeId: UniqueIdentifier | null;
  activeView: "month" | "week" | "day" | null;
  currentTime: Date | null;
  eventHeight: number | null;
  isMultiDay: boolean;
  multiDayWidth: number | null;
  dragHandlePosition: {
    x?: number;
    y?: number;
    data?: {
      isFirstDay?: boolean;
      isLastDay?: boolean;
    };
  } | null;
};

/**
 * DnD 状態共有用の React コンテキスト。
 * {@link useCalendarDnd} で取得してください。
 */
const CalendarDndContext = createContext<CalendarDndContextType>({
  activeEvent: null,
  activeId: null,
  activeView: null,
  currentTime: null,
  eventHeight: null,
  isMultiDay: false,
  multiDayWidth: null,
  dragHandlePosition: null,
});

/**
 * カレンダー用 DnD 状態を参照するフック。
 *
 * @example
 * ```tsx
 * const { activeEvent, currentTime } = useCalendarDnd();
 * ```
 */
export const useCalendarDnd = () => useContext(CalendarDndContext);

/**
 * {@link CalendarDndProvider} の props。
 */
interface CalendarDndProviderProps {
  /** 子要素（DnD 対象となるカレンダー UI 全体をラップ） */
  children: ReactNode;
  /**
   * ドラッグ終了時（ドロップ成立）に呼ばれる更新コールバック。
   * 新しい `start` / `end` に更新された {@link CalendarEvent} が渡されます。
   */
  onEventUpdate: (event: CalendarEvent) => void;
}

/**
 * カレンダーのドラッグ＆ドロップ（@dnd-kit）状態を提供するプロバイダ。
 *
 * @remarks
 * ### データ契約（重要）
 * - **ドラッグ開始側（Drag source）** は、`active.data.current` に以下の形でデータをセットしてください：
 *   ```ts
 *   {
 *     event: CalendarEvent;         // 必須：対象イベント
 *     view: "month" | "week" | "day"; // 必須：開始時のビュー
 *     height?: number;              // 任意：描画高さ（Overlay 用）
 *     isMultiDay?: boolean;         // 任意：マルチデイかどうか
 *     multiDayWidth?: number;       // 任意：横幅%（マルチデイの見た目）
 *     dragHandlePosition?: { x?: number; y?: number; data?: { isFirstDay?: boolean; isLastDay?: boolean } };
 *   }
 *   ```
 * - **ドロップ先（Drop target）** は、`over.data.current` に以下の形でデータをセットしてください：
 *   ```ts
 *   {
 *     date: Date;   // 必須：ドロップ先の「日」
 *     time?: number // 任意：時間（例: 9.5 = 9:30）。省略時は month ビュー扱い
 *   }
 *   ```
 *
 * ### 動作仕様
 * - week/day ビューでは **15 分刻み** にスナップ（0/15/30/45）。
 * - month ビューでは **日付のみ** 移動し、時刻は元イベント（ドラッグ中に保持している `currentTime`）を継承。
 * - ドロップ時は **元イベントの duration** を維持して `end` を再計算します。
 * - `MouseSensor` / `PointerSensor` は 5px、`TouchSensor` は 250ms（5px 許容）の活性化制約を使用。
 *
 * @example
 * ```tsx
 * <CalendarDndProvider onEventUpdate={(e) => save(e)}>
 *   <MonthGrid />  // 各セル/イベントが @dnd-kit の draggable/droppable を実装
 * </CalendarDndProvider>
 * ```
 */
export function CalendarDndProvider({
  children,
  onEventUpdate,
}: CalendarDndProviderProps) {
  const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [activeView, setActiveView] = useState<"month" | "week" | "day" | null>(
    null
  );
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [eventHeight, setEventHeight] = useState<number | null>(null);
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [multiDayWidth, setMultiDayWidth] = useState<number | null>(null);
  const [dragHandlePosition, setDragHandlePosition] = useState<{
    x?: number;
    y?: number;
    data?: {
      isFirstDay?: boolean;
      isLastDay?: boolean;
    };
  } | null>(null);

  /** ドラッグ開始時点のイベント描画寸法（Overlay の安定化に使用） */
  const eventDimensions = useRef<{ height: number }>({ height: 0 });

  // Sensors（活性化しきい値を設定）
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  /** DndContext に付与する安定 ID（デバッグ・識別用） */
  const dndContextId = useId();

  /**
   * ドラッグ開始ハンドラ。
   * - `active.data.current` からイベント情報とビューを読み取り、Overlay 表示用の寸法等を保存します。
   */
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;

    if (!active.data.current) {
      console.error("Missing data in drag start event", event);
      return;
    }

    const {
      event: calendarEvent,
      view,
      height,
      isMultiDay: eventIsMultiDay,
      multiDayWidth: eventMultiDayWidth,
      dragHandlePosition: eventDragHandlePosition,
    } = active.data.current as {
      event: CalendarEvent;
      view: "month" | "week" | "day";
      height?: number;
      isMultiDay?: boolean;
      multiDayWidth?: number;
      dragHandlePosition?: {
        x?: number;
        y?: number;
        data?: { isFirstDay?: boolean; isLastDay?: boolean };
      };
    };

    setActiveEvent(calendarEvent);
    setActiveId(active.id);
    setActiveView(view);
    setCurrentTime(new Date(calendarEvent.start));
    setIsMultiDay(eventIsMultiDay ?? false);
    setMultiDayWidth(eventMultiDayWidth ?? null);
    setDragHandlePosition(eventDragHandlePosition ?? null);

    if (height) {
      eventDimensions.current.height = height;
      setEventHeight(height);
    }
  };

  /**
   * ドラッグ中ハンドラ。
   * - week/day：`over.data.current.time` を 15 分刻みにスナップして `currentTime` を更新
   * - month：日付のみ更新、時刻は維持
   */
  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;

    if (over && activeEvent && over.data.current) {
      const { date, time } = over.data.current as { date: Date; time?: number };

      if (time !== undefined && activeView !== "month") {
        // week/day：time は 9.5=9:30 のような小数
        const newTime = new Date(date);
        const hours = Math.floor(time);
        const fractionalHour = time - hours;

        // 15 分スナップ
        let minutes = 0;
        if (fractionalHour < 0.125) minutes = 0;
        else if (fractionalHour < 0.375) minutes = 15;
        else if (fractionalHour < 0.625) minutes = 30;
        else minutes = 45;

        newTime.setHours(hours, minutes, 0, 0);

        // 実際に変化があるときのみ更新
        if (
          !currentTime ||
          newTime.getTime() !==
            new Date(
              currentTime.getFullYear(),
              currentTime.getMonth(),
              currentTime.getDate(),
              currentTime.getHours(),
              currentTime.getMinutes(),
              0,
              0
            ).getTime()
        ) {
          setCurrentTime(newTime);
        }
      } else if (activeView === "month") {
        // month：日付のみ変更、時刻は保持
        const newTime = new Date(date);
        if (currentTime) {
          newTime.setHours(
            currentTime.getHours(),
            currentTime.getMinutes(),
            currentTime.getSeconds(),
            currentTime.getMilliseconds()
          );
        }

        if (
          !currentTime ||
          newTime.getFullYear() !== currentTime.getFullYear() ||
          newTime.getMonth() !== currentTime.getMonth() ||
          newTime.getDate() !== currentTime.getDate()
        ) {
          setCurrentTime(newTime);
        }
      }
    }
  };

  /**
   * ドロップ時ハンドラ。
   * - ドロップ先の `date`/`time` から新しい `start` を計算
   * - 元イベントの duration（分）を維持して `end` を算出
   * - 実際に開始時刻が変わった場合のみ `onEventUpdate` を呼ぶ
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // 不成立・中断時は状態リセット
    if (!over || !activeEvent || !currentTime) {
      setActiveEvent(null);
      setActiveId(null);
      setActiveView(null);
      setCurrentTime(null);
      setEventHeight(null);
      setIsMultiDay(false);
      setMultiDayWidth(null);
      setDragHandlePosition(null);
      return;
    }

    try {
      if (!active.data.current || !over.data.current) {
        throw new Error("Missing data in drag event");
      }

      const activeData = active.data.current as {
        event?: CalendarEvent;
        view?: string;
      };
      const overData = over.data.current as { date?: Date; time?: number };

      if (!activeData.event || !overData.date) {
        throw new Error("Missing required event data");
      }

      const calendarEvent = activeData.event;
      const date = overData.date;
      const time = overData.time;

      // 新しい start
      const newStart = new Date(date);

      if (time !== undefined) {
        const hours = Math.floor(time);
        const fractionalHour = time - hours;
        let minutes = 0;
        if (fractionalHour < 0.125) minutes = 0;
        else if (fractionalHour < 0.375) minutes = 15;
        else if (fractionalHour < 0.625) minutes = 30;
        else minutes = 45;
        newStart.setHours(hours, minutes, 0, 0);
      } else {
        // month：currentTime の時刻を維持
        newStart.setHours(
          currentTime.getHours(),
          currentTime.getMinutes(),
          currentTime.getSeconds(),
          currentTime.getMilliseconds()
        );
      }

      // duration を維持
      const originalStart = new Date(calendarEvent.start);
      const originalEnd = new Date(calendarEvent.end);
      const durationMinutes = differenceInMinutes(originalEnd, originalStart);
      const newEnd = addMinutes(newStart, durationMinutes);

      const hasStartTimeChanged =
        originalStart.getFullYear() !== newStart.getFullYear() ||
        originalStart.getMonth() !== newStart.getMonth() ||
        originalStart.getDate() !== newStart.getDate() ||
        originalStart.getHours() !== newStart.getHours() ||
        originalStart.getMinutes() !== newStart.getMinutes();

      if (hasStartTimeChanged) {
        onEventUpdate({ ...calendarEvent, start: newStart, end: newEnd });
      }
    } catch (error) {
      console.error("Error in drag end handler:", error);
    } finally {
      // 常にリセット
      setActiveEvent(null);
      setActiveId(null);
      setActiveView(null);
      setCurrentTime(null);
      setEventHeight(null);
      setIsMultiDay(false);
      setMultiDayWidth(null);
      setDragHandlePosition(null);
    }
  };

  return (
    <DndContext
      id={dndContextId}
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <CalendarDndContext.Provider
        value={{
          activeEvent,
          activeId,
          activeView,
          currentTime,
          eventHeight,
          isMultiDay,
          multiDayWidth,
          dragHandlePosition,
        }}
      >
        {children}

        {/* ドラッグ中のプレビュー（実イベント DOM を動かさない） */}
        <DragOverlay adjustScale={false} dropAnimation={null}>
          {activeEvent && activeView && (
            <div
              style={{
                height: eventHeight ? `${eventHeight}px` : "auto",
                width:
                  isMultiDay && multiDayWidth ? `${multiDayWidth}%` : "100%",
              }}
            >
              <EventItem
                event={activeEvent}
                view={activeView}
                isDragging={true}
                showTime={activeView !== "month"}
                currentTime={currentTime || undefined}
                isFirstDay={dragHandlePosition?.data?.isFirstDay !== false}
                isLastDay={dragHandlePosition?.data?.isLastDay !== false}
              />
            </div>
          )}
        </DragOverlay>
      </CalendarDndContext.Provider>
    </DndContext>
  );
}
