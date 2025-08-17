"use client";

import { CalendarIcon, SparklesIcon, PlusIcon } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EventCreationChoiceDialogProps {
  isOpen: boolean;
  selectedDate: Date;
  selectedTime?: Date;
  onClose: () => void;
  onManualCreate: () => void;
  onAICreate: () => void;
}

export function EventCreationChoiceDialog({
  isOpen,
  selectedDate,
  selectedTime,
  onClose,
  onManualCreate,
  onAICreate,
}: EventCreationChoiceDialogProps) {
  const formattedDate = format(selectedDate, "M月d日(E)", { locale: ja });
  const formattedTime = selectedTime 
    ? format(selectedTime, "H:mm") 
    : "";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 bg-gradient-to-br from-slate-50/80 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-800/30 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 ring-1 ring-primary/20 dark:ring-primary/30">
              <CalendarIcon className="w-5 h-5 text-primary dark:text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">
                予定を作成
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                {formattedDate} {formattedTime && `${formattedTime}〜`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 pt-2 space-y-4">
          {/* 手動作成オプション */}
          <div className="group">
            <Button
              onClick={onManualCreate}
              variant="outline"
              className={cn(
                "w-full h-auto p-6 text-left justify-start",
                "border-2 border-dashed border-border/60",
                "hover:border-primary/50 hover:bg-primary/5",
                "dark:hover:border-primary/40 dark:hover:bg-primary/10",
                "transition-all duration-200 group-hover:shadow-md dark:group-hover:shadow-lg"
              )}
            >
              <div className="flex items-start gap-4 w-full">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-muted/50 dark:bg-muted/80 group-hover:bg-primary/10 dark:group-hover:bg-primary/20 transition-colors ring-1 ring-border/50 group-hover:ring-primary/30">
                  <PlusIcon className="w-6 h-6 text-muted-foreground dark:text-muted-foreground group-hover:text-primary dark:group-hover:text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground group-hover:text-primary dark:group-hover:text-primary">
                    手動で予定を作成
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    いつものようにタイトルや内容を自分で決めて作成します
                  </p>
                </div>
              </div>
            </Button>
          </div>

          {/* AI提案オプション */}
          <div className="group">
            <Button
              onClick={onAICreate}
              variant="outline"
              className={cn(
                "w-full h-auto p-6 text-left justify-start",
                "border-2 border-dashed border-border/60",
                "hover:border-accent-foreground/50 hover:bg-accent/50",
                "dark:hover:border-accent-foreground/40 dark:hover:bg-accent/80",
                "transition-all duration-200 group-hover:shadow-md dark:group-hover:shadow-lg",
                "relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-primary/5 before:to-accent/5 before:opacity-0 group-hover:before:opacity-100 before:transition-opacity"
              )}
            >
              <div className="flex items-start gap-4 w-full">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/20 group-hover:from-primary/20 group-hover:to-accent/20 dark:group-hover:from-primary/30 dark:group-hover:to-accent/30 transition-all ring-1 ring-primary/20 dark:ring-primary/30 group-hover:ring-primary/40 relative z-10">
                  <SparklesIcon className="w-6 h-6 text-primary dark:text-primary group-hover:scale-110 transition-transform" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-foreground group-hover:text-primary dark:group-hover:text-primary relative z-10">
                      AIにおすすめを提案してもらう
                    </h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/15 text-primary dark:bg-primary/25 dark:text-primary ring-1 ring-primary/30 relative z-10">
                      NEW
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    この時間に適した予定を3つ提案します。趣味がない方にも最適です
                  </p>
                </div>
              </div>
            </Button>
          </div>
        </div>

        <div className="p-6 pt-0">
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="w-full text-muted-foreground hover:text-foreground"
          >
            キャンセル
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}