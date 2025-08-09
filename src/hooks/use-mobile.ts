import { useEffect, useState } from "react";

// モバイル判定に使うブレークポイント（px単位）
const MOBILE_BREAKPOINT = 1024;

/**
 * 現在のウィンドウ幅がモバイルサイズかどうかを返すカスタムフック
 *
 * - 画面幅が MOBILE_BREAKPOINT 未満の場合に `true` を返す
 * - リサイズや画面幅変更をリアルタイムに監視
 * - サーバーサイドでは `false` を返す（初期値）
 *
 * @returns `boolean` モバイルサイズなら `true`、それ以外は `false`
 */
export function useIsMobile() {
  // undefinedで初期化 → マウント後に値が確定
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    // MediaQueryList オブジェクトを作成
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    // 画面幅に応じて isMobile を更新
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // 初期判定
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);

    // 画面幅変更イベントを監視
    mql.addEventListener("change", onChange);

    return () => {
      mql.removeEventListener("change", onChange);
    };
  }, []);

  // undefined の場合でも boolean にして返す
  return !!isMobile;
}
