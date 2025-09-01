import { useState, useEffect, useCallback } from "react";
import { etiquettes } from "@/components/big-calendar";

const STORAGE_KEY = "editableEtiquettes";

// 型定義
interface EditableEtiquette {
  id: string;
  name: string;
  color: string;
  isActive: boolean;
}

export function useEditableEtiquettes() {
  const [editableEtiquettes, setEditableEtiquettes] = useState<EditableEtiquette[]>(etiquettes);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  // LocalStorageから読み込み - エラーハンドリング追加
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // データの妥当性をチェック
        if (Array.isArray(parsed) && parsed.length > 0) {
          setEditableEtiquettes(parsed);
        }
      }
    } catch (error) {
      console.warn("保存されたデータの読み込みに失敗しました:", error);
      // デフォルトデータにフォールバック
      setEditableEtiquettes(etiquettes);
    }
  }, []);

  // LocalStorageに保存 - エラーハンドリング追加
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(editableEtiquettes));
    } catch (error) {
      console.error("データの保存に失敗しました:", error);
    }
  }, [editableEtiquettes]);

  // 編集開始 - パフォーマンス最適化
  const startEdit = useCallback((item: EditableEtiquette) => {
    setEditingId(item.id);
    setEditingName(item.name);
  }, []);

  // 編集保存 - パフォーマンス最適化
  const saveEdit = useCallback(() => {
    if (editingId && editingName.trim()) {
      setEditableEtiquettes((prev) =>
        prev.map((item) =>
          item.id === editingId ? { ...item, name: editingName.trim() } : item
        )
      );
    }
    setEditingId(null);
    setEditingName("");
  }, [editingId, editingName]);

  // 編集キャンセル - パフォーマンス最適化
  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditingName("");
  }, []);

  // キー操作 - パフォーマンス最適化
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      saveEdit();
    } else if (e.key === "Escape") {
      cancelEdit();
    }
  }, [saveEdit, cancelEdit]);

  return {
    editableEtiquettes,
    editingId,
    editingName,
    setEditingName,
    startEdit,
    saveEdit,
    cancelEdit,
    handleKeyPress,
  };
}

export type { EditableEtiquette };