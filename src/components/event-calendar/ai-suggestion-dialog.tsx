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

interface AISuggestion {
  id: string;
  title: string;
  description: string;
  location: string;
  category: "relax" | "learning" | "active" | "social";
}

interface AISuggestionDialogProps {
  isOpen: boolean;
  selectedDate: Date;
  selectedTime?: Date;
  onClose: () => void;
  onSuggestionSelect: (
    suggestion: AISuggestion,
    timeInfo: { startTime: string; endTime: string }
  ) => void;
  onManualCreate: () => void;
}

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

const categoryStyles = {
  relax: {
    bg: "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/50",
    border: "border-emerald-200/60 dark:border-emerald-800/60",
    icon: "bg-emerald-100/80 dark:bg-emerald-900/40",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    text: "text-emerald-700 dark:text-emerald-300",
    hover: "hover:bg-emerald-100/60 dark:hover:bg-emerald-900/50",
  },
  learning: {
    bg: "bg-blue-50/80 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/50", 
    border: "border-blue-200/60 dark:border-blue-800/60",
    icon: "bg-blue-100/80 dark:bg-blue-900/40",
    iconColor: "text-blue-600 dark:text-blue-400",
    text: "text-blue-700 dark:text-blue-300",
    hover: "hover:bg-blue-100/60 dark:hover:bg-blue-900/50",
  },
  active: {
    bg: "bg-orange-50/80 dark:bg-orange-950/30 border-orange-100 dark:border-orange-900/50",
    border: "border-orange-200/60 dark:border-orange-800/60", 
    icon: "bg-orange-100/80 dark:bg-orange-900/40",
    iconColor: "text-orange-600 dark:text-orange-400",
    text: "text-orange-700 dark:text-orange-300",
    hover: "hover:bg-orange-100/60 dark:hover:bg-orange-900/50",
  },
  social: {
    bg: "bg-purple-50/80 dark:bg-purple-950/30 border-purple-100 dark:border-purple-900/50",
    border: "border-purple-200/60 dark:border-purple-800/60",
    icon: "bg-purple-100/80 dark:bg-purple-900/40", 
    iconColor: "text-purple-600 dark:text-purple-400",
    text: "text-purple-700 dark:text-purple-300",
    hover: "hover:bg-purple-100/60 dark:hover:bg-purple-900/50",
  },
};

// モックデータ（後でAPI呼び出しに置き換え）
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

export function AISuggestionDialog({
  isOpen,
  selectedDate,
  selectedTime,
  onClose,
  onSuggestionSelect,
  onManualCreate,
}: AISuggestionDialogProps) {
  const [startTime, setStartTime] = useState(() => 
    selectedTime ? format(selectedTime, "H:mm") : "14:00"
  );
  const [endTime, setEndTime] = useState(() => {
    if (selectedTime) {
      const endDateTime = addHoursToDate(selectedTime, 1);
      return format(endDateTime, "H:mm");
    }
    return "15:00";
  });
  const [location, setLocation] = useState("anywhere");
  const [customLocation, setCustomLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);

  const formattedDate = format(selectedDate, "M月d日(E)", { locale: ja });

  const handleGenerateSuggestions = async () => {
    setIsLoading(true);
    
    try {
      // 実際のOpenAI API呼び出し
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
      
      // エラー時はフォールバック提案を表示
      setSuggestions(mockSuggestions);
      setHasGenerated(true);
      
      // ユーザーにエラーを通知（オプション）
      // toast.error('提案の生成に失敗しました。サンプル提案を表示します。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateSuggestions = async () => {
    setIsLoading(true);
    
    try {
      // 新しい提案を取得（温度パラメータを少し上げて多様性を確保）
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
      
      // エラー時はランダムシャッフル
      const shuffled = [...mockSuggestions].sort(() => Math.random() - 0.5);
      setSuggestions(shuffled);
    } finally {
      setIsLoading(false);
    }
  };

  const getDuration = () => {
    try {
      const startDate = new Date(`2000-01-01T${startTime.padStart(5, '0')}`);
      const endDate = new Date(`2000-01-01T${endTime.padStart(5, '0')}`);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return "計算エラー";
      }
      
      let diffMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60);
      
      // 終了時刻が開始時刻より前の場合（翌日の場合）
      if (diffMinutes < 0) {
        diffMinutes += 24 * 60; // 24時間分を追加
      }
      
      const hours = Math.floor(diffMinutes / 60);
      const minutes = Math.floor(diffMinutes % 60);
      
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
        <DialogHeader className="pb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/20 ring-2 ring-primary/20 dark:ring-primary/30">
              <SparklesIcon className="w-6 h-6 text-primary dark:text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">
                🤖 AI予定提案
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                {formattedDate}の最適な過ごし方を提案します
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* 設定セクション */}
          <div className="p-4 rounded-lg bg-muted/30 dark:bg-muted/60 border border-border/60 dark:border-border/80">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 時間設定 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <ClockIcon className="w-4 h-4" />
                  時間の設定
                </Label>
                <div className="flex items-center gap-2 text-sm">
                  <Select value={startTime} onValueChange={setStartTime}>
                    <SelectTrigger className="w-20 h-8">
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
                    <SelectTrigger className="w-20 h-8">
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
                  <Badge variant="outline" className="ml-2">
                    {getDuration()}
                  </Badge>
                </div>
              </div>

              {/* 場所設定 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <MapPinIcon className="w-4 h-4" />
                  場所の指定 (任意)
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

          {/* 提案一覧 */}
          {suggestions.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium text-foreground flex items-center gap-2">
                📋 あなたにおすすめの予定
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
                        <div className={cn(
                          "flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0",
                          styles.icon
                        )}>
                          <span className="text-lg">
                            {index === 0 ? "📚" : index === 1 ? "☕" : "🎥"}
                          </span>
                        </div>
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

        {/* フッター */}
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