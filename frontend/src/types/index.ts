export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  balance: number;
  rating: number;
  isAdmin: boolean;
  isActive?: boolean;
  createdAt?: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface Service {
  id: number;
  userId: number;
  title: string;
  description: string;
  categoryId: number;
  categoryName?: string;
  price: number;
  duration?: string;
  isActive: boolean;
  username?: string;
  firstName?: string;
  lastName?: string;
  userRating?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Negotiation {
  id: number;
  serviceId: number;
  serviceTitle: string;
  servicePrice: number;
  buyerId: number;
  sellerId: number;
  proposedPrice?: number;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  buyerUsername: string;
  buyerFirstName: string;
  buyerLastName: string;
  sellerUsername: string;
  sellerFirstName: string;
  sellerLastName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: number;
  fromUserId?: number;
  toUserId: number;
  amount: number;
  description?: string;
  transactionType: 'payment' | 'admin_adjustment' | 'refund';
  serviceId?: number;
  serviceTitle?: string;
  fromUsername?: string;
  fromFirstName?: string;
  fromLastName?: string;
  toUsername: string;
  toFirstName: string;
  toLastName: string;
  balanceAfter?: number;
  createdAt: string;
}

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  isRead: boolean;
  notificationType: 'negotiation' | 'transaction' | 'admin' | 'system';
  relatedId?: number;
  createdAt: string;
}

export interface Rating {
  id: number;
  raterId: number;
  ratedId: number;
  serviceId?: number;
  rating: number; // 1 à 5
  comment?: string;
  createdAt: string;
  // Informations du rater pour l'affichage
  raterUsername?: string;
  raterFirstName?: string;
  raterLastName?: string;
  // Informations du service pour l'affichage
  serviceTitle?: string;
}

// Types pour l'affichage (avec propriétés optionnelles pour gérer les données incomplètes)
export interface UserDisplay {
  id: number;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  balance?: number;
  rating?: number;
  isAdmin?: boolean;
  isActive?: boolean;
  createdAt?: string;
}

export interface ServiceDisplay {
  id: number;
  userId?: number;
  title?: string;
  description?: string;
  categoryId?: number;
  categoryName?: string;
  price?: number;
  duration?: string;
  isActive?: boolean;
  username?: string;
  firstName?: string;
  lastName?: string;
  userRating?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}