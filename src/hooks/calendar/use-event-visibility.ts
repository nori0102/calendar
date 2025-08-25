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
 * カレンダーセル内でイベントの表示件数を自動計算するカスタムフック
 *
 * コンテナの高さに応じて「何件のイベントが表示できるか」を動的に算出し、
 * 画面サイズの変更時も自動的に再計算します。すべてのイベントが表示しきれない
 * 場合は「もっと見る」ボタン用の領域を確保するため、1件少なく表示します。
 *
 * @param options - イベント表示の設定
 * @param options.eventHeight - 各イベントの高さ（px）
 * @param options.eventGap - イベント間の隙間（px）
 * @returns イベント表示制御に必要な値と関数を含むオブジェクト
 *
 * @example
 * ```tsx
 * const { contentRef, getVisibleEventCount } = useEventVisibility({
 *   eventHeight: 32,
 *   eventGap: 4
 * });
 *
 * const events = [...]; // イベントの配列
 * const visibleCount = getVisibleEventCount(events.length);
 *
 * return (
 *   <div ref={contentRef} className="calendar-cell">
 *     {events.slice(0, visibleCount).map(event => (
 *       <div key={event.id}>{event.title}</div>
 *     ))}
 *     {visibleCount < events.length && (
 *       <button>+ 他{events.length - visibleCount}件</button>
 *     )}
 *   </div>
 * );
 * ```
 *
 * @example
 * コンテナ高さ140px、イベント高さ30px、隙間4pxの場合：
 * - 1イベント分の必要高さ = 30 + 4 = 34px
 * - 最大表示可能数 = Math.floor(140 / 34) = 4件
 * - 総イベント数が3件 → 3件すべて表示
 * - 総イベント数が6件 → 3件表示 + 「もっと見る」ボタン
 */
export function useEventVisibility({
  eventHeight,
  eventGap,
}: EventVisibilityOptions): EventVisibilityResult {
  /** 高さ計測対象 */
  const contentRef = useRef<HTMLDivElement>(null);
  /** 使い回すための ResizeObserver 保持 */
  const observerRef = useRef<ResizeObserver | null>(null);
  /** 現在のコンテンツ高さ */
  const [contentHeight, setContentHeight] = useState<number | null>(null);

  /**
   * コンテナの高さを測定し、リサイズ時の再計算を設定
   * useLayoutEffectを使用して描画前に同期的に実行し、ちらつきを防止
   */
  useLayoutEffect(() => {
    if (!contentRef.current) return;

    /**
     * コンテナの高さを測定してstateを更新する関数
     * clientHeightを使用してpaddingを含む内部の高さを取得
     */
    const updateHeight = () => {
      if (contentRef.current) {
        setContentHeight(contentRef.current.clientHeight);
      }
    };

    // 初回の高さ測定
    updateHeight();

    // ResizeObserver が利用可能な環境でのみ設定
    if (!observerRef.current && typeof ResizeObserver !== "undefined") {
      // 要素のサイズが変わった時に updateHeight を実行するオブザーバーを作成
      observerRef.current = new ResizeObserver(() => {
        updateHeight();
      });
    }

    // 監視開始
    observerRef.current?.observe(contentRef.current);

   // クリーンアップ：コンポーネントのアンマウント時に監視を停止
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  /**
   * 表示可能なイベント数を計算する関数
   * contentHeight、eventHeight、eventGapが変更された時のみ再計算
   */
  const getVisibleEventCount = useMemo(() => {
    /**
     * 総イベント数から表示可能な件数を計算
     *
     * @param totalEvents - 表示したい総イベント数
     * @returns 実際に表示すべきイベント数
     *
     * 計算ロジック：
     * 1. まだ高さが測定されていない場合は全件表示
     * 2. 1イベント分の必要高さ = イベント高さ + 隙間
     * 3. 最大表示可能数 = コンテナ高さ ÷ 1イベント分の高さ（切り下げ）
     * 4. 全件表示できる場合：そのまま全件
     * 5. 表示しきれない場合：「もっと見る」ボタン分を考慮して1件減らす
     */
    return (totalEvents: number): number => {
      // 高さが測定されていない場合は全件表示
      if (!contentHeight) return totalEvents;

      // 1つのイベントが占める高さ（イベント本体 + 隙間）
      const slot = eventHeight + eventGap;
      // 異常値の場合は全件表示（ゼロ除算防止）
      if (slot <= 0) return totalEvents;

      // コンテナに収まる最大イベント数を計算
      const maxEvents = Math.floor(contentHeight / slot);

      // 収まるなら全件表示
      if (totalEvents <= maxEvents) return totalEvents;
      // 収まらないなら「もっと見る」分を考慮して1件減らす
      return maxEvents > 0 ? maxEvents - 1 : 0;
    };
  }, [contentHeight, eventHeight, eventGap]);

  return {
    contentRef,
    contentHeight,
    getVisibleEventCount,
  } as EventVisibilityResult;
}
