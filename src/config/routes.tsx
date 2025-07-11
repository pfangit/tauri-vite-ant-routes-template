import Greeting from "@/Greeting.tsx";
import Login from "@/pages/login.tsx";

export const routes = [
  {
    path: "/",
    element: <Greeting />,
  },
  {
    path: "/login",
    element: <Login />,
  },
];
