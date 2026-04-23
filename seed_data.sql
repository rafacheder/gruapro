
-- Inserts de Clientes
INSERT INTO clientes (id, nome_ponto, nome_responsavel, telefone_responsavel, cep, rua, numero, bairro, cidade, estado, percentual_comissao, ativo) VALUES
('9429350e-af0f-4238-8673-cde7b44bc516', 'Ponto 1', 'Responsavel 1', '(11) 99999-0001', '12345-001', 'Rua 1', '10', 'Bairro 1', 'Sao Paulo', 'SP', 30.0, true),
('7dfc3438-5a5d-45ad-bcf3-55fffd73d031', 'Ponto 2', 'Responsavel 2', '(11) 99999-0002', '12345-002', 'Rua 2', '20', 'Bairro 2', 'Sao Paulo', 'SP', 30.0, true),
('d26ad0b5-de31-4df8-8530-e261e28754e1', 'Ponto 3', 'Responsavel 3', '(11) 99999-0003', '12345-003', 'Rua 3', '30', 'Bairro 3', 'Sao Paulo', 'SP', 30.0, true);

-- Inserts de Maquinas
INSERT INTO maquinas (id, cliente_id, codigo_identificacao, modelo, status) VALUES
('c7913423-c9a9-4b86-924c-89e98e070dd2', '9429350e-af0f-4238-8673-cde7b44bc516', 'MQ-001', 'Modelo 1', 'ativa'),
('7d6d573c-da08-4155-8d3c-08bc716bb4c8', '7dfc3438-5a5d-45ad-bcf3-55fffd73d031', 'MQ-002', 'Modelo 2', 'ativa'),
('0aeffc72-1ec4-44f9-8f18-99bdc6742f09', 'd26ad0b5-de31-4df8-8530-e261e28754e1', 'MQ-003', 'Modelo 3', 'ativa');

-- Inserts de Leituras
INSERT INTO leituras (id, maquina_id, cliente_id, usuario_id, data_leitura, valor_faturado, pelucias_saidas, valor_comissao, valor_liquido, percentual_aplicado, status) VALUES
('c721b9f9-0414-49f2-afc7-7a38d34dfddd', 'c7913423-c9a9-4b86-924c-89e98e070dd2', '9429350e-af0f-4238-8673-cde7b44bc516', '8f446950-ecd2-4ce6-8617-4c131a033746', '2024-01-15 10:00:00+00', 100.0, 2, 30.0, 70.0, 30.0, 'pendente'),
('b29249fb-5886-44ba-9247-ca0c16cc1a78', 'c7913423-c9a9-4b86-924c-89e98e070dd2', '9429350e-af0f-4238-8673-cde7b44bc516', '8f446950-ecd2-4ce6-8617-4c131a033746', '2024-02-15 10:00:00+00', 200.0, 4, 60.0, 140.0, 30.0, 'pendente'),
('d0717e09-7f70-4f81-b81f-60d71c73bd95', 'c7913423-c9a9-4b86-924c-89e98e070dd2', '9429350e-af0f-4238-8673-cde7b44bc516', '8f446950-ecd2-4ce6-8617-4c131a033746', '2024-03-15 10:00:00+00', 300.0, 6, 90.0, 210.0, 30.0, 'pendente'),
('15dae922-8f89-4344-ba68-1e69bb90c1be', 'c7913423-c9a9-4b86-924c-89e98e070dd2', '9429350e-af0f-4238-8673-cde7b44bc516', '8f446950-ecd2-4ce6-8617-4c131a033746', '2024-04-15 10:00:00+00', 400.0, 8, 120.0, 280.0, 30.0, 'pendente'),
('cb97ade6-438e-41e2-963c-f7438f3df745', '7d6d573c-da08-4155-8d3c-08bc716bb4c8', '7dfc3438-5a5d-45ad-bcf3-55fffd73d031', '8f446950-ecd2-4ce6-8617-4c131a033746', '2024-01-15 10:00:00+00', 100.0, 2, 30.0, 70.0, 30.0, 'pendente'),
('c7260157-aaf1-415e-89e8-0d9c46c96a8e', '7d6d573c-da08-4155-8d3c-08bc716bb4c8', '7dfc3438-5a5d-45ad-bcf3-55fffd73d031', '8f446950-ecd2-4ce6-8617-4c131a033746', '2024-02-15 10:00:00+00', 200.0, 4, 60.0, 140.0, 30.0, 'pendente'),
('512fc39d-af1f-49c0-9ed8-8b2805f72ce8', '7d6d573c-da08-4155-8d3c-08bc716bb4c8', '7dfc3438-5a5d-45ad-bcf3-55fffd73d031', '8f446950-ecd2-4ce6-8617-4c131a033746', '2024-03-15 10:00:00+00', 300.0, 6, 90.0, 210.0, 30.0, 'pendente'),
('606d2f8b-3d3b-4592-9171-6010c5450975', '7d6d573c-da08-4155-8d3c-08bc716bb4c8', '7dfc3438-5a5d-45ad-bcf3-55fffd73d031', '8f446950-ecd2-4ce6-8617-4c131a033746', '2024-04-15 10:00:00+00', 400.0, 8, 120.0, 280.0, 30.0, 'pendente'),
('7b99f264-b58c-4515-8bb7-167ee9daaab3', '0aeffc72-1ec4-44f9-8f18-99bdc6742f09', 'd26ad0b5-de31-4df8-8530-e261e28754e1', '8f446950-ecd2-4ce6-8617-4c131a033746', '2024-01-15 10:00:00+00', 100.0, 2, 30.0, 70.0, 30.0, 'pendente'),
('3d9daa3e-ef09-4aa5-b1d9-1453c95d85a8', '0aeffc72-1ec4-44f9-8f18-99bdc6742f09', 'd26ad0b5-de31-4df8-8530-e261e28754e1', '8f446950-ecd2-4ce6-8617-4c131a033746', '2024-02-15 10:00:00+00', 200.0, 4, 60.0, 140.0, 30.0, 'pendente'),
('01aa21bf-e470-4d65-a2cf-b61f4a7a5371', '0aeffc72-1ec4-44f9-8f18-99bdc6742f09', 'd26ad0b5-de31-4df8-8530-e261e28754e1', '8f446950-ecd2-4ce6-8617-4c131a033746', '2024-03-15 10:00:00+00', 300.0, 6, 90.0, 210.0, 30.0, 'pendente'),
('0ef65cfd-9bef-45c5-82bc-367aa0525985', '0aeffc72-1ec4-44f9-8f18-99bdc6742f09', 'd26ad0b5-de31-4df8-8530-e261e28754e1', '8f446950-ecd2-4ce6-8617-4c131a033746', '2024-04-15 10:00:00+00', 400.0, 8, 120.0, 280.0, 30.0, 'pendente');

