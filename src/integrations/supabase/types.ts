export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          alert_date: string
          created_at: string
          description: string | null
          driver_id: string | null
          id: string
          is_read: boolean
          severity: Database["public"]["Enums"]["alert_severity"]
          source: string | null
          tenant_id: string
          title: string
          vehicle_id: string | null
        }
        Insert: {
          alert_date?: string
          created_at?: string
          description?: string | null
          driver_id?: string | null
          id?: string
          is_read?: boolean
          severity?: Database["public"]["Enums"]["alert_severity"]
          source?: string | null
          tenant_id: string
          title: string
          vehicle_id?: string | null
        }
        Update: {
          alert_date?: string
          created_at?: string
          description?: string | null
          driver_id?: string | null
          id?: string
          is_read?: boolean
          severity?: Database["public"]["Enums"]["alert_severity"]
          source?: string | null
          tenant_id?: string
          title?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          driver_id: string | null
          expiry_date: string | null
          file_name: string | null
          file_path: string | null
          file_size_bytes: number | null
          id: string
          mime_type: string | null
          name: string
          tenant_id: string
          type: Database["public"]["Enums"]["document_type"]
          updated_at: string
          uploaded_by: string | null
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string
          driver_id?: string | null
          expiry_date?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          id?: string
          mime_type?: string | null
          name: string
          tenant_id: string
          type: Database["public"]["Enums"]["document_type"]
          updated_at?: string
          uploaded_by?: string | null
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string
          driver_id?: string | null
          expiry_date?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          id?: string
          mime_type?: string | null
          name?: string
          tenant_id?: string
          type?: Database["public"]["Enums"]["document_type"]
          updated_at?: string
          uploaded_by?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          address: string | null
          assigned_vehicle_id: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          emergency_contact: string | null
          emergency_phone: string | null
          first_name: string
          id: string
          last_name: string
          license_category: string | null
          license_expiry: string | null
          license_number: string | null
          phone: string | null
          status: Database["public"]["Enums"]["driver_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          assigned_vehicle_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          first_name: string
          id?: string
          last_name: string
          license_category?: string | null
          license_expiry?: string | null
          license_number?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["driver_status"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          assigned_vehicle_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          first_name?: string
          id?: string
          last_name?: string
          license_category?: string | null
          license_expiry?: string | null
          license_number?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["driver_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "drivers_assigned_vehicle_id_fkey"
            columns: ["assigned_vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drivers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      fuel_logs: {
        Row: {
          created_at: string
          driver_id: string | null
          id: string
          litres: number
          log_date: string
          notes: string | null
          odometer: number | null
          price_per_litre: number
          station: string | null
          tenant_id: string
          total_cost: number | null
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          driver_id?: string | null
          id?: string
          litres?: number
          log_date?: string
          notes?: string | null
          odometer?: number | null
          price_per_litre?: number
          station?: string | null
          tenant_id: string
          total_cost?: number | null
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          driver_id?: string | null
          id?: string
          litres?: number
          log_date?: string
          notes?: string | null
          odometer?: number | null
          price_per_litre?: number
          station?: string | null
          tenant_id?: string
          total_cost?: number | null
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fuel_logs_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fuel_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fuel_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance: {
        Row: {
          assigned_to: string | null
          completed_date: string | null
          cost: number | null
          created_at: string
          description: string | null
          id: string
          issue: string
          priority: Database["public"]["Enums"]["maintenance_priority"]
          reported_date: string
          status: Database["public"]["Enums"]["maintenance_status"]
          tenant_id: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          assigned_to?: string | null
          completed_date?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          issue: string
          priority?: Database["public"]["Enums"]["maintenance_priority"]
          reported_date?: string
          status?: Database["public"]["Enums"]["maintenance_status"]
          tenant_id: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          assigned_to?: string | null
          completed_date?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          issue?: string
          priority?: Database["public"]["Enums"]["maintenance_priority"]
          reported_date?: string
          status?: Database["public"]["Enums"]["maintenance_status"]
          tenant_id?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      rentals: {
        Row: {
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          daily_price: number
          deposit: number
          end_date: string
          id: string
          notes: string | null
          start_date: string
          status: Database["public"]["Enums"]["rental_status"]
          tenant_id: string
          total_amount: number | null
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          daily_price?: number
          deposit?: number
          end_date: string
          id?: string
          notes?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["rental_status"]
          tenant_id: string
          total_amount?: number | null
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          daily_price?: number
          deposit?: number
          end_date?: string
          id?: string
          notes?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["rental_status"]
          tenant_id?: string
          total_amount?: number | null
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rentals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rentals_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          cost: number
          created_at: string
          garage_name: string | null
          id: string
          notes: string | null
          odometer: number | null
          service_date: string
          tenant_id: string
          type: Database["public"]["Enums"]["service_type"]
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          cost?: number
          created_at?: string
          garage_name?: string | null
          id?: string
          notes?: string | null
          odometer?: number | null
          service_date?: string
          tenant_id: string
          type: Database["public"]["Enums"]["service_type"]
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          cost?: number
          created_at?: string
          garage_name?: string | null
          id?: string
          notes?: string | null
          odometer?: number | null
          service_date?: string
          tenant_id?: string
          type?: Database["public"]["Enums"]["service_type"]
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      trip_logs: {
        Row: {
          created_at: string
          distance_km: number
          driver_id: string | null
          end_location: string
          end_time: string
          id: string
          notes: string | null
          purpose: string | null
          start_location: string
          start_time: string
          tenant_id: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          distance_km?: number
          driver_id?: string | null
          end_location: string
          end_time: string
          id?: string
          notes?: string | null
          purpose?: string | null
          start_location: string
          start_time: string
          tenant_id: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          distance_km?: number
          driver_id?: string | null
          end_location?: string
          end_time?: string
          id?: string
          notes?: string | null
          purpose?: string | null
          start_location?: string
          start_time?: string
          tenant_id?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_logs_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          assigned_driver_id: string | null
          color: string | null
          created_at: string
          fuel_type: Database["public"]["Enums"]["fuel_type"] | null
          id: string
          insurance_expiry: string | null
          make: string
          mileage: number | null
          model: string
          mot_expiry: string | null
          notes: string | null
          purchase_date: string | null
          registration_number: string
          status: Database["public"]["Enums"]["vehicle_status"]
          tenant_id: string
          transmission: Database["public"]["Enums"]["transmission_type"] | null
          updated_at: string
          vin: string | null
          year: number | null
        }
        Insert: {
          assigned_driver_id?: string | null
          color?: string | null
          created_at?: string
          fuel_type?: Database["public"]["Enums"]["fuel_type"] | null
          id?: string
          insurance_expiry?: string | null
          make: string
          mileage?: number | null
          model: string
          mot_expiry?: string | null
          notes?: string | null
          purchase_date?: string | null
          registration_number: string
          status?: Database["public"]["Enums"]["vehicle_status"]
          tenant_id: string
          transmission?: Database["public"]["Enums"]["transmission_type"] | null
          updated_at?: string
          vin?: string | null
          year?: number | null
        }
        Update: {
          assigned_driver_id?: string | null
          color?: string | null
          created_at?: string
          fuel_type?: Database["public"]["Enums"]["fuel_type"] | null
          id?: string
          insurance_expiry?: string | null
          make?: string
          mileage?: number | null
          model?: string
          mot_expiry?: string | null
          notes?: string | null
          purchase_date?: string | null
          registration_number?: string
          status?: Database["public"]["Enums"]["vehicle_status"]
          tenant_id?: string
          transmission?: Database["public"]["Enums"]["transmission_type"] | null
          updated_at?: string
          vin?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_assigned_driver_fk"
            columns: ["assigned_driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_tenant_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _tenant_id: string
          _user_id: string
        }
        Returns: boolean
      }
      is_tenant_member: { Args: { _tenant_id: string }; Returns: boolean }
    }
    Enums: {
      alert_severity: "info" | "warning" | "medium" | "high"
      app_role: "owner" | "admin" | "manager" | "viewer"
      document_type:
        | "insurance"
        | "mot"
        | "registration"
        | "tax"
        | "permit"
        | "other"
      driver_status: "active" | "inactive" | "suspended" | "on_leave"
      fuel_type: "petrol" | "diesel" | "electric" | "hybrid" | "cng" | "lpg"
      maintenance_priority: "low" | "medium" | "high"
      maintenance_status: "pending" | "in_progress" | "completed"
      rental_status: "active" | "completed" | "cancelled"
      service_type:
        | "oil_change"
        | "tire_rotation"
        | "brake_service"
        | "inspection"
        | "engine_repair"
        | "other"
      transmission_type: "manual" | "automatic" | "cvt" | "semi_automatic"
      vehicle_status: "fit" | "service_due" | "maintenance" | "inactive"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      alert_severity: ["info", "warning", "medium", "high"],
      app_role: ["owner", "admin", "manager", "viewer"],
      document_type: [
        "insurance",
        "mot",
        "registration",
        "tax",
        "permit",
        "other",
      ],
      driver_status: ["active", "inactive", "suspended", "on_leave"],
      fuel_type: ["petrol", "diesel", "electric", "hybrid", "cng", "lpg"],
      maintenance_priority: ["low", "medium", "high"],
      maintenance_status: ["pending", "in_progress", "completed"],
      rental_status: ["active", "completed", "cancelled"],
      service_type: [
        "oil_change",
        "tire_rotation",
        "brake_service",
        "inspection",
        "engine_repair",
        "other",
      ],
      transmission_type: ["manual", "automatic", "cvt", "semi_automatic"],
      vehicle_status: ["fit", "service_due", "maintenance", "inactive"],
    },
  },
} as const
