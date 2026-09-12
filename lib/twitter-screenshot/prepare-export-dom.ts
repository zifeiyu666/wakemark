import { proxiedImageUrl } from "./images";

type StyleBackup = {
  el: HTMLElement;
  cssText: string;
};

function backupStyle(el: HTMLElement, backups: StyleBackup[]) {
  backups.push({ el, cssText: el.style.cssText });
}

function hideSkeletonForImage(img: HTMLImageElement) {
  const skeleton = img
    .closest('[class*="mediaContainer"]')
    ?.querySelector<HTMLElement>('[class*="skeleton"]');
  if (skeleton) skeleton.style.display = "none";
}

function flattenMediaPhotos(root: HTMLElement, backups: StyleBackup[]) {
  const images = root.querySelectorAll<HTMLImageElement>(
    '[class*="tweet-media"] img'
  );

  for (const img of images) {
    hideSkeletonForImage(img);

    const container = img.closest<HTMLElement>('[class*="mediaContainer"]');
    const link = img.closest<HTMLElement>('a[class*="mediaLink"]');
    const wrapper = img.closest<HTMLElement>('[class*="mediaWrapper"]');
    const mediaRoot = img.closest<HTMLElement>('[class*="tweet-media"][class*="root"]')
      ?? img.closest<HTMLElement>('[class*="tweet-media"]');

    backupStyle(img, backups);
    img.style.position = "relative";
    img.style.inset = "auto";
    img.style.display = "block";
    img.style.width = "100%";
    img.style.height = "auto";
    img.style.maxWidth = "100%";
    img.style.objectFit = "contain";
    img.style.objectPosition = "center";

    for (const el of [container, link, wrapper, mediaRoot]) {
      if (!el) continue;
      backupStyle(el, backups);
      el.style.position = "relative";
      el.style.display = "block";
      el.style.height = "auto";
      el.style.overflow = "visible";
    }
  }
}

function replaceVideosWithPoster(root: HTMLElement, backups: StyleBackup[]) {
  const videos = root.querySelectorAll<HTMLVideoElement>("video");

  for (const video of videos) {
    const poster = video.getAttribute("poster");
    if (!poster) continue;

    const posterImg = document.createElement("img");
    posterImg.src = proxiedImageUrl(poster) ?? poster;
    posterImg.alt = "Video preview";
    posterImg.crossOrigin = "anonymous";
    posterImg.referrerPolicy = "no-referrer";
    posterImg.style.cssText =
      "position:relative;display:block;width:100%;height:auto;object-fit:contain;";

    const container = video.closest<HTMLElement>('[class*="mediaContainer"]');
    if (container) {
      hideSkeletonForImage(posterImg);
      backupStyle(video, backups);
      video.style.display = "none";
      container.insertBefore(posterImg, video);
      backups.push({
        el: posterImg,
        cssText: "__remove__",
      });
    }
  }
}

function relaxOverflowClipping(root: HTMLElement, backups: StyleBackup[]) {
  const selectors = [
    root,
    root.querySelector<HTMLElement>("[data-screenshot-tweet]"),
    root.querySelector<HTMLElement>(".react-tweet-theme"),
    root.querySelector<HTMLElement>('[class*="tweet-container"]'),
    root.querySelector<HTMLElement>("article"),
  ].filter((el): el is HTMLElement => Boolean(el));

  for (const el of selectors) {
    backupStyle(el, backups);
    el.style.overflow = "visible";
  }
}

export function prepareExportDom(root: HTMLElement): () => void {
  const backups: StyleBackup[] = [];

  flattenMediaPhotos(root, backups);
  replaceVideosWithPoster(root, backups);
  relaxOverflowClipping(root, backups);

  return () => {
    for (const { el, cssText } of backups) {
      if (cssText === "__remove__") {
        el.remove();
      } else {
        el.style.cssText = cssText;
      }
    }
  };
}
