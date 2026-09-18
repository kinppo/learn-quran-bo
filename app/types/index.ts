export type Locale = 'ar' | 'en';
export interface User {
  id: string;
  role: string;
  firstName: string;
  lastName: string;
  email: string;
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
