import type { Database, Json, ValuationMethod } from "@/lib/supabase/types";
import type { ValuationResult } from "@/lib/valuation";
import { requireSupabase } from "@/lib/supabase/client";
import { mapPersistenceError, PersistenceError } from "./errors";
import { normalizeTicker } from "./rules";
import type {
  ValuationInputs,
  ValuationMetrics,
  ValuationPremises,
  ValuationRecord,
  ValuationWritePayload,
} from "./types";

interface ProfileEmbed {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

type ValuationQueryRow = {
  id: string;
  user_id: string;
  ticker: string;
  company: string | null;
  method: ValuationMethod;
  premises: Json;
  metrics: Json;
  inputs: Json;
  result: Json;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  author?: ProfileEmbed | ProfileEmbed[] | null;
};

function asObject<T>(value: Json | null | undefined): T {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as T;
  }
  return {} as T;
}

function authorFrom(row: ValuationQueryRow): ValuationRecord["author"] | undefined {
  const raw = Array.isArray(row.author) ? row.author[0] : row.author;
  if (!raw) return undefined;
  return {
    id: raw.id,
    displayName: raw.display_name,
    avatarUrl: raw.avatar_url,
  };
}

function mapRow(row: ValuationQueryRow): ValuationRecord {
  return {
    id: row.id,
    userId: row.user_id,
    ticker: row.ticker,
    company: row.company,
    method: row.method,
    premises: asObject<ValuationPremises>(row.premises),
    metrics: asObject<ValuationMetrics>(row.metrics),
    inputs: asObject<ValuationInputs>(row.inputs),
    result: asObject<ValuationResult>(row.result),
    isPublic: row.is_public,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    author: authorFrom(row),
  };
}

const AUTHOR_SELECT = "author:profiles!valuations_user_id_fkey(id, display_name, avatar_url)";

export async function listMyValuations(): Promise<ValuationRecord[]> {
  try {
    const client = requireSupabase();
    const uid = (await client.auth.getUser()).data.user?.id;
    if (!uid) throw new PersistenceError("authentication_required");

    const { data, error } = await client
      .from("valuations")
      .select(`*, ${AUTHOR_SELECT}`)
      .eq("user_id", uid)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return ((data ?? []) as ValuationQueryRow[]).map(mapRow);
  } catch (error) {
    throw mapPersistenceError(error);
  }
}

export async function listPublicValuations(ticker?: string): Promise<ValuationRecord[]> {
  try {
    const client = requireSupabase();
    let query = client
      .from("valuations")
      .select(`*, ${AUTHOR_SELECT}`)
      .eq("is_public", true)
      .order("updated_at", { ascending: false });

    if (ticker) {
      query = query.eq("ticker", normalizeTicker(ticker));
    }

    const { data, error } = await query.limit(50);
    if (error) throw error;
    return ((data ?? []) as ValuationQueryRow[]).map(mapRow);
  } catch (error) {
    throw mapPersistenceError(error);
  }
}

export async function getValuation(id: string): Promise<ValuationRecord> {
  try {
    const client = requireSupabase();
    const { data, error } = await client
      .from("valuations")
      .select(`*, ${AUTHOR_SELECT}`)
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new PersistenceError("not_found");
    return mapRow(data as ValuationQueryRow);
  } catch (error) {
    throw mapPersistenceError(error);
  }
}

export async function createValuation(payload: ValuationWritePayload): Promise<ValuationRecord> {
  try {
    const client = requireSupabase();
    const { data, error } = await client
      .from("valuations")
      .insert({
        ticker: payload.ticker,
        company: payload.company,
        method: payload.method,
        premises: payload.premises as unknown as Json,
        metrics: payload.metrics as unknown as Json,
        inputs: payload.inputs as unknown as Json,
        result: payload.result as unknown as Json,
        is_public: payload.isPublic,
      })
      .select(`*, ${AUTHOR_SELECT}`)
      .single();

    if (error) throw error;
    return mapRow(data as ValuationQueryRow);
  } catch (error) {
    throw mapPersistenceError(error);
  }
}

export async function updateValuation(
  id: string,
  payload: Partial<ValuationWritePayload> & { isPublic?: boolean },
): Promise<ValuationRecord> {
  try {
    const client = requireSupabase();
    const patch: Record<string, unknown> = {};
    if (payload.ticker !== undefined) patch.ticker = payload.ticker;
    if (payload.company !== undefined) patch.company = payload.company;
    if (payload.method !== undefined) patch.method = payload.method;
    if (payload.premises !== undefined) patch.premises = payload.premises as unknown as Json;
    if (payload.metrics !== undefined) patch.metrics = payload.metrics as unknown as Json;
    if (payload.inputs !== undefined) patch.inputs = payload.inputs as unknown as Json;
    if (payload.result !== undefined) patch.result = payload.result as unknown as Json;
    if (payload.isPublic !== undefined) patch.is_public = payload.isPublic;

    const { data, error } = await client
      .from("valuations")
      .update(patch as Database["public"]["Tables"]["valuations"]["Update"])
      .eq("id", id)
      .select(`*, ${AUTHOR_SELECT}`)
      .single();

    if (error) throw error;
    return mapRow(data as ValuationQueryRow);
  } catch (error) {
    throw mapPersistenceError(error);
  }
}

export async function deleteValuation(id: string): Promise<void> {
  try {
    const client = requireSupabase();
    const { error } = await client.from("valuations").delete().eq("id", id);
    if (error) throw error;
  } catch (error) {
    throw mapPersistenceError(error);
  }
}

export async function setValuationPublic(id: string, isPublic: boolean): Promise<ValuationRecord> {
  return updateValuation(id, { isPublic });
}
