export type CategoriaFiltro =
  | "Todos"
  | "Sushi"
  | "Comida Rápida"
  | "Pescados y Mariscos"
  | "Cafetería";

export type SectorComuna = "Tirúa Centro" | "Quidico";

export type TipoEntrega = "Retiro en local" | "Consumo en mesa";

export type MetodoPago = "Efectivo" | "Transferencia Bancaria";

export type PlanComercial = "autogestionado" | "llave_en_mano";

export interface Producto {
  id: string;
  categoria_id?: string;
  nombre: string;
  descripcion: string;
  precio: number; // En pesos chilenos (CLP), ej: 12500
  imagen: string;
  imagen_url?: string;
  disponible?: boolean;
  destacado?: boolean;
  etiqueta?: string;
}

export interface CategoriaMenu {
  id: string;
  local_id?: string;
  nombre: string;
  orden?: number;
  productos: Producto[];
}

export interface Local {
  id: string;
  slug: string;
  nombre: string;
  rubro: string;
  categoriaFiltro: Exclude<CategoriaFiltro, "Todos">[];
  sector: SectorComuna;
  ubicacion: string;
  direccion?: string;
  direccionDetalle: string;
  telefonoWhatsapp: string;
  telefono_whatsapp?: string;
  horario: string;
  horarioEntrega: string;
  tiempoEstimado: string;
  costoDelivery?: number;
  calificacion: number;
  descripcionCorta: string;
  fotoPortada: string;
  banner_url?: string;
  videoPortada?: string;
  videoFondo?: string;
  logo: string;
  logo_url?: string;
  abierto: boolean;
  activo?: boolean;
  plan?: PlanComercial;
  precio_mensual?: number;
  pin?: string;
  banco?: string;
  tipo_cuenta?: string;
  numero_cuenta?: string;
  rut_titular?: string;
  nombre_titular?: string;
  email_transferencia?: string;
  categorias: CategoriaMenu[];
}

export interface ItemCarrito {
  producto: Producto;
  cantidad: number;
}

export interface DatosCheckout {
  nombreCliente: string;
  tipoEntrega: TipoEntrega;
  direccionOMesa: string;
  metodoPago: MetodoPago;
  notasAdicionales: string;
}

export type EstadoPedido = "pendiente" | "preparando" | "listo" | "entregado";

export interface ItemPedidoGuardado {
  nombre: string;
  cantidad: number;
  precio: number;
  subtotal: number;
}

export interface Pedido {
  id: string;
  created_at: string;
  local_slug: string;
  cliente_nombre: string;
  tipo_entrega: string;
  direccion_mesa: string;
  metodo_pago: string;
  notas: string;
  items: ItemPedidoGuardado[];
  total: number;
  estado: EstadoPedido;
}

