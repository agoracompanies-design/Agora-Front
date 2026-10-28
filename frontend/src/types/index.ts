export interface AuthUser {
  id: string;
  username: string;
  permissions: string[];
  /**
   * Si la cuenta está baneada. Lo decide el backend tras las infracciones que
   * él mismo captura; aquí solo se enseña la pantalla que lo dice.
   *
   * **Todavía no llega**: el servidor no tiene ni infracciones ni baneo (pedido
   * en `bugs-para-arreglar.md`). El código está listo para cuando lleguen, y
   * mientras tanto estos campos vienen vacíos y no cambia nada.
   */
  banned?: boolean;
  bannedReason?: string | null;
  bannedAt?: string | null;
  /** Teléfono del grupo de trabajo que atendió a este cliente, para negociar. */
  supportPhone?: string | null;
}

export interface LoginResponse {
  accessToken: string;
  /**
   * Vale una semana y sirve para pedir un `accessToken` nuevo sin volver a
   * escribir la contraseña. Viaja en el cuerpo, no en una cookie.
   */
  refreshToken: string;
  expiresIn: string;
  user: AuthUser;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Contact {
  email: string;
  phone: string;
  website?: string;
}

export interface UserEnterprise {
  idUserEnterprise: string;
  userId: string;
  companyName: string;
  /**
   * El logo, como lo devuelva el servidor. Todavía no existe en el backend
   * —`user_enterprises` no tiene columna de imagen—, así que llega vacío y la
   * ficha enseña el cuadrado con la inicial. Ver `LOGO_DE_EMPRESA_LISTO`.
   */
  image?: string | null;
  address: Address | null;
  contact: Contact | null;
  officeHours: string | null;
  code: number | null;
  latitude: number | null;
  longitude: number | null;

  /**
   * Lo que el negocio necesita contar y antes no cabía. Llegó en el commit
   * `55c1994` del backend; hasta entonces se perdía al guardar.
   */

  /**
   * Cómo se llega hasta la puerta. En Cuba las direcciones se dan por
   * referencias («frente al parque»), no por número de portal.
   */
  reference?: string | null;
  /** El enlace de la ubicación, tal como se comparte por WhatsApp. */
  mapLink?: string | null;
  /** «Lunes a sábado», «Todos los días menos el domingo». */
  openDays?: string | null;
  /** `HH:MM` de 24 horas. O las dos o ninguna: media franja no sirve. */
  openTime?: string | null;
  closeTime?: string | null;
  /** Lleva letras, por eso no es el `code` numérico. */
  affiliateCode?: string | null;
}

/**
 * Una categoría del catálogo. Desde el 2026-09-03 son una tabla propia en el
 * backend: se crean con `approved: false` cuando alguien las sugiere y solo
 * clasifican de verdad cuando un moderador las aprueba.
 */
export interface Category {
  id: string;
  name: string;
  approved: boolean;
  suggestedBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  idProduct: string;
  name: string;
  priceCup: number | null;
  priceUsd: number | null;
  image: string | null;
  description: string;
  unit: string;
  stock: boolean;
  /**
   * La categoría en la que el producto está publicado de verdad: la aprobada,
   * o «Otros» mientras la suya espera revisión. Llega anidada desde la API.
   */
  category: Category | null;
  categoryId: string | null;
  /**
   * El nombre que escribió quien publicó, cuando pidió una que no existía.
   * Es solo rastro: el producto sigue en «Otros» hasta que se apruebe.
   */
  suggestedCategoryName: string | null;
  userEnterpriseId: string;
  userEnterprise?: UserEnterprise;
}

export interface Service {
  idService: string;
  name: string;
  priceCup: number | null;
  priceUsd: number | null;
  description: string;
  /**
   * La foto del servicio, como ruta servible (`/services/image/<fichero>`),
   * igual que en producto. Opcional: un servicio puede no tener foto, y además
   * el servidor todavía no guarda ninguna —ver `IMAGEN_DE_SERVICIO_LISTA` en
   * `api/service.ts`—, así que hoy llega siempre vacía.
   */
  image?: string | null;
  userEnterpriseId: string;
  userEnterprise?: UserEnterprise;
}

export interface Rating {
  idRating: string;
  quantity: number;
  userId: string;
  productId: string | null;
  serviceId: string | null;
  createdAt: string;
  user?: { id: string; username: string };
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  latitude?: number;
  longitude?: number;
  radius?: number;
  userEnterpriseId?: string;
}

export interface Paginated<T> {
  products: T[];
  total: number;
}
