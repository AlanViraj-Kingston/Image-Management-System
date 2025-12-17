-- Migration: Add appointment_id column to medical_tests table
-- Run this script to add the appointment_id column to existing medical_tests table

ALTER TABLE medical_tests 
ADD COLUMN IF NOT EXISTS appointment_id INTEGER;

-- Create index on appointment_id for better query performance
CREATE INDEX IF NOT EXISTS idx_medical_tests_appointment_id ON medical_tests(appointment_id);

