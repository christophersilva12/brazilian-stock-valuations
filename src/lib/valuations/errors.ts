export type PersistenceErrorCode =
  | "supabase_not_configured"
  | "authentication_required"
  | "invalid_credentials"
  | "email_not_confirmed"
  | "invalid_ticker"
  | "invalid_inputs"
  | "invalid_name"
  | "invalid_avatar_type"
  | "invalid_avatar_size"
  | "max_public_valuations"
  | "ticker_already_public"
  | "not_found"
  | "unknown";

export class PersistenceError extends Error {
  code: PersistenceErrorCode;

  constructor(code: PersistenceErrorCode, message?: string) {
    super(message ?? code);
    this.name = "PersistenceError";
    this.code = code;
  }
}

export function mapPersistenceError(error: unknown): PersistenceError {
  if (error instanceof PersistenceError) return error;

  const raw = error as { message?: string; code?: string; hint?: string } | null;
  const message = raw?.message ?? (error instanceof Error ? error.message : "");
  const hint = raw?.hint ?? "";
  const pgCode = raw?.code ?? "";

  if (message === "supabase_not_configured") {
    return new PersistenceError("supabase_not_configured");
  }
  if (message === "invalid_ticker") {
    return new PersistenceError("invalid_ticker");
  }
  if (message === "invalid_inputs") {
    return new PersistenceError("invalid_inputs");
  }
  if (message === "invalid_name") {
    return new PersistenceError("invalid_name");
  }
  if (message === "invalid_avatar_type") {
    return new PersistenceError("invalid_avatar_type");
  }
  if (message === "invalid_avatar_size") {
    return new PersistenceError("invalid_avatar_size");
  }
  if (message.includes("max_public_valuations") || hint === "MAX_PUBLIC") {
    return new PersistenceError("max_public_valuations");
  }
  if (pgCode === "23505" || message.includes("valuations_one_public_per_user_ticker")) {
    return new PersistenceError("ticker_already_public");
  }
  if (pgCode === "42501" || message.includes("authentication_required") || message.includes("not_owner")) {
    return new PersistenceError("authentication_required");
  }
  if (pgCode === "email_not_confirmed" || /email not confirmed/i.test(message)) {
    return new PersistenceError("email_not_confirmed");
  }
  if (pgCode === "invalid_credentials" || /invalid login credentials/i.test(message)) {
    return new PersistenceError("invalid_credentials");
  }
  if (pgCode === "PGRST116") {
    return new PersistenceError("not_found");
  }

  return new PersistenceError("unknown", message || "unknown");
}
