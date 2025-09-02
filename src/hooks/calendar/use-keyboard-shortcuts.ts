import { useEffect } from "react";
import { CalendarView } from "@/components/event-calendar";

interface UseKeyboardShortcutsProps {
  isEventDialogOpen: boolean;
  isChoiceDialogOpen: boolean;
  isAISuggestionOpen: boolean;
  setView: (view: CalendarView) => void;
}

/**
 * カレンダーのキーボードショートカット機能を提供するカスタムフック
 * 
 * キーボードショートカット一覧:
 * - 1: 月表示
 * - 2: 週表示
 * - 3: 日表示
 * - 4: アジェンダ表示
 * 
 * @param params - ショートカット処理に必要なプロパティ
 * 
 * @example
 * ```tsx
 * useKeyboardShortcuts({
 *   isEventDialogOpen,
 *   isChoiceDialogOpen,
 *   isAISuggestionOpen,
 *   setView
 * });
 * ```
 */
export function useKeyboardShortcuts({
  isEventDialogOpen,
  isChoiceDialogOpen,
  isAISuggestionOpen,
  setView,
}: UseKeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        isEventDialogOpen ||
        isChoiceDialogOpen ||
        isAISuggestionOpen ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case "m":
          setView("month");
          break;
        case "w":
          setView("week");
          break;
        case "d":
          setView("day");
          break;
        case "a":
          setView("agenda");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEventDialogOpen, isChoiceDialogOpen, isAISuggestionOpen, setView]);
}