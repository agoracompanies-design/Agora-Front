import { lazy, Suspense } from "react";
import type { ComponentType } from "react";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useParams,
} from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { MotionProvider } from "@/context/MotionContext";
import { ToastProvider } from "@/context/ToastContext";
import { NotificationsProvider } from "@/context/NotificationsContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { OnboardingGate } from "@/components/onboarding/OnboardingGate";
import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  ProtectedRoute,
  RequireModerator,
  RequireSubscription,
  SoloSinSesion,
} from "@/components/layout/ProtectedRoute";
import { ScrollAlInicio } from "@/components/layout/ScrollAlInicio";

import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { ExplorePage } from "@/pages/explore/ExplorePage";
import { BusinessesPage } from "@/pages/business/BusinessesPage";
import { FavoritesPage } from "@/pages/favorites/FavoritesPage";
import { NotificationsPage } from "@/pages/notifications/NotificationsPage";
import { ProductDetailPage } from "@/pages/product/ProductDetailPage";
import { EnterprisePage } from "@/pages/enterprise/EnterprisePage";
import { BecomeSellerPage } from "@/pages/seller/BecomeSellerPage";
import { PlansPage } from "@/pages/plans/PlansPage";
import { AccountPage } from "@/pages/account/AccountPage";
import { DashboardHome } from "@/pages/dashboard/DashboardHome";
import { DashboardProducts } from "@/pages/dashboard/DashboardProducts";
import { ProductFormPage } from "@/pages/dashboard/ProductFormPage";
import { DashboardServices } from "@/pages/dashboard/DashboardServices";
import { ServiceFormPage } from "@/pages/dashboard/ServiceFormPage";
import { DashboardEnterprise } from "@/pages/dashboard/DashboardEnterprise";
import { ModerationPage } from "@/pages/moderation/ModerationPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

import { PageSpinner } from "@/components/ui/Spinner";

/*
 * El panel administrativo se carga solo si alguien entra en /administration.
 *
 * Importado de forma directa, el empaquetador lo metía entero —con `recharts`,
 * la librería de gráficas— en el paquete principal, el que descarga cualquier
 * cliente al abrir Agora aunque nunca vaya a ver el panel. Con `lazy` cada
 * pieza queda en su propio fichero y el navegador lo pide al llegar a la ruta.
 *
 * `named` adapta las exportaciones con nombre, que es como están escritas estas
 * páginas, a lo que espera `lazy` (una exportación por defecto).
 */
function named<T extends Record<string, ComponentType>>(cargar: () => Promise<T>, nombre: keyof T) {
  return lazy(() => cargar().then((m) => ({ default: m[nombre] })));
}
const AdminLayout = named(() => import("@/components/administration/layout/DashboardLayout"), "DashboardLayout");
const MainDashboard = named(() => import("./pages/administration/MainDashboard"), "MainDashboard");
const BusinessListPage = named(() => import("./pages/administration/business/BusinessListPage"), "BusinessListPage");
const UsersListPage = named(() => import("./pages/administration/users/UsersListPage"), "UsersListPage");
const ProductsListPage = named(() => import("./pages/administration/products/ProductsListPage"), "ProductsListPage");
const ServicesListPage = named(() => import("./pages/administration/services/ServicesListPage"), "ServicesListPage");
const SubscriptionsListPage = named(
  () => import("./pages/administration/subscription/SubscriptionsListPage"),
  "SubscriptionsListPage",
);

