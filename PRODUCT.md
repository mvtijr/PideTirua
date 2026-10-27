# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

1. **Comensales y Clientes (Locales y Turistas):** Personas en Tirúa (residentes, veraneantes, trabajadores) que desean revisar la carta gastronómica de los restaurantes del pueblo desde sus teléfonos móviles (mediante código QR en mesa o enlace web directo), personalizar sus platos con extras/salsas y coordinar el retiro sin fricciones ni esperas innecesarias.
2. **Administradores y Dueños de Locales:** Emprendedores gastronómicos de Tirúa que necesitan controlar de forma autónoma su disponibilidad, horarios, carta digital, comandas en cocina en tiempo real (KDS), cierres de caja diarios y datos de transferencia bancaria, sin comisiones de intermediarios.
3. **Super Administrador:** Gestor general de la plataforma comunitaria que supervisa locales activos, accesos y métricas globales.

## Product Purpose

PideTirúa es la plataforma comunitaria e hiperlocal de gastronomía y pedidos de Tirúa. Existe para digitalizar y fortalecer la economía gastronómica de la comuna, permitiendo a los restaurantes operar con herramientas de primer nivel (carta digital QR, KDS de cocina, cuadre de caja) y a los comensales pedir con total claridad y rapidez directo por WhatsApp y Supabase.

El éxito significa:
- Cero fricción en el checkout del cliente desde celulares, sin descargas obligatorias de aplicaciones externas.
- Autonomía operativa absoluta para el dueño del local para cambiar precios, pausar categorías o abrir/cerrar su cocina al instante.
- Coordinación directa y transparente entre comensal y cocina mediante WhatsApp.

## Positioning

Una plataforma gastronómica hiperlocal construida específicamente para la realidad de Tirúa:
- **Cero comisiones ni cobros abusivos** que desangren a los locales pequeños.
- **Sin intermediarios de pago complejos:** transferencias bancarias directas a las cuentas de los dueños o pago en efectivo al retirar.
- **Enfoque en Retiro / Take-Away y mesas presenciales:** diseñado para la dinámica geográfica y turística de Tirúa.

## Operating Context

- **Clientes:** Uso predominantemente móvil (smartphones en mesas o en camino al restaurante), frecuentemente con conectividad móvil variable (4G/3G en zonas costeras/rurales), exigiendo interfaces ultraligeras, estáticas (sin zooms accidentales) y legibles.
- **Cocina y Administración:** Uso mixto (tablets o computadores de escritorio para el monitor de cocina y el panel de administración espacioso de 1080p, y teléfonos móviles para ajustes rápidos).
- **Notificaciones y Despacho:** WhatsApp como canal universal y confiable de mensajería para confirmación de pedidos y avisos de "¡Tu pedido está listo!".

## Capabilities and Constraints

- **Capacidades Confirmadas:**
  - Carta digital responsiva por local (`/[slug]`) con modificadores/extras de platos (salsas, agregados).
  - Programación de hora de retiro ("Lo antes posible" o selector de hora específica).
  - Checkout con cálculo dinámico, métodos de pago (Efectivo o Transferencia con datos bancarios del local desplegados) y generación de comanda a WhatsApp y Supabase.
  - Panel Admin de escritorio (`/admin/[slug]`) dividido en secciones modulares: Carta & Platos (con redacción de descripciones mediante IA Gemini), Monitor de Cocina KDS con alerta sonora y botón directo de aviso WhatsApp, Ventas & Arqueo de Caja diario, y Ajustes & Seguridad (PIN, horario, cartel QR imprimible).
  - Panel SuperAdmin (`/superadmin`) para gestión integral de credenciales y locales.
- **Restricciones Durables:**
  - Sin dependencias de delivery externo centralizado.
  - Sin pasarelas de pago externas con comisión (Webpay/MercadoPago).
  - Interfaz de cliente sin zoom ni redimensionamiento flotante indeseado en móviles (viewport estático y firme).

## Brand Commitments

- **Nombre:** PideTirúa.
- **Identidad:** Cálida, profesional, gastronómica, local y moderna. Colores de acento vivos combinados con fondos limpios y contrastes nítidos.
- **Voz y Tono:** Cercano, educado, claro y eficiente ("¡Hola! 👋 Tu pedido en [Local] ya está caliente y listo para que pases a retirarlo").

## Evidence on Hand

- Código fuente en Next.js 15, React 19, TypeScript y Tailwind CSS en el repositorio.
- Base de datos relacional y Realtime en Supabase (`locales`, `productos`, `categorias`, `pedidos`).
- Integración oficial con Google Gemini API para asistencia de contenido gastronómico.
- Locales iniciales activos: Las Tranqueras, Sushi Burger, Río Mar, Gran Pacífico.

## Product Principles

1. **Autonomía y Simplicidad:** Cada restaurante es dueño de su operativa; ningún flujo técnico debe requerir asistencia técnica externa para las tareas diarias de un local.
2. **Claridad para el Comensal:** El cliente ve exactamente qué está pidiendo, cuánto cuesta cada extra, a qué cuenta transferir y a qué hora estará listo.
3. **Resiliencia y Ligereza:** Páginas rápidas, directas y sin componentes pesados que fallen en conexiones costeras móviles.
4. **Respeto a la Dinámica Local:** Integración fluida con las herramientas reales de Tirúa: WhatsApp, efectivo y transferencias CuentaRUT.

## Accessibility & Inclusion

- Contraste visual elevado en textos y precios para lectura en exteriores y bajo luz solar.
- Botones táctiles amplios (mínimo 44x44px) en la carta móvil.
- Alerta visual y sonora en comandas de cocina para ambientes ruidosos.
