
import { createHash } from "crypto";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";


export function getGravatarUrl(email: string, 
  size: number = 128): string {

  const normalizedEmail = email.trim().toLowerCase();
  const hash = createHash("md5").update(normalizedEmail).digest("hex");
  
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon&r=pg&v=${Date.now()}`;
}

export function resolveMediaUrl(path:string | null | undefined): string | null {
  if (!path) return null;
  
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  if (path.startsWith("/media/")) {
    return `${API_BASE_URL}${path}`;
  }

  return `${API_BASE_URL}/media/${path.replace(/^media\//, "")}`;
}

export function resolveAvatarSrc(src: string | null | undefined): string | null {
  if (!src) return null;

  if (src.startsWith("http://") || src.startsWith("https://")) {
    return src;
  }

  if (src.startsWith("/media/") || src.startsWith("media/")) {
    return resolveMediaUrl(src);
  }

  if (src.startsWith("/")) {
    return src;
  }

  return resolveMediaUrl(src);
}

export function getAvatarUrl(
  email:string | undefined,
  profileImgPath:string | null | undefined,
  size:number = 128): string {
  
  const backendUrl = resolveMediaUrl(profileImgPath);
  if (backendUrl) {
    return `${backendUrl}?v=${Date.now()}`;
  }

  if (email) {
    return getGravatarUrl(email, size);
  }

  return `https://www.gravatar.com/avatar/00000000000000000000000000000000?size=${size}&d=identicon&r=pg&v=${Date.now()}`;
}
