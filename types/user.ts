export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar: string;
  phone: string;
  gender: string;
  dob: Date;
  location: {country: string; region: string; city: string, address: string }
  created_at: Date;
  updated_at: Date;
  last_logged_in: Date;
  role: 'user' | 'admin';
}