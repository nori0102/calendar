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
      <DialogContent className="max-w-sm mx-4 p-0">
        {/* Header */}
        <DialogHeader className="p-4 pb-3 bg-gradient-to-br from-slate-50/80 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-800/30 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 ring-1 ring-primary/20 dark:ring-primary/30">
              <CalendarIcon className="w-5 h-5 text-primary dark:text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                予定を作成
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                {formattedDate} {formattedTime && `${formattedTime}〜`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Options */}
        <div className="p-4 space-y-3">
          {/* Manual Create */}
          <div className="group">
            <Button
              onClick={onManualCreate}
              variant="outline"
              className="w-full p-4 h-auto text-left justify-start hover:bg-primary/5 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center gap-3 w-full">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <PlusIcon className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-foreground">手動で作成</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    タイトルや内容を自分で入力
                  </div>
                </div>
              </div>
            </Button>
          </div>

          {/* AI Create */}
          <div className="group">
            <Button
              onClick={onAICreate}
              variant="outline"
              className="w-full p-4 h-auto text-left justify-start hover:bg-primary/5 hover:border-primary/50 transition-colors relative"
            >
              <div className="flex items-center gap-3 w-full">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <SparklesIcon className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">AI提案</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    3つの提案から選択
                  </div>
                </div>
              </div>
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 pt-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full text-muted-foreground"
          >
            キャンセル
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
