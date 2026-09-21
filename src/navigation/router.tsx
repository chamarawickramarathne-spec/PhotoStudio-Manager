import type { ReactNode } from "react";
import {
  Link as RRLink,
  Navigate,
  Outlet,
  RouteObject,
  createBrowserRouter,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";

import { AppSidebar } from "@/components/layout/AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import type { IconName } from "@/lib/icons";
import { palette } from "@/theme";

import LoginScreen from "@/app/login";
import RegisterScreen from "@/app/register";
import ForgotScreen from "@/app/forgot";
import DashboardTab from "@/app/(tabs)/index";
import BookingsTab from "@/app/(tabs)/bookings";
import ClientsTab from "@/app/(tabs)/clients";
import PaymentsTab from "@/app/(tabs)/payments";
import BookingNew from "@/app/booking/new";
import BookingDetail from "@/app/booking/[id]";
import ClientNew from "@/app/client/new";
import ClientDetail from "@/app/client/[id]";
import PaymentNew from "@/app/payment/new";
import PaymentDetail from "@/app/payment/[id]";
import ProfileScreen from "@/app/profile";

function Protected({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function GuestOnly({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  if (session) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const TABS: { route: string; label: string; icon: IconName; activeIcon: IconName }[] = [
  { route: "/", label: "Dashboard", icon: "home-outline", activeIcon: "home" },
  { route: "/bookings", label: "Bookings", icon: "calendar-outline", activeIcon: "calendar" },
  { route: "/clients", label: "Clients", icon: "people-outline", activeIcon: "people" },
  { route: "/payments", label: "Payments", icon: "wallet-outline", activeIcon: "wallet" },
];

function BottomTabBar({ current }: { current: string }) {
  return (
    <View style={styles.tabBar}>
      {TABS.map((tab) => {
        const active = current === tab.route;
        return (
          <Pressable
            key={tab.route}
            style={styles.tabItem}
            onPress={() => appRouter.navigate(tab.route)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            <Ionicons name={active ? tab.activeIcon : tab.icon} size={20} color={active ? palette.primary : palette.onSurfaceVariant} />
            <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function TabsLayout() {
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === "web" && width >= 900;
  const pathname = usePathname();

  return (
    <View style={styles.tabsRoot}>
      {isWide ? <AppSidebar /> : null}
      <View style={styles.tabsContent}>
        <Outlet />
        {!isWide ? <BottomTabBar current={pathname} /> : null}
      </View>
    </View>
  );
}

const routes: RouteObject[] = [
  { path: "/login", element: <GuestOnly><LoginScreen /></GuestOnly> },
  { path: "/register", element: <GuestOnly><RegisterScreen /></GuestOnly> },
  { path: "/forgot", element: <GuestOnly><ForgotScreen /></GuestOnly> },
  {
    element: <Protected><TabsLayout /></Protected>,
    children: [
      { index: true, element: <DashboardTab /> },
      { path: "bookings", element: <BookingsTab /> },
      { path: "clients", element: <ClientsTab /> },
      { path: "payments", element: <PaymentsTab /> },
    ],
  },
  { path: "/booking/new", element: <Protected><BookingNew /></Protected> },
  { path: "/booking/:id", element: <Protected><BookingDetail /></Protected> },
  { path: "/client/new", element: <Protected><ClientNew /></Protected> },
  { path: "/client/:id", element: <Protected><ClientDetail /></Protected> },
  { path: "/payment/new", element: <Protected><PaymentNew /></Protected> },
  { path: "/payment/:id", element: <Protected><PaymentDetail /></Protected> },
  { path: "/profile", element: <Protected><ProfileScreen /></Protected> },
  { path: "*", element: <Navigate to="/" replace /> },
];

export const appRouter = createBrowserRouter(routes);

export const router = {
  push: (href: string) => appRouter.navigate(href),
  replace: (href: string) => appRouter.navigate(href, { replace: true }),
  back: () => appRouter.navigate(-1),
};

export function useRouter() {
  const navigate = useNavigate();
  return {
    push: (href: string) => navigate(href),
    replace: (href: string) => navigate(href, { replace: true }),
    back: () => navigate(-1),
  };
}

export function usePathname(): string {
  return useLocation().pathname;
}

export function useLocalSearchParams<T extends Record<string, unknown> = Record<string, unknown>>(): T {
  const [searchParams] = useSearchParams();
  const out: Record<string, unknown> = {};
  for (const [key, value] of searchParams.entries()) out[key] = value;
  return out as T;
}

export function Link({ href, style, children }: { href: string; style?: unknown; children?: ReactNode }) {
  return (
    <RRLink to={href} style={style as React.CSSProperties}>
      {children}
    </RRLink>
  );
}

const styles = StyleSheet.create({
  tabsRoot: { flex: 1, flexDirection: "row", backgroundColor: palette.background },
  tabsContent: { flex: 1 },
  tabBar: {
    flexDirection: "row",
    backgroundColor: palette.surface,
    borderTopColor: palette.outlineVariant,
    borderTopWidth: 1,
    paddingBottom: 4,
    paddingTop: 4,
  },
  tabItem: { flex: 1, alignItems: "center", justifyContent: "center", gap: 2, paddingVertical: 4 },
  tabLabel: { fontSize: 10, fontWeight: "600", color: palette.onSurfaceVariant },
  tabLabelActive: { color: palette.primary, fontWeight: "700" },
});