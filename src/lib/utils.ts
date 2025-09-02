import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Tailwind CSSクラスを結合し、競合を解決するユーティリティ関数
 * 
 * @param inputs - 結合するクラス名の配列
 * @returns マージされたクラス文字列
 * 
 * @example
 * ```ts
 * cn('px-2 py-1', 'px-4') // → 'py-1 px-4'
 * cn('bg-red-500', { 'text-white': true }) // → 'bg-red-500 text-white'
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
