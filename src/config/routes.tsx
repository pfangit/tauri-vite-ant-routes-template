import { lazy, LazyExoticComponent, ReactNode } from "react";

const Greeting = lazy(() => import("@/Greeting.tsx"));
const Login = lazy(() => import("@/pages/login.tsx"));
const Directories = lazy(() => import("@/pages/directories.tsx"));

export const routes = [
  {
    path: "/",
    component: Directories,
  },
  {
    path: "/info",
    component: Greeting,
    access: "login",
  },
  {
    path: "/dir",
    component: Directories,
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
