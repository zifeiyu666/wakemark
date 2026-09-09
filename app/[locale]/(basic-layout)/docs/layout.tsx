import { DocsMobileNav, DocsSidebar } from "@/components/docs/DocsSidebar";
import { DocsToc } from "@/components/docs/DocsToc";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full border-b">
      <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
        <DocsMobileNav />
        <div className="flex items-start gap-2">
          <DocsSidebar />
          <article className="docs-article min-w-0 flex-1 py-10 md:px-6 md:py-12 lg:px-8 [&_section[id]]:scroll-mt-24">
            {children}
          </article>
          <DocsToc />
        </div>
      </div>
    </div>
  );
}
