-- Bucket para imagens de produtos
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- Bucket para branding (logo + banner)
INSERT INTO storage.buckets (id, name, public)
VALUES ('branding', 'branding', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Qualquer um pode visualizar imagens de produtos (público)
CREATE POLICY "Public read access for products" ON storage.objects
FOR SELECT USING (bucket_id = 'products');

-- Policy: Admins podem fazer upload de produtos
CREATE POLICY "Admins can upload products" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'products' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Policy: Admins podem atualizar imagens de produtos
CREATE POLICY "Admins can update products" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'products' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Policy: Admins podem deletar imagens de produtos
CREATE POLICY "Admins can delete products" ON storage.objects
FOR DELETE USING (
  bucket_id = 'products' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Policy: Qualquer um pode visualizar branding (público)
CREATE POLICY "Public read access for branding" ON storage.objects
FOR SELECT USING (bucket_id = 'branding');

-- Policy: Admins podem fazer upload de branding
CREATE POLICY "Admins can upload branding" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'branding' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Policy: Admins podem atualizar branding
CREATE POLICY "Admins can update branding" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'branding' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Policy: Admins podem deletar branding
CREATE POLICY "Admins can delete branding" ON storage.objects
FOR DELETE USING (
  bucket_id = 'branding' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);