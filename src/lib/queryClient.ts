import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Helper: Get API key from localStorage
function getStoredApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("discord-bot-api-key");
}

// Helper: Store API key
export function setStoredApiKey(key: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("discord-bot-api-key", key);
}

// Helper: Clear API key
export function clearStoredApiKey() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("discord-bot-api-key");
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: Record<string, string> = data
    ? { "Content-Type": "application/json" }
    : {};

  const apiKey = getStoredApiKey();
  if (apiKey) {
    headers["x-api-key"] = apiKey;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  if (res.status === 401 || res.status === 403) {
    clearStoredApiKey();
    const error = await res.text();
    throw new Error(`Authentication failed: ${error || res.statusText}`);
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const headers: Record<string, string> = {};
    const apiKey = getStoredApiKey();
    if (apiKey) {
      headers["x-api-key"] = apiKey;
    }

    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
      headers,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
