"use client";

import {
  getDigestPreferences,
  updateDigestLanguage,
} from "@/actions/digests";
import { updateUserSettingsAction } from "@/actions/users/settings";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { authClient } from "@/lib/auth/auth-client";
import { user as userSchema } from "@/lib/db/schema";
import {
  DEFAULT_DIGEST_LANGUAGE,
  DIGEST_LANGUAGES,
  type DigestLanguage,
} from "@/lib/digests/language";
import { isSyntheticEmail, normalizeEmail, validateEmail } from "@/lib/email";
import {
  AVATAR_ACCEPT_ATTRIBUTE,
  AVATAR_ALLOWED_EXTENSIONS,
  AVATAR_ALLOWED_FILE_TYPES,
  AVATAR_MAX_FILE_SIZE,
  FULL_NAME_MAX_LENGTH,
  isValidFullName,
} from "@/lib/validations";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import DigestSection from "./DigestSection";
import NotionSection from "./NotionSection";
import SettingsCard from "./SettingsCard";
import { HistoryImportCard } from "@/components/bookmarks/HistoryImportCard";

type User = typeof userSchema.$inferSelect;

export default function Settings({ user }: { user: User }) {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [isAvatarLoading, setIsAvatarLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [fullNameError, setFullNameError] = useState<string>("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Email is managed through better-auth changeEmail (sends a verification
  // link); synthetic X-login placeholders show as empty.
  const [emailValue, setEmailValue] = useState("");
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [digestLanguage, setDigestLanguage] = useState<DigestLanguage>(
    DEFAULT_DIGEST_LANGUAGE
  );
  const [savedDigestLanguage, setSavedDigestLanguage] =
    useState<DigestLanguage>(DEFAULT_DIGEST_LANGUAGE);
  const [languageLoaded, setLanguageLoaded] = useState(false);
  const [isLanguageSaving, setIsLanguageSaving] = useState(false);

  const t = useTranslations("Settings");
  const locale = useLocale();

  useEffect(() => {
    setFullName(user?.name || "");
    setEmailValue(isSyntheticEmail(user?.email) ? "" : user?.email || "");
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    getDigestPreferences().then((result) => {
      if (cancelled || !result.success || !result.data) return;
      setDigestLanguage(result.data.digestLanguage);
      setSavedDigestLanguage(result.data.digestLanguage);
      setLanguageLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleEmailSave = async () => {
    const normalized = normalizeEmail(emailValue);
    if (!validateEmail(normalized).isValid) {
      toast.error(t("toast.updateErrorTitle"), {
        description: t("toast.emailInvalid"),
      });
      return;
    }

    setIsEmailLoading(true);
    try {
      const { error } = await authClient.changeEmail({ newEmail: normalized });
      if (error) {
        toast.error(t("toast.updateErrorTitle"), {
          description: error.message || t("toast.updateErrorDescription"),
        });
        return;
      }
      toast.success(t("toast.emailSentTitle"), {
        description: t("toast.emailSentDescription"),
      });
      await authClient.getSession({
        query: {
          disableCookieCache: true,
        },
      });
      router.refresh();
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleLanguageSave = async () => {
    if (digestLanguage === savedDigestLanguage) return;
    setIsLanguageSaving(true);
    try {
      const result = await updateDigestLanguage(digestLanguage);
      if (!result.success) {
        toast.error(t("toast.updateErrorTitle"), {
          description: result.error || t("toast.updateErrorDescription"),
        });
        return;
      }
      setSavedDigestLanguage(digestLanguage);
      toast.success(t("toast.languageSavedTitle"), {
        description: t("toast.languageSavedDescription"),
      });
    } finally {
      setIsLanguageSaving(false);
    }
  };

  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFullName(value);

    if (value.length > FULL_NAME_MAX_LENGTH) {
      setFullNameError(
        t("toast.fullNameLengthError", {
          maxLength: FULL_NAME_MAX_LENGTH,
        })
      );
    } else if (value && !isValidFullName(value)) {
      setFullNameError(t("toast.fullNameInvalidCharactersError"));
    } else {
      setFullNameError("");
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!AVATAR_ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error(t("toast.errorInvalidFileType"), {
        description: t("toast.errorInvalidFileTypeDescription", {
          allowedTypes: AVATAR_ALLOWED_EXTENSIONS.join(", ").toUpperCase(),
        }),
      });
      e.target.value = "";
      return;
    }

    if (file.size > AVATAR_MAX_FILE_SIZE) {
      toast.error(t("toast.errorFileSizeExceeded"), {
        description: t("toast.errorFileSizeExceededDescription", {
          maxSizeInMB: AVATAR_MAX_FILE_SIZE / 1024 / 1024,
        }),
      });
      e.target.value = "";
      return;
    }

    setAvatarFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleFullNameSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (fullNameError || !fullName.trim()) {
      toast.error(t("toast.errorInvalidFullName"), {
        description: fullNameError || t("toast.errorFullNameRequired"),
      });
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("fullName", fullName.trim());

      const result = await updateUserSettingsAction({
        formData,
        locale: locale || undefined,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      toast.success(t("toast.updateSuccessTitle"), {
        description: t("toast.updateSuccessDescription"),
      });

      await authClient.getSession({
        query: {
          disableCookieCache: true,
        },
      });
      router.refresh();
    } catch (error) {
      toast.error(t("toast.updateErrorTitle"), {
        description:
          error instanceof Error
            ? error.message
            : t("toast.updateErrorDescription"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!avatarFile) return;

    setIsAvatarLoading(true);

    try {
      const formData = new FormData();
      formData.append("avatar", avatarFile);

      const result = await updateUserSettingsAction({
        formData,
        locale: locale || undefined,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      toast.success(t("toast.updateSuccessTitle"), {
        description: t("toast.updateSuccessDescription"),
      });

      await authClient.getSession({
        query: {
          disableCookieCache: true,
        },
      });
      router.refresh();

      setAvatarFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      toast.error(t("toast.updateErrorTitle"), {
        description:
          error instanceof Error
            ? error.message
            : t("toast.updateErrorDescription"),
      });
    } finally {
      setIsAvatarLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    };
  }, [previewUrl]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <HistoryImportCard />
      <SettingsCard
        title={t("form.emailLabel")}
        description={t("form.emailDescription")}
        footerHint={t("form.emailHint")}
        submitLabel={t("form.saveButton")}
        submitting={isEmailLoading}
        submitDisabled={
          !emailValue ||
          normalizeEmail(emailValue) === normalizeEmail(user.email)
        }
        onSubmit={(e) => {
          e.preventDefault();
          handleEmailSave();
        }}
      >
        <Input
          id="settings-email"
          type="email"
          value={emailValue}
          onChange={(e) => setEmailValue(e.target.value)}
          placeholder={t("form.emailPlaceholder")}
          disabled={isEmailLoading}
          className="max-w-sm"
          aria-label={t("form.emailLabel")}
        />
      </SettingsCard>

      <SettingsCard
        title={t("form.languageLabel")}
        description={t("form.languageDescription")}
        footerHint={t("form.languageHint")}
        submitLabel={t("form.saveButton")}
        submitting={isLanguageSaving}
        submitDisabled={
          !languageLoaded || digestLanguage === savedDigestLanguage
        }
        onSubmit={(e) => {
          e.preventDefault();
          handleLanguageSave();
        }}
      >
        <Select
          value={digestLanguage}
          onValueChange={(value) =>
            setDigestLanguage(value as DigestLanguage)
          }
          disabled={!languageLoaded || isLanguageSaving}
        >
          <SelectTrigger
            id="settings-digest-language"
            className="max-w-sm"
            aria-label={t("form.languageLabel")}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DIGEST_LANGUAGES.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingsCard>

      <DigestSection />

      <NotionSection />

      <SettingsCard
        title={t("form.fullNameLabel")}
        description={t("form.fullNameDescription")}
        footerHint={t("form.fullNameHint", {
          maxLength: FULL_NAME_MAX_LENGTH,
        })}
        submitLabel={t("form.saveButton")}
        submitting={isLoading}
        submitDisabled={
          !!fullNameError ||
          !fullName.trim() ||
          fullName.trim() === (user.name ?? "").trim()
        }
        onSubmit={handleFullNameSubmit}
      >
        <div className="max-w-sm space-y-2">
          <Input
            value={fullName}
            onChange={handleFullNameChange}
            placeholder={t("form.fullNamePlaceholder")}
            maxLength={FULL_NAME_MAX_LENGTH}
            aria-label={t("form.fullNameLabel")}
            aria-invalid={!!fullNameError}
          />
          {fullNameError && (
            <p className="text-sm text-destructive">{fullNameError}</p>
          )}
        </div>
      </SettingsCard>

      <SettingsCard
        title={t("form.avatarLabel")}
        description={t("form.avatarDescription")}
        footerHint={t("form.avatarFooterHint")}
        submitLabel={t("form.saveButton")}
        submitting={isAvatarLoading}
        submitDisabled={!avatarFile}
        onSubmit={handleAvatarSubmit}
      >
        <div className="flex items-center gap-4">
          <Avatar className="w-20 h-20">
            <AvatarImage
              src={previewUrl || user.image || undefined}
              alt={user.name || "User avatar"}
            />
            <AvatarFallback>{user.email[0] || ""}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <Input
              ref={fileInputRef}
              type="file"
              accept={AVATAR_ACCEPT_ATTRIBUTE}
              onChange={handleAvatarChange}
              className="max-w-[300px] hover:cursor-pointer"
              aria-label={t("form.avatarLabel")}
            />
            <p className="text-xs text-muted-foreground">
              {t("form.avatarHint", {
                maxSizeInMB: AVATAR_MAX_FILE_SIZE / 1024 / 1024,
                allowedTypes:
                  AVATAR_ALLOWED_EXTENSIONS.join(", ").toUpperCase(),
              })}
            </p>
          </div>
        </div>
      </SettingsCard>
    </div>
  );
}
