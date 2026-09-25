export type Locale = 'ar' | 'en';
export interface User {
  id: string;
  role: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phoneNumber?: string | null;
  avatarId?: string | null;
  locale: Locale;
}
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
}
export type RecordData = Record<string, any>;
export interface Option {
  value: string;
  label: string;
}
