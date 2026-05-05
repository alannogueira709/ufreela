"use client";

import Image from "next/image";
import { User } from "lucide-react";
import { useState } from "react";
import { getAvatarUrl, resolveAvatarSrc } from "@/lib/avatar";

type AvatarImageProps = {
    email?: string | null;
    profileImg?: string | null;
    src?: string | null;
    size?: number;
    alt?: string;
    className?: string;
    fallbackClassName?: string;
};

const LOCAL_IMAGE_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function shouldSkipOptimization(src: string) {
    if (src.includes("gravatar.com")) {
        return true;
    }

    try {
        const url = new URL(src);
        return LOCAL_IMAGE_HOSTS.has(url.hostname);
    } catch {
        return false;
    }
}

function isLocalBackendImage(src: string) {
    try {
        const url = new URL(src);
        return LOCAL_IMAGE_HOSTS.has(url.hostname);
    } catch {
        return false;
    }
}

export default function AvatarImage({
    email,
    profileImg,
    src,
    size = 64,
    alt = "Avatar",
    className = "",
    fallbackClassName = ""
}:AvatarImageProps) {
    const [failedSrc, setFailedSrc] = useState<string | null>(null);
    const avatarUrl =
      resolveAvatarSrc(src) ?? getAvatarUrl(email ?? undefined, profileImg, size * 2);

    const hasError = failedSrc === avatarUrl;
    const usePlainImage = isLocalBackendImage(avatarUrl);

    if (hasError) {
        return (
            <div className={`flex items-center justify-center rounded-full bg-slate-200/80
             text-slate-600 ${fallbackClassName}`} 
             style={ { width: size, height: size } }
            
            >
                <User size={size * 0.5}/>
            </div>
        );
    }

    if (usePlainImage) {
        return (
            // Local Docker media URLs must bypass Next's server-side image optimizer.
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={avatarUrl}
                alt={alt}
                width={size}
                height={size}
                className={`rounded-full object-cover ${className}`}
                onError={() => setFailedSrc(avatarUrl)}
                loading="lazy"
                decoding="async"
                style={{ width: size, height: size }}
            />
        );
    }

    return (
        <Image
            src={avatarUrl}
            alt={alt}
            width={size}
            height={size}
            className={`rounded-full object-cover ${className}`}
            onError={() => setFailedSrc(avatarUrl)}
            unoptimized={shouldSkipOptimization(avatarUrl)}
        />
    );
}
