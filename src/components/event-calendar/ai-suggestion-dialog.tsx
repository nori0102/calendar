"use client";

import { useState } from "react";
import { SparklesIcon, ClockIcon, MapPinIcon, LoaderIcon, RefreshCwIcon } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { addHoursToDate } from "@/components/event-calendar";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * AI提案のイベント情報を表す型
 */
interface AISuggestion {
  /** 提案のユニークID */
  id: string;
  /** イベントのタイトル */
  title: string;
  /** イベントの詳細説明 */
  description: string;
  /** イベントの開催場所 */
  location: string;
  /** イベントのカテゴリー（リラックス、学習、アクティブ、社交） */
  category: "relax" | "learning" | "active" | "social";
}

/**
 * AI提案ダイアログコンポーネントのProps型定義
 */
interface AISuggestionDialogProps {
  /** ダイアログの表示状態 */
  isOpen: boolean;
  /** 選択された日付 */
  selectedDate: Date;
  /** 選択された時刻（オプション） */
  selectedTime?: Date;
  /** ダイアログを閉じる時のコールバック */
  onClose: () => void;
  /** AI提案が選択された時のコールバック */
  onSuggestionSelect: (
    suggestion: AISuggestion,
    timeInfo: { startTime: string; endTime: string }
  ) => void;
  /** 手動作成が選択された時のコールバック */
  onManualCreate: () => void;
}

/**
 * 場所選択のオプション設定
 * ユーザーが選択できる場所の種類を定義
 */
const locationOptions = [
  { value: "anywhere", label: "✨ どこでもOK", icon: "✨" },
  { value: "home", label: "🏠 自宅・家の中", icon: "🏠" },
  { value: "nearby", label: "🚶 近所（徒歩圏内）", icon: "🚶" },
  { value: "outdoor", label: "🌳 屋外・公園", icon: "🌳" },
  { value: "cafe", label: "☕ カフェ・お店", icon: "☕" },
  { value: "library", label: "📚 図書館・静かな場所", icon: "📚" },
  { value: "gym", label: "💪 ジム・運動施設", icon: "💪" },
  { value: "custom", label: "➕ その他（カスタム入力）", icon: "➕" },
];

/**
 * カテゴリー別のスタイル設定
 * 各イベントカテゴリーごとの色とスタイルを定義
 */
const categoryStyles = {
  /** リラックス系のイベント（緑系統） */
  relax: {
    bg: "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/50",
    border: "border-emerald-200/60 dark:border-emerald-800/60",
    icon: "bg-emerald-100/80 dark:bg-emerald-900/40",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    text: "text-emerald-700 dark:text-emerald-300",
    hover: "hover:bg-emerald-100/60 dark:hover:bg-emerald-900/50",
  },
  /** 学習系のイベント（青系統） */
  learning: {
    bg: "bg-blue-50/80 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/50",
    border: "border-blue-200/60 dark:border-blue-800/60",
    icon: "bg-blue-100/80 dark:bg-blue-900/40",
    iconColor: "text-blue-600 dark:text-blue-400",
    text: "text-blue-700 dark:text-blue-300",
    hover: "hover:bg-blue-100/60 dark:hover:bg-blue-900/50",
  },
  /** アクティブ系のイベント（オレンジ系統） */
  active: {
    bg: "bg-orange-50/80 dark:bg-orange-950/30 border-orange-100 dark:border-orange-900/50",
    border: "border-orange-200/60 dark:border-orange-800/60",
    icon: "bg-orange-100/80 dark:bg-orange-900/40",
    iconColor: "text-orange-600 dark:text-orange-400",
    text: "text-orange-700 dark:text-orange-300",
    hover: "hover:bg-orange-100/60 dark:hover:bg-orange-900/50",
  },
  /** 社交系のイベント（紫系統） */
  social: {
    bg: "bg-purple-50/80 dark:bg-purple-950/30 border-purple-100 dark:border-purple-900/50",
    border: "border-purple-200/60 dark:border-purple-800/60",
    icon: "bg-purple-100/80 dark:bg-purple-900/40",
    iconColor: "text-purple-600 dark:text-purple-400",
    text: "text-purple-700 dark:text-purple-300",
    hover: "hover:bg-purple-100/60 dark:hover:bg-purple-900/50",
  },
};

