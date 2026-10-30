export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type Inserts<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type Updates<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          business_name: string | null;
          currency_type: string;
          avatar_data: string | null;
          avatar_mime: string | null;
          business_email: string | null;
          business_phone: string | null;
          business_address: string | null;
          bio: string | null;
          website: string | null;
          portfolio_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          business_name?: string | null;
          currency_type?: string;
          avatar_data?: string | null;
          avatar_mime?: string | null;
          business_email?: string | null;
          business_phone?: string | null;
          business_address?: string | null;
          bio?: string | null;
          website?: string | null;
          portfolio_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          email: string | null;
          phone: string | null;
          second_contact: string | null;
          second_phone: string | null;
          address: string | null;
          city: string | null;
          state: string | null;
          zip_code: string | null;
          country: string;
          status: "active" | "inactive" | "blacklisted";
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name: string;
          email?: string | null;
          phone?: string | null;
          second_contact?: string | null;
          second_phone?: string | null;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          zip_code?: string | null;
          country?: string;
          status?: "active" | "inactive" | "blacklisted";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["clients"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "clients_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      bookings: {
        Row: {
          id: string;
          user_id: string;
          client_id: string;
          title: string;
          booking_date: string | null;
          start_time: string | null;
          end_time: string | null;
          location: string | null;
          event_type:
            | "Wedding"
            | "Birthday"
            | "Anniversary"
            | "Corporate"
            | "Party"
            | "Other";
          package_name: string | null;
          shoot_type: "Photography" | "Videography" | "Both";
          album: "Yes" | "No";
          status:
            | "pending"
            | "confirmed"
            | "in_progress"
            | "completed"
            | "cancelled";
          total_amount: number | null;
          deposit_amount: number | null;
          notes: string | null;
          wedding_hotel_name: string | null;
          wedding_date: string | null;
          homecoming_hotel_name: string | null;
          homecoming_date: string | null;
          wedding_album: boolean;
          pre_shoot_album: boolean;
          family_album: boolean;
          group_photo_size: string | null;
          homecoming_photo_size: string | null;
          wedding_photo_sizes: string[];
          extra_thank_you_cards_qty: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          client_id: string;
          title: string;
          booking_date?: string | null;
          start_time?: string | null;
          end_time?: string | null;
          location?: string | null;
          event_type?: Database["public"]["Tables"]["bookings"]["Row"]["event_type"];
          package_name?: string | null;
          shoot_type?: Database["public"]["Tables"]["bookings"]["Row"]["shoot_type"];
          album?: Database["public"]["Tables"]["bookings"]["Row"]["album"];
          status?: Database["public"]["Tables"]["bookings"]["Row"]["status"];
          total_amount?: number | null;
          deposit_amount?: number | null;
          notes?: string | null;
          wedding_hotel_name?: string | null;
          wedding_date?: string | null;
          homecoming_hotel_name?: string | null;
          homecoming_date?: string | null;
          wedding_album?: boolean;
          pre_shoot_album?: boolean;
          family_album?: boolean;
          group_photo_size?: string | null;
          homecoming_photo_size?: string | null;
          wedding_photo_sizes?: string[];
          extra_thank_you_cards_qty?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["bookings"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "bookings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      payment_schedules: {
        Row: {
          id: string;
          user_id: string;
          booking_id: string | null;
          name: string | null;
          schedule_type: "deposit" | "milestone" | "final" | "custom";
          amount: number;
          paid_amount: number;
          due_date: string | null;
          status: "pending" | "paid" | "overdue" | "cancelled";
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          booking_id?: string | null;
          name?: string | null;
          schedule_type: Database["public"]["Tables"]["payment_schedules"]["Row"]["schedule_type"];
          amount: number;
          paid_amount?: number;
          due_date?: string | null;
          status?: Database["public"]["Tables"]["payment_schedules"]["Row"]["status"];
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["payment_schedules"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "payment_schedules_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payment_schedules_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
        ];
      };
      payment_installments: {
        Row: {
          id: string;
          user_id: string;
          schedule_id: string;
          amount: number;
          paid_date: string;
          payment_method: "cash" | "e_transfer_bank" | "card_pay" | "other" | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          schedule_id: string;
          amount: number;
          paid_date?: string;
          payment_method?: Database["public"]["Tables"]["payment_installments"]["Row"]["payment_method"];
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["payment_installments"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "payment_installments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payment_installments_schedule_id_fkey";
            columns: ["schedule_id"];
            isOneToOne: false;
            referencedRelation: "payment_schedules";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      delete_own_account: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
