import { useEffect, useState } from "react";
import { api } from "../api/client";

export function AuthImage({ src, fallback = "/logoicon.png", alt = "", className = "" }) {
  const [objectUrl, setObjectUrl] = useState("");

  useEffect(() => {
    let active = true;
    let nextUrl = "";

    if (!src) {
      setObjectUrl("");
      return undefined;
    }

    if (/^(https?:|blob:|data:)/.test(src)) {
      setObjectUrl(src);
      return undefined;
    }

    api.get(src, { responseType: "blob" })
      .then((response) => {
        if (!active) return;
        nextUrl = URL.createObjectURL(response.data);
        setObjectUrl(nextUrl);
      })
      .catch(() => {
        if (active) setObjectUrl("");
      });

    return () => {
      active = false;
      if (nextUrl) URL.revokeObjectURL(nextUrl);
    };
  }, [src]);

  return <img src={objectUrl || fallback} alt={alt} className={className} />;
}
