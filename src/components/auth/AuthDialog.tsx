import { useRef, useState } from "react";
import { toast } from "sonner";
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
import { useI18n } from "@/i18n/i18n";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { signInWithPassword, signUpWithProfile, validateAvatarFile } from "@/lib/auth/api";
import { mapPersistenceError } from "@/lib/valuations/errors";

type AuthMode = "login" | "signup";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
}

export function AuthDialog({ open, onOpenChange, mode, onModeChange }: AuthDialogProps) {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setPassword("");
    setAvatar(null);
    setPreview(null);
  };

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    try {
      validateAvatarFile(file);
      setAvatar(file);
      setPreview(URL.createObjectURL(file));
    } catch (error) {
      const mapped = mapPersistenceError(error);
      toast.error(t(`persist.error.${mapped.code}`));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isSupabaseConfigured) {
      toast.error(t("persist.error.supabase_not_configured"));
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "login") {
        await signInWithPassword(email, password);
        toast.success(t("toast.loginSuccess"));
        resetForm();
        onOpenChange(false);
        return;
      }

      if (!avatar) {
        toast.error(t("auth.avatar.required"));
        return;
      }

      const result = await signUpWithProfile({ name, email, password, avatar });
      resetForm();
      if (result.needsEmailConfirmation) {
        toast.success(t("auth.confirmEmail"));
        onModeChange("login");
        return;
      }
      toast.success(t("toast.signupSuccess"));
      onOpenChange(false);
    } catch (error) {
      const mapped = mapPersistenceError(error);
      toast.error(
        mapped.code === "unknown" && mapped.message !== "unknown"
          ? mapped.message
          : t(`persist.error.${mapped.code}`),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "login" ? t("auth.login") : t("auth.signup")}</DialogTitle>
          <DialogDescription>
            {mode === "login" ? t("auth.login.subtitle") : t("auth.signup.subtitle")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="auth-name">{t("auth.name")}</Label>
                <Input
                  id="auth-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                  minLength={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="auth-avatar">{t("auth.avatar")}</Label>
                <input
                  ref={fileRef}
                  id="auth-avatar"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full rounded-lg border border-border/50 bg-secondary/20 p-3 text-left hover:bg-secondary/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {preview ? (
                      <img src={preview} alt="" className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-muted" />
                    )}
                    <div>
                      <p className="text-sm">{avatar ? avatar.name : t("auth.avatar.choose")}</p>
                      <p className="text-xs text-muted-foreground">{t("auth.avatar.help")}</p>
                    </div>
                  </div>
                </button>
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label htmlFor="auth-email">{t("auth.email")}</Label>
            <Input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="auth-password">{t("auth.password")}</Label>
            <Input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              minLength={6}
            />
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button type="submit" className="w-full" disabled={submitting}>
              {mode === "login" ? t("auth.submit.login") : t("auth.submit.signup")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full text-xs"
              onClick={() => {
                resetForm();
                onModeChange(mode === "login" ? "signup" : "login");
              }}
            >
              {mode === "login" ? t("auth.switch.toSignup") : t("auth.switch.toLogin")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
