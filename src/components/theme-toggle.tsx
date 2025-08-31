"use client";

import { RiMoonClearLine, RiSunLine } from "@remixicon/react";
import { useTheme } from "next-themes";
import { useId, useState, useCallback } from "react";

/**
 * テーマ切り替えトグルボタン
 *
 * - `light` / `dark` / `system` の3モードを順番に切り替える
 * - `system` の場合は、OSの設定に従ってライト/ダークが自動適用される
 * - `smartToggle` 関数で、現在の状態とOS設定を考慮して次のモードを決定
 *
 * 表示ルール:
 * - ライトモード → 太陽アイコン
 * - ダークモード → 月アイコン
 */
export default function ThemeToggle() {
  const id = useId();
  const { theme, setTheme } = useTheme();

  // 現在のモードが "system" かどうか
  const [system, setSystem] = useState(false);

  /**
   * 現在のテーマ状態と OS のカラースキーム設定をもとに
   * 次に適用するテーマを決める（右上から円形に広がるアニメーション付き）
   *
   * 動作の流れ:
   * 1. 現在 system → OS設定と逆のテーマに変更（system解除）
   * 2. 現在 light/dark で OS設定と異なる → 反対テーマに変更
   * 3. それ以外 → system モードに戻す
   */
  const smartToggle = useCallback(() => {
    // アニメーションスタイルを注入
    const styleId = `theme-transition-${Date.now()}`;
    const style = document.createElement("style");
    style.id = styleId;

    // 右上から円形に広がるアニメーション
    const css = `
      @supports (view-transition-name: root) {
        ::view-transition-old(root) { 
          animation: none;
        }
        ::view-transition-new(root) {
          animation: circle-expand 0.5s ease-out;
        }
        @keyframes circle-expand {
          from {
            clip-path: circle(0% at 100% 0%);
          }
          to {
            clip-path: circle(150% at 100% 0%);
          }
        }
      }
    `;

    style.textContent = css;
    document.head.appendChild(style);

    // アニメーション完了後にスタイルを削除
    setTimeout(() => {
      const styleEl = document.getElementById(styleId);
      if (styleEl) {
        styleEl.remove();
      }
    }, 800);

    const updateTheme = () => {
      const prefersDarkScheme = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;

      if (theme === "system") {
        // system の場合は OS 設定の逆にする
        setTheme(prefersDarkScheme ? "light" : "dark");
        setSystem(false);
      } else if (
        (theme === "light" && !prefersDarkScheme) ||
        (theme === "dark" && prefersDarkScheme)
      ) {
        // 現在のテーマと OS の設定が同じ場合 → 反対に切り替え
        setTheme(theme === "light" ? "dark" : "light");
        setSystem(false);
      } else {
        // それ以外は system に戻す
        setTheme("system");
        setSystem(true);
      }
    };

    // View Transitions APIを使用
    if ("startViewTransition" in document && document.startViewTransition) {
      document.startViewTransition(updateTheme);
    } else {
      updateTheme();
    }
  }, [theme, setTheme, setSystem]);

  return (
    <div className="flex flex-col justify-center">
      {/* 視覚的には非表示のチェックボックス。systemモード管理に使用 */}
      <input
        type="checkbox"
        name="theme-toggle"
        id={id}
        className="peer sr-only"
        checked={system}
        onChange={smartToggle}
        aria-label="Toggle dark mode"
      />

      {/* 見た目の切替ボタン */}
      <label
        className="text-muted-foreground/80 hover:text-foreground/80 rounded peer-focus-visible:border-ring peer-focus-visible:ring-ring/50 relative inline-flex size-8 cursor-pointer items-center justify-center transition-[color,box-shadow] outline-none peer-focus-visible:ring-[3px]"
        htmlFor={id}
        aria-hidden="true"
      >
        {/* ライトモード時のアイコン */}
        <RiSunLine className="dark:hidden" size={20} aria-hidden="true" />

        {/* ダークモード時のアイコン */}
        <RiMoonClearLine
          className="hidden dark:block"
          size={20}
          aria-hidden="true"
        />

        {/* SR向け説明 */}
        <span className="sr-only">Switch to system/light/dark version</span>
      </label>
    </div>
  );
}
