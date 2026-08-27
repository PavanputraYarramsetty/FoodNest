-- Migration: Update existing hostel block names in users table
UPDATE users SET hostel_block = 'F Block (Old)' WHERE hostel_block = 'F Block';
UPDATE users SET hostel_block = 'Others(A, B, C, D, F)' WHERE hostel_block IN ('Other', 'Others');
