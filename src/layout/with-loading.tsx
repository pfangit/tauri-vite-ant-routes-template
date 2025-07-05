//  懒加载组件
import React, { Suspense } from "react";
import { PageLoading } from "@ant-design/pro-components";

const WithLoading = (children: React.ReactNode) => {
  return <Suspense fallback={<PageLoading />}>{children}</Suspense>;
};

export default WithLoading;
