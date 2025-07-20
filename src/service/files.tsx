import request, { ApiPageResponse } from "@/request";
import { File } from "@/service/types";

export const fetchFiles = async ({ pid }: { pid: string }) => {
  return request<ApiPageResponse<File>>({
    url: "/api/files",
    method: "get",
    params: { pid },
    skipErrorNotification: true,
  });
};
