# Yotei (予定) - カレンダーアプリ

Next.js 製のモダンなカレンダーアプリケーションです。AI 予定提案機能付き。

## 機能

- 📅 月/週/日/アジェンダビューの切り替え
- ✨ イベントの作成・編集・削除（ドラッグ&ドロップ対応）
- 🎨 カラーカテゴリによるイベント分類
- 🏖️ 日本の祝日自動表示
- 🤖 AI 予定提案機能（OpenAI GPT-4o mini）
- 🌓 ダーク/ライトモード対応
- 📱 レスポンシブデザイン
- 💾 ローカルストレージによるデータ永続化
- 🔔 イベント操作時のトースト通知

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. OpenAI API キーの設定（AI 提案機能を使う場合）

1. [OpenAI Platform](https://platform.openai.com/api-keys) で API キーを取得
2. プロジェクトルートに `.env.local` ファイルを作成
3. 以下の内容を記述：

```bash
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**注意：** API キーは秘密情報です。Git にコミットしないでください（`.gitignore`で除外済み）

### 3. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開いてアプリを使用できます。

## AI 予定提案機能の使い方

1. カレンダー上の空きスロットをクリック
2. 「AI におすすめを提案してもらう」を選択
3. 時間と場所を設定
4. 「この条件で提案を取得」をクリック
5. 3 つの提案から選択してイベント作成

**API キー未設定時：** モック提案が表示されます（開発・テスト用）

## 技術スタック

- **フレームワーク：** Next.js 15.4.2 (App Router)
- **言語：** TypeScript
- **スタイリング：** Tailwind CSS
- **UI コンポーネント：** shadcn/ui + Radix UI
- **日付操作：** date-fns
- **ドラッグ&ドロップ：** @dnd-kit
- **アニメーション：** Framer Motion
- **アイコン：** Lucide React + Remix Icon
- **AI：** OpenAI GPT-4o mini
- **通知：** Sonner
- **祝日データ：** holidays-jp API

## プロジェクト構成

```
src/
├── app/                    # Next.js App Router
│   ├── api/
│   │   └── suggest-events/ # AI予定提案API
│   ├── layout.tsx          # ルートレイアウト
│   └── page.tsx           # ホームページ（カレンダー）
│
├── components/
│   ├── event-calendar/     # カレンダーコンポーネント群
│   │   ├── views/
│   │   │   ├── month-view.tsx    # 月表示
│   │   │   ├── week-view.tsx     # 週表示
│   │   │   ├── day-view.tsx      # 日表示
│   │   │   └── agenda-view.tsx   # アジェンダ表示
│   │   ├── dialogs/
│   │   │   ├── event-dialog.tsx               # イベント作成・編集
│   │   │   ├── ai-suggestion-dialog.tsx       # AI提案
│   │   │   └── event-creation-choice-dialog.tsx # 作成方法選択
│   │   ├── event-calendar.tsx    # メインカレンダー
│   │   ├── event-item.tsx        # イベント表示
│   │   ├── draggable-event.tsx   # ドラッグ可能イベント
│   │   └── utils/               # カレンダー用ユーティリティ
│   ├── ui/                # shadcn/ui コンポーネント
│   ├── app-sidebar.tsx    # サイドバー
│   └── big-calendar.tsx   # カレンダー統合コンポーネント
│
├── contexts/              # React Context
│   ├── calendar-context.tsx     # カレンダー状態管理
│   └── calendar-dnd-context.tsx # ドラッグ&ドロップ状態
│
├── hooks/                # カスタムフック
│   ├── calendar/         # カレンダー専用
│   │   ├── use-event-handlers.ts    # イベント操作
│   │   ├── use-navigation.ts        # ナビゲーション
│   │   ├── use-keyboard-shortcuts.ts # キーボードショートカット
│   │   └── use-current-time-indicator.ts # 現在時刻表示
│   ├── use-holidays.ts   # 祝日データ取得
│   ├── use-local-storage.ts # ローカルストレージ
│   └── use-mobile.ts     # モバイル判定
│
├── lib/                  # ユーティリティ関数
│   ├── utils.ts         # 汎用ユーティリティ
│   └── calendar-utils.ts # カレンダー専用ユーティリティ
│
├── providers/           # プロバイダー
│   └── theme-provider.tsx # テーマ管理
│
└── types/               # TypeScript型定義
    ├── calendar.ts      # カレンダー関連の型
    └── index.ts         # 型のエクスポート
```

## 主要な機能とファイル

| 機能 | 主なファイル |
|------|-------------|
| カレンダー表示 | `components/event-calendar/` |
| イベント管理 | `hooks/calendar/use-event-handlers.ts` |
| AI予定提案 | `app/api/suggest-events/route.ts` |
| 祝日表示 | `hooks/use-holidays.ts` |
| ドラッグ&ドロップ | `contexts/calendar-dnd-context.tsx` |
| データ永続化 | `hooks/use-local-storage.ts` |

## 開発時のコマンド

```bash
npm run dev      # 開発サーバー起動
npm run build    # プロダクションビルド
npm run start    # プロダクションサーバー起動
npm run lint     # ESLint実行
```
