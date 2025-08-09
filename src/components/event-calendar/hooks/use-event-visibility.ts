"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";

interface EventVisibilityOptions {
  /** 各イベント行の高さ（px） */
  eventHeight: number;
  /** 行間（px） */
  eventGap: number;
}

interface EventVisibilityResult {
  /** 高さを測定する対象（イベントリストを包む要素） */
  contentRef: React.RefObject<HTMLDivElement>;
  /** 測定したコンテンツコンテナの高さ（px）。測定前は `null` */
  contentHeight: number | null;
  /**
   * セルに収まる「表示イベント数」を返す関数
   * （必要に応じて「もっと見る」ボタンの分だけ1件減らす）
   */
  getVisibleEventCount: (totalEvents: number) => number;
}

/**
 * コンテナの高さに基づいて、カレンダーセル内に「何件のイベントを表示できるか」を算出するフック。
 * `ResizeObserver` を用いてリサイズ時に効率よく再計算します。
 *
 * @remarks
 * - 計測の正確さを優先するため `useLayoutEffect` を使用しています（描画前に同期計測）。
 * - SSR 環境では `ResizeObserver` が存在しない場合があります。通常はクライアント側のみで実行してください。
 * - `eventHeight` と `eventGap` は **px 前提**。UIと数値の整合性に注意してください。
 * - すべてのイベントが収まらない場合、「もっと見る」ボタン等の領域を確保するため 1 件減らして返します。
 *
 * @param options - 表示計算に必要な見た目の寸法
 * @param options.eventHeight - 各イベント行の高さ（px）
 * @param options.eventGap - 行間（px）
 *
 * @returns {@link EventVisibilityResult}
 * - `contentRef`: 高さ測定対象に付与する ref
 * - `contentHeight`: 現在のコンテナ高さ（px）
 * - `getVisibleEventCount(total)`: 表示可能なイベント件数を返す
 *
 * @example
 * ```tsx
 * const { contentRef, getVisibleEventCount } = useEventVisibility({
 *   eventHeight: 28,
 *   eventGap: 4,
 * });
 *
 * const visibleCount = getVisibleEventCount(events.length);
 * const visibleEvents = events.slice(0, visibleCount);
 *
 * return (
 *   <div ref={contentRef} className="h-full overflow-hidden">
 *     {visibleEvents.map(e => <EventRow key={e.id} event={e} />)}
 *     {events.length > visibleCount && (
 *       <button className="mt-1 text-xs underline">もっと見る</button>
 *     )}
 *   </div>
 * );
 * ```
 */
export function useEventVisibility({
  eventHeight,
  eventGap,
}: EventVisibilityOptions): EventVisibilityResult {
  // 高さ計測対象
  const contentRef = useRef<HTMLDivElement>(null);
  // 使い回すための ResizeObserver 保持
  const observerRef = useRef<ResizeObserver | null>(null);
  // 現在のコンテンツ高さ
  const [contentHeight, setContentHeight] = useState<number | null>(null);

  // 描画前に同期計測
  useLayoutEffect(() => {
    if (!contentRef.current) return;

    // 高さを取得して state に反映
    const updateHeight = () => {
      if (contentRef.current) {
        setContentHeight(contentRef.current.clientHeight);
      }
    };

    // 初回計測
    updateHeight();

    // ResizeObserver が利用可能な環境でのみ設定
    if (!observerRef.current && typeof ResizeObserver !== "undefined") {
      observerRef.current = new ResizeObserver(() => {
        updateHeight();
      });
    }

    // 監視開始
    observerRef.current?.observe(contentRef.current);

    // クリーンアップ
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  // 表示可能件数の計算（contentHeight / (行高 + 行間)）
  const getVisibleEventCount = useMemo(() => {
    return (totalEvents: number): number => {
      if (!contentHeight) return totalEvents;

      const slot = eventHeight + eventGap;
      if (slot <= 0) return totalEvents; // 異常値ガード

      const maxEvents = Math.floor(contentHeight / slot);

      // 収まるなら全件、収まらないなら「もっと見る」用に1件減らす
      if (totalEvents <= maxEvents) return totalEvents;
      return maxEvents > 0 ? maxEvents - 1 : 0;
    };
  }, [contentHeight, eventHeight, eventGap]);

  return {
    contentRef,
    contentHeight,
    getVisibleEventCount,
  } as EventVisibilityResult;
}
