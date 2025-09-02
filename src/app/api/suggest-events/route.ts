import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// 環境変数チェック
if (!process.env.OPENAI_API_KEY) {
  console.error('🚨 OPENAI_API_KEY is not set');
}

// OpenAI クライアント（セキュリティ設定付き）
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000, // 30秒タイムアウト
  maxRetries: 2,  // 最大2回リトライ
});

// 型定義
interface SuggestionRequest {
  date: string;      // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  location: string;  // 列挙型の値
  customLocation?: string;
}

interface SuggestionResponse {
  id: string;
  title: string;
  description: string;
  location: string;
  category: 'relax' | 'learning' | 'active' | 'social';
}

// OpenAI API からの提案データの型定義
interface RawSuggestion {
  title?: string;
  description?: string;
  location?: string;
}

// リクエストボディの型定義
interface RequestBody {
  date?: unknown;
  startTime?: unknown;
  endTime?: unknown;
  location?: unknown;
  customLocation?: unknown;
}

// レート制限用のメモリストア（本番では Redis 推奨）
const rateLimitStore = new Map<string, number[]>();

/**
 * レート制限チェック（IP単位で1分間に5回まで）
 * 
 * @param ip - クライアントのIPアドレス
 * @returns 制限内であればtrue、制限を超えていればfalse
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1分
  const maxRequests = 5;

  if (!rateLimitStore.has(ip)) {
    rateLimitStore.set(ip, []);
  }

  const requests = rateLimitStore.get(ip)!;

  // 古いリクエストを削除
  const validRequests = requests.filter(time => now - time < windowMs);

  if (validRequests.length >= maxRequests) {
    return false; // レート制限超過
  }

  // 新しいリクエストを記録
  validRequests.push(now);
  rateLimitStore.set(ip, validRequests);

  return true;
}

/**
 * 入力値検証
 * 
 * @param body - リクエストボディ
 * @returns 検証済みのリクエストデータまたはnull
 */
function validateInput(body: RequestBody): SuggestionRequest | null {
  const { date, startTime, endTime, location, customLocation } = body;

  // 型チェックと必須フィールドチェック
  if (typeof date !== 'string' || typeof startTime !== 'string' || 
      typeof endTime !== 'string' || typeof location !== 'string') {
    return null;
  }

  // 日付形式チェック (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return null;
  }

  // 時刻形式チェック (H:mm または HH:mm)
  if (!/^\d{1,2}:\d{2}$/.test(startTime) || !/^\d{1,2}:\d{2}$/.test(endTime)) {
    return null;
  }

  // 場所の値チェック
  const validLocations = ['anywhere', 'home', 'nearby', 'outdoor', 'cafe', 'library', 'gym', 'custom'];
  if (!validLocations.includes(location)) {
    return null;
  }

  // カスタム場所の長さチェック
  if (location === 'custom' && typeof customLocation === 'string' && customLocation.length > 50) {
    return null;
  }

  return {
    date: date.trim(),
    startTime: startTime.trim(),
    endTime: endTime.trim(),
    location: location.trim(),
    customLocation: typeof customLocation === 'string' ? customLocation.trim().slice(0, 50) : undefined
  };
}

/**
 * 場所コンテキスト生成
 * 
 * @param location - 場所の種類
 * @param customLocation - カスタム場所（任意）
 * @returns 場所に応じたコンテキスト文字列
 */
function getLocationContext(location: string, customLocation?: string): string {
  const contexts = {
    home: '自宅・家の中',
    nearby: '近所（徒歩圏内）',
    outdoor: '屋外・公園',
    cafe: 'カフェ・お店',
    library: '図書館・静かな場所',
    gym: 'ジム・運動施設',
    custom: customLocation || '指定した場所',
    anywhere: 'どこでも'
  };
  return contexts[location as keyof typeof contexts] || 'どこでも';
}

/**
 * 時間コンテキスト生成
 * 
 * @param hour - 時間（0-23）
 * @returns 時間帯に応じたコンテキスト文字列
 */
function getTimeContext(hour: number): string {
  if (hour >= 6 && hour < 12) return '朝';
  if (hour >= 12 && hour < 17) return '昼';
  if (hour >= 17 && hour < 22) return '夜';
  return '深夜・早朝';
}

/**
 * カテゴリ自動判定
 * 
 * @param title - イベントタイトル
 * @param description - イベント説明
 * @returns 判定されたカテゴリ
 */
function determineCategory(title: string, description: string): SuggestionResponse['category'] {
  const text = `${title} ${description}`.toLowerCase();

  if (text.includes('読書') || text.includes('リラックス') || text.includes('休息') || text.includes('瞑想')) {
    return 'relax';
  }
  if (text.includes('学習') || text.includes('勉強') || text.includes('スキル') || text.includes('動画')) {
    return 'learning';
  }
  if (text.includes('散歩') || text.includes('運動') || text.includes('ウォーキング')) {
    return 'active';
  }
  if (text.includes('友人') || text.includes('カフェ') || text.includes('人') || text.includes('連絡')) {
    return 'social';
  }

  return 'relax';
}

