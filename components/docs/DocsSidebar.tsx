"use client";

import { DocsNav } from "@/components/docs/DocsNav";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { usePathname } from "@/i18n/routing";
import { docsNavLabelKey } from "@/lib/docs/nav";
import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export function DocsSidebar() {
  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-56 shrink-0 overflow-y-auto py-10 pr-4 lg:block">
      <DocsNav />
    </aside>
  );
}

export function DocsMobileNav() {
  const t = useTranslations("Docs");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const labelKey = docsNavLabelKey(pathname);
  const current = labelKey ? t(labelKey) : t("nav.menu");

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="border-b py-3 lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            aria-label={t("nav.open")}
          >
            <Menu className="size-4" />
            {current}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="border-b">
            <SheetTitle>{t("nav.label")}</SheetTitle>
          </SheetHeader>
          <div className="px-3 py-5">
            <DocsNav />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