/**
 * モックデータ（開発・フォールバック用）
 * API呼び出しが失敗した場合やテスト時に使用される提案データ
 */
const mockSuggestions: AISuggestion[] = [
  {
    id: "1",
    title: "読書タイム",
    description: "好きな本をゆっくり読んでリラックスする時間。コーヒーや紅茶と一緒に楽しんでみてください。",
    location: "自宅のリビング",
    category: "relax"
  },
  {
    id: "2",
    title: "新しいカフェ探索",
    description: "気になっていたカフェを訪れて、新しいメニューを試してみる冒険時間。",
    location: "徒歩10分圏内のカフェ",
    category: "social"
  },
  {
    id: "3",
    title: "YouTubeでスキル学習",
    description: "興味のある分野の動画を見て新しい知識やスキルを身につける時間。",
    location: "自宅",
    category: "learning"
  }
];

/**
 * AIによるイベント提案ダイアログコンポーネント
 *
 * ユーザーが指定した日時と条件に基づいて、AIが最適なイベントを提案するダイアログです。
 * 時間設定、場所の指定、カテゴリー別の提案表示などの機能を提供し、
 * OpenAI APIを使用してパーソナライズされた提案を生成します。
 *
 * @param props - コンポーネントのプロパティ
 * @param props.isOpen - ダイアログの表示状態
 * @param props.selectedDate - 提案対象の日付
 * @param props.selectedTime - 初期設定する時刻（オプション）
 * @param props.onClose - ダイアログを閉じる時のコールバック
 * @param props.onSuggestionSelect - AI提案を選択した時のコールバック
 * @param props.onManualCreate - 手動作成を選択した時のコールバック
 *
 * @example
 * ```tsx
 * const handleSuggestionSelect = (suggestion, timeInfo) => {
 *   // 選択された提案でイベントを作成
 *   createEvent({
 *     title: suggestion.title,
 *     description: suggestion.description,
 *     startTime: timeInfo.startTime,
 *     endTime: timeInfo.endTime,
 *   });
 * };
 *
 * <AISuggestionDialog
 *   isOpen={isDialogOpen}
 *   selectedDate={new Date('2025-08-25')}
 *   selectedTime={new Date('2025-08-25T14:00')}
 *   onClose={() => setIsDialogOpen(false)}
 *   onSuggestionSelect={handleSuggestionSelect}
 *   onManualCreate={() => openManualCreateDialog()}
 * />
 * ```
 *
 * @example
 * 機能説明：
 * - 時間設定: 開始・終了時刻をセレクトボックスで選択
 * - 場所指定: 予定義された場所またはカスタム入力
 * - AI提案: OpenAI APIを使用したパーソナライズ提案
 * - カテゴリー別表示: relax, learning, active, social の4カテゴリー
 * - エラーハンドリング: API失敗時はモックデータでフォールバック
 */
