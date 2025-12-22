-- Drop existing motoboy policies that are too restrictive
DROP POLICY IF EXISTS "Motoboy can view assigned orders" ON orders;
DROP POLICY IF EXISTS "Motoboy can update assigned orders" ON orders;

-- Create new policy: Motoboy can view orders that are ready (to accept) OR assigned to them
CREATE POLICY "Motoboy can view ready and assigned orders" ON orders
  FOR SELECT
  USING (
    has_role(auth.uid(), 'motoboy'::app_role) AND (
      status = 'ready' OR 
      motoboy_id = auth.uid()::text
    )
  );

-- Create policy: Motoboy can update orders that are ready (to accept) OR assigned to them
CREATE POLICY "Motoboy can update ready and assigned orders" ON orders
  FOR UPDATE
  USING (
    has_role(auth.uid(), 'motoboy'::app_role) AND (
      status = 'ready' OR 
      motoboy_id = auth.uid()::text
    )
  );

-- Also fix the order_items policy for motoboy to include ready orders
DROP POLICY IF EXISTS "Motoboy can view assigned order items" ON order_items;

CREATE POLICY "Motoboy can view ready and assigned order items" ON order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND has_role(auth.uid(), 'motoboy'::app_role)
      AND (orders.status = 'ready' OR orders.motoboy_id = auth.uid()::text)
    )
  );