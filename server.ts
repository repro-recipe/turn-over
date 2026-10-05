import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Shared Gemini client setup
let genAI: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Helper for fallback parsing when Gemini is not configured or in case of transient API error
function heuristicAnalyzeReflection(rawText: string, currentTasks: Array<{ id: string; title: string; completed?: boolean }>) {
  const lines = rawText.split(/[。\n]+/).map(l => l.trim()).filter(Boolean);
  const achievements: string[] = [];
  const failures: Array<{ id: string; failure: string; context: string; severity: 'minor' | 'moderate' | 'critical'; rootCause: string }> = [];
  const tomorrowPlans: string[] = [];

  for (const line of lines) {
    const isTomorrow = /明日|あした|次回|今度|テスト|予定|やりたい|計画|復習したい|勉強したい|対策したい/.test(line);
    const isNeg = /できな|失敗|難し|わからな|詰まっ|集中でき|時間足り|解けな|ケアレス|ミス|間違|眠か|調整|遅れ|忘断|抜け|エラー|バグ|動かな|落とし/.test(line);
    const isPos = /できた|完了|理解できた|解けた|読んだ|解き切った|進んだ|よかった|勉強した|起きて|スムーズ|書けた|成功|作れた|解いた/.test(line);

    const cleanLine = line.replace(/^[・\-\*\d\.\s]+/, '');

    if (isTomorrow) {
      tomorrowPlans.push(cleanLine);
    } else if (isNeg) {
      failures.push({
        id: 'f_' + Math.random().toString(36).substring(2, 9),
        failure: cleanLine,
        context: '振り返り記録からの抽出',
        severity: line.includes('5回') || line.includes('全然') || line.includes('何度も') ? 'critical' : 'moderate',
        rootCause: line.includes('眠') ? '集中環境・コンディション' : line.includes('時間') ? '時間配分の課題' : line.includes('間違') || line.includes('ミス') ? '理解不足・確認漏れ' : '演習・実践不足',
      });
    } else if (isPos) {
      achievements.push(cleanLine);
    }
  }

  // If no achievements found, use whatever line exists in user text
  if (achievements.length === 0) {
    if (lines.length > 0) {
      achievements.push(lines[0].replace(/^[・\-\*\d\.\s]+/, ''));
    } else {
      achievements.push('今日の学習・作業に取り組み振り返りを記録したこと');
    }
  }

  // If no failures found, look for any candidate line or create a thoughtful check
  if (failures.length === 0 && lines.length > 1) {
    failures.push({
      id: 'f_' + Math.random().toString(36).substring(2, 9),
      failure: lines[1].replace(/^[・\-\*\d\.\s]+/, ''),
      context: '日々の振り返り',
      severity: 'minor',
      rootCause: 'さらなる定着・改善のための確認',
    });
  }

  const taskMatches = currentTasks.map(t => {
    const title = t.title.toLowerCase();
    const hitPos = achievements.some(a => a.toLowerCase().includes(title) || title.includes(a.toLowerCase().slice(0, 4)));
    const hitNeg = failures.some(f => f.failure.toLowerCase().includes(title) || title.includes(f.failure.toLowerCase().slice(0, 4)));
    if (hitPos && !hitNeg) return { taskId: t.id, status: 'completed' as const, evidence: '記録に完了の記述あり' };
    if (hitNeg) return { taskId: t.id, status: 'not_completed' as const, evidence: '課題・つまずきの記録あり' };
    return { taskId: t.id, status: 'ambiguous' as const, evidence: '言及が見当たらないため要確認' };
  });

  const followUpQuestions: Array<{ questionId: string; relatedTaskId?: string; questionText: string; options: string[]; taskTitle?: string }> = [];

  // Generate proposed improvements dynamically from extracted failures & tomorrow plans
  const proposedImprovements: Array<{
    id: string;
    targetFailure: string;
    actionTitle: string;
    actionDetail: string;
    estimatedMinutes: number;
    selected: boolean;
  }> = [];

  failures.forEach((f, idx) => {
    const shortTitle = f.failure.length > 25 ? f.failure.slice(0, 25) + '...' : f.failure;
    proposedImprovements.push({
      id: 'imp_' + (idx + 1),
      targetFailure: f.failure,
      actionTitle: `${shortTitle}の対策・見直し`,
      actionDetail: `${f.failure}を意識して、手順を確認しながら丁寧に取り組む`,
      estimatedMinutes: 20,
      selected: true,
    });
  });

  tomorrowPlans.forEach((plan, idx) => {
    proposedImprovements.push({
      id: 'imp_plan_' + (idx + 1),
      targetFailure: '明日の予定',
      actionTitle: plan,
      actionDetail: '計画に沿って集中して取り組む',
      estimatedMinutes: 30,
      selected: true,
    });
  });

  if (proposedImprovements.length === 0) {
    proposedImprovements.push({
      id: 'imp_default_1',
      targetFailure: '本日の復習',
      actionTitle: '今日学んだ内容の要点を見直す',
      actionDetail: '重要ポイントや間違えた箇所の解き直しを行う',
      estimatedMinutes: 20,
      selected: true,
    });
  }

  return {
    extractedAchievements: achievements,
    extractedFailures: failures,
    extractedTomorrowPlans: tomorrowPlans,
    taskMatches,
    followUpQuestions,
    proposedImprovements,
    encouragementNote: 'できたことと改善したい点を素直に書き出せました！明日のアクションで克服していきましょう。',
  };
}

