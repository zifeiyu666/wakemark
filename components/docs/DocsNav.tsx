"use client";

import { DynamicIcon } from "@/components/DynamicIcon";
import { Link as I18nLink, usePathname } from "@/i18n/routing";
import {
  DOCS_NAV,
  isDocsNavGroup,
} from "@/lib/docs/nav";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export function DocsNav() {
  const pathname = usePathname();
  const t = useTranslations("Docs");

  return (
    <nav aria-label={t("nav.label")} className="space-y-6">
      {DOCS_NAV.map((entry) =>
        isDocsNavGroup(entry) ? (
          <div key={entry.titleKey}>
            <p className="mb-2 px-3 text-[13px] text-muted-foreground">
              {t(entry.titleKey)}
            </p>
            <ul className="space-y-0.5">
              {entry.items.map((item) => (
                <li key={item.href}>
                  <DocsNavLink
                    href={item.href}
                    label={t(item.labelKey)}
                    icon={item.icon}
                    active={pathname === item.href}
                  />
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <ul key={entry.href} className="space-y-0.5">
            <li>
              <DocsNavLink
                href={entry.href}
                label={t(entry.labelKey)}
                icon={entry.icon}
                active={pathname === entry.href}
              />
            </li>
          </ul>
        )
      )}
    </nav>
  );
}

function DocsNavLink({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: string;
  active: boolean;
}) {
  return (
    <I18nLink
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
        active
          ? "font-semibold text-foreground"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <DynamicIcon name={icon} className="size-4 shrink-0" />
      {label}
    </I18nLink>
  );
}
