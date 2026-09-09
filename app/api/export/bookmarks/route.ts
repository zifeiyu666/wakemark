import { getSession } from "@/lib/auth/server";
import {
  fetchBookmarksForExport,
  markdownFileName,
  serializeBookmarkMarkdown,
  serializeExportCsv,
  serializeExportJson,
} from "@/lib/bookmarks/export";
import { ZipArchive } from "archiver";
import { NextRequest, NextResponse } from "next/server";
import { PassThrough } from "node:stream";
import { finished } from "node:stream/promises";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

function parseIds(raw: string | null): string[] | undefined {
  if (!raw) return undefined;
  const ids = raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  return ids.length > 0 ? ids : undefined;
}

function exportStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

async function buildZipBuffer(
  rows: Awaited<ReturnType<typeof fetchBookmarksForExport>>
): Promise<Buffer> {
  const passThrough = new PassThrough();
  const chunks: Buffer[] = [];
  passThrough.on("data", (chunk: Buffer | string) => {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  });

  const archive = new ZipArchive({ zlib: { level: 9 } });
  archive.on("error", (error: Error) => passThrough.destroy(error));
  archive.pipe(passThrough);

  for (const row of rows) {
    archive.append(serializeBookmarkMarkdown(row), {
      name: `wakemark-export/${markdownFileName(row)}`,
    });
  }
  archive.append(serializeExportJson(rows), {
    name: "wakemark-export/export.json",
  });
  archive.append(serializeExportCsv(rows), {
    name: "wakemark-export/export.csv",
  });

  await archive.finalize();
  await finished(passThrough);
  return Buffer.concat(chunks);
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  const user = session?.user;
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const format = request.nextUrl.searchParams.get("format") ?? "md-zip";
  const ids = parseIds(request.nextUrl.searchParams.get("ids"));
  const rows = await fetchBookmarksForExport(user.id, ids);

  if (rows.length === 0) {
    return NextResponse.json({ error: "no-bookmarks" }, { status: 404 });
  }

  if (format === "json") {
    return new NextResponse(serializeExportJson(rows), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="wakemark-export-${exportStamp()}.json"`,
        "Cache-Control": "no-store",
      },
    });
  }

  if (format === "csv") {
    return new NextResponse(serializeExportCsv(rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="wakemark-export-${exportStamp()}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const zipBuffer = await buildZipBuffer(rows);
  return new NextResponse(new Uint8Array(zipBuffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="wakemark-export-${exportStamp()}.zip"`,
      "Cache-Control": "no-store",
      "Content-Length": String(zipBuffer.byteLength),
    },
  });
}
