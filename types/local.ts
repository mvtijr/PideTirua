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
  nombre: string;
  descripcion: string;
  precio: number; // En pesos chilenos (CLP), ej: 12500
  imagen: string;
  destacado?: boolean;
  etiqueta?: string;
}

export interface CategoriaMenu {
  id: string;
  nombre: string;
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
  direccionDetalle: string;
  telefonoWhatsapp: string;
  horarioEntrega: string;
  tiempoEstimado: string;
  costoDelivery?: number;
  calificacion: number;
  descripcionCorta: string;
  fotoPortada: string;
  videoPortada?: string;
  logo: string;
  abierto: boolean;
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
