const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: Date;
  bloodGroup?: string;
  height?: number;
  weight?: number;
  gender?: string;
  allergies?: string[];
  chronicConditions?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  phone?: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    token: string;
    user: User;
  };
  error?: string;
  needsVerification?: boolean;
}

class AuthService {
  private token: string | null = null;
  private user: User | null = null;
  private rememberMe: boolean = false;

  constructor() {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    console.log('AuthService: Initializing...');
    
    // Check BOTH storages - localStorage first (persistent), then sessionStorage
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
    const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    
    console.log('AuthService: Token found?', !!token);
    console.log('AuthService: User data found?', !!userData);
    
    if (token && userData) {
      this.token = token;
      try {
        this.user = JSON.parse(userData);
        // Determine if rememberMe based on where token was found
        this.rememberMe = !!localStorage.getItem('token');
        console.log('AuthService: User loaded:', this.user?.email);
        console.log('AuthService: Remember Me:', this.rememberMe);
      } catch (error) {
        console.error('Error parsing user data:', error);
        this.logout();
      }
    } else {
      console.log('AuthService: No stored credentials found');
    }
  }

  // Removed automatic token validation on startup to prevent logout issues
  // Token will be validated when actually making API calls

  async login(loginData: LoginData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const result = await response.json();

      if (result.success && result.data) {
        this.token = result.data.token;
        this.user = result.data.user;
        this.rememberMe = loginData.rememberMe || false;
        
        console.log('Login successful. Remember Me:', this.rememberMe);
        
        // Store remember me preference
        localStorage.setItem('rememberMe', this.rememberMe.toString());
        
        // Store auth data in appropriate storage
        if (this.rememberMe) {
          console.log('Storing in localStorage (persistent)');
          // Persistent storage
          localStorage.setItem('token', this.token);
          localStorage.setItem('user', JSON.stringify(this.user));
          localStorage.setItem('userId', this.user.id);
          
          // Clear session storage
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
          sessionStorage.removeItem('userId');
        } else {
          console.log('Storing in sessionStorage (session only)');
          // Session storage only
          sessionStorage.setItem('token', this.token);
          sessionStorage.setItem('user', JSON.stringify(this.user));
          sessionStorage.setItem('userId', this.user.id);
          
          // Clear persistent storage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('userId');
        }
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: 'Network error. Please try again.',
      };
    }
  }

  async googleLogin(credential: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credential }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        this.token = result.data.token;
        this.user = result.data.user;
        this.rememberMe = true; // Google users stay logged in

        // Store in localStorage (persistent) for Google auth
        localStorage.setItem('token', this.token!);
        localStorage.setItem('user', JSON.stringify(this.user));
        localStorage.setItem('userId', this.user!.id);
        localStorage.setItem('rememberMe', 'true');

        // Clear session storage
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('userId');
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: 'Google authentication failed. Please try again.',
      };
    }
  }

  async register(registerData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
      });

      const result = await response.json();

      if (result.success && result.data) {
        // DON'T store token or user - they need to verify email first
        console.log('Registration successful. User must verify email before logging in.');
        console.log('Email sent:', result.data.emailSent);
        
        // Don't set token or user in memory
        // Don't store anything in localStorage
        // User must verify email and then login
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: 'Network error. Please try again.',
      };
    }
  }

  async getCurrentUser(): Promise<User | null> {
    if (!this.token) return null;

    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        this.user = result.data;
        
        // Update user data in appropriate storage
        if (this.rememberMe) {
          localStorage.setItem('user', JSON.stringify(this.user));
        } else {
          sessionStorage.setItem('user', JSON.stringify(this.user));
        }
        
        return this.user;
      } else {
        this.logout();
        return null;
      }
    } catch (error) {
      this.logout();
      return null;
    }
  }

  logout(): void {
    this.token = null;
    this.user = null;
    this.rememberMe = false;
    
    // Clear all auth data from both storages
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    localStorage.removeItem('rememberMe');
    
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('userId');
  }

  getRememberMe(): boolean {
    return this.rememberMe;
  }

  // Check if user is authenticated and token is still valid
  async checkAuthStatus(): Promise<boolean> {
    if (!this.isAuthenticated()) {
      return false;
    }

    try {
      const user = await this.getCurrentUser();
      return !!user;
    } catch (error) {
      return false;
    }
  }

  getToken(): string | null {
    return this.token;
  }

  getUser(): User | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return !!this.token && !!this.user;
  }

  updateUser(updatedUser: User): void {
    this.user = updatedUser;

    const userData = JSON.stringify(this.user);
    if (this.rememberMe) {
      localStorage.setItem('user', userData);
    } else {
      sessionStorage.setItem('user', userData);
    }
  }

  async forgotPassword(email: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  async resetPassword(token: string, password: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  }
}

export const authService = new AuthService();