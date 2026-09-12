import { proxiedImageUrl, upgradeMediaSize } from "./images";
import { prepareExportDom } from "./prepare-export-dom";

export { proxiedImageUrl } from "./images";

type ImageBackup = {
  img: HTMLImageElement;
  src: string | null;
  crossOrigin: string | null;
  visibility: string;
};

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function waitForNextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

async function waitForImages(root: HTMLElement) {
  const images = Array.from(root.querySelectorAll("img"));

  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }
          img.onload = () => resolve();
          img.onerror = () => resolve();
        })
    )
  );
}

async function inlineImages(root: HTMLElement): Promise<() => void> {
  const images = Array.from(root.querySelectorAll("img"));
  const backups: ImageBackup[] = [];

  await Promise.all(
    images.map(async (img) => {
      const src = img.getAttribute("src");
      if (!src || src.startsWith("data:")) return;

      backups.push({
        img,
        src,
        crossOrigin: img.getAttribute("crossorigin"),
        visibility: img.style.visibility,
      });

      const upgraded = upgradeMediaSize(src);
      const fetchUrl = upgraded.startsWith("/")
        ? upgraded
        : proxiedImageUrl(upgraded) ?? upgraded;

      try {
        const response = await fetch(fetchUrl);
        if (!response.ok) return;
        const dataUrl = await blobToDataUrl(await response.blob());
        img.setAttribute("src", dataUrl);
        img.removeAttribute("crossorigin");
      } catch {
        img.style.visibility = "hidden";
      }
    })
  );

  return () => {
    for (const { img, src, crossOrigin, visibility } of backups) {
      if (src) img.setAttribute("src", src);
      else img.removeAttribute("src");

      if (crossOrigin) img.setAttribute("crossorigin", crossOrigin);
      else img.removeAttribute("crossorigin");

      img.style.visibility = visibility;
    }
  };
}

function isCanvasBlank(canvas: HTMLCanvasElement): boolean {
  const ctx = canvas.getContext("2d");
  if (!ctx || canvas.width === 0 || canvas.height === 0) return true;

  const sample = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  for (let i = 3; i < sample.length; i += 16) {
    if (sample[i] > 0) return false;
  }
  return true;
}

function resetTransformForCapture(node: HTMLElement): () => void {
  const tweetEl = node.querySelector<HTMLElement>("[data-screenshot-tweet]");
  if (!tweetEl) return () => undefined;

  const previousTransform = tweetEl.style.transform;
  tweetEl.style.transform = "none";
  return () => {
    tweetEl.style.transform = previousTransform;
  };
}

export async function captureNodeAsPng(node: HTMLElement): Promise<string> {
  if (node.offsetWidth === 0 || node.offsetHeight === 0) {
    throw new Error("Preview has no size yet.");
  }

  const html2canvas = (await import("html2canvas")).default;
  node.scrollIntoView({ block: "center", inline: "nearest" });
  await waitForNextFrame();

  const restoreTransform = resetTransformForCapture(node);
  const restoreDom = prepareExportDom(node);
  const restoreImages = await inlineImages(node);

  try {
    await waitForImages(node);
    await waitForNextFrame();

    const canvas = await html2canvas(node, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: null,
      imageTimeout: 15_000,
      onclone: (_clonedDoc, clonedNode) => {
        const tweetEl = clonedNode.querySelector<HTMLElement>(
          "[data-screenshot-tweet]"
        );
        if (tweetEl) tweetEl.style.transform = "none";
      },
    });

    if (isCanvasBlank(canvas)) {
      throw new Error("Rendered canvas was empty.");
    }

    return canvas.toDataURL("image/png");
  } finally {
    restoreImages();
    restoreDom();
    restoreTransform();
  }
}
