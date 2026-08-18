export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ValuationMethod = "graham" | "barsi" | "dcf" | "lynch";
export type ValuationSignal = "comprar" | "neutro" | "caro";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      valuations: {
        Row: {
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
        };
        Insert: {
          id?: string;
          user_id?: string;
          ticker: string;
          company?: string | null;
          method: ValuationMethod;
          premises?: Json;
          metrics?: Json;
          inputs?: Json;
          result: Json;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          ticker?: string;
          company?: string | null;
          method?: ValuationMethod;
          premises?: Json;
          metrics?: Json;
          inputs?: Json;
          result?: Json;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "valuations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ValuationRow = Database["public"]["Tables"]["valuations"]["Row"];
export type ValuationInsert = Database["public"]["Tables"]["valuations"]["Insert"];
export type ValuationUpdate = Database["public"]["Tables"]["valuations"]["Update"];
