import { useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { avatarDataUri, canProcessAvatar, decryptAvatar } from "@/lib/media";

export function useProfileAvatar(): string | null {
  const { profile } = useAuth();
  const data = profile?.avatar_data ?? null;
  const mime = profile?.avatar_mime ?? null;
  const canUse = Boolean(data && mime && canProcessAvatar());

  const key = `${data ?? ""}|${mime ?? ""}`;
  const [decodedKey, setDecodedKey] = useState(key);
  const [uri, setUri] = useState<string | null>(null);

  if (key !== decodedKey) {
    setDecodedKey(key);
    setUri(null);
  }

  useEffect(() => {
    if (!canUse || !data || !mime) return undefined;
    let active = true;
    decryptAvatar(data)
      .then((base64) => {
        if (active) setUri(avatarDataUri(base64, mime));
      })
      .catch((err) => {
        console.error("Failed to decrypt profile avatar:", err);
        if (active) setUri(null);
      });
    return () => {
      active = false;
    };
  }, [canUse, data, mime]);

  return uri;
}