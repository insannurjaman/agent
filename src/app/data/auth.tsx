import { createContext, useContext, useState, useCallback } from 'react';
import { canonicalExperimentPath } from './routes';

export interface UserProfile {
  name: string;
  email: string;
  initials: string;
  role?: string;
}

const MOCK_USER: UserProfile = {
  name: 'Sarah Chen',
  email: 'sarah.chen@eftax.com',
  initials: 'SC',
  role: 'Research Lead',
};

interface AuthContextValue {
  user: UserProfile;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: MOCK_USER,
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user] = useState<UserProfile>(MOCK_USER);

  const logout = useCallback(() => {
    // Mock logout — in real app: clear tokens, redirect to the landing page.
    window.location.hash = `#${canonicalExperimentPath()}`;
  }, []);

  return (
    <AuthContext.Provider value={{ user, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
