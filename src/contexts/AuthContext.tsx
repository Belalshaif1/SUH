import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '@/lib/apiClient';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  avatar_url: string | null;
  phone: string | null;
}

interface UserRole {
  id: string;
  role: 'super_admin' | 'university_admin' | 'college_admin' | 'department_admin' | 'user';
  university_id: string | null;
  college_id: string | null;
  department_id: string | null;
  permissions: Record<string, boolean>;
}

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  userRole: UserRole | null;
  loading: boolean;
  signIn: (identifier: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string | null, phone: string | null, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  hasPermission: (key: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const userData = await apiClient('/auth/me');
      setUser(userData);

      // Set profile and role from the same user data in SQLite implementation
      setProfile({
        id: userData.id,
        user_id: userData.id,
        full_name: userData.full_name,
        avatar_url: userData.avatar_url,
        phone: userData.phone
      });

      setUserRole({
        id: userData.id,
        role: userData.role,
        university_id: userData.university_id || null,
        college_id: userData.college_id || null,
        department_id: userData.department_id || null,
        permissions: userData.permissions || {}
      });

      return userData;
    } catch (error) {
      console.error("Error fetching current user:", error);
      localStorage.removeItem('token');
      setUser(null);
      setProfile(null);
      setUserRole(null);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (localStorage.getItem('token')) {
      await fetchCurrentUser();
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        await fetchCurrentUser();
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const signIn = async (identifier: string, password: string) => {
    try {
      const data = await apiClient('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
      });

      localStorage.setItem('token', data.token);
      setUser(data.user);

      setProfile({
        id: data.user.id,
        user_id: data.user.id,
        full_name: data.user.full_name,
        avatar_url: data.user.avatar_url,
        phone: data.user.phone
      });

      setUserRole({
        id: data.user.id,
        role: data.user.role,
        university_id: data.user.university_id || null,
        college_id: data.user.college_id || null,
        department_id: data.user.department_id || null,
        permissions: data.user.permissions || {}
      });

      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signUp = async (email: string | null, phone: string | null, password: string, fullName: string) => {
    try {
      await apiClient('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, phone, password, full_name: fullName }),
      });

      // Auto login after signup
      return await signIn(email || phone || "", password);
    } catch (error: any) {
      return { error };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('token');
    setUser(null);
    setProfile(null);
    setUserRole(null);
  };

  const hasPermission = (key: string) => {
    if (userRole?.role === 'super_admin') return true;
    return !!userRole?.permissions?.[key];
  };

  return (
    <AuthContext.Provider value={{ user, profile, userRole, loading, signIn, signUp, signOut, refreshProfile, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
