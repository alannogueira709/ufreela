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

    return (
        <Image
            src={avatarUrl}
            alt={alt}
            width={size}
            height={size}
            className={`rounded-full object-cover ${className}`}
            onError={() => setFailedSrc(avatarUrl)}
            unoptimized={avatarUrl.includes('gravatar.com')}
        />
    );
}
