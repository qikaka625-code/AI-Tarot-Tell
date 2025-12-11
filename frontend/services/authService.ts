const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== "undefined" && window.location.hostname === "tarot.lumosai.asia"
    ? "https://tarot.lumosai.asia"
    : "http://localhost:3702");

export interface LoginResult {
  user: {
    username: string;
    email: string;
    plan_type: string;
    is_test: number;
    valid_from?: string;
    valid_to?: string;
    name?: string;
  };
  usage: {
    limit: number;
    used: number;
    remaining: number;
  };
  token: string;
}

const handleResponse = async (res: Response) => {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `API_ERROR_${res.status}`);
  }
  return res.json();
};

export const login = async (
  username: string,
  password: string
): Promise<LoginResult> => {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });
  return handleResponse(res);
};

