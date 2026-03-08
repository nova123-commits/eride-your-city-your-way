
-- Wallet transactions table
CREATE TABLE public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'ride_payment', 'ride_earning')),
  amount numeric NOT NULL,
  fee numeric NOT NULL DEFAULT 0,
  label text NOT NULL,
  phone text,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON public.wallet_transactions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON public.wallet_transactions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions" ON public.wallet_transactions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_transactions;
