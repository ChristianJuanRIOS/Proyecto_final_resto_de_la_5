-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 22-10-2026 a las 19:11:30
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `restaurante`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `insumos`
--

CREATE TABLE `insumos` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `unidad` varchar(20) NOT NULL,
  `stock_actual` decimal(10,2) NOT NULL DEFAULT 0.00,
  `stock_minimo` decimal(10,2) NOT NULL DEFAULT 0.00,
  `creado_en` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `insumos`
--

INSERT INTO `insumos` (`id`, `nombre`, `unidad`, `stock_actual`, `stock_minimo`, `creado_en`) VALUES
(26, 'Muzzarella', 'kg', 9.25, 2.00, '2026-10-22 11:51:10'),
(27, 'Harina', 'kg', 9.10, 3.00, '2026-10-22 11:51:10'),
(28, 'Tomate', 'kg', 3.55, 2.00, '2026-10-22 11:51:10'),
(29, 'Carne picada', 'kg', 5.70, 2.00, '2026-10-22 11:51:10'),
(30, 'Huevo', 'u', 30.00, 12.00, '2026-10-22 11:51:10'),
(31, 'Pan de hamburguesa', 'u', 18.00, 10.00, '2026-10-22 11:51:10'),
(32, 'Papas fritas', 'kg', 7.60, 3.00, '2026-10-22 11:51:10'),
(33, 'Gaseosa cola', 'u', 24.00, 12.00, '2026-10-22 11:51:10');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `menu_items`
--

CREATE TABLE `menu_items` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `precio` decimal(10,2) NOT NULL,
  `categoria` enum('entrada','principal','postre','bebida') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `menu_items`
--

INSERT INTO `menu_items` (`id`, `nombre`, `precio`, `categoria`) VALUES
(1, 'Milanesa napolitana', 8500.00, 'principal'),
(2, 'Ensalada Cesar', 6200.00, 'entrada'),
(3, 'Flan casero', 3200.00, 'postre'),
(4, 'Gaseosa 500ml', 2000.00, 'bebida'),
(7, 'Pizza Muzzarella', 8000.00, 'principal'),
(8, 'Hamburguesa Clásica', 9000.00, 'principal');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `mesas`
--

