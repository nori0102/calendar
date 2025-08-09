"use client";

import { useRef, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { differenceInDays } from "date-fns";

import {
  CalendarEvent,
  EventItem,
  useCalendarDnd,
} from "@/components/event-calendar";

interface DraggableEventProps {
  /** 描画・操作対象のイベント */
  event: CalendarEvent;
  /** 現在のビュー。DnD の識別子や挙動に影響（"month" | "week" | "day"） */
  view: "month" | "week" | "day";
  /** イベント内に時刻を表示するか（主に week/day 用） */
  showTime?: boolean;
  /** クリック時に親へ伝える。リサイズ/ドラッグとは独立して動く */
  onClick?: (e: React.MouseEvent) => void;
  /** 見た目の高さ（px）。Overlay の安定表示のため `@dnd-kit` の data にも渡す */
  height?: number;
  /** マルチデイ扱いを強制。未指定時は start/end から自動判定 */
  isMultiDay?: boolean;
  /** マルチデイ描画時の横幅（%）。行内でスパンして見せるために使用 */
  multiDayWidth?: number;
  /** スパンの左端かどうか（装飾・角丸等に使用） */
  isFirstDay?: boolean;
  /** スパンの右端かどうか（装飾・角丸等に使用） */
  isLastDay?: boolean;
  /** アイテムを AT に隠すか（Overlay との二重読み上げ抑止などに使用） */
  "aria-hidden"?: boolean | "true" | "false";
}

/**
 * カレンダーの単一イベントを「ドラッグ可能」にして描画するコンポーネント。
 *
 * - `@dnd-kit/core` の `useDraggable` を用いてドラッグ可能にします。
 * - DnD 中の見た目やドロップ計算用に、`active.data.current` にイベント情報や
 *   クリック位置（ドラッグ開始位置）などを渡します。
 * - マルチデイ（終日含む）の場合、`multiDayWidth` を用いて横方向スパンを表現できます。
 *
 * @remarks
 * ### DnD データ契約（drag source 側）
 * 本コンポーネントは `useDraggable` の `data` に以下を設定します。ドロップ先はこれを前提に処理してください。
 * ```ts
 * {
 *   event: CalendarEvent;               // 対象イベント
 *   view: "month" | "week" | "day";     // 開始時ビュー
 *   height?: number | null;             // 見た目の高さ（Overlay 安定化）
 *   isMultiDay: boolean;                // マルチデイ/終日か
 *   multiDayWidth?: number;             // マルチデイの横幅 (%)
 *   dragHandlePosition?: { x: number; y: number } | null; // 要素内の押下位置
 *   isFirstDay?: boolean;               // スパン左端か
 *   isLastDay?: boolean;                // スパン右端か
 * }
 * ```
 *
 * ### マルチデイ判定
 * - `props.isMultiDay` が与えられた場合はそれを優先。
 * - 未指定の場合、`event.allDay === true` または `differenceInDays(end, start) >= 1` で自動判定。
 *
 * ### アクセシビリティ
 * - DnD 中は実体 DOM を非表示（`opacity-0`）にし、Overlay を表示します。
 *   スクリーンリーダーの二重読み上げを避けたい場合は `aria-hidden` を適宜指定してください。
 */
export function DraggableEvent({
  event,
  view,
  showTime,
  onClick,
  height,
  isMultiDay,
  multiDayWidth,
  isFirstDay = true,
  isLastDay = true,
  "aria-hidden": ariaHidden,
}: DraggableEventProps) {
  const { activeId } = useCalendarDnd();
  const elementRef = useRef<HTMLDivElement>(null);
  const [dragHandlePosition, setDragHandlePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // マルチデイ（終日含む）判定
  const eventStart = new Date(event.start);
  const eventEnd = new Date(event.end);
  const isMultiDayEvent =
    isMultiDay || event.allDay || differenceInDays(eventEnd, eventStart) >= 1;

  // Draggable 設定：ドロップ側が参照する data をここで集約
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `${event.id}-${view}`,
      data: {
        event,
        view,
        height: height || elementRef.current?.offsetHeight || null,
        isMultiDay: isMultiDayEvent,
        multiDayWidth: multiDayWidth,
        dragHandlePosition,
        isFirstDay,
        isLastDay,
      },
    });

  // 押下位置（要素内の相対座標）を記録：リサイズ/ドラッグの見た目調整に利用可能
  const handleMouseDown = (e: React.MouseEvent) => {
    if (elementRef.current) {
      const rect = elementRef.current.getBoundingClientRect();
      setDragHandlePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  // DnD 中は実体を透明化し、Overlay の表示に任せる
  if (isDragging || activeId === `${event.id}-${view}`) {
    return (
      <div
        ref={setNodeRef}
        className="opacity-0"
        style={{ height: height || "auto" }}
      />
    );
  }

  // 変換トランスフォーム（ドラッグ中のみ付与）
  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
        height: height || "auto",
        width:
          isMultiDayEvent && multiDayWidth ? `${multiDayWidth}%` : undefined,
      }
    : {
        height: height || "auto",
        width:
          isMultiDayEvent && multiDayWidth ? `${multiDayWidth}%` : undefined,
      };

  // タッチ開始位置の記録
  const handleTouchStart = (e: React.TouchEvent) => {
    if (elementRef.current) {
      const rect = elementRef.current.getBoundingClientRect();
      const touch = e.touches[0];
      if (touch) {
        setDragHandlePosition({
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top,
        });
      }
    }
  };

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        if (elementRef) elementRef.current = node;
      }}
      style={style}
      className="touch-none"
    >
      <EventItem
        event={event}
        view={view}
        showTime={showTime}
        isFirstDay={isFirstDay}
        isLastDay={isLastDay}
        isDragging={isDragging}
        onClick={onClick}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        dndListeners={listeners}
        dndAttributes={attributes}
        aria-hidden={ariaHidden}
      />
    </div>
  );
}
