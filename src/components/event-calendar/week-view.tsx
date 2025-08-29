"use client";

import React, { useMemo } from "react";
import {
  addHours,
  areIntervalsOverlapping,
  differenceInMinutes,
  eachDayOfInterval,
  eachHourOfInterval,
  endOfWeek,
  format,
  getHours,
  getMinutes,
  isBefore,
  isSameDay,
  isToday,
  startOfDay,
  startOfWeek,
} from "date-fns";
import { ja } from "date-fns/locale";

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

/**
 * 週表示ビューのプロパティ
 *
 * @property currentDate - 表示基準日（この日を含む週を描画）
 * @property events - すべてのイベント配列（本コンポーネントで週/日別にフィルタ）
 * @property onEventSelect - イベントクリック時のハンドラ
 * @property onEventCreate - グリッドクリック（10分刻み）で新規作成する開始時刻を通知
 */
interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventSelect: (event: CalendarEvent) => void;
  onEventCreate: (startTime: Date) => void;
}

/** タイムスロット上に配置するための計算済みイベント */
interface PositionedEvent {
  event: CalendarEvent;
  /** 上端位置(px)。`StartHour` を 0 として `WeekCellsHeight` を係数に変換 */
  top: number;
  /** 高さ(px)。イベントの duration を `WeekCellsHeight` でスケール */
  height: number;
  /** 左位置(0..1)。衝突解消のための列インデックスを % に変換 */
  left: number;
  /** 幅(0..1)。列数に応じて 1 または 0.9 などに設定 */
  width: number;
  /** 重なり順 */
  zIndex: number;
}

/**
 * # WeekView
 * カレンダーの**週表示**コンポーネント。
 *
 * - 上段：終日/マルチデイイベントの行（タイトルはスパンの初日 or 週の最初の可視日で表示）
 * - 下段：時間グリッド（`StartHour`〜`EndHour`、10分刻みの Droppable）
 * - イベントの**重なり解消**は「列割り当て」方式：重なるイベントは別列に配置し、幅/left を調整
 * - 現在時刻インジケーターをその日の列に描画（`useCurrentTimeIndicator`）
 *
 * @remarks
 * - 描画は Pure 計算の `useMemo` によって最小化。
 * - 当日だけ赤線インジケーターを描画し、スクロール上でも視認性を確保。
 */
