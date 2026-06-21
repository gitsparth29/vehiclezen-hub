
-- ============================================================
-- Lock down SECURITY DEFINER helpers (linter fix from prev migration)
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_tenant_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_tenant_member(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_tenant_member(uuid) TO authenticated;

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE public.vehicle_status   AS ENUM ('fit', 'service_due', 'maintenance', 'inactive');
CREATE TYPE public.fuel_type        AS ENUM ('petrol', 'diesel', 'electric', 'hybrid', 'cng', 'lpg');
CREATE TYPE public.transmission_type AS ENUM ('manual', 'automatic', 'cvt', 'semi_automatic');
CREATE TYPE public.driver_status    AS ENUM ('active', 'inactive', 'suspended', 'on_leave');
CREATE TYPE public.document_type    AS ENUM ('insurance', 'mot', 'registration', 'tax', 'permit', 'other');
CREATE TYPE public.service_type     AS ENUM ('oil_change', 'tire_rotation', 'brake_service', 'inspection', 'engine_repair', 'other');
CREATE TYPE public.maintenance_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE public.maintenance_status   AS ENUM ('pending', 'in_progress', 'completed');
CREATE TYPE public.rental_status    AS ENUM ('active', 'completed', 'cancelled');
CREATE TYPE public.alert_severity   AS ENUM ('info', 'warning', 'medium', 'high');

-- ============================================================
-- Reusable policy helper: insert policy needs tenant gate
-- (current_tenant_id() already exists from prior migration)
-- ============================================================

-- ============================================================
-- VEHICLES
-- ============================================================
CREATE TABLE public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  registration_number text NOT NULL,
  make text NOT NULL,
  model text NOT NULL,
  year int,
  color text,
  vin text,
  fuel_type public.fuel_type DEFAULT 'petrol',
  transmission public.transmission_type DEFAULT 'manual',
  mileage int DEFAULT 0,
  purchase_date date,
  insurance_expiry date,
  mot_expiry date,
  status public.vehicle_status NOT NULL DEFAULT 'fit',
  assigned_driver_id uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, registration_number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT ALL ON public.vehicles TO service_role;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant members can view vehicles" ON public.vehicles
  FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY "tenant members can insert vehicles" ON public.vehicles
  FOR INSERT TO authenticated WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY "tenant members can update vehicles" ON public.vehicles
  FOR UPDATE TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY "tenant members can delete vehicles" ON public.vehicles
  FOR DELETE TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE INDEX idx_vehicles_tenant ON public.vehicles(tenant_id);
CREATE INDEX idx_vehicles_status ON public.vehicles(tenant_id, status);

-- ============================================================
-- DRIVERS
-- ============================================================
CREATE TABLE public.drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  address text,
  date_of_birth date,
  license_number text,
  license_expiry date,
  license_category text,
  emergency_contact text,
  emergency_phone text,
  assigned_vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  status public.driver_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.drivers TO authenticated;
GRANT ALL ON public.drivers TO service_role;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant members can view drivers" ON public.drivers
  FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY "tenant members can insert drivers" ON public.drivers
  FOR INSERT TO authenticated WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY "tenant members can update drivers" ON public.drivers
  FOR UPDATE TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY "tenant members can delete drivers" ON public.drivers
  FOR DELETE TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE INDEX idx_drivers_tenant ON public.drivers(tenant_id);

-- Now add the FK from vehicles.assigned_driver_id
ALTER TABLE public.vehicles
  ADD CONSTRAINT vehicles_assigned_driver_fk
  FOREIGN KEY (assigned_driver_id) REFERENCES public.drivers(id) ON DELETE SET NULL;

-- ============================================================
-- DOCUMENTS
-- ============================================================
CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES public.drivers(id) ON DELETE CASCADE,
  name text NOT NULL,
  type public.document_type NOT NULL,
  file_path text,
  file_name text,
  file_size_bytes bigint,
  mime_type text,
  expiry_date date,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant members can view documents" ON public.documents
  FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY "tenant members can insert documents" ON public.documents
  FOR INSERT TO authenticated WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY "tenant members can update documents" ON public.documents
  FOR UPDATE TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY "tenant members can delete documents" ON public.documents
  FOR DELETE TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE INDEX idx_documents_tenant ON public.documents(tenant_id);
CREATE INDEX idx_documents_vehicle ON public.documents(vehicle_id);
CREATE INDEX idx_documents_expiry ON public.documents(tenant_id, expiry_date);

-- ============================================================
-- SERVICES
-- ============================================================
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  type public.service_type NOT NULL,
  service_date date NOT NULL DEFAULT current_date,
  cost numeric(12,2) NOT NULL DEFAULT 0,
  odometer int,
  garage_name text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant members can view services" ON public.services
  FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY "tenant members can insert services" ON public.services
  FOR INSERT TO authenticated WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY "tenant members can update services" ON public.services
  FOR UPDATE TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY "tenant members can delete services" ON public.services
  FOR DELETE TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE INDEX idx_services_tenant_date ON public.services(tenant_id, service_date DESC);
CREATE INDEX idx_services_vehicle ON public.services(vehicle_id);

-- ============================================================
-- MAINTENANCE
-- ============================================================
CREATE TABLE public.maintenance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  issue text NOT NULL,
  description text,
  priority public.maintenance_priority NOT NULL DEFAULT 'medium',
  status public.maintenance_status NOT NULL DEFAULT 'pending',
  reported_date date NOT NULL DEFAULT current_date,
  completed_date date,
  cost numeric(12,2),
  assigned_to text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.maintenance TO authenticated;
GRANT ALL ON public.maintenance TO service_role;
ALTER TABLE public.maintenance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant members can view maintenance" ON public.maintenance
  FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY "tenant members can insert maintenance" ON public.maintenance
  FOR INSERT TO authenticated WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY "tenant members can update maintenance" ON public.maintenance
  FOR UPDATE TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY "tenant members can delete maintenance" ON public.maintenance
  FOR DELETE TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE INDEX idx_maintenance_tenant_status ON public.maintenance(tenant_id, status);

-- ============================================================
-- FUEL LOGS
-- ============================================================
CREATE TABLE public.fuel_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL,
  log_date date NOT NULL DEFAULT current_date,
  odometer int,
  litres numeric(10,2) NOT NULL DEFAULT 0,
  price_per_litre numeric(10,2) NOT NULL DEFAULT 0,
  total_cost numeric(12,2) GENERATED ALWAYS AS (litres * price_per_litre) STORED,
  station text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fuel_logs TO authenticated;
GRANT ALL ON public.fuel_logs TO service_role;
ALTER TABLE public.fuel_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant members can view fuel_logs" ON public.fuel_logs
  FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY "tenant members can insert fuel_logs" ON public.fuel_logs
  FOR INSERT TO authenticated WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY "tenant members can update fuel_logs" ON public.fuel_logs
  FOR UPDATE TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY "tenant members can delete fuel_logs" ON public.fuel_logs
  FOR DELETE TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE INDEX idx_fuel_logs_tenant_date ON public.fuel_logs(tenant_id, log_date DESC);
CREATE INDEX idx_fuel_logs_vehicle ON public.fuel_logs(vehicle_id);

-- ============================================================
-- RENTALS
-- ============================================================
CREATE TABLE public.rentals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  customer_email text,
  customer_phone text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  daily_price numeric(12,2) NOT NULL DEFAULT 0,
  deposit numeric(12,2) NOT NULL DEFAULT 0,
  total_amount numeric(12,2) GENERATED ALWAYS AS (
    daily_price * GREATEST((end_date - start_date), 1)
  ) STORED,
  status public.rental_status NOT NULL DEFAULT 'active',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rentals TO authenticated;
GRANT ALL ON public.rentals TO service_role;
ALTER TABLE public.rentals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant members can view rentals" ON public.rentals
  FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY "tenant members can insert rentals" ON public.rentals
  FOR INSERT TO authenticated WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY "tenant members can update rentals" ON public.rentals
  FOR UPDATE TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY "tenant members can delete rentals" ON public.rentals
  FOR DELETE TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE INDEX idx_rentals_tenant_status ON public.rentals(tenant_id, status);

-- ============================================================
-- TRIP LOGS
-- ============================================================
CREATE TABLE public.trip_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL,
  start_location text NOT NULL,
  end_location text NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  distance_km numeric(10,2) NOT NULL DEFAULT 0,
  purpose text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trip_logs TO authenticated;
GRANT ALL ON public.trip_logs TO service_role;
ALTER TABLE public.trip_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant members can view trip_logs" ON public.trip_logs
  FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY "tenant members can insert trip_logs" ON public.trip_logs
  FOR INSERT TO authenticated WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY "tenant members can update trip_logs" ON public.trip_logs
  FOR UPDATE TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY "tenant members can delete trip_logs" ON public.trip_logs
  FOR DELETE TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE INDEX idx_trip_logs_tenant_time ON public.trip_logs(tenant_id, start_time DESC);

-- ============================================================
-- ALERTS
-- ============================================================
CREATE TABLE public.alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES public.drivers(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  severity public.alert_severity NOT NULL DEFAULT 'info',
  alert_date timestamptz NOT NULL DEFAULT now(),
  is_read boolean NOT NULL DEFAULT false,
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.alerts TO authenticated;
GRANT ALL ON public.alerts TO service_role;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant members can view alerts" ON public.alerts
  FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY "tenant members can insert alerts" ON public.alerts
  FOR INSERT TO authenticated WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY "tenant members can update alerts" ON public.alerts
  FOR UPDATE TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY "tenant members can delete alerts" ON public.alerts
  FOR DELETE TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE INDEX idx_alerts_tenant_date ON public.alerts(tenant_id, alert_date DESC);
CREATE INDEX idx_alerts_unread ON public.alerts(tenant_id, is_read) WHERE is_read = false;

-- ============================================================
-- updated_at triggers
-- ============================================================
CREATE TRIGGER trg_vehicles_updated    BEFORE UPDATE ON public.vehicles    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_drivers_updated     BEFORE UPDATE ON public.drivers     FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_documents_updated   BEFORE UPDATE ON public.documents   FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_services_updated    BEFORE UPDATE ON public.services    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_maintenance_updated BEFORE UPDATE ON public.maintenance FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_fuel_logs_updated   BEFORE UPDATE ON public.fuel_logs   FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_rentals_updated     BEFORE UPDATE ON public.rentals     FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_trip_logs_updated   BEFORE UPDATE ON public.trip_logs   FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
