import { fetchCurrentUser } from "@/service/user.tsx";
import { useGlobalStore } from "@/store/global.tsx";
import { PageLoading } from "@ant-design/pro-components";
import { FC, PropsWithChildren, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const WithAccess: FC<PropsWithChildren & { access: string | string[] }> = ({
  children,
  access,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const { currentUser, setCurrentUser } = useGlobalStore();
  console.log("need access : ", access);
  console.log("current user : ", currentUser);

  const loadCurrentUser = () => {
    setLoading(false);
    // 未登录，跳转登录页面
    if (currentUser === undefined) {
      fetchCurrentUser()
        .then((res) => {
          setCurrentUser(res.data!);
        })
        .catch((reason) => {
          console.log(reason);
          navigate("/login", {
            replace: false,
            state: { redirect: pathname },
          });
        })
        .finally(() => {});
    } else {
      if (currentUser.perms) {
        // 已登录，判断用户的权限
        let strAccess = access;
        if (Array.isArray(access)) {
          strAccess = (access as string[]).join("-") as string;
        }

        if (!currentUser.perms.includes(strAccess as string)) {
          navigate("/403", { replace: true });
        }
      } else {
        navigate("/403", { replace: true });
      }
    }
  };

  useEffect(() => {
    // 获取当前登录用户信息
    loadCurrentUser();
  }, []);

  if (loading) {
    return <PageLoading />;
  }

  return children;
};

export default WithAccess;
