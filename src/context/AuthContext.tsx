'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Business, api } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  token: string | null;
  businesses: Business[];
  activeBusiness: Business | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  selectBusiness: (business: Business) => void;
  refreshBusinesses: (autoSelectId?: number) => Promise<Business[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeBusiness, setActiveBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const loadUserData = async () => {
      const storedToken = localStorage.getItem('forecast_auth_token');
      if (!storedToken) {
        if (isMounted) setLoading(false);
        return;
      }

      setToken(storedToken);

      try {
        const { user: me } = await api.auth.me();
        if (!isMounted) return;
        setUser(me);

        // Load businesses
        const { businesses: bList } = await api.business.list();
        if (!isMounted) return;
        setBusinesses(bList);

        const savedBusinessId = localStorage.getItem('active_business_id');
        let currentActive: Business | null = null;

        if (savedBusinessId) {
          currentActive = bList.find((b) => b.id === parseInt(savedBusinessId, 10)) || null;
        }

        if (!currentActive && bList.length > 0) {
          currentActive = bList[0];
        }

        if (currentActive) {
          setActiveBusiness(currentActive);
          localStorage.setItem('active_business_id', currentActive.id.toString());
        }
      } catch (err) {
        console.error('Failed to initialize user session:', err);
        localStorage.removeItem('forecast_auth_token');
        localStorage.removeItem('active_business_id');
        if (isMounted) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadUserData();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (newToken: string, newUser: User) => {
    localStorage.setItem('forecast_auth_token', newToken);
    localStorage.removeItem('active_business_id');
    setToken(newToken);
    setUser(newUser);
    setActiveBusiness(null);
    await refreshBusinesses();
  };

  const logout = () => {
    localStorage.removeItem('forecast_auth_token');
    localStorage.removeItem('active_business_id');
    setToken(null);
    setUser(null);
    setBusinesses([]);
    setActiveBusiness(null);
    router.push('/login');
  };

  const selectBusiness = (business: Business) => {
    setActiveBusiness(business);
    localStorage.setItem('active_business_id', business.id.toString());
  };

  const refreshBusinesses = async (autoSelectId?: number): Promise<Business[]> => {
    try {
      const { businesses: bList } = await api.business.list();
      setBusinesses(bList);

      if (autoSelectId) {
        const found = bList.find((b) => b.id === autoSelectId);
        if (found) {
          selectBusiness(found);
        }
      } else if (bList.length > 0 && (!activeBusiness || !bList.some((b) => b.id === activeBusiness.id))) {
        selectBusiness(bList[0]);
      }
      return bList;
    } catch (err) {
      console.error('Error refreshing businesses:', err);
      return [];
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        businesses,
        activeBusiness,
        loading,
        login,
        logout,
        selectBusiness,
        refreshBusinesses,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
