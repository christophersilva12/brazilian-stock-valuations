import type { User } from "@supabase/supabase-js";
import { requireSupabase, supabase } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/types";
import { mapPersistenceError, PersistenceError } from "@/lib/valuations/errors";

const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw mapPersistenceError(error);
  return data;
}

export async function signInWithPassword(email: string, password: string) {
  const client = requireSupabase();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw mapPersistenceError(error);
  return data;
}

export async function signOut() {
  const client = requireSupabase();
  const { error } = await client.auth.signOut();
  if (error) throw new PersistenceError("unknown", error.message);
}

export function validateAvatarFile(file: File) {
  if (!AVATAR_TYPES.has(file.type)) {
    throw new PersistenceError("invalid_avatar_type");
  }
  if (file.size > AVATAR_MAX_BYTES) {
    throw new PersistenceError("invalid_avatar_size");
  }
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  validateAvatarFile(file);
  const client = requireSupabase();
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : file.type === "image/gif" ? "gif" : "jpg";
  const path = `${userId}/avatar.${ext}`;

  const { error } = await client.storage.from("avatars").upload(path, file, {
    upsert: true,
    contentType: file.type,
    cacheControl: "3600",
  });
  if (error) throw new PersistenceError("unknown", error.message);

  const { data } = client.storage.from("avatars").getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}

export async function updateProfile(userId: string, patch: { display_name?: string; avatar_url?: string }) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("profiles")
    .update(patch)
    .eq("id", userId)
    .select("*")
    .single();
  if (error) throw mapPersistenceError(error);
  return data as Profile;
}

export async function signUpWithProfile(params: {
  name: string;
  email: string;
  password: string;
  avatar: File;
}): Promise<{ user: User | null; needsEmailConfirmation: boolean }> {
  validateAvatarFile(params.avatar);
  const name = params.name.trim();
  if (name.length < 2) {
    throw new PersistenceError("invalid_name");
  }

  const client = requireSupabase();
  const { data, error } = await client.auth.signUp({
    email: params.email.trim(),
    password: params.password,
    options: {
      data: { display_name: name },
      emailRedirectTo: `${window.location.origin}/`,
    },
  });
  if (error) throw new PersistenceError("unknown", error.message);

  const user = data.user;
  if (user && data.session) {
    const avatarUrl = await uploadAvatar(user.id, params.avatar);
    await updateProfile(user.id, { display_name: name, avatar_url: avatarUrl });
    return { user, needsEmailConfirmation: false };
  }

  return { user, needsEmailConfirmation: true };
}

export { supabase };
