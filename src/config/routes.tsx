import { lazy, LazyExoticComponent, ReactNode } from "react";

const Greeting = lazy(() => import("@/Greeting.tsx"));
const Login = lazy(() => import("@/pages/login.tsx"));
export const routes = [
  {
    path: "/",
    component: Greeting,
  },
  {
    path: "/info",
    component: Greeting,
    access: "login",
  },
  {
    path: "/login",
    component: Login,
  },
] as {
  path: string;
  login?: boolean;
  access?: string | string[];
  component: LazyExoticComponent<() => ReactNode>;
}[];
