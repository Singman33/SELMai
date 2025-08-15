import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType } from '../types';
import { authAPI, userAPI } from '../services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      if (token && savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          // S'assurer que balance et rating sont des nombres
          parsedUser.balance = Number(parsedUser.balance) || 0;
          parsedUser.rating = Number(parsedUser.rating) || 0;
          
          setUser(parsedUser);
          // Vérifier la validité du token
          await authAPI.verify();
        } catch (error) {
          console.error('Token invalide:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await authAPI.login(username, password);
      
      // S'assurer que balance et rating sont des nombres
      const user = {
        ...response.user,
        balance: Number(response.user.balance) || 0,
        rating: Number(response.user.rating) || 0
      };
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erreur de connexion');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const refreshUser = async () => {
    try {
      console.log('🔄 Rafraîchissement du profil utilisateur...');
      const response = await userAPI.getProfile();
      console.log('📥 Données reçues du serveur:', response);
      
      const updatedUser = {
        ...response,
        balance: Number(response.balance) || 0,
        rating: Number(response.rating) || 0
      };
      
      console.log('✅ Utilisateur mis à jour:', updatedUser);
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du profil:', error);
    }
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    updateUser,
    refreshUser,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};