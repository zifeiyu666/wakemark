import LocaleSwitcher from "@/components/LocaleSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import MobileMenu from "@/components/header/MobileMenu";
import {
  DASHBOARD_HEADER_END_ID,
  DASHBOARD_HEADER_START_ID,
} from "@/components/header/DashboardHeaderPortals";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default async function SidebarInsetHeader() {
  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 px-4 py-2 backdrop-blur-md">
      <nav className="mx-auto flex w-full items-center gap-2">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-4" />
        <div
          id={DASHBOARD_HEADER_START_ID}
          className="flex min-w-0 flex-1 items-center"
        />

        <div className="flex shrink-0 items-center gap-x-2">
          <div
            id={DASHBOARD_HEADER_END_ID}
            className="hidden min-w-0 items-center lg:flex"
          />
          {/* PC */}
          <div className="hidden items-center gap-x-2 lg:flex">
            <LocaleSwitcher />
            <ThemeToggle />
          </div>

          {/* Mobile */}
          <div className="flex lg:hidden">
            <MobileMenu showThemeToggle />
          </div>
        </div>
      </nav>
    </header>
  );
}
