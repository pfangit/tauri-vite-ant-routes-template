import Mock from "mockjs";
import { MockMethod } from "vite-plugin-mock";

export default [
  {
    url: "/api/files",
    method: "get",
    response: () => {
      return Mock.mock({
        "code|+1": 100,
        "data|20": [
          {
            name: "@word",
            fid: "@integer",
            isDirectory: "@boolean",
            lastUpdateAt: "@datetime()",
            size: "@integer",
          },
        ],
        msg: "@word",
        "success|1": true,
      });
    },
  },
] as MockMethod[];
