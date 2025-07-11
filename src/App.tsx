import { useCallback, useEffect, useState } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import { routes } from "@/config/routes.tsx";
import Exception404 from "@/layout/exception-404.tsx";
import { useGlobalStore } from "@/store/global.tsx";
import { PageLoading } from "@ant-design/pro-components";
import { fetchCurrentUser } from "@/service/user.tsx";

function App() {
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  const { setCurrentUser } = useGlobalStore();

  const loadCurrentUser = useCallback(() => {
    // todo load data from server
    setTimeout(() => {
      fetchCurrentUser()
        .then((res) => {
          setCurrentUser(res.data!);
        })
        .catch((reason) => {
          console.log(reason);
          navigate("/login", { replace: false });
        })
        .finally(() => {
          setLoading(false);
        });
    }, 1000);
  }, []);

  useEffect(() => {
    console.log("render loading", loading);

    // 获取当前登录用户信息
    if (loading) {
      loadCurrentUser();
    }
  }, [loading]);

  if (loading) {
    return <PageLoading />;
  }

  return (
    <Routes>
      {routes.map((route) => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}
      <Route path="*" element={<Exception404 />} />
    </Routes>
  );
}

export default App;
