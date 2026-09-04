"use client";

import { getBookmarkStats } from "@/actions/bookmarks/list";
import {
  createList,
  deleteList,
  getLists,
  renameList,
  setListVisibility,
  type BookmarkListRow,
} from "@/actions/bookmarks/lists";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Link as I18nLink, usePathname, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { publicListUrl } from "@/lib/url";
import {
  ChevronDown,
  Copy,
  EllipsisVertical,
  Eye,
  EyeOff,
  Globe,
  ListTree,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import useSWR, { useSWRConfig } from "swr";

export function ListsSidebarMenu() {
  const t = useTranslations("Lists");
  const pathname = usePathname();
  const router = useRouter();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { mutate: globalMutate } = useSWRConfig();

  const [creating, setCreating] = useState(false);
  const [createName, setCreateName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<BookmarkListRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data } = useSWR("bookmark-lists", getLists, {
    refreshInterval: 30_000,
    revalidateOnFocus: true,
  });
  const lists = data?.success ? (data.data ?? []) : [];

  const { data: statsData } = useSWR("bookmarks-stats", getBookmarkStats);
  const username = statsData?.success ? statsData.data?.username : null;

  const refreshLists = () => globalMutate("bookmark-lists");

  const handleCreate = async () => {
    const name = createName.trim();
    if (!name) return;
    const res = await createList(name);
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    setCreateName("");
    setCreating(false);
    refreshLists();
  };

  const handleRename = async (listId: string) => {
    const name = editName.trim();
    if (!name) return;
    const res = await renameList(listId, name);
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    setEditingId(null);
    refreshLists();
  };

  const handleVisibility = async (list: BookmarkListRow, isPublic: boolean) => {
    const res = await setListVisibility(list.id, isPublic);
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    refreshLists();
    toast.success(isPublic ? t("board.madePublic") : t("board.madePrivate"));
  };

  const handleCopy = async (list: BookmarkListRow) => {
    if (!username) return;
    await navigator.clipboard.writeText(publicListUrl(username, list.slug));
    toast.success(t("board.copied"));
  };

  const handleDelete = async (list: BookmarkListRow) => {
    const res = await deleteList(list.id);
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    refreshLists();
    // Leaving the page behind if we just deleted the list we were viewing.
    if (pathname === `/dashboard/lists/${list.id}`) {
      router.push("/dashboard/lists");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    await handleDelete(deleteTarget);
    setDeleting(false);
    setDeleteTarget(null);
  };

  if (isCollapsed) {
    return (
      <SidebarMenuItem data-onboarding-target="lists">
        <SidebarMenuButton asChild isActive={pathname.startsWith("/dashboard/lists")}>
          <I18nLink href="/dashboard/lists" title={t("sidebar.group")}>
            <ListTree className="h-4 w-4" />
          </I18nLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <Collapsible
      data-onboarding-target="lists"
      defaultOpen={pathname.startsWith("/dashboard/lists")}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <div className="relative">
          <CollapsibleTrigger asChild>
            <SidebarMenuButton>
              <ListTree className="h-4 w-4" />
              <span>{t("sidebar.group")}</span>
              <ChevronDown className="ml-auto h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <button
            type="button"
            aria-label={t("sidebar.create")}
            className="absolute right-8 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            onClick={() => setCreating((v) => !v)}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <CollapsibleContent>
          <SidebarMenuSub>
            {creating && (
              <SidebarMenuSubItem>
                <div className="flex flex-col gap-1.5 px-1 py-1">
                  <Input
                    value={createName}
                    placeholder={t("sidebar.listNamePlaceholder")}
                    className="h-7 text-xs"
                    autoFocus
                    onChange={(e) => setCreateName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreate();
                      if (e.key === "Escape") setCreating(false);
                    }}
                  />
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      className="flex-1"
                      disabled={!createName.trim()}
                      onClick={handleCreate}
                    >
                      {t("sidebar.create")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCreating(false)}
                    >
                      {t("sidebar.cancel")}
                    </Button>
                  </div>
                </div>
              </SidebarMenuSubItem>
            )}
            {lists.length === 0 && !creating && (
              <SidebarMenuSubItem>
                <span className="block px-2 py-1 text-xs text-muted-foreground">
                  {t("sidebar.empty")}
                </span>
              </SidebarMenuSubItem>
            )}
            {lists.map((list) => {
              const active = pathname === `/dashboard/lists/${list.id}`;
              return (
                <SidebarMenuSubItem key={list.id}>
                  {editingId === list.id ? (
                    <div className="flex items-center gap-1.5 px-1 py-1">
                      <Input
                        value={editName}
                        className="h-7 text-xs"
                        autoFocus
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRename(list.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                      />
                      <Button
                        size="sm"
                        disabled={!editName.trim()}
                        onClick={() => handleRename(list.id)}
                      >
                        {t("sidebar.create")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingId(null)}
                      >
                        {t("sidebar.cancel")}
                      </Button>
                    </div>
                  ) : (
                    <div className="group/list flex w-full items-center gap-1">
                      <I18nLink
                        href={`/dashboard/lists/${list.id}`}
                        title={list.name}
                        className={cn(
                          "flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          active && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        )}
                      >
                        <span className="truncate">{list.name}</span>
                        {list.isPublic && (
                          <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        )}
                        <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                          {list.count}
                        </span>
                      </I18nLink>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            aria-label={`${list.name} menu`}
                            className="rounded-sm p-0.5 text-muted-foreground opacity-0 transition-opacity hover:bg-secondary hover:text-foreground focus-visible:opacity-100 group-hover/list:opacity-100"
                          >
                            <EllipsisVertical className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-44">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingId(list.id);
                              setEditName(list.name);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                            {t("menu.editName")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleVisibility(list, !list.isPublic)}
                          >
                            {list.isPublic ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                            {list.isPublic
                              ? t("menu.makePrivate")
                              : t("menu.makePublic")}
                          </DropdownMenuItem>
                          {list.isPublic && username && (
                            <DropdownMenuItem onClick={() => handleCopy(list)}>
                              <Copy className="h-4 w-4" />
                              {t("menu.copyPublicUrl")}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteTarget(list)}
                          >
                            <Trash2 className="h-4 w-4" />
                            {t("menu.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </SidebarMenuSubItem>
              );
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
        <AlertDialog
          open={deleteTarget !== null}
          onOpenChange={(open) => {
            if (!open && !deleting) setDeleteTarget(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("menu.deleteConfirmTitle")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("menu.deleteConfirmDescription", {
                  name: deleteTarget?.name ?? "",
                })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>
                {t("sidebar.cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleting}
                onClick={confirmDelete}
              >
                {t("menu.delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarMenuItem>
    </Collapsible>
  );
}
