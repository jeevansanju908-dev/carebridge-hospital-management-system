-- ==============================================================================
-- CareBridge Healthcare Platform - Supabase Schema
-- Project ID: crnurqfbksebpzceymvq
-- Run this script in the Supabase SQL Editor (https://supabase.com/dashboard/project/crnurqfbksebpzceymvq/sql)
-- ==============================================================================

-- 1. Create the appointments table
CREATE TABLE IF NOT EXISTS public.appointments (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    patient_email TEXT,
    patient_phone TEXT,
    patient_blood_group TEXT,
    doctor_id TEXT NOT NULL,
    doctor_name TEXT NOT NULL,
    doctor_specialization TEXT,
    hospital_id TEXT,
    hospital_name TEXT,
    date DATE NOT NULL,
    time_slot TEXT NOT NULL,
    reason_for_visit TEXT,
    additional_notes TEXT,
    status TEXT DEFAULT 'Pending',
    consultation_fee NUMERIC DEFAULT 600,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- 3. Create policies to allow inserts and reads via Publishable/Anon API key
CREATE POLICY "Allow public insert to appointments"
    ON public.appointments
    FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY "Allow public select from appointments"
    ON public.appointments
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow public update to appointments"
    ON public.appointments
    FOR UPDATE
    TO public
    USING (true);

-- 4. Enable Realtime updates for appointments table
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
