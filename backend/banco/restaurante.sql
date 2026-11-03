-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 03/11/2026 às 23:36
-- Versão do servidor: 10.4.32-MariaDB
-- Versão do PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `restaurante`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `bairros`
--

CREATE TABLE `bairros` (
  `id` int(11) NOT NULL,
  `cep_inicial` varchar(255) DEFAULT NULL,
  `cidade` varchar(255) DEFAULT NULL,
  `estado` varchar(255) DEFAULT NULL,
  `nome` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `bairros`
--

INSERT INTO `bairros` (`id`, `cep_inicial`, `cidade`, `estado`, `nome`) VALUES
(1, '98250-000', 'Saldanha Marinho', '- RS', 'Diullian');

-- --------------------------------------------------------

--
-- Estrutura para tabela `fotos_imoveis`
--

CREATE TABLE `fotos_imoveis` (
  `id` int(11) NOT NULL,
  `caminho` varchar(255) DEFAULT NULL,
  `capa` bit(1) DEFAULT NULL,
  `nome_arquivo` varchar(255) DEFAULT NULL,
  `ordem` int(11) DEFAULT NULL,
  `imovel_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `imoveis`
--

CREATE TABLE `imoveis` (
  `id` int(11) NOT NULL,
  `area_total` decimal(15,2) DEFAULT NULL,
  `area_construida` decimal(15,2) DEFAULT NULL,
  `banheiros` int(11) DEFAULT NULL,
  `caracteristicas` varchar(255) DEFAULT NULL,
  `cep` varchar(255) DEFAULT NULL,
  `complemento` varchar(255) DEFAULT NULL,
  `descricao` text DEFAULT NULL,
  `destaque` bit(1) DEFAULT NULL,
  `dormitorios` int(11) DEFAULT NULL,
  `endereco` varchar(255) DEFAULT NULL,
  `finalidade` varchar(255) DEFAULT NULL,
  `garagem` int(11) DEFAULT NULL,
  `numero` varchar(255) DEFAULT NULL,
  `preco_aluguel` decimal(15,2) DEFAULT NULL,
  `preco_venda` decimal(15,2) DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `titulo` varchar(255) DEFAULT NULL,
  `bairro_id` int(11) DEFAULT NULL,
  `tipo_imovel_id` int(11) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `imoveis`
--

INSERT INTO `imoveis` (`id`, `area_total`, `area_construida`, `banheiros`, `caracteristicas`, `cep`, `complemento`, `descricao`, `destaque`, `dormitorios`, `endereco`, `finalidade`, `garagem`, `numero`, `preco_aluguel`, `preco_venda`, `status`, `titulo`, `bairro_id`, `tipo_imovel_id`, `created_at`, `updated_at`) VALUES
(1, 300.50, 180.75, 2, 'Piscina, Churrasqueira, Jardim', '12345-678', 'Casa 02', 'Excelente casa em bairro tranquilo, próximo a escolas e comércios.', b'1', 3, 'Rua das Flores', 'Residencial', 2, '123', 3500.00, 850000.00, 'Disponível', 'Casa ampla com piscina', 1, 2, NULL, NULL),
(3, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 3, NULL, 'VENDA', NULL, NULL, NULL, 350000.00, 'DISPONIVEL', 'Casa teste', NULL, NULL, '2026-10-27 20:49:19.000000', '2026-10-27 20:49:19.000000'),
(4, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 3, NULL, 'VENDA', NULL, NULL, NULL, 350000.00, 'DISPONIVEL', 'Casa teste', NULL, NULL, '2026-10-27 20:56:38.000000', '2026-10-27 20:56:38.000000');

-- --------------------------------------------------------

--
-- Estrutura para tabela `tipos_imoveis`
--

CREATE TABLE `tipos_imoveis` (
  `id` int(11) NOT NULL,
  `descricao` varchar(255) DEFAULT NULL,
  `nome` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `tipos_imoveis`
--

INSERT INTO `tipos_imoveis` (`id`, `descricao`, `nome`, `created_at`, `updated_at`) VALUES
(2, '1-piso', 'Casas', NULL, NULL);

-- --------------------------------------------------------

--
-- Estrutura para tabela `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `nome` varchar(255) DEFAULT NULL,
  `senha` varchar(255) DEFAULT NULL,
  `tipo` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `usuarios`
--

INSERT INTO `usuarios` (`id`, `email`, `nome`, `senha`, `tipo`) VALUES
(2, 'admin@admin.com', 'Administrador', '$2a$10$r2EcytpoUGy1hETJtdKeBu.S1fLgIuWxOmvodHN3AMN2EtysiFF3u', 'ADMIN'),
(3, 'teste3@teste.com', 'teste', '$2a$10$HEx/QAUv8yzgCUC6uOS9fOa2X6qHSTI12Cf0ega6.X0Oxuk/FrFPe', 'ADMIN');

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `bairros`
--
ALTER TABLE `bairros`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `fotos_imoveis`
--
ALTER TABLE `fotos_imoveis`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FKlxjlrrwj621jii9i201qr6x3d` (`imovel_id`);

--
-- Índices de tabela `imoveis`
--
ALTER TABLE `imoveis`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FKlbe75ud15gr1jhci27a5febtj` (`bairro_id`),
  ADD KEY `FK8l4n1619tyasatoa0a7051ins` (`tipo_imovel_id`);

--
-- Índices de tabela `tipos_imoveis`
--
ALTER TABLE `tipos_imoveis`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `bairros`
--
ALTER TABLE `bairros`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de tabela `fotos_imoveis`
--
ALTER TABLE `fotos_imoveis`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `imoveis`
--
ALTER TABLE `imoveis`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de tabela `tipos_imoveis`
--
ALTER TABLE `tipos_imoveis`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de tabela `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `fotos_imoveis`
--
ALTER TABLE `fotos_imoveis`
  ADD CONSTRAINT `FKlxjlrrwj621jii9i201qr6x3d` FOREIGN KEY (`imovel_id`) REFERENCES `imoveis` (`id`);

--
-- Restrições para tabelas `imoveis`
--
ALTER TABLE `imoveis`
  ADD CONSTRAINT `FK8l4n1619tyasatoa0a7051ins` FOREIGN KEY (`tipo_imovel_id`) REFERENCES `tipos_imoveis` (`id`),
  ADD CONSTRAINT `FKlbe75ud15gr1jhci27a5febtj` FOREIGN KEY (`bairro_id`) REFERENCES `bairros` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
