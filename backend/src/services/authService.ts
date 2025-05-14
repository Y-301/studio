
// backend/src/services/authService.ts
import { StoredUser, readUsers, writeUsers } from '../models/user';
import { hashPassword, comparePassword, generateToken } from '../utils/authUtils';
import { log } from './logService';

export const signupUser = async (email: string, passwordParam: string, name?: string): Promise<{ user: Omit<StoredUser, 'passwordHash'>; token: string } | null> => {
  const users = await readUsers();
  if (users[email.toLowerCase()]) {
    log('warn', `Signup attempt for existing email: ${email}`, undefined, { component: 'AuthService' });
    return null; // User already exists
  }

  const passwordHash = await hashPassword(passwordParam);
  const userId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const newUser: StoredUser = {
    id: userId,
    email: email.toLowerCase(),
    passwordHash,
    name: name || '', // Ensure name is stored
    photoURL: null, // Initialize photoURL
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  users[email.toLowerCase()] = newUser;
  await writeUsers(users);

  const token = generateToken(newUser.id, newUser.email);
  if (!token) {
    log('error', `Token generation failed during signup for ${email}`, undefined, { component: 'AuthService' });
    // Potentially rollback user creation or handle error appropriately
    return null;
  }

  const { passwordHash: _, ...userToReturn } = newUser;
  log('info', `User signed up successfully: ${email}`, newUser.id, { component: 'AuthService' });
  return { user: userToReturn, token };
};

export const loginUser = async (email: string, passwordParam: string): Promise<{ user: Omit<StoredUser, 'passwordHash'>; token: string } | null> => {
  const users = await readUsers();
  const user = users[email.toLowerCase()];

  if (!user) {
    log('warn', `Login attempt for non-existent email: ${email}`, undefined, { component: 'AuthService' });
    return null; // User not found
  }

  const isMatch = await comparePassword(passwordParam, user.passwordHash);
  if (!isMatch) {
    log('warn', `Incorrect password attempt for email: ${email}`, user.id, { component: 'AuthService' });
    return null; // Incorrect password
  }

  const token = generateToken(user.id, user.email);
  if (!token) {
    log('error', `Token generation failed during login for ${email}`, user.id, { component: 'AuthService' });
    return null; // Token generation failed
  }

  const { passwordHash: _, ...userToReturn } = user;
  log('info', `User logged in successfully: ${email}`, user.id, { component: 'AuthService' });
  return { user: userToReturn, token };
};

export const findUserById = async (userId: string): Promise<Omit<StoredUser, 'passwordHash'> | null> => {
  const users = await readUsers();
  // Since users are stored by email key, we need to iterate to find by ID
  const foundUser = Object.values(users).find(u => u.id === userId);
  if (foundUser) {
    const { passwordHash: _, ...userToReturn } = foundUser;
    return userToReturn;
  }
  return null;
};

export const updateUserProfile = async (userId: string, updates: { name?: string; photoURL?: string }): Promise<Omit<StoredUser, 'passwordHash'> | null> => {
  const users = await readUsers();
  const userEmail = Object.keys(users).find(email => users[email].id === userId);

  if (!userEmail || !users[userEmail]) {
    log('warn', `Attempt to update profile for non-existent user ID: ${userId}`, undefined, { component: 'AuthService' });
    return null;
  }

  const updatedUser = {
    ...users[userEmail],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  users[userEmail] = updatedUser;
  await writeUsers(users);

  const { passwordHash: _, ...userToReturn } = updatedUser;
  log('info', `User profile updated for ID: ${userId}`, userId, { component: 'AuthService' });
  return userToReturn;
};

export const changeUserPassword = async (userId: string, currentPasswordParam: string, newPasswordParam: string): Promise<boolean> => {
  const users = await readUsers();
  const userEmail = Object.keys(users).find(email => users[email].id === userId);

  if (!userEmail || !users[userEmail]) {
    log('warn', `Password change attempt for non-existent user ID: ${userId}`, undefined, { component: 'AuthService' });
    return false;
  }

  const user = users[userEmail];
  const isMatch = await comparePassword(currentPasswordParam, user.passwordHash);
  if (!isMatch) {
    log('warn', `Incorrect current password for password change attempt by user ID: ${userId}`, userId, { component: 'AuthService' });
    return false;
  }

  const newPasswordHash = await hashPassword(newPasswordParam);
  users[userEmail].passwordHash = newPasswordHash;
  users[userEmail].updatedAt = new Date().toISOString();
  await writeUsers(users);

  log('info', `Password changed successfully for user ID: ${userId}`, userId, { component: 'AuthService' });
  return true;
};
