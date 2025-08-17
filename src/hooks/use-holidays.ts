"use client";

import { useEffect, useState } from "react";

/**
 * 日本の祝日データ型
 * APIレスポンス: { "YYYY-MM-DD": "祝日名" }
 */
export type HolidayData = Record<string, string>;

/**
 * 祝日情報の型
 */
export interface Holiday {
  date: string; // YYYY-MM-DD format
  name: string; // 祝日名
  dateObject: Date; // Date オブジェクト
}

/**
 * 日本の祝日データを取得・管理するカスタムフック
 * 
 * @returns {object} 祝日データと操作関数
 * - holidays: 祝日の配列
 * - holidayMap: 日付をキーとした祝日マップ
 * - isHoliday: 指定した日付が祝日かチェックする関数
 * - getHolidayName: 指定した日付の祝日名を取得する関数
 * - loading: データ取得中フラグ
 * - error: エラー情報
 */
export function useHolidays() {
  const [holidayData, setHolidayData] = useState<HolidayData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 祝日データを取得
  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch("https://holidays-jp.github.io/api/v1/date.json");
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data: HolidayData = await response.json();
        setHolidayData(data);
      } catch (err) {
        console.error("Failed to fetch holiday data:", err);
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchHolidays();
  }, []);

  // 祝日配列を生成（Date オブジェクト付き）
  const holidays: Holiday[] = Object.entries(holidayData).map(([date, name]) => ({
    date,
    name,
    dateObject: new Date(date + "T00:00:00+09:00"), // 日本時間で解釈
  }));

  // 日付文字列から祝日かどうかを判定
  const isHoliday = (date: Date | string): boolean => {
    const dateStr = typeof date === "string" ? date : formatDateToISO(date);
    return dateStr in holidayData;
  };

  // 祝日名を取得
  const getHolidayName = (date: Date | string): string | null => {
    const dateStr = typeof date === "string" ? date : formatDateToISO(date);
    return holidayData[dateStr] || null;
  };

  return {
    holidays,
    holidayMap: holidayData,
    isHoliday,
    getHolidayName,
    loading,
    error,
  };
}

/**
 * Date オブジェクトを YYYY-MM-DD 形式の文字列に変換
 * 日本時間で処理
 */
function formatDateToISO(date: Date): string {
  // 日本時間に変換して日付部分を取得
  const japanTime = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
  const year = japanTime.getFullYear();
  const month = String(japanTime.getMonth() + 1).padStart(2, "0");
  const day = String(japanTime.getDate()).padStart(2, "0");
  
  return `${year}-${month}-${day}`;
}