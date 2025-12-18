import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, Address } from '@shared/schema';

type UserRole = 'customer' | 'admin' | 'kitchen' | 'motoboy' | 'pdv';

interface AuthContextType {
  user: User | null;
  address: Address | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  login: (user: User, role: UserRole) => void;
  logout: () => void;
  setAddress: (address: Address) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vibe-drinks-user');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return null;
        }
      }
    }
    return null;
  });

  const [address, setAddressState] = useState<Address | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vibe-drinks-address');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return null;
        }
      }
    }
    return null;
  });

  const [role, setRole] = useState<UserRole | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vibe-drinks-role');
      return saved as UserRole | null;
    }
    return null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('vibe-drinks-user', JSON.stringify(user));
    } else {
      localStorage.removeItem('vibe-drinks-user');
    }
  }, [user]);

  useEffect(() => {
    if (address) {
      localStorage.setItem('vibe-drinks-address', JSON.stringify(address));
    } else {
      localStorage.removeItem('vibe-drinks-address');
    }
  }, [address]);

  useEffect(() => {
    if (role) {
      localStorage.setItem('vibe-drinks-role', role);
    } else {
      localStorage.removeItem('vibe-drinks-role');
    }
  }, [role]);

  const login = (userData: User, userRole: UserRole) => {
    setUser(userData);
    setRole(userRole);
  };

  const logout = () => {
    setUser(null);
    setAddressState(null);
    setRole(null);
  };

  const setAddress = (addr: Address) => {
    setAddressState(addr);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        address,
        role,
        isAuthenticated: !!user,
        login,
        logout,
        setAddress,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