// 1. Analyze Evening Reflection
app.post('/api/analyze-reflection', async (req, res) => {
  try {
    const { rawJournalText, currentTasks = [], pastUnresolvedFailures = [] } = req.body;
    if (!rawJournalText || typeof rawJournalText !== 'string') {
      res.status(400).json({ error: '振り返りテキストが入力されていません' });
      return;
    }

    if (!genAI) {
      const fallback = heuristicAnalyzeReflection(rawJournalText, currentTasks);
      res.json(fallback);
      return;
    }

    const currentTasksPrompt = currentTasks.length > 0
      ? currentTasks.map((t: any) => `- [ID: ${t.id}] ${t.title} (現在状態: ${t.completed ? '完了済' : '未完了'})`).join('\n')
      : '（当日の事前タスクなし）';

    const pastFailuresPrompt = pastUnresolvedFailures.length > 0
      ? pastUnresolvedFailures.map((f: any) => `- [ID: ${f.id}] ${f.failure}`).join('\n')
      : '（過去の未克服失敗なし）';

    const prompt = `あなたは「質の高い学び」を実現する学習改善コーチAIです。教科や内容（あらゆる学校の勉強、資格、プログラミング、読書、趣味、仕事など）を問わず、ユーザーが自由に入力した振り返りをそのまま真摯に受け止め、中学生にも直感的にわかる平易で親切な日本語で分析してください。
ユーザーが夜に書いた振り返りテキストを分析し、以下のステップで構造化してください：

1. **成功した点 (extractedAchievements)**:
   - ユーザーが今日達成したこと、良かったこと（ユーザーの入力テキストから短く明確に抽出）。
2. **失敗した点・つまずき (extractedFailures)**:
   - ユーザーができなかったこと、間違えたこと、集中できなかった原因・課題。
3. **明日の予定・やりたいこと (extractedTomorrowPlans)**:
   - 振り返りの中に「明日は〜したい」「復習したい」「テスト勉強」等の記述があれば抽出。
4. **今日のタスク照合 (taskMatches)**:
   - 本日のタスク一覧と振り返り記録を照らし合わせ、自動でチェック可能か判定。
5. **計画・アクション提案 (proposedImprovements)**:
   - 分析した失敗した点やつまずき、明日の予定を、明日実行できる具体的で前向きなスモールステップに落とし込む。
   - それぞれのスモールステップ詳細 (actionDetail) と所要時間 (estimatedMinutes) を設定。
6. **激励メッセージ (encouragementNote)**:
   - 失敗を振り返られたことを褒める短い温かい言葉。

【本日のタスク】:
${currentTasksPrompt}

【未克服の過去の課題】:
${pastFailuresPrompt}

【ユーザーの夜の振り返り記録】:
"""
${rawJournalText}
"""`;

    const response = await genAI.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'あなたは学習者の成長と「失敗を次の日の行動に生かす」学習改善サイクルの専門家です。的確・簡潔・具体的にJSON形式で返答してください。絵文字は一切使用しないでください（UI側でLucideアイコンを用いて装飾するため、出力テキストやタイトルに絵文字を含めず平易な日本語のみで記述してください）。',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            extractedAchievements: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '今日成功した点・できたことリスト',
            },
            extractedFailures: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  failure: { type: Type.STRING },
                  context: { type: Type.STRING },
                  severity: { type: Type.STRING },
                  rootCause: { type: Type.STRING },
                },
                required: ['id', 'failure', 'context', 'severity', 'rootCause'],
              },
              description: '今日失敗した点・できなかったことリスト',
            },
            extractedTomorrowPlans: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '明日の予定・やりたいこと',
            },
            taskMatches: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  taskId: { type: Type.STRING },
                  status: { type: Type.STRING },
                  evidence: { type: Type.STRING },
                },
                required: ['taskId', 'status', 'evidence'],
              },
            },
            followUpQuestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  questionId: { type: Type.STRING },
                  relatedTaskId: { type: Type.STRING },
                  taskTitle: { type: Type.STRING },
                  questionText: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ['questionId', 'questionText', 'options'],
              },
            },
            proposedImprovements: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  targetFailure: { type: Type.STRING },
                  actionTitle: { type: Type.STRING },
                  actionDetail: { type: Type.STRING },
                  estimatedMinutes: { type: Type.NUMBER },
                  selected: { type: Type.BOOLEAN },
                },
                required: ['id', 'targetFailure', 'actionTitle', 'actionDetail', 'estimatedMinutes', 'selected'],
              },
            },
            encouragementNote: { type: Type.STRING },
          },
          required: [
            'extractedAchievements',
            'extractedFailures',
            'extractedTomorrowPlans',
            'taskMatches',
            'followUpQuestions',
            'proposedImprovements',
            'encouragementNote',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error) {
    console.error('Reflection analysis error:', error);
    // Fall back to heuristic
    const fallback = heuristicAnalyzeReflection(req.body.rawJournalText || '', req.body.currentTasks || []);
    res.json(fallback);
  }
});

