import { clsx, type ClassValue } from "clsx"; // استيراد وظيفة clsx للتعامل مع الفئات (classes) الشرطية
import { twMerge } from "tailwind-merge"; // استيراد وظيفة twMerge لدمج فئات Tailwind CSS ومنع التعارضات

// دالة مساعدة لدمج فئات CSS بشكل ذكي (تجمع بين clsx و tailwind-merge)
export function cn(...inputs: ClassValue[]) { 
  return twMerge(clsx(inputs)); // دمج الفئات المدخلة بعد معالجتها بواسطة clsx
}
