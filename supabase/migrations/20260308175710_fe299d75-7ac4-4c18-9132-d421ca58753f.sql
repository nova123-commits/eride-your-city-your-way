
-- Support messages table
CREATE TABLE public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role text NOT NULL DEFAULT 'user',
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages" ON public.support_messages
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can send messages" ON public.support_messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all messages" ON public.support_messages
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can send messages" ON public.support_messages
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Lost items table
CREATE TABLE public.lost_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description text NOT NULL,
  trip_date text,
  status text NOT NULL DEFAULT 'reported',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lost_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can report lost items" ON public.lost_items
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view own lost items" ON public.lost_items
  FOR SELECT TO authenticated USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all lost items" ON public.lost_items
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update lost items" ON public.lost_items
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for support tickets
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
