# カレンダーアプリ

Next.js 製のカレンダーアプリケーションです。AI 予定提案機能付き。

## 機能

- 📅 月/週/日/アジェンダビューの切り替え
- ✨ イベントの作成・編集・削除
- 🤖 AI 予定提案機能（OpenAI GPT-4o mini）
- 🌓 ダーク/ライトモード対応
- 📱 レスポンシブデザイン

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

- **フレームワーク：** Next.js 15.4.2
- **言語：** TypeScript
- **スタイリング：** Tailwind CSS
- **UI コンポーネント：** shadcn/ui
- **日付操作：** date-fns
- **AI：** OpenAI GPT-4o mini
- **通知：** Sonner
