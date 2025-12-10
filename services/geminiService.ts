import { GoogleGenAI } from "@google/genai";
import { Language } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

/**
 * Uses Gemini 2.5 Flash to generate a mystical reading for a specific card.
 */
export const getTarotReading = async (
  cardName: string, 
  positionLabel: string, 
  spreadName: string, 
  isReversed: boolean,
  language: Language
): Promise<string> => {
  if (!apiKey) {
    return language === Language.CN ? "由于缺少 API 密钥，无法连接到以太层获取解读。" : "Thiếu khóa API, không thể kết nối.";
  }

  try {
    const model = 'gemini-2.5-flash';
    const orientation = isReversed ? (language === Language.CN ? "逆位" : "Ngược") : (language === Language.CN ? "正位" : "Xuôi");
    const langInstruction = language === Language.CN ? "请用中文" : "Please answer in VIETNAMESE (Tiếng Việt)";
    
    const prompt = `You are a mystical Tarot reader. 
    Spread: "${spreadName}".
    Card: 【${cardName}】 (${orientation}).
    Position: 【${positionLabel}】.
    
    Instruction: ${langInstruction}.
    Provide a short, profound, and spiritual interpretation (max 150 words). 
    Focus on the meaning of the card in this specific position.
    Do not use filler phrases like "Here is the interpretation". Direct insight only.`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || (language === Language.CN ? "星辰沉默不语。" : "Các vì sao im lặng.");
  } catch (error) {
    console.error("Gemini Reading Error:", error);
    return language === Language.CN ? "连接宇宙意识时发生干扰。" : "Lỗi kết nối vũ trụ.";
  }
};

/**
 * Generates a full comprehensive reading based on all cards in the spread.
 */
export const getFullSpreadReading = async (
    spreadName: string,
    cards: { name: string; position: string; isReversed: boolean; meaning: string }[],
    language: Language
): Promise<string> => {
    if (!apiKey) {
        return language === Language.CN ? "请配置 API Key。" : "Vui lòng nhập API Key.";
    }

    try {
        const model = 'gemini-2.5-flash';
        const cardsDesc = cards.map((c, i) => 
            `${i + 1}. [${c.position}]: ${c.name} (${c.isReversed ? 'Reversed' : 'Upright'})`
        ).join('\n');

        const langInstruction = language === Language.CN ? "请用中文回答" : "Please answer in VIETNAMESE (Tiếng Việt)";

        const prompt = `You are a master Tarot reader. Provide a full analysis for the "${spreadName}" spread.
        
        Cards:
        ${cardsDesc}
        
        Instruction: ${langInstruction}.
        
        Format (Markdown):
        ### (Insight Title)
        (Content)
        
        Structure:
        1. Core Insight (The essence of the situation)
        2. Flow of Energy (Connections between cards)
        3. Advice (Actionable spiritual guidance)
        
        Tone: Mystical, empathetic, wise.
        Length: 600-800 words.`;

        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });

        return response.text || "Error generating reading.";

    } catch (error) {
        console.error("Gemini Full Reading Error:", error);
        return "Error.";
    }
};