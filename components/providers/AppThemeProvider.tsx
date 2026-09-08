"use client";

import { usePathname } from "@/i18n/routing";
import { ThemeProvider } from "next-themes";

export function AppThemeProvider({
  children,
  defaultTheme,
}: {
  children: React.ReactNode;
  defaultTheme: string;
}) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme={defaultTheme}
      enableSystem={!isHomePage}
      forcedTheme={isHomePage ? "light" : undefined}
    >
      {children}
    </ThemeProvider>
  );
}
