
import { createHash } from "crypto";

export function getGravatarUrl(email: string, size: number = 80): string {
  const normalizedEmail = email.trim().toLowerCase();
  const hash = createHash("md5").update(normalizedEmail).digest("hex");
  
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon&r=pg&v=${Date.now()}`;
}