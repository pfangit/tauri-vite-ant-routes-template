import { useCallback, useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { routes } from "@/config/routes.tsx";
import Exception404 from "@/layout/exception-404.tsx";
import { useGlobalStore } from "@/store/global.tsx";
import { PageLoading } from "@ant-design/pro-components";
import { fetchCurrentUser } from "@/service/user.tsx";

function App() {
  const [loading, setLoading] = useState<boolean>(true);

  const { setCurrentUser } = useGlobalStore();

  const loadCurrentUser = useCallback(() => {
    // todo load data from server
    setTimeout(() => {
      fetchCurrentUser()
        .then((res) => {
          console.log(res);
          setCurrentUser(res);
        })
        .finally(() => {
          setLoading(false);
        });
    }, 1000);
  }, []);

  useEffect(() => {
    // 获取当前登录用户信息
    loadCurrentUser();
  }, []);

  if (loading) {
    return <PageLoading />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {routes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
        <Route path="*" element={<Exception404 />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
