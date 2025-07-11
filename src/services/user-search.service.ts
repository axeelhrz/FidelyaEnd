import {
  collection,
  query,
  where,
  getDocs,
  limit,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/constants';
import { handleError } from '@/lib/error-handler';

export interface RegisteredUser {
  id: string;
  uid: string;
  nombre: string;
  email: string;
  telefono?: string;
  dni?: string;
  role: string;
  estado: string;
  creadoEn: Date;
  ultimoAcceso?: Date;
  avatar?: string;
  metadata?: Record<string, unknown>;
}

export interface UserSearchFilters {
  search?: string;
  role?: string;
  estado?: string;
  excludeAsociacionId?: string;
}

export interface UserSearchResult {
  users: RegisteredUser[];
  total: number;
  hasMore: boolean;
}

class UserSearchService {
  private readonly usersCollection = COLLECTIONS.USERS;
  private readonly sociosCollection = COLLECTIONS.SOCIOS;

  /**
   * Search for registered users that can be added as socios
   */
  async searchRegisteredUsers(
    filters: UserSearchFilters = {},
    pageSize = 10
  ): Promise<UserSearchResult> {
    try {
      // First, get existing socios for the association to exclude them
      const existingSociosEmails = await this.getExistingSociosEmails(filters.excludeAsociacionId);

      // Build query for users
      const q = query(
        collection(db, this.usersCollection),
        where('estado', '==', 'activo'),
        orderBy('nombre', 'asc'),
        limit(pageSize + 1) // Get one extra to check if there are more
      );

      // Execute query
      const snapshot = await getDocs(q);
      const docs = snapshot.docs;
      const hasMore = docs.length > pageSize;

      if (hasMore) {
        docs.pop(); // Remove the extra document
      }

      let users = docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          uid: data.uid || doc.id,
          nombre: data.nombre || '',
          email: data.email || '',
          telefono: data.telefono,
          dni: data.dni,
          role: data.role || '',
          estado: data.estado || 'activo',
          creadoEn: data.creadoEn?.toDate() || new Date(),
          ultimoAcceso: data.ultimoAcceso?.toDate(),
          avatar: data.avatar,
          metadata: data.metadata,
        } as RegisteredUser;
      });

      // Filter out existing socios
      users = users.filter(user => !existingSociosEmails.includes(user.email.toLowerCase()));

      // Apply client-side filters
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        users = users.filter(user =>
          user.nombre.toLowerCase().includes(searchTerm) ||
          user.email.toLowerCase().includes(searchTerm) ||
          (user.dni && user.dni.toLowerCase().includes(searchTerm)) ||
          (user.telefono && user.telefono.includes(searchTerm))
        );
      }

      if (filters.role && filters.role !== 'all') {
        users = users.filter(user => user.role === filters.role);
      }

      return {
        users,
        total: users.length,
        hasMore: hasMore && users.length === pageSize
      };
    } catch (error) {
      handleError(error, 'Search Registered Users');
      return {
        users: [],
        total: 0,
        hasMore: false
      };
    }
  }

  /**
   * Get user by ID for detailed information
   */
  async getUserById(userId: string): Promise<RegisteredUser | null> {
    try {
      const userQuery = query(
        collection(db, this.usersCollection),
        where('uid', '==', userId),
        limit(1)
      );

      const snapshot = await getDocs(userQuery);
      
      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      const data = doc.data();

      return {
        id: doc.id,
        uid: data.uid || doc.id,
        nombre: data.nombre || '',
        email: data.email || '',
        telefono: data.telefono,
        dni: data.dni,
        role: data.role || '',
        estado: data.estado || 'activo',
        creadoEn: data.creadoEn?.toDate() || new Date(),
        ultimoAcceso: data.ultimoAcceso?.toDate(),
        avatar: data.avatar,
        metadata: data.metadata,
      } as RegisteredUser;
    } catch (error) {
      handleError(error, 'Get User By ID');
      return null;
    }
  }

  /**
   * Check if user can be added as socio
   */
  async canAddAsSocio(userId: string, asociacionId: string): Promise<{
    canAdd: boolean;
    reason?: string;
  }> {
    try {
      // Check if user exists
      const user = await this.getUserById(userId);
      if (!user) {
        return { canAdd: false, reason: 'Usuario no encontrado' };
      }

      // Check if user is active
      if (user.estado !== 'activo') {
        return { canAdd: false, reason: 'El usuario no está activo' };
      }

      // Check if user is already a socio in this association
      const existingSocioQuery = query(
        collection(db, this.sociosCollection),
        where('email', '==', user.email.toLowerCase()),
        where('asociacionId', '==', asociacionId),
        limit(1)
      );

      const existingSocioSnapshot = await getDocs(existingSocioQuery);
      if (!existingSocioSnapshot.empty) {
        return { canAdd: false, reason: 'El usuario ya es socio de esta asociación' };
      }

      return { canAdd: true };
    } catch (error) {
      handleError(error, 'Can Add As Socio');
      return { canAdd: false, reason: 'Error al verificar el usuario' };
    }
  }

  /**
   * Get emails of existing socios for an association
   */
  private async getExistingSociosEmails(asociacionId?: string): Promise<string[]> {
    if (!asociacionId) return [];

    try {
      const sociosQuery = query(
        collection(db, this.sociosCollection),
        where('asociacionId', '==', asociacionId)
      );

      const snapshot = await getDocs(sociosQuery);
      return snapshot.docs.map(doc => doc.data().email?.toLowerCase() || '').filter(Boolean);
    } catch (error) {
      console.error('Error getting existing socios emails:', error);
      return [];
    }
  }

  /**
   * Search users by email specifically
   */
  async searchByEmail(email: string, excludeAsociacionId?: string): Promise<RegisteredUser[]> {
    try {
      const userQuery = query(
        collection(db, this.usersCollection),
        where('email', '==', email.toLowerCase()),
        where('estado', '==', 'activo'),
        limit(5)
      );

      const snapshot = await getDocs(userQuery);
      
      if (snapshot.empty) {
        return [];
      }

      const users = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          uid: data.uid || doc.id,
          nombre: data.nombre || '',
          email: data.email || '',
          telefono: data.telefono,
          dni: data.dni,
          role: data.role || '',
          estado: data.estado || 'activo',
          creadoEn: data.creadoEn?.toDate() || new Date(),
          ultimoAcceso: data.ultimoAcceso?.toDate(),
          avatar: data.avatar,
          metadata: data.metadata,
        } as RegisteredUser;
      });

      // Filter out existing socios if association ID is provided
      if (excludeAsociacionId) {
        const existingSociosEmails = await this.getExistingSociosEmails(excludeAsociacionId);
        return users.filter(user => !existingSociosEmails.includes(user.email.toLowerCase()));
      }

      return users;
    } catch (error) {
      handleError(error, 'Search By Email');
      return [];
    }
  }
}

// Export singleton instance
export const userSearchService = new UserSearchService();
export default userSearchService;