CREATE TABLE `mesas` (
  `id` int(11) NOT NULL,
  `numero` int(11) NOT NULL,
  `capacidad` int(11) NOT NULL,
  `estado` enum('libre','ocupada') NOT NULL DEFAULT 'libre',
  `pos_x` decimal(5,2) DEFAULT NULL,
  `pos_y` decimal(5,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `mesas`
--

INSERT INTO `mesas` (`id`, `numero`, `capacidad`, `estado`, `pos_x`, `pos_y`) VALUES
(1, 1, 2, 'libre', 14.02, 19.59),
(2, 2, 4, 'libre', NULL, NULL),
(3, 3, 4, 'ocupada', NULL, NULL),
(4, 4, 4, 'ocupada', NULL, NULL),
(5, 5, 2, 'libre', NULL, NULL),
(6, 6, 2, 'libre', NULL, NULL),
(7, 7, 2, 'libre', NULL, NULL),
(8, 8, 2, 'libre', NULL, NULL),
(9, 9, 2, 'libre', NULL, NULL),
(10, 10, 4, 'libre', NULL, NULL),
(11, 11, 4, 'libre', NULL, NULL),
(12, 12, 4, 'libre', NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `movimientos_stock`
--

CREATE TABLE `movimientos_stock` (
  `id` int(11) NOT NULL,
  `insumo_id` int(11) NOT NULL,
  `cantidad` decimal(10,2) NOT NULL,
  `motivo` enum('pedido','cancelacion','compra','merma','ajuste') NOT NULL,
  `orden_id` int(11) DEFAULT NULL,
  `creado_en` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `movimientos_stock`
--

INSERT INTO `movimientos_stock` (`id`, `insumo_id`, `cantidad`, `motivo`, `orden_id`, `creado_en`) VALUES
(1, 26, -0.25, 'pedido', 7, '2026-10-22 11:59:27'),
(2, 27, -0.30, 'pedido', 7, '2026-10-22 11:59:27'),
(3, 28, -0.15, 'pedido', 7, '2026-10-22 11:59:27'),
(4, 26, 5.00, 'compra', NULL, '2026-10-22 12:19:08'),
(5, 29, -0.30, 'pedido', 8, '2026-10-22 12:35:15'),
(6, 31, -2.00, 'pedido', 8, '2026-10-22 12:35:15'),
(7, 32, -0.40, 'pedido', 8, '2026-10-22 12:35:15'),
(8, 26, -0.25, 'pedido', 9, '2026-10-22 12:54:15'),
(9, 27, -0.30, 'pedido', 9, '2026-10-22 12:54:15'),
(10, 28, -0.15, 'pedido', 9, '2026-10-22 12:54:15'),
(11, 26, -0.25, 'pedido', 11, '2026-10-22 13:13:58'),
(12, 27, -0.30, 'pedido', 11, '2026-10-22 13:13:58'),
(13, 28, -0.15, 'pedido', 11, '2026-10-22 13:13:58');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ordenes`
--

CREATE TABLE `ordenes` (
  `id` int(11) NOT NULL,
  `mesa_id` int(11) DEFAULT NULL,
  `mozo_nombre` varchar(100) NOT NULL,
  `estado` enum('pendiente','en_cocina','listo','entregado','cancelado') NOT NULL DEFAULT 'pendiente',
  `creado_en` datetime NOT NULL DEFAULT current_timestamp(),
  `enviado_cocina_en` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `ordenes`
--

INSERT INTO `ordenes` (`id`, `mesa_id`, `mozo_nombre`, `estado`, `creado_en`, `enviado_cocina_en`) VALUES
(1, 4, 'Juan', 'entregado', '2026-10-22 10:06:47', '2026-10-22 10:06:47'),
(2, 4, 'Administrador', 'entregado', '2026-10-22 10:08:28', '2026-10-22 10:08:28'),
(3, 4, 'Juan', 'entregado', '2026-10-22 10:22:00', '2026-10-22 10:22:00'),
(4, 4, 'Juan', 'entregado', '2026-10-22 10:29:55', '2026-10-22 10:29:55'),
(5, 4, 'Administrador', 'entregado', '2026-10-22 10:40:55', '2026-10-22 10:40:55'),
(6, 4, 'Juan', 'entregado', '2026-10-22 11:06:46', '2026-10-22 11:06:46'),
(7, 3, 'Juan', 'entregado', '2026-10-22 11:59:27', '2026-10-22 11:59:27'),
(8, 3, 'Administrador', 'en_cocina', '2026-10-22 12:35:15', '2026-10-22 12:35:15'),
(9, 2, 'Juan', 'pendiente', '2026-10-22 12:54:15', NULL),
(10, 4, 'Juan', 'cancelado', '2026-10-22 13:13:33', NULL),
(11, 4, 'Juan', 'entregado', '2026-10-22 13:13:58', '2026-10-22 13:14:31'),
(12, 4, 'Juan', 'pendiente', '2026-10-22 13:15:39', NULL),
(13, 4, 'Juan', 'cancelado', '2026-10-22 13:17:00', NULL),
(14, 4, 'Juan', 'pendiente', '2026-10-22 13:17:06', NULL),
(15, 4, 'Juan', 'cancelado', '2026-10-22 13:19:02', '2026-10-22 13:19:41'),
(16, 4, 'Juan', 'pendiente', '2026-10-22 13:21:18', NULL),
(17, 4, 'Administrador', 'pendiente', '2026-10-22 13:24:40', NULL),
(18, 4, 'Administrador', 'pendiente', '2026-10-22 13:24:43', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `orden_items`
--

CREATE TABLE `orden_items` (
  `id` int(11) NOT NULL,
  `orden_id` int(11) NOT NULL,
  `menu_item_id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `precio` decimal(10,2) NOT NULL,
  `cantidad` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `orden_items`
--

INSERT INTO `orden_items` (`id`, `orden_id`, `menu_item_id`, `nombre`, `precio`, `cantidad`) VALUES
(1, 1, 1, 'Milanesa napolitana', 8500.00, 2),
(2, 2, 2, 'Ensalada Cesar', 6200.00, 3),
(3, 3, 1, 'Milanesa napolitana', 8500.00, 2),
(4, 4, 1, 'Milanesa napolitana', 8500.00, 1),
(5, 4, 2, 'Ensalada Cesar', 6200.00, 1),
(6, 5, 1, 'Milanesa napolitana', 8500.00, 3),
(7, 6, 1, 'Milanesa napolitana', 8500.00, 2),
(8, 6, 2, 'Ensalada Cesar', 6200.00, 1),
(9, 7, 7, 'Pizza Muzzarella', 8000.00, 1),
(10, 8, 8, 'Hamburguesa Clásica', 9000.00, 2),
(11, 9, 7, 'Pizza Muzzarella', 8000.00, 1),
(12, 10, 1, 'Milanesa napolitana', 8500.00, 1),
(13, 11, 7, 'Pizza Muzzarella', 8000.00, 1),
(14, 12, 1, 'Milanesa napolitana', 8500.00, 1),
(15, 13, 1, 'Milanesa napolitana', 8500.00, 1),
(16, 14, 1, 'Milanesa napolitana', 8500.00, 1),
(17, 15, 1, 'Milanesa napolitana', 8500.00, 1),
(18, 16, 1, 'Milanesa napolitana', 8500.00, 1),
(19, 17, 1, 'Milanesa napolitana', 8500.00, 1),
(20, 18, 1, 'Milanesa napolitana', 8500.00, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pagos`
--

CREATE TABLE `pagos` (
  `id` int(11) NOT NULL,
  `orden_id` int(11) NOT NULL,
  `monto` decimal(10,2) NOT NULL,
  `pasarela` enum('tarjeta','mercadopago','transferencia') NOT NULL,
  `estado` enum('pendiente','aprobado','rechazado','reembolsado') NOT NULL DEFAULT 'pendiente',
  `referencia_externa` varchar(255) DEFAULT NULL,
  `detalle` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`detalle`)),
  `creado_en` datetime DEFAULT current_timestamp(),
  `actualizado_en` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `pagos`
--

INSERT INTO `pagos` (`id`, `orden_id`, `monto`, `pasarela`, `estado`, `referencia_externa`, `detalle`, `creado_en`, `actualizado_en`) VALUES
(1, 11, 8000.00, 'tarjeta', 'aprobado', 'TARJ-T9WWYU02', '{\"mensaje\":\"Pago aprobado (simulado)\",\"ultimos_4\":\"4242\",\"titular\":\"juan\"}', '2026-10-22 13:14:31', '2026-10-22 13:14:31'),
(2, 12, 8500.00, 'tarjeta', 'rechazado', NULL, '{\"error\":\"Tarjeta rechazada por la entidad bancaria (caso de prueba)\"}', '2026-10-22 13:16:07', '2026-10-22 13:16:07'),
(3, 14, 8500.00, 'tarjeta', 'rechazado', NULL, '{\"error\":\"Tarjeta rechazada por la entidad bancaria (caso de prueba)\"}', '2026-10-22 13:17:41', '2026-10-22 13:17:41'),
(4, 15, 8500.00, 'tarjeta', 'reembolsado', 'TARJ-BVDV8L79', '{\"mensaje\":\"Reembolso procesado (simulado)\",\"ultimos_4\":\"1212\",\"titular\":\"juan\",\"referencia_original\":\"TARJ-BVDV8L79\"}', '2026-10-22 13:19:41', '2026-10-22 13:22:55'),
(5, 16, 8500.00, 'transferencia', 'pendiente', 'TRANSF-EYOAKYPM', '{\"mensaje\":\"Transferencia registrada. Pendiente de verificación por admin.\",\"cbu_destino\":\"0001010218276172157215\",\"banco_origen\":\"Banco Nación\"}', '2026-10-22 13:22:28', '2026-10-22 13:22:28');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pedidos_delivery`
--

CREATE TABLE `pedidos_delivery` (
  `id` int(11) NOT NULL,
  `orden_id` int(11) NOT NULL,
  `cliente_nombre` varchar(100) NOT NULL,
  `direccion` varchar(255) NOT NULL,
  `observaciones` text DEFAULT NULL,
  `telefono` varchar(50) DEFAULT NULL,
  `modalidad_envio` enum('moto_propia','cadeteria_externa','retiro_local') NOT NULL,
  `costo_envio` decimal(10,2) NOT NULL DEFAULT 0.00,
  `repartidor_id` int(11) DEFAULT NULL,
  `estado` enum('en_preparacion','en_camino','entregado','cancelado') NOT NULL DEFAULT 'en_preparacion',
  `creado_en` datetime DEFAULT current_timestamp(),
  `actualizado_en` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `plato_insumos`
--

CREATE TABLE `plato_insumos` (
  `plato_id` int(11) NOT NULL,
  `insumo_id` int(11) NOT NULL,
  `cantidad_necesaria` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `plato_insumos`
--

INSERT INTO `plato_insumos` (`plato_id`, `insumo_id`, `cantidad_necesaria`) VALUES
(7, 26, 0.25),
(7, 27, 0.30),
(7, 28, 0.15),
(8, 29, 0.15),
(8, 31, 1.00),
(8, 32, 0.20);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `repartidores`
--

CREATE TABLE `repartidores` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `contacto` varchar(100) DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `creado_en` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `repartidores`
--

INSERT INTO `repartidores` (`id`, `nombre`, `contacto`, `activo`, `creado_en`) VALUES
(1, 'Pedro Repartidor', '11-5555-1111', 1, '2026-10-22 13:45:49'),
(2, 'Ana Perez', '11-5555-2222', 1, '2026-10-22 13:45:49'),
(3, 'Lucas Moto', '11-5555-3333', 1, '2026-10-22 13:45:49');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `usuario` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `rol` enum('admin','mozo','cocinero','chef') NOT NULL DEFAULT 'mozo',
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `usuario`, `password_hash`, `nombre`, `rol`, `creado_en`) VALUES
(1, 'admin', '$2b$10$x/LpCm.bbvPXA9E3o3FzwuQs3h8Is0HxFVDwDJZgIcINs3R9HBm8.', 'Administrador', 'admin', '2026-10-22 13:03:01'),
(2, 'juan', '$2b$10$d9HqGN37tLVTzKrTFOFK8OZXWvsSyzkqB.oq4YjVvIDbxwP9Nvr..', 'Juan', 'mozo', '2026-10-22 13:03:01'),
(3, 'maria', '$2b$10$wPnrjQmzIN89jvKu.pU5iejnVEKTFNo9AM1AmLbga7Dnok9NcESp2', 'Maria', 'cocinero', '2026-10-22 13:03:01'),
(4, 'carlos', '$2b$10$Hh7a0Cp0JRtmvfnOtukwKe/1xrJcK/sHW3yNjOooSlosyw12lFjmy', 'Carlos', 'chef', '2026-10-22 13:03:01');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `insumos`
--
ALTER TABLE `insumos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `menu_items`
--
ALTER TABLE `menu_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `mesas`
--
ALTER TABLE `mesas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `numero` (`numero`);

--
-- Indices de la tabla `movimientos_stock`
--
ALTER TABLE `movimientos_stock`
  ADD PRIMARY KEY (`id`),
  ADD KEY `insumo_id` (`insumo_id`),
  ADD KEY `orden_id` (`orden_id`);

--
-- Indices de la tabla `ordenes`
--
ALTER TABLE `ordenes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `mesa_id` (`mesa_id`);

--
-- Indices de la tabla `orden_items`
--
ALTER TABLE `orden_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `orden_id` (`orden_id`),
  ADD KEY `menu_item_id` (`menu_item_id`);

--
-- Indices de la tabla `pagos`
--
ALTER TABLE `pagos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_orden` (`orden_id`),
  ADD KEY `idx_estado` (`estado`);

--
-- Indices de la tabla `pedidos_delivery`
--
ALTER TABLE `pedidos_delivery`
  ADD PRIMARY KEY (`id`),
  ADD KEY `orden_id` (`orden_id`),
  ADD KEY `idx_estado` (`estado`),
  ADD KEY `idx_repartidor` (`repartidor_id`);

--
-- Indices de la tabla `plato_insumos`
--
ALTER TABLE `plato_insumos`
  ADD PRIMARY KEY (`plato_id`,`insumo_id`),
  ADD KEY `insumo_id` (`insumo_id`);

--
-- Indices de la tabla `repartidores`
--
ALTER TABLE `repartidores`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `usuario` (`usuario`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `insumos`
--
ALTER TABLE `insumos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT de la tabla `menu_items`
--
ALTER TABLE `menu_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `mesas`
--
ALTER TABLE `mesas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `movimientos_stock`
--
ALTER TABLE `movimientos_stock`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT de la tabla `ordenes`
--
ALTER TABLE `ordenes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT de la tabla `orden_items`
--
ALTER TABLE `orden_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT de la tabla `pagos`
--
ALTER TABLE `pagos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `pedidos_delivery`
--
ALTER TABLE `pedidos_delivery`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `repartidores`
--
ALTER TABLE `repartidores`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `movimientos_stock`
--
ALTER TABLE `movimientos_stock`
  ADD CONSTRAINT `movimientos_stock_ibfk_1` FOREIGN KEY (`insumo_id`) REFERENCES `insumos` (`id`),
  ADD CONSTRAINT `movimientos_stock_ibfk_2` FOREIGN KEY (`orden_id`) REFERENCES `ordenes` (`id`);

--
-- Filtros para la tabla `ordenes`
--
ALTER TABLE `ordenes`
  ADD CONSTRAINT `ordenes_ibfk_1` FOREIGN KEY (`mesa_id`) REFERENCES `mesas` (`id`);

--
-- Filtros para la tabla `orden_items`
--
ALTER TABLE `orden_items`
  ADD CONSTRAINT `orden_items_ibfk_1` FOREIGN KEY (`orden_id`) REFERENCES `ordenes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `orden_items_ibfk_2` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`id`);

--
-- Filtros para la tabla `pagos`
--
ALTER TABLE `pagos`
  ADD CONSTRAINT `pagos_ibfk_1` FOREIGN KEY (`orden_id`) REFERENCES `ordenes` (`id`);

--
-- Filtros para la tabla `pedidos_delivery`
--
ALTER TABLE `pedidos_delivery`
  ADD CONSTRAINT `pedidos_delivery_ibfk_1` FOREIGN KEY (`orden_id`) REFERENCES `ordenes` (`id`),
  ADD CONSTRAINT `pedidos_delivery_ibfk_2` FOREIGN KEY (`repartidor_id`) REFERENCES `repartidores` (`id`);

--
-- Filtros para la tabla `plato_insumos`
--
ALTER TABLE `plato_insumos`
  ADD CONSTRAINT `plato_insumos_ibfk_1` FOREIGN KEY (`plato_id`) REFERENCES `menu_items` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `plato_insumos_ibfk_2` FOREIGN KEY (`insumo_id`) REFERENCES `insumos` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
