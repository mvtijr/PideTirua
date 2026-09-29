export type CategoriaFiltro =
  | "Todos"
  | "Sushi"
  | "Comida Rápida"
  | "Pescados y Mariscos"
  | "Cafetería";

export type SectorComuna = "Tirúa Centro" | "Quidico";

export type TipoEntrega = "Retiro en local" | "Consumo en mesa";

export type MetodoPago = "Efectivo" | "Transferencia Bancaria";

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
  videoPortada?: string;
  videoFondo?: string;
  logo: string;
  abierto: boolean;
  pin?: string;
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
