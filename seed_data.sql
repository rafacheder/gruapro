BEGIN;
-- Clientes
INSERT INTO clientes (id, nome_ponto, nome_responsavel, telefone_responsavel, cep, rua, numero, bairro, cidade, estado, percentual_comissao, ativo) VALUES
('ebd3cb40-685b-420f-9b05-c32923e1a211', 'Ponto 1', 'Responsavel 1', '(11) 99999-0001', '01234-561', 'Rua 1', '10', 'Bairro 1', 'Sao Paulo', 'SP', 30.0, true),
('05a812ec-d6d9-4413-aeea-39c65e791c9c', 'Ponto 2', 'Responsavel 2', '(11) 99999-0002', '01234-562', 'Rua 2', '20', 'Bairro 2', 'Sao Paulo', 'SP', 30.0, true),
('db90ea08-6021-4b4a-b723-6e33ca9dcc88', 'Ponto 3', 'Responsavel 3', '(11) 99999-0003', '01234-563', 'Rua 3', '30', 'Bairro 3', 'Sao Paulo', 'SP', 30.0, true);

-- Maquinas
INSERT INTO maquinas (id, cliente_id, codigo_identificacao, modelo, status) VALUES
('1ee1942e-fcc1-4e13-b815-81498d014e68', 'ebd3cb40-685b-420f-9b05-c32923e1a211', 'MQ-001', 'Modelo 1', 'ativa'),
('590019db-1202-4bfb-8a03-1c5782b1c714', '05a812ec-d6d9-4413-aeea-39c65e791c9c', 'MQ-002', 'Modelo 2', 'ativa'),
('d6dc8154-a843-416d-b37a-4bfe1229157d', 'db90ea08-6021-4b4a-b723-6e33ca9dcc88', 'MQ-003', 'Modelo 3', 'ativa');

-- Leituras
INSERT INTO leituras (id, maquina_id, cliente_id, usuario_id, data_leitura, valor_faturado, pelucias_saidas, valor_comissao, valor_liquido, percentual_aplicado, status) VALUES
('99868265-9504-4318-8b53-3b1f00d68190', '1ee1942e-fcc1-4e13-b815-81498d014e68', 'ebd3cb40-685b-420f-9b05-c32923e1a211', '8f446950-ecd2-4ce6-8617-4c131a033746', '2024-01-15 10:00:00+00', 100.0, 2, 30.0, 70.0, 30.0, 'pago'),
('ee0952c8-eb22-4968-b9e9-825130f19b34', '1ee1942e-fcc1-4e13-b815-81498d014e68', 'ebd3cb40-685b-420f-9b05-c32923e1a211', '8f446950-ecd2-4ce6-8617-4c131a033746', '2024-02-15 10:00:00+00', 200.0, 4, 60.0, 140.0, 30.0, 'pago'),
('9352cbfb-4cf3-4dcc-b4f2-e53f1d6dc612', '1ee1942e-fcc1-4e13-b815-81498d014e68', 'ebd3cb40-685b-420f-9b05-c32923e1a211', '8f446950-ecd2-4ce6-8617-4c131a033746', '2024-03-15 10:00:00+00', 300.0, 6, 90.0, 210.0, 30.0, 'pendente'),
('6df5d53d-03ef-4582-8080-156c6f637289', '1ee1942e-fcc1-4e13-b815-81498d014e68', 'ebd3cb40-685b-420f-9b05-c32923e1a211', '8f446950-ecd2-4ce6-8617-4c131a033746', '2024-04-15 10:00:00+00', 400.0, 8, 120.0, 280.0, 30.0, 'pendente'),
('57d64090-309c-4ed6-bd9d-9929bce6610f', '590019db-1202-4bfb-8a03-1c5782b1c714', '05a812ec-d6d9-4413-aeea-39c65e791c9c', '8f446950-ecd2-4ce6-8617-4c131a033746', '2024-01-15 10:00:00+00', 100.0, 2, 30.0, 70.0, 30.0, 'pago'),
('dbc21401-6f54-44d6-9b25-d4e4bb997598', '590019db-1202-4bfb-8a03-1c5782b1c714', '05a812ec-d6d9-4413-aeea-39c65e791c9c', '8f446950-ecd2-4ce6-8617-4c131a033746', '2024-02-15 10:00:00+00', 200.0, 4, 60.0, 140.0, 30.0, 'pago'),
('f49f86e1-fc3d-41df-aa71-5e1c0bc8c857', '590019db-1202-4bfb-8a03-1c5782b1c714', '05a812ec-d6d9-4413-aeea-39c65e791c9c', '8f446950-ecd2-4ce6-8617-4c131a033746', '2024-03-15 10:00:00+00', 300.0, 6, 90.0, 210.0, 30.0, 'pendente'),
('f5f885f6-1130-4ca9-afc5-fdf2551791a2', '590019db-1202-4bfb-8a03-1c5782b1c714', '05a812ec-d6d9-4413-aeea-39c65e791c9c', '8f446950-ecd2-4ce6-8617-4c131a033746', '2024-04-15 10:00:00+00', 400.0, 8, 120.0, 280.0, 30.0, 'pendente'),
('c89006ba-5dc1-4055-ba03-d518ac1d2c60', 'd6dc8154-a843-416d-b37a-4bfe1229157d', 'db90ea08-6021-4b4a-b723-6e33ca9dcc88', '8f446950-ecd2-4ce6-8617-4c131a033746', '2024-01-15 10:00:00+00', 100.0, 2, 30.0, 70.0, 30.0, 'pago'),
('fbfaa66b-f593-4ff3-a022-6a83e1687e36', 'd6dc8154-a843-416d-b37a-4bfe1229157d', 'db90ea08-6021-4b4a-b723-6e33ca9dcc88', '8f446950-ecd2-4ce6-8617-4c131a033746', '2024-02-15 10:00:00+00', 200.0, 4, 60.0, 140.0, 30.0, 'pago'),
('e135c03b-9e90-44bf-b365-9498371a4705', 'd6dc8154-a843-416d-b37a-4bfe1229157d', 'db90ea08-6021-4b4a-b723-6e33ca9dcc88', '8f446950-ecd2-4ce6-8617-4c131a033746', '2024-03-15 10:00:00+00', 300.0, 6, 90.0, 210.0, 30.0, 'pendente'),
('c7209cf3-d440-489c-b74f-22400a89252c', 'd6dc8154-a843-416d-b37a-4bfe1229157d', 'db90ea08-6021-4b4a-b723-6e33ca9dcc88', '8f446950-ecd2-4ce6-8617-4c131a033746', '2024-04-15 10:00:00+00', 400.0, 8, 120.0, 280.0, 30.0, 'pendente');

