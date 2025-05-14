// src/lib/mockAuthStore.ts

// This interface is specifically for the users stored in the mock store,
// including the mock password for local auth checking.
export interface MockStoredUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  password?: string; // For mock login check, NOT to be sent to frontend as is.
  createdAt?: string;
  updatedAt?: string;
}

export let mockUserStore: { [uid: string]: MockStoredUser } = {};
