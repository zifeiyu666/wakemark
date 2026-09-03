import { Link as I18nLink } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export default function CTA() {
  const t = useTranslations("Landing.CTA");

  return (
    <section
      id="cta"
      className="relative left-1/2 w-screen max-w-none -translate-x-1/2"
    >
      <div className="cta-grid relative isolate flex min-h-[430px] items-center justify-center overflow-hidden px-6 py-20 text-center sm:px-10 md:min-h-[510px]">
        <div aria-hidden className="cta-grid-meteors">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="relative z-10 flex max-w-5xl flex-col items-center">
          <h2 className="max-w-5xl text-4xl font-medium leading-[1.08] tracking-[-0.045em] text-white sm:text-5xl md:text-6xl">
            {t("title")}
          </h2>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-zinc-400 md:text-lg">
            {t("description")}
          </p>

          <I18nLink
            href="/#pricing"
            className="mt-9 inline-flex h-12 items-center rounded-xl border border-zinc-600 bg-zinc-700 px-5 text-sm font-medium text-white transition-colors hover:border-zinc-500 hover:bg-zinc-600 active:translate-y-px"
            prefetch={true}
          >
            {t("button")}
          </I18nLink>

          {t.has("trustText") && (
            <p className="mt-5 text-sm text-zinc-500">
              {t("trustText")}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
