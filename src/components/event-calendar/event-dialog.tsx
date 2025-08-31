"use client";

import { useEffect, useMemo, useState } from "react";
import { RiCalendarLine, RiDeleteBinLine } from "@remixicon/react";
import { format, isBefore } from "date-fns";

import type { CalendarEvent, EventColor } from "@/components/event-calendar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  StartHour,
  EndHour,
  DefaultStartHour,
  DefaultEndHour,
} from "@/components/event-calendar/constants";

/**
 * イベント作成/編集ダイアログのプロパティ。
 *
 * @property event - 編集対象イベント。`null` の場合は新規作成モード。
 * @property isOpen - ダイアログ表示フラグ。
 * @property onClose - ダイアログを閉じる時に呼ばれるハンドラ（保存/削除以外のクローズ）。
 * @property onSave - フォーム内容を {@link CalendarEvent} として保存（新規/更新を呼び分けるのは親側）。
 * @property onDelete - 既存イベント削除時に呼ばれる（`event.id` 必須）。
 */
interface EventDialogProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
  onDelete: (eventId: string) => void;
}

/**
 * カレンダーのイベントを作成/編集するダイアログ。
 *
 * - 日付は `Calendar`（単一選択）、時間は **10分刻み** の `Select` を使用。
 * - 時間帯イベントは `StartHour`〜`EndHour` の範囲チェックを行い、終日（All day）の場合は 00:00〜23:59:59 として保存。
 * - `end` が `start` より前にならないようバリデーション（同時刻はOK）。
 * - タイトル未入力時は `"（タイトルなし）"` を補完。
 * - 既存イベントには削除ボタンを表示。
 *
 * @remarks
 * - 時間選択肢の生成は初回マウント時のみ（`useMemo`）で最適化。
 * - `EndHour` も選択肢に含めています（例：`StartHour=7, EndHour=24` なら 24:00 をラベル上は表示）。運用で「終了は end-exclusive」にしたい場合は調整してください。
 * - i18n の日付/時刻フォーマットは `date-fns/format` を使用。必要に応じて `locale` を適用してください。
 *
 * @example
 * ```tsx
 * <EventDialog
 *   event={editingEvent}
 *   isOpen={open}
 *   onClose={() => setOpen(false)}
 *   onSave={(e) => upsertEvent(e)}
 *   onDelete={(id) => removeEvent(id)}
 * />
 * ```
 */
