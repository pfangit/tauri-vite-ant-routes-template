import { MockMethod } from "vite-plugin-mock";
import Mock from "mockjs";

export default [
  {
    url: "/api/current",
    method: "get",
    response: () => {
      return Mock.mock({
        "code|+1": 100,
        data: {
          "name@word": "abc",
        },
        "success|1": true,
      });
    },
  },
] as MockMethod[];
