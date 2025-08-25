import dynamic from "next/dynamic";

// 重いダイアログコンポーネントの遅延読み込み
export const LazyEventDialog = dynamic(
  () => import("./event-dialog").then((mod) => ({ default: mod.EventDialog })),
  {
    loading: () => <div className="animate-pulse h-96 bg-gray-200 rounded-lg" />,
  }
);

export const LazyAISuggestionDialog = dynamic(
  () => import("./ai-suggestion-dialog").then((mod) => ({ default: mod.AISuggestionDialog })),
  {
    loading: () => <div className="animate-pulse h-96 bg-gray-200 rounded-lg" />,
  }
);

export const LazyEventCreationChoiceDialog = dynamic(
  () => import("./event-creation-choice-dialog").then((mod) => ({ default: mod.EventCreationChoiceDialog })),
  {
    loading: () => <div className="animate-pulse h-64 bg-gray-200 rounded-lg" />,
  }
);