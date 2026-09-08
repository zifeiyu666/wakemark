"use client";

import { getBookmarkStats } from "@/actions/bookmarks/list";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Link as I18nLink, usePathname } from "@/i18n/routing";
import { Bookmark, BookmarkCheck, ChevronDown, Inbox, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import useSWR from "swr";

export function BookmarksSidebarMenu() {
  const t = useTranslations("Bookmarks");
  const pathname = usePathname();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const { data } = useSWR("bookmarks-stats", getBookmarkStats, {
    refreshInterval: 30_000,
    revalidateOnFocus: true,
  });
  const stats = data?.success ? data.data : null;
  const unread = stats?.connected ? stats.unread : 0;
  const trashCount = stats?.connected ? stats.trash : 0;

  const isInBookmarks = pathname.startsWith("/dashboard/bookmarks");

  const subItems = [
    {
      href: "/dashboard/bookmarks",
      label: t("sidebar.all"),
      icon: Inbox,
      badge: 0,
    },
    {
      href: "/dashboard/bookmarks/unread",
      label: t("sidebar.unread"),
      icon: Bookmark,
      badge: unread,
    },
    {
      href: "/dashboard/bookmarks/read",
      label: t("sidebar.read"),
      icon: BookmarkCheck,
      badge: 0,
    },
    {
      href: "/dashboard/bookmarks/trash",
      label: t("sidebar.trash"),
      icon: Trash2,
      badge: trashCount,
    },
  ];

  // In icon-collapsed mode fall back to a plain link (no room for submenu).
  if (isCollapsed) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isInBookmarks}>
          <I18nLink href="/dashboard/bookmarks" title={t("sidebar.group")}>
            <Inbox className="h-4 w-4" />
          </I18nLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <Collapsible defaultOpen={isInBookmarks} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton>
            <Inbox className="h-4 w-4" />
            <span>{t("sidebar.group")}</span>
            <ChevronDown className="ml-auto h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {subItems.map((item) => (
              <SidebarMenuSubItem key={item.href}>
                <SidebarMenuSubButton asChild isActive={pathname === item.href}>
                  <I18nLink href={item.href} title={item.label}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                    {item.badge > 0 && (
                      <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-none bg-foreground px-1.5 text-xs font-medium text-background">
                        {item.badge}
                      </span>
                    )}
                  </I18nLink>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}
