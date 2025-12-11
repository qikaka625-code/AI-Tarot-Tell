import cors from "cors";
import dotenv from "dotenv";
import express, { RequestHandler } from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import {
  computeRemaining,
  getUserByToken,
  getUserByUsername,
  incrementUsage,
  UserRecord,
} from "./db.js";
import {
  FullSpreadRequest,
  TarotReadingRequest,
  LoginResponse,
} from "./types.js";

dotenv.config({ path: path.join(process.cwd(), "backend", ".env") });

const app = express();
const PORT = Number(process.env.PORT || 3702);
const HOST = process.env.HOST || "0.0.0.0";

const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : ["*"];

app.use(
  cors({
    origin: corsOrigin,
  })
);
app.use(express.json({ limit: "2mb" }));

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

interface AuthedRequest extends express.Request {
  user?: UserRecord;
  token?: string;
}

const authMiddleware: RequestHandler = (req: AuthedRequest, res, next) => {
  const token =
    (req.headers["x-api-token"] as string) ||
    (req.headers["authorization"] as string) ||
    (req.body?.token as string) ||
    "";

  if (!token) {
    return res.status(401).json({ message: "缺少访问令牌" });
  }

  const user = getUserByToken(token);
  if (!user) {
    return res.status(401).json({ message: "令牌无效或用户不存在" });
  }

  const now = new Date();
  if (user.valid_to && new Date(user.valid_to) < now) {
    return res.status(403).json({ message: "账户已过期" });
  }

  req.user = user;
  req.token = token;
  next();
};

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: "缺少用户名或密码" });
  }

  const user = getUserByUsername(username);
  if (!user || user.password !== password) {
    return res.status(401).json({ message: "用户名或密码错误" });
  }

  const now = new Date();
  if (user.valid_to && new Date(user.valid_to) < now) {
    return res.status(403).json({ message: "账户已过期" });
  }

  const remaining = computeRemaining(user);
  const payload: LoginResponse = {
    user: {
      username: user.username,
      email: user.email,
      plan_type: user.plan_type,
      is_test: user.is_test,
      valid_from: user.valid_from,
      valid_to: user.valid_to,
      name: user.name,
    },
    usage: {
      limit: user.usage_limit,
      used: user.usage_used,
      remaining,
    },
    token: user.api_token,
  };

  res.json(payload);
});

app.get("/api/usage", authMiddleware, (req: AuthedRequest, res) => {
  const user = req.user!;
  res.json({
    limit: user.usage_limit,
    used: user.usage_used,
    remaining: computeRemaining(user),
    plan: user.plan_type,
    is_test: user.is_test,
    valid_to: user.valid_to,
  });
});

const ensureKey = (res: express.Response) => {
  if (!ai) {
    res.status(503).json({ message: "未配置 Gemini API Key" });
    return false;
  }
  return true;
};

const buildLangInstruction = (language: string) => {
  if (language === "vi-VN") return "Vui lòng trả lời bằng tiếng Việt.";
  if (language.startsWith("zh")) return "请用中文回答。";
  return "Please answer in English.";
};

app.post(
  "/api/tarot/reading",
  authMiddleware,
  async (req: AuthedRequest, res) => {
    if (!ensureKey(res)) return;
    const body = req.body as TarotReadingRequest;
    const { cardName, positionLabel, spreadName, isReversed, language } = body;

    if (!cardName || !positionLabel || !spreadName || language === undefined) {
      return res.status(400).json({ message: "参数不完整" });
    }

    const user = req.user!;
    if (computeRemaining(user) <= 0) {
      return res.status(429).json({ message: "调用次数已用完" });
    }

    try {
      const model = "gemini-2.5-pro";
      const orientation =
        language === "zh-CN"
          ? isReversed
            ? "逆位"
            : "正位"
          : isReversed
          ? "Ngược"
          : "Xuôi";

      const prompt = `
You are a mystical Tarot reader.
Spread: "${spreadName}".
Card: 【${cardName}】 (${orientation}).
Position: 【${positionLabel}】.

${buildLangInstruction(language)}
Provide a short, profound, and spiritual interpretation (max 150 words).
Focus on the meaning of the card in this specific position.
Avoid filler phrases; respond with insight directly.`;

      const response = await ai!.models.generateContent({
        model,
        contents: prompt,
      });

      incrementUsage(req.token!);
      const updatedUser = getUserByToken(req.token!)!;

      res.json({
        text:
          response.text ||
          (language === "zh-CN"
            ? "星辰沉默不语。"
            : "Các vì sao im lặng."),
        usage: {
          remaining: computeRemaining(updatedUser),
          used: updatedUser.usage_used,
          limit: updatedUser.usage_limit,
        },
      });
    } catch (error: any) {
      console.error("Tarot reading error:", error);
      res.status(500).json({ message: "生成解读失败", detail: error?.message });
    }
  }
);

app.post(
  "/api/tarot/full-reading",
  authMiddleware,
  async (req: AuthedRequest, res) => {
    if (!ensureKey(res)) return;
    const body = req.body as FullSpreadRequest;
    const { spreadName, cards, language } = body;

    if (!spreadName || !cards || !Array.isArray(cards)) {
      return res.status(400).json({ message: "参数不完整" });
    }

    const user = req.user!;
    if (computeRemaining(user) <= 0) {
      return res.status(429).json({ message: "调用次数已用完" });
    }

    try {
      const cardsDesc = cards
        .map(
          (c, i) =>
            `${i + 1}. [${c.position}]: ${c.name} (${
              c.isReversed ? "Reversed" : "Upright"
            })`
        )
        .join("\n");

      const prompt = `You are a master Tarot reader. Provide a full analysis for the "${spreadName}" spread.

Cards:
${cardsDesc}

${buildLangInstruction(language)}

Format (Markdown):
### (Insight Title)
(Content)

Structure:
1. Core Insight (The essence of the situation)
2. Flow of Energy (Connections between cards)
3. Advice (Actionable spiritual guidance)

Tone: Mystical, empathetic, wise.
Length: 600-800 words.`;

      const response = await ai!.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
      });

      incrementUsage(req.token!);
      const updatedUser = getUserByToken(req.token!)!;

      res.json({
        text:
          response.text ||
          (language === "zh-CN"
            ? "连接宇宙意识时发生干扰。"
            : "Lỗi kết nối vũ trụ."),
        usage: {
          remaining: computeRemaining(updatedUser),
          used: updatedUser.usage_used,
          limit: updatedUser.usage_limit,
        },
      });
    } catch (error: any) {
      console.error("Full spread error:", error);
      res.status(500).json({ message: "生成全局解读失败", detail: error?.message });
    }
  }
);

app.listen(PORT, HOST, () => {
  console.log(`AI-Tarot-Tell backend listening on http://${HOST}:${PORT}`);
});

