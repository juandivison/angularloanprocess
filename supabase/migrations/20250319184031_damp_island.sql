/*
  # Initial Schema for Loan Management App

  1. New Tables
    - `loans`
      - Core loan information including amount, interest rate, and payment terms
    - `payments`
      - Records of payments made against loans
    
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create loans table
CREATE TABLE IF NOT EXISTS loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  amount decimal NOT NULL,
  interest_rate decimal NOT NULL,
  payment_frequency text NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  grace_period integer NOT NULL,
  remaining_balance decimal NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id)
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid REFERENCES loans(id),
  amount decimal NOT NULL,
  payment_date timestamptz NOT NULL,
  is_late boolean DEFAULT false,
  late_fee decimal DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own loans"
  ON loans
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own loans"
  ON loans
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payments"
  ON payments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);