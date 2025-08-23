import axios from 'axios';
import { User, Service, Category, Negotiation, Transaction, Notification, Rating } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Fonction pour extraire le message d'erreur
const getErrorMessage = (error: any): { message: string; details?: string } => {
  if (error.response) {
    // Erreur du serveur avec réponse
    const data = error.response.data;
    if (typeof data === 'string') {
      return { message: data };
    }
    if (data && data.message) {
      return { 
        message: data.message,
        details: data.details || `Erreur ${error.response.status}: ${error.response.statusText}`
      };
    }
    if (data && data.error) {
      return { 
        message: data.error,
        details: `Erreur ${error.response.status}: ${error.response.statusText}`
      };
    }
    return { 
      message: `Erreur ${error.response.status}`,
      details: error.response.statusText || 'Erreur inconnue du serveur'
    };
  } else if (error.request) {
    // Erreur de réseau
    return { 
      message: 'Erreur de connexion',
      details: 'Impossible de joindre le serveur. Vérifiez votre connexion internet.'
    };
  } else {
    // Autre erreur
    return { 
      message: 'Erreur inattendue',
      details: error.message || 'Une erreur inattendue s\'est produite'
    };
  }
};

// Intercepteur pour gérer les erreurs d'authentification et améliorer les messages d'erreur
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    // Enrichir l'erreur avec des informations plus détaillées
    const errorInfo = getErrorMessage(error);
    error.userMessage = errorInfo.message;
    error.userDetails = errorInfo.details;
    
    return Promise.reject(error);
  }
);

// Authentification
export const authAPI = {
  login: async (username: string, password: string) => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },
  
  verify: async () => {
    const response = await api.get('/auth/verify');
    return response.data;
  },
  
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
};

// Utilisateurs
export const userAPI = {
  getProfile: async (): Promise<User> => {
    const response = await api.get('/users/profile');
    return response.data;
  },
  
  getCommunity: async (): Promise<User[]> => {
    const response = await api.get('/users/community');
    return response.data;
  },
  
  // Admin
  getAllUsers: async (): Promise<User[]> => {
    const response = await api.get('/users/admin/all');
    return response.data;
  },
  
  createUser: async (userData: Partial<User> & { password: string }) => {
    const response = await api.post('/users/admin/create', userData);
    return response.data;
  },
  
  updateUser: async (userId: number, userData: Partial<User>) => {
    const response = await api.put(`/users/admin/${userId}`, userData);
    return response.data;
  },
  
  adjustBalance: async (userId: number, amount: number, description?: string) => {
    const response = await api.post(`/users/admin/${userId}/adjust-balance`, {
      amount,
      description,
    });
    return response.data;
  },
  
  deleteUser: async (userId: number) => {
    const response = await api.delete(`/users/admin/${userId}`);
    return response.data;
  },
};

// Services
export const serviceAPI = {
  getAll: async (): Promise<Service[]> => {
    const response = await api.get('/services');
    return response.data;
  },
  
  getMyServices: async (): Promise<Service[]> => {
    const response = await api.get('/services/my-services');
    return response.data;
  },
  
  create: async (serviceData: Partial<Service>) => {
    const response = await api.post('/services', serviceData);
    return response.data;
  },
  
  update: async (serviceId: number, serviceData: Partial<Service>) => {
    const response = await api.put(`/services/${serviceId}`, serviceData);
    return response.data;
  },
  
  delete: async (serviceId: number) => {
    const response = await api.delete(`/services/${serviceId}`);
    return response.data;
  },
  
  // Admin
  getAllServices: async (): Promise<Service[]> => {
    const response = await api.get('/services/admin/all');
    return response.data;
  },
};

// Catégories
export const categoryAPI = {
  getAll: async (): Promise<Category[]> => {
    const response = await api.get('/categories');
    return response.data;
  },
};

// Négociations
export const negotiationAPI = {
  getAll: async (): Promise<Negotiation[]> => {
    const response = await api.get('/negotiations');
    return response.data;
  },
  
  create: async (negotiationData: {
    service_id: number;
    proposed_price?: number;
    message?: string;
  }) => {
    const response = await api.post('/negotiations', negotiationData);
    return response.data;
  },
  
  respond: async (
    negotiationId: number,
    status: 'accepted' | 'rejected',
    counterPrice?: number,
    message?: string
  ) => {
    const response = await api.put(`/negotiations/${negotiationId}/respond`, {
      status,
      counter_price: counterPrice,
      message,
    });
    return response.data;
  },
  
  // Admin
  getAllNegotiations: async (): Promise<Negotiation[]> => {
    const response = await api.get('/negotiations/admin/all');
    return response.data;
  },
  
  deleteNegotiation: async (negotiationId: number) => {
    const response = await api.delete(`/negotiations/admin/${negotiationId}`);
    return response.data;
  },
};

// Transactions
export const transactionAPI = {
  getAll: async (): Promise<Transaction[]> => {
    const response = await api.get('/transactions');
    return response.data;
  },
  
  getBalance: async (): Promise<{ balance: number }> => {
    const response = await api.get('/transactions/balance');
    return response.data;
  },
};

// Notifications
export const notificationAPI = {
  getAll: async (): Promise<Notification[]> => {
    const response = await api.get('/notifications');
    return response.data;
  },
  
  markAsRead: async (notificationId: number) => {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },
  
  markAllAsRead: async () => {
    const response = await api.put('/notifications/mark-all-read');
    return response.data;
  },
  
  getUnreadCount: async (): Promise<{ count: number }> => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },
  
  // Admin
  sendToUser: async (userId: number, title: string, message: string) => {
    const response = await api.post('/notifications/admin/send-to-user', {
      user_id: userId,
      title,
      message,
    });
    return response.data;
  },
  
  broadcast: async (title: string, message: string) => {
    const response = await api.post('/notifications/admin/broadcast', {
      title,
      message,
    });
    return response.data;
  },
};

// Évaluations
export const ratingAPI = {
  create: async (ratingData: {
    rated_id: number;
    service_id?: number;
    rating: number;
    comment?: string;
  }) => {
    const response = await api.post('/ratings', ratingData);
    return response.data;
  },
  
  getUserRatings: async (userId: number): Promise<Rating[]> => {
    const response = await api.get(`/ratings/user/${userId}`);
    return response.data;
  },
  
  getMyRatings: async (userId: number): Promise<Rating[]> => {
    const response = await api.get(`/ratings/by-user/${userId}`);
    return response.data;
  },
  
  getServiceRatings: async (serviceId: number): Promise<Rating[]> => {
    const response = await api.get(`/ratings/service/${serviceId}`);
    return response.data;
  },
  
  update: async (ratingId: number, ratingData: { rating: number; comment?: string }) => {
    const response = await api.put(`/ratings/${ratingId}`, ratingData);
    return response.data;
  },
  
  delete: async (ratingId: number) => {
    const response = await api.delete(`/ratings/${ratingId}`);
    return response.data;
  },
};

export default api;