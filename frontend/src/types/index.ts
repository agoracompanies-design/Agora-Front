export interface AuthUser {
  id: string;
  username: string;
  permissions: string[];
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
}

export interface Paginated<T> {
  products: T[];
  total: number;
}
