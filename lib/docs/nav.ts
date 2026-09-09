export type DocsNavLink = {
  href: string;
  labelKey: string;
  icon: string;
};

export type DocsNavGroup = {
  titleKey: string;
  items: DocsNavLink[];
};

export type DocsNavEntry = DocsNavLink | DocsNavGroup;

export function isDocsNavGroup(entry: DocsNavEntry): entry is DocsNavGroup {
  return "items" in entry;
}

export const DOCS_NAV: DocsNavEntry[] = [
  {
    titleKey: "nav.start",
    items: [
      {
        href: "/docs/start/introduction",
        labelKey: "nav.introduction",
        icon: "BookOpen",
      },
      {
        href: "/docs/start/quickstart",
        labelKey: "nav.quickstart",
        icon: "Rocket",
      },
      {
        href: "/docs/start/import-history",
        labelKey: "nav.importHistory",
        icon: "History",
      },
      {
        href: "/docs/start/export",
        labelKey: "nav.export",
        icon: "Download",
      },
      {
        href: "/docs/start/notion",
        labelKey: "nav.notion",
        icon: "NotebookPen",
      },
    ],
  },
  { href: "/docs/mcp", labelKey: "nav.mcp", icon: "Cable" },
  { href: "/docs/extension", labelKey: "nav.extension", icon: "Puzzle" },
  { href: "/docs/raycast", labelKey: "nav.raycast", icon: "Command" },
];

export function docsNavLabelKey(pathname: string): string | null {
  for (const entry of DOCS_NAV) {
    if (isDocsNavGroup(entry)) {
      const match = entry.items.find((item) => item.href === pathname);
      if (match) return match.labelKey;
      continue;
    }
    if (entry.href === pathname) return entry.labelKey;
  }
  return null;
}
