import { Arg, createAlova, MethodType, RequestBody } from "alova";
import adapterFetch from "alova/fetch";
import { message } from "antd";

export interface ApiResponse<T> {
  data?: T;
  success: boolean;
  msg: string;
  code: number;
}

export interface RequestOptions {
  url: string;
  method: MethodType;
  headers?: Arg;
  data?: RequestBody;
  params?: Arg | string;
  timeout?: number;
  onComplete?: () => void;
  onError?: (message: string) => void;
}

function onError<T>(options: RequestOptions, json: ApiResponse<T>) {
  if (options.onError !== undefined) {
    options.onError(json.msg);
  } else {
    message.error(json.msg).then(() => {});
  }
}

export default function request<T = any>(options: RequestOptions) {
  const requestInstance = createAlova({
    baseURL: import.meta.env.VITE_BASE_API,
    // 请求超时时间，单位为毫秒，默认为0，表示永不超时
    timeout: 10000,
    requestAdapter: adapterFetch(),
    // 请求拦截器
    beforeRequest() {
      // 全局请求拦截，请求前进行参数、header等处理
    },
    // 响应拦截器
    // 使用 responded 对象分别指定请求成功的拦截器和请求失败的拦截器
    responded: {
      // 请求成功的拦截器
      // 当使用 `alova/fetch` 请求适配器时，第一个参数接收Response对象
      // 第二个参数为当前请求的method实例，你可以用它同步请求前后的配置信息
      onSuccess: async (response) => {
        if (response.status >= 400) {
          throw new Error(response.statusText);
        }
        const json: ApiResponse<T> = await response.json();

        if (response.status !== 200) {
          onError(options, json);
          return Promise.reject(response.statusText);
        }

        if (!json.success) {
          onError(options, json);
          return Promise.reject(json.msg);
        }
        // 解析的响应数据将传给method实例的transform钩子函数，这些函数将在后续讲解
        return json;
      },

      // 请求失败的拦截器
      // 请求错误时将会进入该拦截器。
      // 第二个参数为当前请求的method实例，你可以用它同步请求前后的配置信息
      onError: (err) => {
        message.error(err.message).then(() => {});
        return Promise.reject(err);
      },

      // 请求完成的拦截器
      // 当你需要在请求不论是成功、失败、还是命中缓存都需要执行的逻辑时，可以在创建alova实例时指定全局的`onComplete`拦截器，例如关闭请求 loading 状态。
      // 接收当前请求的method实例
      onComplete: async () => {
        // 处理请求完成逻辑
        if (options.onComplete) {
          options.onComplete();
        }
      },
    },
  });

  switch (options.method.toLowerCase()) {
    case "delete":
      return requestInstance.Delete<T>(options.url, options);
    case "post":
      return requestInstance.Post<T>(options.url, options.data, options);
    case "put":
      return requestInstance.Put<T>(options.url, options.data, options);
    case "get":
      return requestInstance.Get<T>(options.url, options);
    case "patch":
      return requestInstance.Patch<T>(options.url, options.data, options);
    case "head":
      return requestInstance.Head<T>(options.url, options);
    case "options":
      return requestInstance.Options<T>(options.url, options);
    default:
      return requestInstance.Request<T>(options);
  }
}