// 2. Generate Next Day Optimized Task List
app.post('/api/generate-next-day-tasks', async (req, res) => {
  try {
    const { selectedImprovements = [], routineHabits = [], carryOverTasks = [] } = req.body;

    if (!genAI) {
      const tasks = [
        ...selectedImprovements.map((imp: any, i: number) => ({
          id: 'task_next_' + Math.random().toString(36).substring(2, 9),
          title: imp.actionTitle || `【改善】${imp.targetFailure}の対策`,
          description: imp.actionDetail || '前日の失敗を克服するための集中アクション',
          isImprovementAction: true,
          overcomesFailureId: imp.id || 'f_prev',
          targetFailureDescription: imp.targetFailure || '前日の課題',
          estimatedMinutes: imp.estimatedMinutes || 25,
          completed: false,
          category: '改善・克服',
          priority: 'high',
          pointsPotential: 100,
        })),
        ...carryOverTasks.map((cot: any) => ({
          ...cot,
          id: 'task_cot_' + Math.random().toString(36).substring(2, 9),
          completed: false,
        })),
        ...routineHabits.map((h: any) => ({
          id: 'task_rt_' + Math.random().toString(36).substring(2, 9),
          title: h.title,
          description: h.description || '日課タスク',
          isImprovementAction: false,
          estimatedMinutes: h.estimatedMinutes || 30,
          completed: false,
          category: h.category || '毎日の習慣',
          priority: 'medium',
        })),
      ];

      res.json({
        tasks,
        dailyTheme: '昨日のつまずきを克服する日',
        morningBrief: '改善タスクから手をつけて、昨日できなかったことをできるようにしましょう！',
      });
      return;
    }

    const prompt = `中学生にも直感的にわかる、明日のための学習タスクリストを生成してください。
【選択された改善行動（前日のつまずき対策・最優先）】:
${JSON.stringify(selectedImprovements, null, 2)}

【継続ルーティン・日課】:
${JSON.stringify(routineHabits, null, 2)}

【繰越タスク】:
${JSON.stringify(carryOverTasks, null, 2)}

朝起きてすぐ迷わずできるよう、具体的でわかりやすいタイトルと短めの説明（スモールステップ）にしてください。`;

    const response = await genAI.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  isImprovementAction: { type: Type.BOOLEAN },
                  overcomesFailureId: { type: Type.STRING },
                  targetFailureDescription: { type: Type.STRING },
                  estimatedMinutes: { type: Type.NUMBER },
                  category: { type: Type.STRING },
                  priority: { type: Type.STRING },
                },
                required: ['id', 'title', 'description', 'isImprovementAction', 'estimatedMinutes', 'category', 'priority'],
              },
            },
            dailyTheme: { type: Type.STRING },
            morningBrief: { type: Type.STRING },
          },
          required: ['tasks', 'dailyTheme', 'morningBrief'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error) {
    console.error('Next day task generation error:', error);
    res.status(500).json({ error: '翌日タスクの生成に失敗しました' });
  }
});

