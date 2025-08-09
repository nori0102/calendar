"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { etiquettes } from "@/components/big-calendar";

interface CalendarContextType {
  /**  表示中の日付 */
  currentDate: Date;
  /** 表示中の日付を設定する */
  setCurrentDate: (date: Date) => void;

  /** 表示する色ラベルの管理 */
  visibleColors: string[];
  /** 色ラベルの表示・非表示を切り替える */
  toggleColorVisibility: (color: string) => void;
  /** 色ラベルが表示されているかどうか */
  isColorVisible: (color: string | undefined) => boolean;
}

const CalendarContext = createContext<CalendarContextType | undefined>(
  undefined
);

export function useCalendarContext() {
  const context = useContext(CalendarContext);
  if (context === undefined) {
    throw new Error(
      "useCalendarContext must be used within a CalendarProvider"
    );
  }
  return context;
}

/**
 * 日付や色ラベル（タグ）の可視状態などの共有状態を管理する
 */
export function CalendarProvider({ children }: { children: ReactNode }) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // 初期状態では、etiquetteのisActiveがtrueのもののcolorをvisibleColorsに設定
  // これにより、初期表示ではアクティブな色ラベルのみが表示される
  const [visibleColors, setVisibleColors] = useState<string[]>(() => {
    /** isActiveがtrueのetiquetteのcolorを取得 */
    return etiquettes
      .filter((etiquette) => etiquette.isActive)
      .map((etiquette) => etiquette.color);
  });

  /**
   * 指定した色ラベルの表示/非表示をトグル（切り替え）する関数
   *
   * @param {string} color - 表示/非表示を切り替える色ラベル
   */
  const toggleColorVisibility = (color: string) => {
    setVisibleColors((prev) => {
      if (prev.includes(color)) {
        return prev.filter((c) => c !== color);
      } else {
        return [...prev, color];
      }
    });
  };

  /**
   * 指定された色が現在表示状態かどうかを判定する関数
   *
   * @param {string | undefined} color - 色ラベル（undefinedの場合は常に表示）
   * @returns {boolean} - 色ラベルが表示されている場合はtrue、表示されていない場合はfalse
   */
  const isColorVisible = (color: string | undefined) => {
    if (!color) return true; // 色が指定されていないイベントは常に表示
    return visibleColors.includes(color);
  };

  const value = {
    currentDate,
    setCurrentDate,
    visibleColors,
    toggleColorVisibility,
    isColorVisible,
  };

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
}
