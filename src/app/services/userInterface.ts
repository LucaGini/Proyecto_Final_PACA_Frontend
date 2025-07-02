export interface User {
  _id: string;
  id?: string;
  email: string;
  privilege: string;
  firstName: string;
  lastName: string;
  phone: string;
  street: string;
  streetNumber: string;
  city: string;
  password?: string;
}