-- Pagamentos
INSERT INTO pagamentos (id, cliente_id, valor, forma_pagamento, registrado_por) VALUES
('a7087aa2-9c17-477c-bb64-437934383aea', 'ebd3cb40-685b-420f-9b05-c32923e1a211', 210.0, 'pix', '8f446950-ecd2-4ce6-8617-4c131a033746'),
('53186374-5faa-4fec-a64c-1d970e15c333', '05a812ec-d6d9-4413-aeea-39c65e791c9c', 210.0, 'pix', '8f446950-ecd2-4ce6-8617-4c131a033746'),
('ebe717a6-7736-4d55-97cf-31c78ded4df4', 'db90ea08-6021-4b4a-b723-6e33ca9dcc88', 210.0, 'pix', '8f446950-ecd2-4ce6-8617-4c131a033746');

-- Pagamento Leituras
INSERT INTO pagamento_leituras (pagamento_id, leitura_id, valor_aplicado) VALUES
('a7087aa2-9c17-477c-bb64-437934383aea', '99868265-9504-4318-8b53-3b1f00d68190', 70.0),
('a7087aa2-9c17-477c-bb64-437934383aea', 'ee0952c8-eb22-4968-b9e9-825130f19b34', 140.0),
('53186374-5faa-4fec-a64c-1d970e15c333', '57d64090-309c-4ed6-bd9d-9929bce6610f', 70.0),
('53186374-5faa-4fec-a64c-1d970e15c333', 'dbc21401-6f54-44d6-9b25-d4e4bb997598', 140.0),
('ebe717a6-7736-4d55-97cf-31c78ded4df4', 'c89006ba-5dc1-4055-ba03-d518ac1d2c60', 70.0),
('ebe717a6-7736-4d55-97cf-31c78ded4df4', 'fbfaa66b-f593-4ff3-a022-6a83e1687e36', 140.0);
COMMIT;
