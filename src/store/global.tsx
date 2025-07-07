import { create } from "zustand";

export type User = {
  name: string;
  userid: string;
  avatar: string;
};

export type GlobalStore = {
  currentUser: User | undefined;
  setCurrentUser: (user: User) => void;
};

export const useGlobalStore = create<GlobalStore>((set) => ({
  currentUser: undefined,
  setCurrentUser: (user: User) => set(() => ({ currentUser: user })),
}));
