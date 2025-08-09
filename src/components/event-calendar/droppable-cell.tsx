"use client";

import { useDroppable } from "@dnd-kit/core";

import { cn } from "@/lib/utils";
import { useCalendarDnd } from "@/components/event-calendar";

interface DroppableCellProps {
  /** 一意のドロップ領域 ID（@dnd-kit が参照） */
  id: string;
  /** セルが表す日付（ドロップ時の基準日） */
  date: Date;
  /**
   * セルが表す時間帯（週/日ビュー用、例: 9.25 = 9:15）
   * - 未指定の場合は「月ビュー扱い」で日付のみを意味する
   */
  time?: number;
  /** セル内に追加する任意の要素（補助表示など） */
  children?: React.ReactNode;
  /** 追加クラス */
  className?: string;
  /** セルクリック時のハンドラ（新規作成などに利用） */
  onClick?: () => void;
}

/**
 * カレンダーの「ドロップ可能な時間枠」コンポーネント。
 *
 * - `@dnd-kit/core` の `useDroppable` を用いて、ドラッグ中のイベントを受け入れる領域を作ります。
 * - `data` に `date` と `time`（任意）を載せ、ドロップ側（`onDragOver`/`onDragEnd`）の計算に利用します。
 * - ドラッグ対象がこのセル上にある間は `data-dragging` が `true` になり、スタイルで強調できます。
 *
 * @remarks
 * ### データ契約（drop target 側）
 * 本コンポーネントは `useDroppable` の `data` に以下を設定します。
 * ドロップ処理側は `over.data.current` から同値を参照してください。
 * ```ts
 * { date: Date; time?: number } // time 例: 9.5 = 9:30
 * ```
 *
 * ### デバッグ表示
 * `title` 属性に `"H:mm"` 形式のツールチップを出します（`time` 指定時のみ）。
 * 本番で不要なら削除してください。
 *
 * @example
 * ```tsx
 * <DroppableCell
 *   id={`day-cell-${date.toISOString()}-${9.5}`}
 *   date={date}
 *   time={9.5}
 *   onClick={() => onCreate(new Date(date.setHours(9, 30)))}
 * />
 * ```
 */
export function DroppableCell({
  id,
  date,
  time,
  children,
  className,
  onClick,
}: DroppableCellProps) {
  const { activeEvent } = useCalendarDnd();

  // ドロップ領域の登録とホバー中判定
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { date, time },
  });

  // デバッグ用：ツールチップに表示する "H:mm"
  const formattedTime =
    time !== undefined
      ? `${Math.floor(time)}:${Math.round((time - Math.floor(time)) * 60)
          .toString()
          .padStart(2, "0")}`
      : null;

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      className={cn(
        // ホバー中は data-dragging でトーンを上げる想定
        "data-dragging:bg-accent flex h-full flex-col px-0.5 py-1 sm:px-1",
        className
      )}
      title={formattedTime ?? undefined}
      data-dragging={isOver && activeEvent ? true : undefined}
    >
      {children}
    </div>
  );
}
