-- Migration: Allow 'Preparing' in orders status check constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN ('Pending', 'Preparing', 'Completed', 'Cancelled'));
