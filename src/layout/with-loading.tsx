import { FC, PropsWithChildren, Suspense } from "react";
import { PageLoading } from "@ant-design/pro-components";

//  懒加载loading转场组件
const WithLoading: FC<PropsWithChildren> = ({ children }) => {
  return <Suspense fallback={<PageLoading />}>{children}</Suspense>;
};

export default WithLoading;
