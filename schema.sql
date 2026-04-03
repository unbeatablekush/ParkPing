-- Supabase Schema for ParkPing

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone TEXT UNIQUE NOT NULL,
    name TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    car_number TEXT UNIQUE NOT NULL,
    make TEXT,
    model TEXT,
    color TEXT,
    rc_image_url TEXT,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS qr_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    qr_image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'dispatched', 'delivered')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scan_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    qr_id UUID REFERENCES qr_codes(id) ON DELETE CASCADE,
    scanner_phone_hash TEXT,
    scanner_name TEXT,
    contact_method TEXT CHECK (contact_method IN ('call', 'alert', 'chat')),
    location_city TEXT,
    resolution_status TEXT DEFAULT 'pending' CHECK (resolution_status IN ('pending', 'resolved', 'no_response')),
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id UUID REFERENCES scan_logs(id) ON DELETE CASCADE,
    twilio_call_sid TEXT,
    duration_seconds INTEGER,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_vehicle_id ON qr_codes(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_scan_logs_qr_id ON scan_logs(qr_id);
CREATE INDEX IF NOT EXISTS idx_calls_scan_id ON calls(scan_id);
