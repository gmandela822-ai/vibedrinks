import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, Address } from '@shared/schema';

type UserRole = 'customer' | 'admin' | 'kitchen' | 'motoboy' | 'pdv';

interface AuthContextType {
  user: User | null;
  address: Address | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  login: (user: User, role: UserRole) => void;
  logout: () => void;
  setAddress: (address: Address) => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getStoredValue<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved) as T;
    }
  } catch {
    // ignore parse errors
  }
  return null;
}

function getStoredString(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(key);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [address, setAddressState] = useState<Address | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const storedUser = getStoredValue<User>('vibe-drinks-user');
    const storedAddress = getStoredValue<Address>('vibe-drinks-address');
    const storedRole = getStoredString('vibe-drinks-role') as UserRole | null;
    
    if (storedUser) setUser(storedUser);
    if (storedAddress) setAddressState(storedAddress);
    if (storedRole) setRole(storedRole);
    
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    
    if (user) {
      localStorage.setItem('vibe-drinks-user', JSON.stringify(user));
    } else {
      localStorage.removeItem('vibe-drinks-user');
    }
  }, [user, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    
    if (address) {
      localStorage.setItem('vibe-drinks-address', JSON.stringify(address));
    } else {
      localStorage.removeItem('vibe-drinks-address');
    }
  }, [address, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    
    if (role) {
      localStorage.setItem('vibe-drinks-role', role);
    } else {
      localStorage.removeItem('vibe-drinks-role');
    }
  }, [role, isHydrated]);

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

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        address,
        role,
        isAuthenticated: !!user,
        isHydrated,
        login,
        logout,
        setAddress,
        updateUser,
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