export function EventDialog({
  event,
  isOpen,
  onClose,
  onSave,
  onDelete,
}: EventDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState(`${DefaultStartHour}:00`);
  const [endTime, setEndTime] = useState(`${DefaultEndHour}:00`);
  const [allDay, setAllDay] = useState(false);
  const [location, setLocation] = useState("");
  const [color, setColor] = useState<EventColor>("blue");
  const [error, setError] = useState<string | null>(null);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  // モード切替（編集/新規）に応じてフォーム初期化
  useEffect(() => {
    if (event) {
      setTitle(event.title || "");
      setDescription(event.description || "");

      const start = new Date(event.start);
      const end = new Date(event.end);

      setStartDate(start);
      setEndDate(end);
      setStartTime(formatTimeForInput(start));
      setEndTime(formatTimeForInput(end));
      setAllDay(event.allDay || false);
      setLocation(event.location || "");
      setColor((event.color as EventColor) || "blue");
      setError(null);
    } else {
      resetForm();
    }
  }, [event]);

  /** 新規作成モードの初期値にリセット */
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStartDate(new Date());
    setEndDate(new Date());
    setStartTime(`${DefaultStartHour}:00`);
    setEndTime(`${DefaultEndHour}:00`);
    setAllDay(false);
    setLocation("");
    setColor("blue");
    setError(null);
  };

  /** `Date` を `HH:mm`（10分刻み）に整形してセレクト値に使う */
  const formatTimeForInput = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = Math.floor(date.getMinutes() / 10) * 10;
    return `${hours}:${minutes.toString().padStart(2, "0")}`;
    // ↑ 分は切り捨てで 10 分刻みに正規化。必要なら四捨五入に変更可。
  };

  /** 時刻選択肢（StartHour〜EndHour、10分刻み） */
  const timeOptions = useMemo(() => {
    const options = [];
    for (let hour = StartHour; hour <= EndHour; hour++) {
      // 24時の場合は00分のみ（24:05~24:55を除外）
      const maxMinute = hour === 24 ? 0 : 59;
      for (let minute = 0; minute <= maxMinute; minute += 10) {
        const formattedHour = hour.toString().padStart(2, "0");
        const formattedMinute = minute.toString().padStart(2, "0");
        const value = `${formattedHour}:${formattedMinute}`;
        const label = `${formattedHour}:${formattedMinute}`;
        options.push({ value, label });
      }
    }
    return options;
  }, []);

  /** 保存クリック：入力値を CalendarEvent にまとめて onSave */
  const handleSave = () => {
    // タイトル必須チェック
    if (!title.trim()) {
      setError("タイトルを入力してください");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (!allDay) {
      const [startHours = 0, startMinutes = 0] = startTime
        .split(":")
        .map(Number);
      const [endHours = 0, endMinutes = 0] = endTime.split(":").map(Number);

      // 時間帯の範囲チェック（必要に応じて end-exclusive に調整）
      if (
        startHours < StartHour ||
        startHours > EndHour ||
        endHours < StartHour ||
        endHours > EndHour
      ) {
        setError(
          `選択した時刻は${StartHour}:00から${EndHour}:00の間で入力してください`
        );
        return;
      }

      start.setHours(startHours, startMinutes, 0);
      end.setHours(endHours, endMinutes, 0);
    } else {
      // 終日は日付全体をカバー
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    }

    // 日付整合性（end >= start）
    if (isBefore(end, start)) {
      setError("終了日は開始日より前に設定できません");
      return;
    }

    onSave({
      id: event?.id || "",
      title: title.trim(),
      description,
      start,
      end,
      allDay,
      location,
      color,
    });
  };

  /** 削除確認後の実際の削除処理 */
  const handleConfirmDelete = () => {
    if (event?.id) {
      onDelete(event.id);
    }
  };

  // カラー候補（EventColor に準拠）
  const colorOptions: Array<{
    value: EventColor;
    label: string;
    bgClass: string;
    borderClass: string;
  }> = [
    {
      value: "blue",
      label: "Blue",
      bgClass: "bg-blue-400 data-[state=checked]:bg-blue-400",
      borderClass: "border-blue-400 data-[state=checked]:border-blue-400",
    },
    {
      value: "violet",
      label: "Violet",
      bgClass: "bg-violet-400 data-[state=checked]:bg-violet-400",
      borderClass: "border-violet-400 data-[state=checked]:border-violet-400",
    },
    {
      value: "emerald",
      label: "Emerald",
      bgClass: "bg-emerald-400 data-[state=checked]:bg-emerald-400",
      borderClass: "border-emerald-400 data-[state=checked]:border-emerald-400",
    },
    {
      value: "orange",
      label: "Orange",
      bgClass: "bg-orange-400 data-[state=checked]:bg-orange-400",
      borderClass: "border-orange-400 data-[state=checked]:border-orange-400",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {event?.id ? "イベント編集" : "イベント作成"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {event?.id
              ? "このイベントの詳細を編集"
              : "新しいイベントをカレンダーに追加"}
          </DialogDescription>
        </DialogHeader>

        {/* バリデーションエラー */}
        {error && (
          <div className="bg-destructive/15 text-destructive rounded-md px-3 py-2 text-sm">
            {error}
          </div>
        )}

        {/* 本文フォーム */}
        <div className="grid gap-4 py-4">
          <div className="*:not-first:mt-1.5">
            <Label htmlFor="title">タイトル</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="*:not-first:mt-1.5">
            <Label htmlFor="description">説明</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Start */}
          <div className="flex gap-4">
            <div className="flex-1 *:not-first:mt-1.5">
              <Label htmlFor="start-date">開始日</Label>
              <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="start-date"
                    variant={"outline"}
                    className={cn(
                      "group bg-background hover:bg-background border-input w-full justify-between px-3 font-normal outline-offset-0 outline-none focus-visible:outline-[3px]",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "truncate",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      {startDate
                        ? format(startDate, "yyyy年 M月d日")
                        : "日付を選択"}
                    </span>
                    <RiCalendarLine
                      size={16}
                      className="text-muted-foreground/80 shrink-0"
                      aria-hidden="true"
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    defaultMonth={startDate}
                    onSelect={(date) => {
                      if (date) {
                        setStartDate(date);
                        // 終了日が開始日より前なら開始日に揃える
                        if (isBefore(endDate, date)) {
                          setEndDate(date);
                        }
                        setError(null);
                        setStartDateOpen(false);
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {!allDay && (
              <div className="min-w-28 *:not-first:mt-1.5">
                <Label htmlFor="start-time">開始時刻</Label>
                <Select value={startTime} onValueChange={setStartTime}>
                  <SelectTrigger id="start-time">
                    <SelectValue placeholder="時刻を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* End */}
          <div className="flex gap-4">
            <div className="flex-1 *:not-first:mt-1.5">
              <Label htmlFor="end-date">終了日</Label>
              <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="end-date"
                    variant={"outline"}
                    className={cn(
                      "group bg-background hover:bg-background border-input w-full justify-between px-3 font-normal outline-offset-0 outline-none focus-visible:outline-[3px]",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "truncate",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      {endDate
                        ? format(endDate, "yyyy年 M月d日")
                        : "日付を選択"}
                    </span>
                    <RiCalendarLine
                      size={16}
                      className="text-muted-foreground/80 shrink-0"
                      aria-hidden="true"
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    defaultMonth={endDate}
                    disabled={{ before: startDate }}
                    onSelect={(date) => {
                      if (date) {
                        setEndDate(date);
                        setError(null);
                        setEndDateOpen(false);
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {!allDay && (
              <div className="min-w-28 *:not-first:mt-1.5">
                <Label htmlFor="end-time">終了時刻</Label>
                <Select value={endTime} onValueChange={setEndTime}>
                  <SelectTrigger id="end-time">
                    <SelectValue placeholder="時刻を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* All day */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="all-day"
              checked={allDay}
              onCheckedChange={(checked) => setAllDay(checked === true)}
            />
            <Label htmlFor="all-day">終日</Label>
          </div>

          {/* Location */}
          <div className="*:not-first:mt-1.5">
            <Label htmlFor="location">場所</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {/* Color/Etiquette */}
          <fieldset className="space-y-4">
            <legend className="text-foreground text-sm leading-none font-medium">
              色
            </legend>
            <RadioGroup
              className="flex gap-1.5"
              defaultValue="blue"
              value={color}
              onValueChange={(value: EventColor) => setColor(value)}
            >
              {colorOptions.map((colorOption) => (
                <RadioGroupItem
                  key={colorOption.value}
                  id={`color-${colorOption.value}`}
                  value={colorOption.value}
                  aria-label={colorOption.label}
                  className={cn(
                    "size-6 shadow-none",
                    colorOption.bgClass,
                    colorOption.borderClass
                  )}
                />
              ))}
            </RadioGroup>
          </fieldset>
        </div>

        {/* Footer */}
        <DialogFooter className="flex-row sm:justify-between">
          {event?.id && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
                  size="icon"
                  aria-label="イベントを削除"
                >
                  <RiDeleteBinLine size={16} aria-hidden="true" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>イベントを削除しますか？</AlertDialogTitle>
                  <AlertDialogDescription>
                    この操作は取り消すことができません。イベント「{event?.title}」を完全に削除します。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>キャンセル</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleConfirmDelete}
                  >
                    削除
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <div className="flex flex-1 justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button onClick={handleSave}>保存</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
