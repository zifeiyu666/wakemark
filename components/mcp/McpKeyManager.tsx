"use client";

import {
  createMcpApiKey,
  revokeMcpApiKey,
  type ApiKeyRow,
} from "@/actions/mcp/keys";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Check, Copy, KeyRound, Loader2, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";

type ExpirationOption = "never" | "30" | "90" | "365";

function useCopy(): [boolean, (text: string) => void] {
  const [copied, setCopied] = useState(false);
  const copy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return [copied, copy];
}

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}

export default function McpKeyManager({
  initialKeys,
}: {
  initialKeys: ApiKeyRow[];
}) {
  const t = useTranslations("Mcp.keys");
  // Dates arrive as ISO strings through the RSC boundary; revive them once.
  const [keys, setKeys] = useState<ApiKeyRow[]>(() =>
    initialKeys.map((k) => ({
      ...k,
      createdAt: toDate(k.createdAt)!,
      lastRequest: toDate(k.lastRequest),
      expiresAt: toDate(k.expiresAt),
    }))
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [expiration, setExpiration] = useState<ExpirationOption>("never");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<ApiKeyRow | null>(null);
  const [isPending, startTransition] = useTransition();
  const [keyCopied, copyKey] = useCopy();

  const handleCreate = () => {
    const keyName = name.trim();
    if (!keyName) return;
    startTransition(async () => {
      const res = await createMcpApiKey({
        name: keyName,
        expiresInDays:
          expiration === "never" ? undefined : Number(expiration),
      });
      if (!res.success || !res.data) {
        toast.error(t("toastErrorTitle"), {
          description: res.success ? undefined : res.error,
        });
        return;
      }
      setCreateOpen(false);
      setNewKey(res.data.key);
      setName("");
      setExpiration("never");
      toast.success(t("toastCreatedTitle"));
      // Optimistic row mirroring what the server persisted (start = the stored
      // leading characters of the plaintext key).
      setKeys((prev) => [
        {
          id: res.data!.id,
          name: keyName,
          start: res.data!.key.slice(0, 9),
          prefix: "wkm_",
          enabled: true,
          createdAt: new Date(),
          lastRequest: null,
          expiresAt:
            expiration === "never"
              ? null
              : new Date(Date.now() + Number(expiration) * 86400_000),
        },
        ...prev,
      ]);
    });
  };

  const handleRevoke = () => {
    if (!revokeTarget) return;
    const target = revokeTarget;
    startTransition(async () => {
      const res = await revokeMcpApiKey(target.id);
      setRevokeTarget(null);
      if (!res.success) {
        toast.error(t("toastErrorTitle"), { description: res.error });
        return;
      }
      setKeys((prev) => prev.filter((k) => k.id !== target.id));
      toast.success(t("toastRevokedTitle"));
    });
  };

  return (
    <>
      {keys.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-10 text-center">
          <KeyRound className="size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground max-w-sm">{t("empty")}</p>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4 mr-2" />
            {t("create")}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{t("columnName")}</TableHead>
                <TableHead>{t("columnKey")}</TableHead>
                <TableHead>{t("columnCreated")}</TableHead>
                <TableHead>{t("columnLastUsed")}</TableHead>
                <TableHead>{t("columnExpires")}</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell className="font-medium">
                    {key.name ?? "-"}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {key.start ? `${key.start}...` : "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(key.createdAt, "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {key.lastRequest
                      ? format(key.lastRequest, "MMM d, yyyy")
                      : t("neverUsed")}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {key.expiresAt
                      ? format(key.expiresAt, "MMM d, yyyy")
                      : t("never")}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setRevokeTarget(key)}
                      aria-label={t("revoke")}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div>
            <Button variant="outline" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4 mr-2" />
              {t("create")}
            </Button>
          </div>
        </div>
      )}

      {/* Create key dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("createTitle")}</DialogTitle>
            <DialogDescription>{t("createDescription")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="mcp-key-name">{t("nameLabel")}</Label>
              <Input
                id="mcp-key-name"
                value={name}
                maxLength={60}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("namePlaceholder")}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>{t("expiresLabel")}</Label>
              <Select
                value={expiration}
                onValueChange={(v) => setExpiration(v as ExpirationOption)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">{t("expiresNever")}</SelectItem>
                  <SelectItem value="30">{t("expiresDays", { days: 30 })}</SelectItem>
                  <SelectItem value="90">{t("expiresDays", { days: 90 })}</SelectItem>
                  <SelectItem value="365">{t("expiresDays", { days: 365 })}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleCreate}
              disabled={!name.trim() || isPending}
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin mr-2" />
              ) : (
                <KeyRound className="size-4 mr-2" />
              )}
              {isPending ? t("creating") : t("createSubmit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* One-time plaintext key reveal */}
      <Dialog
        open={!!newKey}
        onOpenChange={(open) => {
          if (!open) setNewKey(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("createdTitle")}</DialogTitle>
            <DialogDescription>{t("createdDescription")}</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-3">
            <code className="flex-1 break-all font-mono text-xs">
              {newKey}
            </code>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0"
              onClick={() => newKey && copyKey(newKey)}
              aria-label={t("copyKey")}
            >
              {keyCopied ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setNewKey(null)}>{t("done")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke confirmation */}
      <AlertDialog
        open={!!revokeTarget}
        onOpenChange={(open) => {
          if (!open) setRevokeTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("revokeConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("revokeConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("revoke")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
