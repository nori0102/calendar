"use client";

import React, { useMemo } from "react";
import {
  addHours,
  areIntervalsOverlapping,
  differenceInMinutes,
  eachHourOfInterval,
  format,
  getHours,
  getMinutes,
  isSameDay,
  startOfDay,
} from "date-fns";

import {
  DraggableEvent,
  DroppableCell,
  EventItem,
  isMultiDayEvent,
  useCurrentTimeIndicator,
  WeekCellsHeight,
  type CalendarEvent,
} from "@/components/event-calendar";
import { StartHour, EndHour } from "@/components/event-calendar/constants";
import { cn } from "@/lib/utils";

interface DayViewProps {
  /** 表示対象の日（この1日分のイベントを描画） */
  currentDate: Date;
  /** すべてのイベント（本コンポーネント側で日別フィルタリング） */
  events: CalendarEvent[];
  /** イベントクリック時に親へ通知（詳細表示など） */
  onEventSelect: (event: CalendarEvent) => void;
  /** 空き枠クリックで新規作成：開始時刻を親へ通知 */
  onEventCreate: (startTime: Date) => void;
}

interface PositionedEvent {
  /** 描画対象のイベント */
  event: CalendarEvent;
  /** タイムグリッド内の上端位置（px） */
  top: number;
  /** 高さ（px）= 期間に比例 */
  height: number;
  /** 左位置（%）= 重なり時に段組み */
  left: number;
  /** 幅（%）= 重なり段に応じて調整 */
  width: number;
  /** 前後関係を制御する z-index */
  zIndex: number;
}

/**
 * 日ビューのタイムグリッドを描画するコンポーネント。
 *
 * - `currentDate` の1日分について、終日/マルチデイと時間帯イベントを分けて表示します。
 * - 時間帯イベントは重なりを検出し、段（カラム）に割り当てて `left`/`width` を計算します。
 * - 空き枠クリックで `onEventCreate(startTime)` を呼び出します（10分刻み）。
 * - 現在時刻インジケーターをパーセンテージで配置します（`useCurrentTimeIndicator`）。
 *
 * @remarks
 * - 表示時間帯は `StartHour`〜`EndHour` を使用（例：7〜24時）。見た目のセル高は CSS 変数 `--week-cells-height` を参照（型では `WeekCellsHeight`）。
 * - 10分刻みのセルに対して `DroppableCell` を設置。DnD のドロップ先として `date` と `time`（例: `9.1667`=9:10）を提供します。
 * - 終日・マルチデイはヘッダ行（all-day セクション）にまとめ、スパンの左右端を `isFirstDay`/`isLastDay` で表現します。
 * - ラベルの書式は `format(hour, "H時")`。24時間表記の日本語形式を使用します。
 *
 * @example
 * ```tsx
 * <DayView
 *   currentDate={new Date()}
 *   events={events}
 *   onEventSelect={(e) => setSelected(e)}
 *   onEventCreate={(start) => openCreateDialog({ start })}
 * />
 * ```
 */
