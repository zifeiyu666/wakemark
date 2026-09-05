"use client";

import { DynamicIcon } from "@/components/DynamicIcon";
import { BookmarksSidebarMenu } from "@/components/bookmarks/BookmarksSidebarMenu";
import { ListsSidebarMenu } from "@/components/bookmarks/ListsSidebarMenu";
import { SidebarUserNav } from "@/components/header/SidebarUserNav";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { Link as I18nLink, usePathname } from "@/i18n/routing";
import { authClient } from "@/lib/auth/auth-client";
import { MailOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

type Menu = {
  name: string;
  href: string;
  target?: string;
  icon: string;
};

export function DashboardSidebar({
  hasProductAccess,
}: {
  hasProductAccess: boolean;
}) {
  const { data: session } = authClient.useSession();
  const user = session?.user as any | undefined;
  const pathname = usePathname();
  const t = useTranslations("Login");
  const tHome = useTranslations("Home");
  const tDigests = useTranslations("Digests");

  const isAdmin = user?.role === "admin";

  // Hide personal order/credit entries from the sidebar
  const hiddenUserMenuHrefs = [
    "/dashboard/my-orders",
    "/dashboard/credit-history",
  ];
  // MCP is a product surface; Settings stays visible so billing can be managed
  // before a plan is active (admins can open dashboard without a subscription).
  const unsubscribedHiddenHrefs = hasProductAccess ? [] : ["/dashboard/mcp"];

  const allUserMenus: Menu[] = t.raw("UserMenus");
  const userMenus = allUserMenus.filter(
    (menu) =>
      !hiddenUserMenuHrefs.includes(menu.href) &&
      !unsubscribedHiddenHrefs.includes(menu.href)
  );
  const adminMenus: Menu[] = t.raw("AdminMenus");

  const isActive = (href: string) => pathname === href;

  const { state } = useSidebar();

  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <I18nLink
          href="/"
          title={tHome("title")}
          prefetch={true}
          className="flex items-center space-x-1 px-2 py-1"
        >
          <Image
            src="/logo.png"
            alt="Logo"
            width={24}
            height={24}
            className="rounded-none"
          />
          {!isCollapsed && <h1 className="font-semibold">{tHome("title")}</h1>}
        </I18nLink>
      </SidebarHeader>

      <SidebarContent>
        {hasProductAccess && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <BookmarksSidebarMenu />
                <ListsSidebarMenu />
                <SidebarMenuItem data-onboarding-target="digests">
                  <SidebarMenuButton
                    asChild
                    isActive={isActive("/dashboard/digests")}
                  >
                    <I18nLink
                      href="/dashboard/digests"
                      title={tDigests("title")}
                      prefetch={false}
                    >
                      <MailOpen className="h-4 w-4" />
                      {!isCollapsed && <span>{tDigests("title")}</span>}
                    </I18nLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {isAdmin && (
          <>
            {hasProductAccess && <SidebarSeparator />}
            <SidebarGroup>
              <SidebarGroupLabel>Admin Menus</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminMenus.map((menu) => (
                    <SidebarMenuItem key={menu.href}>
                      <SidebarMenuButton asChild isActive={isActive(menu.href)}>
                        <I18nLink
                          href={menu.href}
                          title={menu.name}
                          prefetch={false}
                        >
                          <DynamicIcon name={menu.icon} className="h-4 w-4" />
                          {!isCollapsed && <span>{menu.name}</span>}
                        </I18nLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {userMenus.map((menu) => (
            <SidebarMenuItem key={menu.href}>
              <SidebarMenuButton asChild isActive={isActive(menu.href)}>
                <I18nLink
                  href={menu.href}
                  title={menu.name}
                  prefetch={true}
                  target={menu.target}
                >
                  {menu.icon ? (
                    <DynamicIcon name={menu.icon} className="h-4 w-4" />
                  ) : (
                    <span>{menu.name.slice(0, 1)}</span>
                  )}
                  {!isCollapsed && <span>{menu.name}</span>}
                </I18nLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        <SidebarUserNav user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
