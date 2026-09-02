"use client";

import {
  getDigestPreferences,
  updateDigestPreferences,
} from "@/actions/digests";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import SettingsCard from "./SettingsCard";

// Curated IANA subset for the Settings select; the browser-detected zone and
// the stored zone are always merged in so the current value stays selectable.
const COMMON_TIMEZONES = [
  "UTC",
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "Africa/Lagos",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Shanghai",
  "Asia/Hong_Kong",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Australia/Sydney",
  "Pacific/Auckland",
];

const HOUR_OPTIONS = Array.from({ length: 17 }, (_, i) => i + 6); // 6..22

export default function DigestSection() {
  const t = useTranslations("Settings");

  const browserTimeZone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    []
  );

  const [loaded, setLoaded] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [timeZone, setTimeZone] = useState(browserTimeZone);
  const [hour, setHour] = useState(9);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getDigestPreferences().then((result) => {
      if (cancelled || !result.success || !result.data) return;
      setEnabled(result.data.digestEnabled);
      setTimeZone(result.data.timeZone ?? browserTimeZone);
      setHour(result.data.digestHour);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [browserTimeZone]);

  const timeZoneOptions = useMemo(() => {
    const options = [...COMMON_TIMEZONES];
    for (const zone of [browserTimeZone, timeZone]) {
      if (zone && !options.includes(zone)) options.push(zone);
    }
    return options;
  }, [browserTimeZone, timeZone]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updateDigestPreferences({
        timeZone,
        digestHour: hour,
        digestEnabled: enabled,
      });
      if (!result.success) throw new Error(result.error);
      toast.success(t("digest.toast.saveSuccessTitle"), {
        description: t("digest.toast.saveSuccessDescription"),
      });
    } catch (error) {
      toast.error(t("digest.toast.saveErrorTitle"), {
        description:
          error instanceof Error
          ? error.message
          : t("digest.toast.saveErrorDescription"),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <SettingsCard
        title={t("digest.title")}
        description={t("digest.description")}
        footerHint={t("digest.footerHint")}
        submitLabel={t("digest.saveButton")}
        submitting={saving}
        submitDisabled={!loaded}
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label>{t("digest.enabledLabel")}</Label>
            <p className="text-xs text-muted-foreground">
              {t("digest.enabledHint")}
            </p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{t("digest.timeZoneLabel")}</Label>
            <Select value={timeZone} onValueChange={setTimeZone} disabled={!loaded}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeZoneOptions.map((zone) => (
                  <SelectItem key={zone} value={zone}>
                    {zone === browserTimeZone
                      ? t("digest.timeZoneAuto", { zone })
                      : zone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t("digest.timeZoneHint")}
            </p>
          </div>

          <div className="space-y-2">
            <Label>{t("digest.hourLabel")}</Label>
            <Select
              value={String(hour)}
              onValueChange={(value) => setHour(Number(value))}
              disabled={!loaded}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HOUR_OPTIONS.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {t("digest.hourOption", { hour: option })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t("digest.hourHint")}
            </p>
          </div>
        </div>
      </SettingsCard>
    </div>
  );
}
