-- Migration: Add gender field to doctors and user travel preferences
-- Description: This migration adds gender field to doctors table and adds origin_city, destination_city, budget fields to users table

-- Add gender type enum
CREATE TYPE gender_enum AS ENUM ('male', 'female', 'other');

-- Add gender column to doctors table
ALTER TABLE doctors
ADD COLUMN gender gender_enum;

-- Add origin_city column to users table
ALTER TABLE users
ADD COLUMN origin_city VARCHAR(100);

-- Add destination_city column to users table
ALTER TABLE users
ADD COLUMN destination_city VARCHAR(100);

-- Add budget column to users table
ALTER TABLE users
ADD COLUMN budget DECIMAL(10, 2);

-- Add comments for documentation
COMMENT ON COLUMN doctors.gender IS 'Doctor gender: male, female, or other';
COMMENT ON COLUMN users.origin_city IS 'User''s departure city mentioned in conversation';
COMMENT ON COLUMN users.destination_city IS 'User''s destination city mentioned in conversation';
COMMENT ON COLUMN users.budget IS 'User''s budget for medical travel in USD';
