import { MockMethod } from "vite-plugin-mock";
export default [
  {
    url: "/api/current",
    method: "get",
    response: ({}) => {
      return {
        "code|+1": 100,
        data: {
          "name@word": "abc",
        },
        "success|1": true,
      };
    },
  },
] as MockMethod[];
