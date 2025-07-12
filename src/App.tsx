import { routes } from "@/config/routes.tsx";
import Exception404 from "@/layout/exception-404.tsx";
import WithAccess from "@/layout/with-access.tsx";
import WithLoading from "@/layout/with-loading.tsx";
import { Route, Routes } from "react-router-dom";

function App() {
  return (
    <WithLoading>
      <Routes>
        {routes.map((route) => {
          if (route.access) {
            return (
              <Route
                key={route.path}
                path={route.path}
                Component={() => (
                  <WithAccess access={route.access!}>
                    <route.component />
                  </WithAccess>
                )}
              />
            );
          }

          return (
            <Route
              key={route.path}
              path={route.path}
              Component={route.component}
            />
          );
        })}
        <Route path="*" element={<Exception404 />} />
      </Routes>
    </WithLoading>
  );
}

export default App;
