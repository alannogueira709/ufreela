import axios from "axios";

function getMessageFromObject(data: Record<string, unknown>, keys?: string[]) {
  const preferredKeys = keys ?? ["error", "detail", "message"];

  for (const key of preferredKeys) {
    const value = data[key];

    if (typeof value === "string" && value.trim()) {
      return value;
    }

    if (Array.isArray(value) && typeof value[0] === "string") {
      return value[0];
    }
  }

  for (const value of Object.values(data)) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }

    if (Array.isArray(value) && typeof value[0] === "string") {
      return value[0];
    }
  }

  return null;
}

export function getApiErrorMessage(
  error: unknown,
  fallbackMessage: string,
  keys?: string[]
) {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data;

    if (payload && typeof payload === "object") {
      const message = getMessageFromObject(payload as Record<string, unknown>, keys);

      if (message) {
        return message;
      }
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
}