export function WeekView({
  currentDate,
  events,
  onEventSelect,
  onEventCreate,
}: WeekViewProps) {
  /** 週に含まれる各日（Sun〜Sat） */
  const days = useMemo(() => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [currentDate]);

  /** 週の開始日（終日セクションのタイトル表示可否の判定に使用） */
  const weekStart = useMemo(
    () => startOfWeek(currentDate, { weekStartsOn: 0 }),
    [currentDate]
  );

  /** 時間グリッド（`StartHour`〜`EndHour`、1時間刻み） */
  const hours = useMemo(() => {
    const dayStart = startOfDay(currentDate);
    return eachHourOfInterval({
      start: addHours(dayStart, StartHour),
      end: addHours(dayStart, EndHour - 1),
    });
  }, [currentDate]);

  /**
   * 終日/マルチデイのイベント（この週に可視なもの）
   * - `allDay` または `isMultiDayEvent` を満たす
   * - 週内のどこか1日に「開始/終了/中日」として引っかかるかで抽出
   */
  const allDayEvents = useMemo(() => {
    return events
      .filter((event) => event.allDay || isMultiDayEvent(event))
      .filter((event) => {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        return days.some(
          (day) =>
            isSameDay(day, eventStart) ||
            isSameDay(day, eventEnd) ||
            (day > eventStart && day < eventEnd)
        );
      });
  }, [events, days]);

  /**
   * 各日の時間帯イベント（終日/マルチデイを除く）を
   * - 開始時刻 → duration 長い順 に並べ
   * - 列割り当て（重なり解消）して `top/height/left/width/zIndex` を計算
   */
  const processedDayEvents = useMemo(() => {
    const result = days.map((day) => {
      // 1) その日の時間帯イベントを抽出（終日/マルチデイは除外）
      const dayEvents = events.filter((event) => {
        if (event.allDay || isMultiDayEvent(event)) return false;

        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);

        // 当日開始/終了、または当日を跨いでいる（夜間にかかる）ものを含める
        return (
          isSameDay(day, eventStart) ||
          isSameDay(day, eventEnd) ||
          (eventStart < day && eventEnd > day)
        );
      });

      // 2) ソート（開始時刻→長い順）
      const sortedEvents = [...dayEvents].sort((a, b) => {
        const aStart = new Date(a.start);
        const bStart = new Date(b.start);
        const aEnd = new Date(a.end);
        const bEnd = new Date(b.end);

        if (aStart < bStart) return -1;
        if (aStart > bStart) return 1;

        const aDuration = differenceInMinutes(aEnd, aStart);
        const bDuration = differenceInMinutes(bEnd, bStart);
        return bDuration - aDuration;
      });

      // 3) 位置計算（列割り当て）
      const positionedEvents: PositionedEvent[] = [];
      const dayStart = startOfDay(day);
      const columns: { event: CalendarEvent; end: Date }[][] = [];

      sortedEvents.forEach((event) => {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);

        // 当日外の端は当日端に切り詰める（表示計算用）
        const adjustedStart = isSameDay(day, eventStart)
          ? eventStart
          : dayStart;
        const adjustedEnd = isSameDay(day, eventEnd)
          ? eventEnd
          : addHours(dayStart, 24);

        // px計算（StartHour を 0 とした相対位置を WeekCellsHeight でスケール）
        const startHour =
          getHours(adjustedStart) + getMinutes(adjustedStart) / 60;
        const endHour = getHours(adjustedEnd) + getMinutes(adjustedEnd) / 60;
        const top = (startHour - StartHour) * WeekCellsHeight;
        const height = (endHour - startHour) * WeekCellsHeight;

        // 列決定（重なる限り次の列へ）
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

        // 列へ push
        const currentColumn = columns[columnIndex] || [];
        columns[columnIndex] = currentColumn;
        currentColumn.push({ event, end: adjustedEnd });

        // 幅と left（列数が増えるほどやや狭く・右へ）
        const width = columnIndex === 0 ? 1 : 0.9;
        const left = columnIndex === 0 ? 0 : columnIndex * 0.1;

        positionedEvents.push({
          event,
          top,
          height,
          left,
          width,
          zIndex: 10 + columnIndex,
        });
      });

      return positionedEvents;
    });

    return result;
  }, [days, events]);

  /** イベントクリック時の通知（セルクリックにバブらないよう stopPropagation） */
  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    onEventSelect(event);
  };

  /** 終日セクションの表示有無 */
  const showAllDaySection = allDayEvents.length > 0;

  /** 現在時刻インジケーター（週ビュー版） */
  const { currentTimePosition, currentTimeVisible } = useCurrentTimeIndicator(
    currentDate,
    "week"
  );

  return (
    <div data-slot="week-view" className="flex h-full flex-col">
      {/* 曜日ヘッダー */}
      <div className="bg-background/80 border-border/70 sticky top-0 z-30 grid grid-cols-8 border-y backdrop-blur-md uppercase">
        <div className="text-muted-foreground/70 py-2 text-center text-xs">
          <span className="max-[479px]:sr-only">{format(new Date(), "O")}</span>
        </div>
        {days.map((day) => (
          <div
            key={day.toString()}
            className="data-today:text-primary text-muted-foreground/70 py-2 text-center text-xs data-today:font-medium"
            data-today={isToday(day) || undefined}
          >
            <span className="sm:hidden" aria-hidden="true">
              {format(day, "EEEEE d日", { locale: ja })}
            </span>
            <span className="max-sm:hidden">{format(day, "EEEEE d日", { locale: ja })}</span>
          </div>
        ))}
      </div>

      {/* 終日/マルチデイ列 */}
      {showAllDaySection && (
        <div className="border-border/70 bg-muted/50 border-b">
          <div className="grid grid-cols-8">
            <div className="border-border/70 relative border-r">
              <span className="text-muted-foreground/70 absolute bottom-0 left-0 h-6 w-16 max-w-full pe-2 text-right text-[10px] sm:pe-4 sm:text-xs">
                All day
              </span>
            </div>
            {days.map((day, dayIndex) => {
              const dayAllDayEvents = allDayEvents.filter((event) => {
                const eventStart = new Date(event.start);
                const eventEnd = new Date(event.end);
                return (
                  isSameDay(day, eventStart) ||
                  (day > eventStart && day < eventEnd) ||
                  isSameDay(day, eventEnd)
                );
              });

              return (
                <div
                  key={day.toString()}
                  className="border-border/70 relative border-r p-1 last:border-r-0"
                  data-today={isToday(day) || undefined}
                >
                  {dayAllDayEvents.map((event) => {
                    const eventStart = new Date(event.start);
                    const eventEnd = new Date(event.end);
                    const isFirstDay = isSameDay(day, eventStart);
                    const isLastDay = isSameDay(day, eventEnd);

                    // 週の最初の可視日に達していればタイトルを表示
                    const isFirstVisibleDay =
                      dayIndex === 0 && isBefore(eventStart, weekStart);
                    const shouldShowTitle = isFirstDay || isFirstVisibleDay;

                    return (
                      <EventItem
                        key={`spanning-${event.id}`}
                        onClick={(e) => handleEventClick(event, e)}
                        event={event}
                        view="month"
                        isFirstDay={isFirstDay}
                        isLastDay={isLastDay}
                      >
                        {/* 初日 or 週の最初の可視日のときだけタイトル */}
                        <div
                          className={cn(
                            "truncate",
                            !shouldShowTitle && "invisible"
                          )}
                          aria-hidden={!shouldShowTitle}
                        >
                          {event.title}
                        </div>
                      </EventItem>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 時間グリッド + 位置指定済みイベント */}
      <div className="grid flex-1 grid-cols-8 overflow-hidden">
        {/* 時間レール */}
        <div className="border-border/70 border-r grid auto-cols-fr">
          {hours.map((hour, index) => (
            <div
              key={hour.toString()}
              className="border-border/70 relative min-h-[var(--week-cells-height)] border-b last:border-b-0"
            >
              {index > 0 && (
                <span className="bg-background text-muted-foreground/70 absolute -top-3 left-0 flex h-6 w-16 max-w-full items-center justify-end pe-2 text-[10px] sm:pe-4 sm:text-xs">
                  {format(hour, "H:mm")}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* 各日の列 */}
        {days.map((day, dayIndex) => (
          <div
            key={day.toString()}
            className="border-border/70 relative border-r last:border-r-0 grid auto-cols-fr"
            data-today={isToday(day) || undefined}
          >
            {/* 配置済みイベント（ドラッグ可） */}
            {(processedDayEvents[dayIndex] ?? []).map((positionedEvent) => (
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
                onClick={(e) => e.stopPropagation()}
              >
                <div className="h-full w-full">
                  <DraggableEvent
                    event={positionedEvent.event}
                    view="week"
                    onClick={(e) => handleEventClick(positionedEvent.event, e)}
                    showTime
                    height={positionedEvent.height}
                  />
                </div>
              </div>
            ))}

            {/* 現在時刻インジケーター（当日列のみ） */}
            {currentTimeVisible && isToday(day) && (
              <div
                className="pointer-events-none absolute right-0 left-0 z-20"
                style={{ top: `${currentTimePosition}%` }}
              >
                <div className="relative flex items-center">
                  <div className="bg-red-500 absolute -left-1 h-2 w-2 rounded-full"></div>
                  <div className="bg-red-500 h-[2px] w-full"></div>
                </div>
              </div>
            )}

            {/* 10分刻みの Droppable セル */}
            {hours.map((hour) => {
              const hourValue = getHours(hour);
              return (
                <div
                  key={hour.toString()}
                  className="border-border/70 relative min-h-[var(--week-cells-height)] border-b last:border-b-0"
                >
                  {[0, 1, 2, 3, 4, 5].map((tenMinInterval) => {
                    const tenMinTime = hourValue + tenMinInterval * (10/60);
                    return (
                      <DroppableCell
                        key={`${hour.toString()}-${tenMinInterval}`}
                        id={`week-cell-${day.toISOString()}-${tenMinTime}`}
                        date={day}
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
                          const startTime = new Date(day);
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
        ))}
      </div>
    </div>
  );
}
