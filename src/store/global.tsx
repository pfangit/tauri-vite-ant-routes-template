import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type User = {
  name: string;
  userid: string;
  avatar: string;
  perms?: string[];
};

export type GlobalStore = {
  currentUser: User | undefined;
  setCurrentUser: (user: User) => void;
};

export const useGlobalStore = create<GlobalStore>()(
  persist<GlobalStore>(
    (set) => ({
      currentUser: undefined,
      setCurrentUser: (user: User) => set({ currentUser: user }),
    }),
    {
      name: "global-storage",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
