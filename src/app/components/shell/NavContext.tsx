import { createContext, useContext } from 'react';

export type DrawerTab = 'chats' | 'navigation';

interface NavContextValue {
  openNav: (tab?: DrawerTab) => void;
  closeNav: () => void;
}

export const NavContext = createContext<NavContextValue>({
  openNav: () => {},
  closeNav: () => {},
});

export function useNavContext() {
  return useContext(NavContext);
}