/** Enlaces antiguos: /tiendas/:id era la ficha del negocio antes del 2026-08-31. */
function RedirigirANegocio() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/negocios/${id}`} replace />;
}

/**
 * El muro de ubicación va aquí dentro, no envolviendo toda la aplicación: si
 * no, era lo primero que veía alguien sin sesión, antes incluso del acceso.
 */
function ConOnboarding() {
  return (
    <OnboardingGate>
      <Outlet />
    </OnboardingGate>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <MotionProvider>
          <AuthProvider>
            <ToastProvider>
              <NotificationsProvider>
                <FavoritesProvider>
                  <ScrollAlInicio />
                  <Routes>
                    {/* Todo lo de dentro exige sesión: Agora no se navega sin cuenta. */}
                    <Route element={<ProtectedRoute />}>
                      {/* Y con sesión, además, una suscripción vigente. */}
                      <Route element={<RequireSubscription />}>
                        <Route element={<ConOnboarding />}>
                          <Route element={<AppLayout />}>
                            <Route index element={<ExplorePage />} />
                            <Route
                              path="explorar"
                              element={<Navigate to="/" replace />}
                            />
                            <Route
                              path="negocios"
                              element={<BusinessesPage />}
                            />
                            {/* La sección se llamó «mercados» hasta el 2026-08-31: se
                    redirige para no romper enlaces ya compartidos. */}
                            <Route
                              path="mercados"
                              element={<Navigate to="/negocios" replace />}
                            />
                            <Route
                              path="favoritos"
                              element={<FavoritesPage />}
                            />
                            <Route
                              path="avisos"
                              element={<NotificationsPage />}
                            />
                            <Route
                              path="productos/:id"
                              element={<ProductDetailPage />}
                            />
                            <Route
                              path="negocios/:id"
                              element={<EnterprisePage />}
                            />
                            <Route
                              path="tiendas/:id"
                              element={<RedirigirANegocio />}
                            />
                            <Route
                              path="vender"
                              element={<BecomeSellerPage />}
                            />
                            <Route path="cuenta" element={<AccountPage />} />
                            <Route path="planes" element={<PlansPage />} />

                            {/* El panel no se cierra con un guardia: DashboardLayout
                    enseña la página de venta a quien no puede administrar, y
                    entonces no llega a montar ninguna de estas subrutas. */}
                            <Route path="panel" element={<DashboardLayout />}>
                              <Route index element={<DashboardHome />} />
                              <Route
                                path="productos"
                                element={<DashboardProducts />}
                              />
                              <Route
                                path="productos/nuevo"
                                element={<ProductFormPage />}
                              />
                              <Route
                                path="productos/:id"
                                element={<ProductFormPage />}
                              />
                              <Route
                                path="servicios"
                                element={<DashboardServices />}
                              />
                              <Route
                                path="servicios/nuevo"
                                element={<ServiceFormPage />}
                              />
                              <Route
                                path="servicios/:id"
                                element={<ServiceFormPage />}
                              />
                              <Route
                                path="empresa"
                                element={<DashboardEnterprise />}
                              />
                            </Route>

                            {/* Panel administrativo — DENTRO del AppLayout para mantener el header global */}
                            <Route
                              path="administration"
                              element={
                                <Suspense fallback={<PageSpinner />}>
                                  <AdminLayout />
                                </Suspense>
                              }
                            >
                              <Route index element={<MainDashboard />} />
                              <Route
                                path="negocios"
                                element={<BusinessListPage />}
                              />
                              <Route
                                path="usuarios"
                                element={<UsersListPage />}
                              />
                              <Route
                                path="productos"
                                element={<ProductsListPage />}
                              />
                              <Route
                                path="servicios"
                                element={<ServicesListPage />}
                              />
                              <Route
                                path="suscripciones"
                                element={<SubscriptionsListPage />}
                              />
                            </Route>

                            <Route element={<RequireModerator />}>
                              <Route
                                path="moderacion"
                                element={<ModerationPage />}
                              />
                            </Route>

                            <Route path="*" element={<NotFoundPage />} />
                          </Route>
                        </Route>
                      </Route>
                    </Route>

                    {/* Las únicas pantallas visibles sin token. */}
                    <Route element={<SoloSinSesion />}>
                      <Route path="iniciar-sesion" element={<LoginPage />} />
                      <Route path="registrarse" element={<RegisterPage />} />
                    </Route>
                  </Routes>
                </FavoritesProvider>
              </NotificationsProvider>
            </ToastProvider>
          </AuthProvider>
        </MotionProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
