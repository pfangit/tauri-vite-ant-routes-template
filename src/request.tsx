import { createAlova, RequestElements } from "alova";
import adapterFetch from "alova/fetch";
import { message } from "antd";

export interface ApiResponse<T> {
  data?: T;
  success: boolean;
  msg: string;
  code: number;
}

function request<T = any>(options: RequestElements) {
  const instance = createAlova({
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

        if (json.code !== 200) {
          // 抛出错误或返回reject状态的Promise实例时，此请求将抛出错误
          throw new Error(json.msg);
        }

        // 解析的响应数据将传给method实例的transform钩子函数，这些函数将在后续讲解
        return json.data;
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
      },
    },
  });

  switch (options.type.toLowerCase()) {
    case "delete":
      return instance.Delete(options.url, options);
    case "post":
      return instance.Post(options.url, options.data, options);
    case "put":
      return instance.Put(options.url, options.data, options);
    case "get":
      return instance.Get(options.url, options);
    case "patch":
      return instance.Patch(options.url, options.data, options);
    case "head":
      return instance.Head(options.url, options);
    case "options":
      return instance.Options(options.url, options);
    default:
      return instance.Request(options);
  }
}

export default request;