export function DayView({
  currentDate,
  events,
  onEventSelect,
  onEventCreate,
}: DayViewProps) {
  // 表示する時間帯（StartHour〜EndHour-1 を1時間刻みで配列化）
  const hours = useMemo(() => {
    const dayStart = startOfDay(currentDate);
    return eachHourOfInterval({
      start: addHours(dayStart, StartHour),
      end: addHours(dayStart, EndHour - 1),
    });
  }, [currentDate]);

  // 当日と重なるイベントのみ抽出（開始/終了が当日、または当日でサンドイッチ）
  const dayEvents = useMemo(() => {
    return events
      .filter((event) => {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        return (
          isSameDay(currentDate, eventStart) ||
          isSameDay(currentDate, eventEnd) ||
          (currentDate > eventStart && currentDate < eventEnd)
        );
      })
      .sort(
        (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
      );
  }, [currentDate, events]);

  // 終日・マルチデイ（上部の All day セクション）
  const allDayEvents = useMemo(() => {
    return dayEvents.filter((event) => event.allDay || isMultiDayEvent(event));
  }, [dayEvents]);

  // 時間帯イベント（タイムグリッド内）
  const timeEvents = useMemo(() => {
    return dayEvents.filter(
      (event) => !event.allDay && !isMultiDayEvent(event)
    );
  }, [dayEvents]);

  // 重なりを考慮した位置計算（段組み/幅/高さ）
  const positionedEvents = useMemo(() => {
    const result: PositionedEvent[] = [];
    const dayStart = startOfDay(currentDate);

    // 先に開始時刻→同時刻なら長いもの優先
    const sortedEvents = [...timeEvents].sort((a, b) => {
      const aStart = new Date(a.start);
      const bStart = new Date(b.start);
      const aEnd = new Date(a.end);
      const bEnd = new Date(b.end);
      if (aStart < bStart) return -1;
      if (aStart > bStart) return 1;
      return (
        (differenceInMinutes(aEnd, aStart) -
          differenceInMinutes(bEnd, bStart)) *
        -1
      );
    });

    // 重なり判定用の段配列
    const columns: { event: CalendarEvent; end: Date }[][] = [];

    sortedEvents.forEach((event) => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);

      // 当日外にまたぐ場合は当日範囲にクランプ
      const adjustedStart = isSameDay(currentDate, eventStart)
        ? eventStart
        : dayStart;
      const adjustedEnd = isSameDay(currentDate, eventEnd)
        ? eventEnd
        : addHours(dayStart, 24);

      // 表示位置（px）
      const startHour =
        getHours(adjustedStart) + getMinutes(adjustedStart) / 60;
      const endHour = getHours(adjustedEnd) + getMinutes(adjustedEnd) / 60;
      const top = (startHour - StartHour) * WeekCellsHeight;
      const height = (endHour - startHour) * WeekCellsHeight;

      // 段（重なりのない列）に割り当て
      let columnIndex = 0;
      let placed = false;

      while (!placed) {
        const col = columns[columnIndex] || [];
        if (col.length === 0) {
          columns[columnIndex] = col;
          placed = true;
        } else {
          const overlaps = col.some((c) =>
            areIntervalsOverlapping(
              { start: adjustedStart, end: adjustedEnd },
              { start: new Date(c.event.start), end: new Date(c.event.end) }
            )
          );
          if (!overlaps) {
            placed = true;
          } else {
            columnIndex++;
          }
        }
      }

      const currentColumn = columns[columnIndex] || [];
      columns[columnIndex] = currentColumn;
      currentColumn.push({ event, end: adjustedEnd });

      // 1段目は全幅、以降は10%ずつインデントして90%幅
      const width = columnIndex === 0 ? 1 : 0.9;
      const left = columnIndex === 0 ? 0 : columnIndex * 0.1;

      result.push({
        event,
        top,
        height,
        left,
        width,
        zIndex: 10 + columnIndex,
      });
    });

    return result;
  }, [currentDate, timeEvents]);

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    onEventSelect(event);
  };

  const showAllDaySection = allDayEvents.length > 0;
  const { currentTimePosition, currentTimeVisible } = useCurrentTimeIndicator(
    currentDate,
    "day"
  );

  return (
    <div data-slot="day-view" className="contents">
      {/* 終日/マルチデイ */}
      {showAllDaySection && (
        <div className="border-border/70 bg-muted/50 border-t">
          <div className="grid grid-cols-[3rem_1fr] sm:grid-cols-[4rem_1fr]">
            <div className="relative">
              <span className="text-muted-foreground/70 absolute bottom-0 left-0 h-6 w-16 max-w-full pe-2 text-right text-[10px] sm:pe-4 sm:text-xs">
                All day
              </span>
            </div>
            <div className="border-border/70 relative border-r p-1 last:border-r-0">
              {allDayEvents.map((event) => {
                const eventStart = new Date(event.start);
                const eventEnd = new Date(event.end);
                const isFirstDay = isSameDay(currentDate, eventStart);
                const isLastDay = isSameDay(currentDate, eventEnd);

                return (
                  <EventItem
                    key={`spanning-${event.id}`}
                    onClick={(e) => handleEventClick(event, e)}
                    event={event}
                    view="month"
                    isFirstDay={isFirstDay}
                    isLastDay={isLastDay}
                  >
                    {/* DayView ではタイトルを常に表示 */}
                    <div>{event.title}</div>
                  </EventItem>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* タイムグリッド */}
      <div className="border-border/70 grid flex-1 grid-cols-[3rem_1fr] border-t sm:grid-cols-[4rem_1fr] overflow-hidden">
        {/* 時刻ラベル列 */}
        <div>
          {hours.map((hour, index) => (
            <div
              key={hour.toString()}
              className="border-border/70 relative h-[var(--week-cells-height)] border-b last:border-b-0"
            >
              {index > 0 && (
                <span className="bg-background text-muted-foreground/70 absolute -top-3 left-0 flex h-6 w-16 max-w-full items-center justify-end pe-2 text-[10px] sm:pe-4 sm:text-xs">
                  {format(hour, "H:mm")}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* イベントとドロップ領域 */}
        <div className="relative">
          {/* 配置済みイベント */}
          {positionedEvents.map((positionedEvent) => (
            <div
              key={positionedEvent.event.id}
              className="absolute z-10 px-0.5"
              style={{
                top: `${positionedEvent.top}px`,
                height: `${positionedEvent.height}px`,
                left: `${positionedEvent.left * 100}%`,
                width: `${positionedEvent.width * 100}%`,
                zIndex: positionedEvent.zIndex,
              }}
            >
              <div className="h-full w-full">
                <DraggableEvent
                  event={positionedEvent.event}
                  view="day"
                  onClick={(e) => handleEventClick(positionedEvent.event, e)}
                  showTime
                  height={positionedEvent.height}
                />
              </div>
            </div>
          ))}

          {/* 現在時刻インジケーター */}
          {currentTimeVisible && (
            <div
              className="pointer-events-none absolute right-0 left-0 z-20"
              style={{ top: `${currentTimePosition}%` }}
            >
              <div className="relative flex items-center">
                <div className="bg-red-500 absolute -left-1 h-2 w-2 rounded-full" />
                <div className="bg-red-500 h-[2px] w-full" />
              </div>
            </div>
          )}

          {/* 10分刻みのドロップ/クリックセル */}
          {hours.map((hour) => {
            const hourValue = getHours(hour);
            return (
              <div
                key={hour.toString()}
                className="border-border/70 relative h-[var(--week-cells-height)] border-b last:border-b-0"
              >
                {[0, 1, 2, 3, 4, 5].map((tenMinInterval) => {
                  const tenMinTime = hourValue + tenMinInterval * (10/60);
                  return (
                    <DroppableCell
                      key={`${hour.toString()}-${tenMinInterval}`}
                      id={`day-cell-${currentDate.toISOString()}-${tenMinTime}`}
                      date={currentDate}
                      time={tenMinTime}
                      className={cn(
                        "absolute h-[calc(var(--week-cells-height)/6)] w-full",
                        tenMinInterval === 0 && "top-0",
                        tenMinInterval === 1 && "top-[calc(var(--week-cells-height)/6)]",
                        tenMinInterval === 2 && "top-[calc(var(--week-cells-height)/6*2)]",
                        tenMinInterval === 3 && "top-[calc(var(--week-cells-height)/6*3)]",
                        tenMinInterval === 4 && "top-[calc(var(--week-cells-height)/6*4)]",
                        tenMinInterval === 5 && "top-[calc(var(--week-cells-height)/6*5)]"
                      )}
                      onClick={() => {
                        const startTime = new Date(currentDate);
                        startTime.setHours(hourValue);
                        startTime.setMinutes(tenMinInterval * 10);
                        onEventCreate(startTime);
                      }}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