/**
 * AI予定提案APIのエンドポイント
 * 
 * @param request - Next.jsリクエストオブジェクト
 * @returns AI提案またはモック提案のレスポンス
 */
export async function POST(request: NextRequest) {
  try {
    // IP取得（プロキシ対応）
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
              request.headers.get('x-real-ip') ||
              'unknown';

    // レート制限チェック
    if (!checkRateLimit(ip)) {
      return NextResponse.json({
        error: 'Too many requests. Please try again later.'
      }, { status: 429 });
    }

    // リクエストボディ取得
    const body = await request.json();

    // 入力値検証（デバッグログ追加）
    if (process.env.NODE_ENV === 'development') {
      console.log('Received request body:', JSON.stringify(body, null, 2));
    }

    const validatedInput = validateInput(body);
    if (!validatedInput) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Validation failed for:', body);
      }
      return NextResponse.json({
        error: 'Invalid input parameters'
      }, { status: 400 });
    }

    const { date, startTime, endTime, location, customLocation } = validatedInput;

    // 時間計算
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);

    // 時間の妥当性チェック
    if (durationMinutes <= 0 || durationMinutes > 12 * 60) { // 12時間以内
      return NextResponse.json({
        error: 'Invalid time range'
      }, { status: 400 });
    }

    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    let durationText = '';

    if (hours > 0 && minutes > 0) {
      durationText = `${hours}時間${minutes}分`;
    } else if (hours > 0) {
      durationText = `${hours}時間`;
    } else {
      durationText = `${minutes}分`;
    }

    const locationContext = getLocationContext(location, customLocation);
    const timeContext = getTimeContext(start.getHours());

    // セキュアなプロンプト（固定テンプレート）
    const prompt = `趣味がない人向けの予定を3つ提案してください。

条件:
- 日時: ${date} ${startTime}-${endTime} (${durationText})
- 場所: ${locationContext}
- 時間帯: ${timeContext}の時間帯

要求:
- 初心者でも始めやすい活動
- ${durationText}で完了できる内容
- 予算は無料〜500円程度
- 具体的で実行しやすい内容

以下のJSON形式で返答してください:
[
  {
    "title": "具体的なタイトル",
    "description": "50文字程度の説明",
    "location": "具体的な場所の詳細"
  }
]`;

    // OpenAI API呼び出し（GPT-4o mini）
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "あなたは予定作成が苦手な人を支援するアシスタントです。実用的で始めやすい提案をJSON形式で返してください。"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 800,
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const responseText = completion.choices[0]?.message?.content;

    if (!responseText) {
      throw new Error('Empty response from OpenAI');
    }

    // JSONパース（安全処理）
    let suggestions;
    try {
      const parsed = JSON.parse(responseText);
      suggestions = Array.isArray(parsed) ? parsed : parsed.suggestions || [];
    } catch (parseError) {
      // フォールバック提案
      suggestions = [
        {
          title: "読書タイム",
          description: "好きな本をゆっくり読んでリラックスする時間",
          location: locationContext
        },
        {
          title: "散歩・ウォーキング",
          description: "新鮮な空気を吸いながら気軽に体を動かす時間",
          location: locationContext
        },
        {
          title: "学習動画視聴",
          description: "興味のある分野の動画を見て新しい知識を得る時間",
          location: locationContext
        }
      ];
    }

    // レスポンス形式に変換（最大3件）
    const formattedSuggestions: SuggestionResponse[] = suggestions
      .slice(0, 3)
      .map((suggestion: RawSuggestion, index: number) => ({
        id: `suggestion-${Date.now()}-${index}`,
        title: (suggestion.title || `提案${index + 1}`).slice(0, 100),
        description: (suggestion.description || '').slice(0, 200),
        location: (suggestion.location || locationContext).slice(0, 100),
        category: determineCategory(suggestion.title || '', suggestion.description || '')
      }));

    // 使用量ログ（開発用）
    if (process.env.NODE_ENV === 'development') {
      console.log('OpenAI Usage:', {
        prompt_tokens: completion.usage?.prompt_tokens,
        completion_tokens: completion.usage?.completion_tokens,
        total_tokens: completion.usage?.total_tokens,
        estimated_cost: ((completion.usage?.total_tokens || 0) * 0.00015 / 1000).toFixed(6)
      });
    }

    return NextResponse.json({
      suggestions: formattedSuggestions,
      metadata: {
        date,
        duration: durationText,
        location: locationContext,
        timeContext
      }
    });

  } catch (error) {
    console.error('OpenAI API Error:', error);

    // 本番環境では詳細なエラー情報を隠蔽
    const isDev = process.env.NODE_ENV === 'development';

    return NextResponse.json({
      error: 'Failed to generate suggestions',
      ...(isDev && { details: error instanceof Error ? error.message : 'Unknown error' })
    }, { status: 500 });
  }
}