export function AISuggestionDialog({
  isOpen,
  selectedDate,
  selectedTime,
  onClose,
  onSuggestionSelect,
  onManualCreate,
}: AISuggestionDialogProps) {
  /** 開始時刻の状態管理（HH:MM形式） */
  const [startTime, setStartTime] = useState(() => {
    if (selectedTime) {
      // 10分刻みに正規化
      const normalizedTime = new Date(selectedTime);
      const minutes = Math.floor(normalizedTime.getMinutes() / 10) * 10;
      normalizedTime.setMinutes(minutes);
      return format(normalizedTime, "HH:mm");
    }
    return "14:00";
  });

  /** 終了時刻の状態管理（HH:MM形式） */
  const [endTime, setEndTime] = useState(() => {
    if (selectedTime) {
      // 10分刻みに正規化した開始時刻から1時間後
      const normalizedTime = new Date(selectedTime);
      const minutes = Math.floor(normalizedTime.getMinutes() / 10) * 10;
      normalizedTime.setMinutes(minutes);
      const endDateTime = addHoursToDate(normalizedTime, 1);
      return format(endDateTime, "HH:mm");
    }
    return "15:00";
  });

  /** 場所選択の状態管理 */
  const [location, setLocation] = useState("anywhere");

  /** カスタム場所入力の状態管理 */
  const [customLocation, setCustomLocation] = useState("");

  /** API呼び出し中の状態管理 */
  const [isLoading, setIsLoading] = useState(false);

  /** AI提案結果の状態管理 */
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);

  /** 提案生成済みフラグの状態管理 */
  const [hasGenerated, setHasGenerated] = useState(false);

  /** 選択された日付を日本語形式でフォーマット */
  const formattedDate = format(selectedDate, "M月d日(E)", { locale: ja });

  /**
   * AI提案を生成する関数
   * OpenAI APIを呼び出してイベント提案を取得し、失敗時はモックデータを使用
   *
   * @async
   * @function handleGenerateSuggestions
   *
   * @example
   * API呼び出し例：
   * POST /api/suggest-events
   * {
   *   "date": "2025-08-25",
   *   "startTime": "14:00",
   *   "endTime": "15:00",
   *   "location": "cafe",
   *   "customLocation": "スターバックス渋谷店"
   * }
   */
  const handleGenerateSuggestions = async () => {
    setIsLoading(true);

    try {
      // OpenAI APIへのリクエスト送信
      const response = await fetch('/api/suggest-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: format(selectedDate, 'yyyy-MM-dd'),
          startTime: startTime,
          endTime: endTime,
          location: location,
          customLocation: location === 'custom' ? customLocation : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      setSuggestions(data.suggestions || []);
      setHasGenerated(true);

    } catch (error) {
      console.error('Failed to generate suggestions:', error);

      // エラー時のフォールバック処理
      setSuggestions(mockSuggestions);
      setHasGenerated(true);

    } finally {
      setIsLoading(false);
    }
  };

  /**
   * AI提案を再生成する関数
   * より多様な提案を得るために再度APIを呼び出し、新しい提案を取得
   *
   * @async
   * @function handleRegenerateSuggestions
   */
  const handleRegenerateSuggestions = async () => {
    setIsLoading(true);

    try {
      // 再生成用のAPI呼び出し（多様性パラメータ付き）
      const response = await fetch('/api/suggest-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: format(selectedDate, 'yyyy-MM-dd'),
          startTime: startTime,
          endTime: endTime,
          location: location,
          customLocation: location === 'custom' ? customLocation : undefined,
          regenerate: true, // 再生成フラグ
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      setSuggestions(data.suggestions || []);

    } catch (error) {
      console.error('Failed to regenerate suggestions:', error);

      // エラー時はランダムシャッフルで多様性を確保
      const shuffled = [...mockSuggestions].sort(() => Math.random() - 0.5);
      setSuggestions(shuffled);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 開始時刻と終了時刻から所要時間を計算する関数
   * 時刻文字列から時間差を計算し、「X時間Y分」形式で返す
   *
   * @function getDuration
   * @returns {string} 計算された所要時間（例: "1時間30分"、"45分"）
   *
   * @example
   * getDuration() // startTime="14:00", endTime="15:30"
   * // → "1時間30分"
   *
   * getDuration() // startTime="23:30", endTime="01:00" (翌日)
   * // → "1時間30分"
   */
  const getDuration = () => {
    try {
      // 時刻文字列をDateオブジェクトに変換
      const startDate = new Date(`2000-01-01T${startTime.padStart(5, '0')}`);
      const endDate = new Date(`2000-01-01T${endTime.padStart(5, '0')}`);

      // 無効な時刻の場合のエラーハンドリング
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return "計算エラー";
      }

      // 時間差を分単位で計算
      let diffMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60);

      // 終了時刻が開始時刻より前の場合（翌日跨ぎ）の処理
      if (diffMinutes < 0) {
        diffMinutes += 24 * 60; // 24時間分を追加
      }

      // 時間と分を計算
      const hours = Math.floor(diffMinutes / 60);
      const minutes = Math.floor(diffMinutes % 60);

      // フォーマットして返す
      if (hours > 0 && minutes > 0) return `${hours}時間${minutes}分`;
      if (hours > 0) return `${hours}時間`;
      if (minutes > 0) return `${minutes}分`;
      return "0分";
    } catch (error) {
      return "計算エラー";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        {/* ダイアログヘッダー */}
        <DialogHeader className="pb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/20 ring-2 ring-primary/20 dark:ring-primary/30">
              <SparklesIcon className="w-6 h-6 text-primary dark:text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">
                AI予定提案
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                {formattedDate}の最適な過ごし方を提案します
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* 設定セクション - 時間・場所の設定エリア */}
          <div className="p-4 rounded-lg bg-muted/30 dark:bg-muted/60 border border-border/60 dark:border-border/80">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 時間設定 - 開始・終了時刻の選択 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <ClockIcon className="w-4 h-4" />
                  時間の設定
                </Label>
                <div className="flex items-center gap-2 text-sm">
                  <Select value={startTime} onValueChange={setStartTime}>
                    <SelectTrigger className="w-24 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => {
                        const hour = i.toString().padStart(2, "0");
                        return [`${hour}:00`, `${hour}:30`];
                      }).flat().map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-muted-foreground">〜</span>
                  <Select value={endTime} onValueChange={setEndTime}>
                    <SelectTrigger className="w-24 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => {
                        const hour = i.toString().padStart(2, "0");
                        return [`${hour}:00`, `${hour}:30`];
                      }).flat().map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                </div>
              </div>

              {/* 場所設定 - 予定義された場所またはカスタム入力 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <MapPinIcon className="w-4 h-4" />
                  場所の指定
                </Label>
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="場所を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {locationOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {location === "custom" && (
                  <Input
                    placeholder="具体的な場所を入力..."
                    value={customLocation}
                    onChange={(e) => setCustomLocation(e.target.value)}
                    className="mt-2"
                  />
                )}
              </div>
            </div>

            {/* AI提案生成ボタン */}
            <Button
              onClick={hasGenerated ? handleRegenerateSuggestions : handleGenerateSuggestions}
              disabled={isLoading}
              className="w-full mt-4 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 dark:from-primary dark:to-primary/90 dark:hover:from-primary/90 dark:hover:to-primary/80"
            >
              {isLoading ? (
                <>
                  <LoaderIcon className="w-4 h-4 mr-2 animate-spin" />
                  提案を生成中...
                </>
              ) : hasGenerated ? (
                <>
                  <RefreshCwIcon className="w-4 h-4 mr-2" />
                  新しい提案を取得
                </>
              ) : (
                <>
                  <SparklesIcon className="w-4 h-4 mr-2" />
                  この条件で提案を取得
                </>
              )}
            </Button>
          </div>

          {/* AI提案一覧 - 生成された提案の表示エリア */}
          {suggestions.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium text-foreground flex items-center gap-2">
                  あなたにおすすめの予定
                <Badge variant="secondary" className="text-xs">
                  {suggestions.length}件の提案
                </Badge>
              </h3>

              <div className="space-y-3">
                {suggestions.map((suggestion, index) => {
                  const styles = categoryStyles[suggestion.category];
                  return (
                    <div
                      key={suggestion.id}
                      className={cn(
                        "p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer group hover:shadow-md dark:hover:shadow-lg",
                        styles.bg,
                        styles.border,
                        styles.hover
                      )}
                      onClick={() => onSuggestionSelect(suggestion, { startTime, endTime })}
                    >
                      <div className="flex items-start gap-4">
                        {/* カテゴリーアイコン */}
                        <div className={cn(
                          "flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0",
                          styles.icon
                        )}>
                          <span className="text-lg">
                            {index === 0 ? "📚" : index === 1 ? "☕" : "🎥"}
                          </span>
                        </div>

                        {/* 提案内容 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className={cn("font-medium", styles.text)}>
                              {suggestion.title}
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              {getDuration()}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
                            {suggestion.description}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPinIcon className="w-3 h-3" />
                            <span>{suggestion.location}</span>
                          </div>
                        </div>

                        {/* 選択ボタン */}
                        <Button
                          size="sm"
                          variant="outline"
                          className={cn(
                            "opacity-0 group-hover:opacity-100 transition-opacity",
                            styles.text,
                            "hover:bg-background/80 dark:hover:bg-background/90 border border-current/20"
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSuggestionSelect(suggestion, { startTime, endTime });
                          }}
                        >
                          これにする
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* フッター - 戻るボタンと手動作成ボタン */}
        <div className="flex items-center gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} className="flex-1">
            戻る
          </Button>
          <Button variant="outline" onClick={onManualCreate} className="flex-1">
            手動で作成
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
