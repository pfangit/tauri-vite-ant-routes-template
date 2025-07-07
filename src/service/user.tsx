import request, { ApiResponse } from "@/request";
import { User } from "@/store/global.tsx";

export const fetchCurrentUser = async () => {
  return request<ApiResponse<User>>({
    url: "/api/current",
    method: "get",
  });
};