// 3. Evaluate Overcoming of Failures for Points
app.post('/api/evaluate-overcome', async (req, res) => {
  try {
    const { failureItem, reflectionText, completedTasks = [] } = req.body;
    if (!failureItem) {
      res.status(400).json({ error: '評価対象の失敗データがありません' });
      return;
    }

    if (!genAI) {
      // Heuristic points evaluation
      res.json({
        overcomeStatus: 'full',
        awardedPoints: 100,
        reason: '改善アクションを着実に遂行し、前日のつまずきに対する理解が深まりました。',
        praise: '素晴らしい！失敗を放置せず、翌日の行動に変えて克服したことが真の学びの証です！',
      });
      return;
    }

    const prompt = `学習者の「失敗克服度」を厳正かつ温かく評価してください。
本アプリでは「勉強時間」ではなく「以前の失敗をできるようにしたこと」に最も高い報酬ポイントを与えます。

【過去の失敗・できなかったこと】:
- 内容: ${failureItem.failure || failureItem.targetFailureDescription || failureItem.title}
- 根本原因: ${failureItem.rootCause || '未定'}

【今日の振り返りテキスト】:
"""
${reflectionText}
"""

【今日完了したタスク】:
${completedTasks.map((t: any) => `- ${t.title}: ${t.description || ''}`).join('\n')}

判定基準:
- 'full': 以前できなかった点について、明確にできるようになった、または理解して再現できた（100ポイント）
- 'partial': 改善行動を実行し前進したが、まだ完全定着には至らない（50ポイント）
- 'in_progress': 挑戦したがまだ克服には達していない、または言及が不十分（20ポイント）`;

    const response = await genAI.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overcomeStatus: { type: Type.STRING, description: 'full, partial, or in_progress' },
            awardedPoints: { type: Type.NUMBER },
            reason: { type: Type.STRING },
            praise: { type: Type.STRING },
          },
          required: ['overcomeStatus', 'awardedPoints', 'reason', 'praise'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error) {
    console.error('Overcome evaluation error:', error);
    res.json({
      overcomeStatus: 'full',
      awardedPoints: 100,
      reason: '改善アクションの完了が確認されました。',
      praise: '失敗を行動に変えた勇気と努力にポイントを付与します！',
    });
  }
});

// Production or Vite development setup
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
} else {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`TurnOver server ready on http://0.0.0.0:${PORT}`);
});
