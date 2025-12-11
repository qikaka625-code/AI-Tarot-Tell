import { Language } from "../types";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== "undefined" && window.location.hostname === "tarot.lumosai.asia"
    ? "https://tarot.lumosai.asia"
    : "http://localhost:3702");

const handleResponse = async (res: Response) => {
  if (res.status === 401) throw new Error("AUTH_REQUIRED");
  if (res.status === 429) throw new Error("QUOTA_EXCEEDED");
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `API_ERROR_${res.status}`);
  }
  return res.json();
};

export const getTarotReading = async (
  cardName: string,
  positionLabel: string,
  spreadName: string,
  isReversed: boolean,
  language: Language,
  token: string
): Promise<{ text: string; usage?: any }> => {
  const res = await fetch(`${API_BASE}/api/tarot/reading`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-token": token,
    },
    body: JSON.stringify({
      cardName,
      positionLabel,
      spreadName,
      isReversed,
      language,
    }),
  });
  return handleResponse(res);
};

export const getFullSpreadReading = async (
  spreadName: string,
  cards: { name: string; position: string; isReversed: boolean; meaning: string }[],
  language: Language,
  token: string
): Promise<{ text: string; usage?: any }> => {
  const res = await fetch(`${API_BASE}/api/tarot/full-reading`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-token": token,
    },
    body: JSON.stringify({ spreadName, cards, language }),
  });
  return handleResponse(res);
};

