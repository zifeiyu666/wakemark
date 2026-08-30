"use client";

import { PlayIcon, XIcon } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  /** 视频源地址 */
  src: string;
  /** 预览封面图 */
  poster?: string;
  /** 视频标题（用于无障碍与弹窗标题） */
  title: string;
  /** 眉标文案 */
  eyebrow?: string;
  /** 大标题（支持富文本节点） */
  heading?: ReactNode;
  /** 副标题描述 */
  description?: string;
  /** 播放按钮无障碍文案 */
  playLabel?: string;
  /** 关闭按钮无障碍文案 */
  closeLabel?: string;
  /** 容器底部是否渐隐（用于嵌入 Hero 等区块） */
  fadeBottom?: boolean;
  className?: string;
}

export default function VideoPlayer({
  src,
  poster,
  title,
  eyebrow,
  heading,
  description,
  playLabel,
  closeLabel = "Close",
  fadeBottom = false,
  className,
}: VideoPlayerProps) {
  return (
    <div className={cn("flex w-full flex-col items-center gap-12", className)}>
      {eyebrow || heading || description ? (
        <div className="flex max-w-3xl flex-col items-center gap-6 text-center">
          {eyebrow ? (
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {eyebrow}
            </p>
          ) : null}
          {heading ? (
            <h2 className="text-3xl font-bold tracking-tight text-balance md:text-5xl">
              {heading}
            </h2>
          ) : null}
          {description ? (
            <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
              {description}
            </p>
          ) : null}
        </div>
      ) : null}

      <Dialog>
        <DialogTrigger asChild>
          <button
            type="button"
            aria-label={playLabel ?? title}
            className={cn(
              "group relative block w-full cursor-pointer overflow-hidden rounded-xl border shadow-2xl",
              "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-hidden",
              fadeBottom && "fade-bottom"
            )}
          >
            <div className="relative aspect-video w-full bg-muted">
              {poster ? (
                <Image
                  src={poster}
                  alt={title}
                  fill
                  className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
              ) : null}

              {/* hover 蒙版 */}
              <div className="absolute inset-0 bg-foreground/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              {/* 播放按钮 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-8 ring-primary/10 transition-transform duration-300 group-hover:scale-110 md:size-20">
                  <PlayIcon className="size-6 fill-current md:size-8" />
                </span>
              </div>
            </div>
          </button>
        </DialogTrigger>

        <DialogContent
          showCloseButton={false}
          overlayClassName="bg-background/70 backdrop-blur-md duration-300"
          className="gap-0 overflow-visible border-none bg-transparent p-0 shadow-none duration-300 sm:max-w-4xl data-[state=open]:zoom-in-90 data-[state=closed]:zoom-out-90"
        >
          <DialogTitle className="sr-only">{title}</DialogTitle>

          <DialogClose className="ring-offset-background focus:ring-ring absolute -top-12 right-0 rounded-full border bg-card p-2 text-foreground opacity-90 shadow-md transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden [&_svg]:pointer-events-none [&_svg]:size-4">
            <XIcon />
            <span className="sr-only">{closeLabel}</span>
          </DialogClose>

          <div className="overflow-hidden rounded-xl border bg-card shadow-2xl">
            <video
              src={src}
              poster={poster}
              controls
              playsInline
              preload="none"
              className="aspect-video w-full"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
