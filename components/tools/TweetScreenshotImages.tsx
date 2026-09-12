"use client";

import {
  proxiedImageUrl,
  upgradeMediaSize,
} from "@/lib/twitter-screenshot/images";
import type { ImgHTMLAttributes } from "react";

type ImgProps = ImgHTMLAttributes<HTMLImageElement>;

function hideMediaSkeleton(img: HTMLImageElement) {
  const skeleton = img
    .closest('[class*="mediaContainer"]')
    ?.querySelector<HTMLElement>('[class*="skeleton"]');
  if (skeleton) skeleton.style.display = "none";
}

function ProxiedAvatarImg(props: ImgProps) {
  const src =
    typeof props.src === "string" ? proxiedImageUrl(props.src) : props.src;

  return (
    <img
      {...props}
      src={src}
      crossOrigin="anonymous"
      referrerPolicy="no-referrer"
    />
  );
}

function ProxiedMediaImg({ className: _className, style, onLoad, ...props }: ImgProps) {
  const rawSrc = typeof props.src === "string" ? props.src : undefined;
  const src = rawSrc ? proxiedImageUrl(upgradeMediaSize(rawSrc)) : props.src;

  return (
    <img
      {...props}
      src={src}
      crossOrigin="anonymous"
      referrerPolicy="no-referrer"
      className="block w-full h-auto max-w-full"
      style={{
        position: "relative",
        inset: "auto",
        objectFit: "contain",
        objectPosition: "center",
        ...style,
      }}
      onLoad={(event) => {
        hideMediaSkeleton(event.currentTarget);
        onLoad?.(event);
      }}
    />
  );
}

export const tweetScreenshotComponents = {
  AvatarImg: ProxiedAvatarImg,
  MediaImg: ProxiedMediaImg,
};
