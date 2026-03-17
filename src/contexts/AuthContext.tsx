import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '@/lib/apiClient';

// 1. تعريف بنية بيانات المستخدم (User Interface)
interface User {
  id: string;      // المعرف الفريد للمستخدم
  email: string;   // البريد الإلكتروني
  full_name: string | null; // الاسم الكامل
  role: string;    // الدور الإداري (super_admin, user, etc.)
  avatar_url: string | null; // رابط الصورة الشخصية
  phone: string | null;      // رقم الهاتف
}

// 2. تعريف بنية دور المستخدم وصلاحياته (UserRole Interface)
interface UserRole {
  id: string;
  role: 'super_admin' | 'university_admin' | 'college_admin' | 'department_admin' | 'user';
  university_id: string | null; // معرف الجامعة المرتبط بها (إن وُجد)
  college_id: string | null;    // معرف الكلية المرتبط بها
  department_id: string | null; // معرف القسم المرتبط به
  permissions: Record<string, boolean>; // خريطة الصلاحيات (مفتاح: قيمة بولينية)
}

// 3. تعريف بنية الملف الشخصي (Profile Interface)
interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
}

// 4. تعريف محتويات سياق المصادقة (Auth Context Type)
interface AuthContextType {
  user: User | null;           // بيانات المستخدم الحالي
  profile: Profile | null;     // ملف المستخدم الشخصي
  userRole: UserRole | null;   // دور وصلاحيات المستخدم
  loading: boolean;            // حالة التحميل (عند بدء التطبيق)
  signIn: (identifier: string, password: string) => Promise<{ error: any }>; // دالة تسجيل الدخول
  signUp: (email: string | null, phone: string | null, password: string, fullName: string) => Promise<{ error: any }>; // دالة إنشاء حساب
  signOut: () => Promise<void>; // دالة تسجيل الخروج
  refreshProfile: () => Promise<void>; // دالة تحديث بيانات الملف الشخصي
  hasPermission: (key: string) => boolean; // دالة للتحقق من امتلاك صلاحية معينة
}

// إنشاء السياق بقيمة افتراضية غير معرفة
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 5. مكون موفر المصادقة (AuthProvider) المحيط بالتطبيق
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  // دالة لجلب بيانات المستخدم الحالي من الخادم باستخدام التوكن المخزن
  const fetchCurrentUser = async () => {
    try {
      const userData = await apiClient('/auth/me'); // طلب بيانات "أنا" من السيرفر
      setUser(userData);

      // في هذا النظام، يتم استخراج البروفايل والدور من نفس بيانات المستخدم
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
      localStorage.removeItem('token'); // في حال فشل الجلب، يتم حذف التوكن غير الصالح
      setUser(null);
      setProfile(null);
      setUserRole(null);
      return null;
    }
  };

  // دالة لتحديث البيانات يدوياً عند الحاجة
  const refreshProfile = async () => {
    if (localStorage.getItem('token')) {
      await fetchCurrentUser();
    }
  };

  // تشغيل عملية التحقق من الهوية عند تحميل التطبيق لأول مرة
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        await fetchCurrentUser();
      }
      setLoading(false); // انتهاء حالة التحميل الأولية
    };

    initAuth();
  }, []);

  // دالة تسجيل الدخول (SignIn)
  const signIn = async (identifier: string, password: string) => {
    try {
      const data = await apiClient('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
      });

      // تخزين التوكن وتحديث حالة المستخدم في الحافظة (State)
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
      return { error }; // إرجاع الخطأ ليتم عرضه في واجهة المستخدم
    }
  };

  // دالة إنشاء حساب جديد (SignUp)
  const signUp = async (email: string | null, phone: string | null, password: string, fullName: string) => {
    try {
      await apiClient('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, phone, password, full_name: fullName }),
      });

      // تسجيل الدخول تلقائياً بعد نجاح إنشاء الحساب
      return await signIn(email || phone || "", password);
    } catch (error: any) {
      return { error };
    }
  };

  // دالة تسجيل الخروج (SignOut)
  const signOut = async () => {
    localStorage.removeItem('token'); // مسح التوكن من الذاكرة المحلية
    setUser(null);                   // تصفير بيانات المستخدم
    setProfile(null);
    setUserRole(null);
  };

  // دالة فحص الصلاحيات (HasPermission)
  const hasPermission = (key: string) => {
    // المدير العام يملك صلاحية الوصول لكل شيء دائماً
    if (userRole?.role === 'super_admin') return true;
    // التحقق مما إذا كانت الصلاحية المطلوبة موجودة في مصفوفة صلاحيات المستخدم
    return !!userRole?.permissions?.[key];
  };

  return (
    // توفير كافة البيانات والدوال المذكورة لكل مكونات التطبيق
    <AuthContext.Provider value={{ user, profile, userRole, loading, signIn, signUp, signOut, refreshProfile, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

// خطاف (Hook) مخصص لسهولة الوصول إلى بيانات المصادقة في المكونات
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
