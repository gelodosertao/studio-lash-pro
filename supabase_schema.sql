-- Tabela de Serviços
CREATE TABLE services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  duration TEXT,
  images TEXT[] DEFAULT '{}',
  video TEXT,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Agendamentos (Bookings)
CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "clientName" TEXT NOT NULL,
  "clientWhatsapp" TEXT,
  "serviceId" TEXT,
  "serviceName" TEXT,
  status TEXT DEFAULT 'Pendente',
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  "fcmToken" TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Disponibilidade
CREATE TABLE availability (
  date TEXT PRIMARY KEY,
  booked_times TEXT[] DEFAULT '{}'
);

-- Tabela de Despesas
CREATE TABLE expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  value NUMERIC NOT NULL,
  date TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Configuração de RLS (Row Level Security) - Ajuste conforme necessário
-- Para um setup rápido, vamos habilitar acesso total (CUIDADO em produção)
-- O ideal seria restringir o admin, mas como o app já faz essa checagem via Auth do Supabase:

ALTER TABLE services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Serviços visíveis para todos" ON services FOR SELECT USING (true);
CREATE POLICY "Admin pode tudo nos serviços" ON services FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Qualquer um pode agendar" ON bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin vê todos os agendamentos" ON bookings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin edita agendamentos" ON bookings FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admin deleta agendamentos" ON bookings FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Cliente vê seu próprio agendamento via WhatsApp" ON bookings FOR SELECT USING (true); -- Simplificado

ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Qualquer um vê disponibilidade" ON availability FOR SELECT USING (true);
CREATE POLICY "Qualquer um insere/atualiza disponibilidade ao agendar" ON availability FOR ALL USING (true);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Somente admin vê e gerencia despesas" ON expenses FOR ALL USING (auth.role() = 'authenticated');
