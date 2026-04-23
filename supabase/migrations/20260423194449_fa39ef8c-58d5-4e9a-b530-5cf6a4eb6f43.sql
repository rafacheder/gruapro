-- Allow public access to read machines
CREATE POLICY "Allow public read access to machines"
ON public.maquinas
FOR SELECT
TO anon
USING (true);

-- Allow public access to read client point names and cities
CREATE POLICY "Allow public read access to client info"
ON public.clientes
FOR SELECT
TO anon
USING (true);
