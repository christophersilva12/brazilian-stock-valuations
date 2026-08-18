import { useRef } from "react";
import { Link } from "react-router-dom";
import { ImagePlus, LogIn, LogOut, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth/AuthProvider";
import { signOut, updateProfile, uploadAvatar } from "@/lib/auth/api";
import { mapPersistenceError } from "@/lib/valuations/errors";
import { useI18n } from "@/i18n/i18n";

function initials(name: string | undefined, email: string | undefined) {
  const source = name?.trim() || email?.trim() || "?";
  return source.slice(0, 2).toUpperCase();
}

export function UserMenu() {
  const { t } = useI18n();
  const { user, profile, loading, openAuth, setProfile } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  if (loading) {
    return <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />;
  }

  if (!user) {
    return (
      <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => openAuth("login")}>
        <LogIn className="h-3.5 w-3.5" />
        {t("auth.login")}
      </Button>
    );
  }

  const handleAvatar = async (file: File | undefined) => {
    if (!file) return;
    try {
      const avatarUrl = await uploadAvatar(user.id, file);
      const next = await updateProfile(user.id, { avatar_url: avatarUrl });
      setProfile(next);
    } catch (error) {
      toast.error(t(`persist.error.${mapPersistenceError(error).code}`));
    }
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => void handleAvatar(e.target.files?.[0])}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile?.avatar_url ?? undefined} alt={profile?.display_name} />
              <AvatarFallback className="text-xs">
                {initials(profile?.display_name, user.email ?? undefined)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="space-y-0.5">
            <p className="text-sm font-medium truncate">{profile?.display_name ?? t("common.account")}</p>
            <p className="text-xs text-muted-foreground font-normal truncate">{user.email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/history" className="flex items-center gap-2">
              <UserRound className="h-4 w-4" />
              {t("history.mine")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              fileRef.current?.click();
            }}
          >
            <ImagePlus className="h-4 w-4" />
            {t("auth.avatar.choose")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={async () => {
              await signOut();
              toast.success(t("auth.logout"));
            }}
          >
            <LogOut className="h-4 w-4" />
            {t("auth.logout")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
