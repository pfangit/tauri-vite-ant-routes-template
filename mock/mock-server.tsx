import { createProdMockServer } from "vite-plugin-mock/client";

const modules: {
  [key: string]: { default: object[] };
} = import.meta.glob("./*.ts", { eager: true });

const mockModules: object[] = [];
Object.keys(modules).forEach((key) => {
  if (key.includes("/_")) {
    return;
  }
  mockModules.push(...modules[key].default);
});

export async function setupMockServer() {
  await createProdMockServer(mockModules);
}
