
// backend/src/controllers/authController.ts
import type { Request, Response } from 'express';
import * as authService from '../services/authService';
import { log } from '../services/logService';

export const signup = async (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }
  if (password.length < 6) { // Basic validation
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
  }

  try {
    const result = await authService.signupUser(email, password, name);
    if (!result) {
      return res.status(409).json({ message: 'User already exists or signup failed.' }); // 409 Conflict
    }
    // User object in result already excludes passwordHash
    res.status(201).json({ message: 'User registered successfully', user: result.user, token: result.token });
  } catch (error) {
    log('error', `Signup error: ${(error as Error).message}`, undefined, { component: 'AuthController', stack: (error as Error).stack });
    res.status(500).json({ message: 'Failed to register user.' });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const result = await authService.loginUser(email, password);
    if (!result) {
      return res.status(401).json({ message: 'Invalid credentials.' }); // 401 Unauthorized
    }
    // User object in result already excludes passwordHash
    res.status(200).json({ message: 'Login successful', user: result.user, token: result.token });
  } catch (error) {
    log('error', `Login error: ${(error as Error).message}`, undefined, { component: 'AuthController', stack: (error as Error).stack });
    res.status(500).json({ message: 'Failed to login.' });
  }
};

// For verifying token and getting user details (e.g., for AppContext initialization)
export const getMe = async (req: Request, res: Response) => {
  // The userId is attached to req by authMiddleware if token is valid
  const userId = (req as any).user?.id; 
  if (!userId) {
    // This case should ideally not be reached if authMiddleware is working correctly
    return res.status(401).json({ message: 'Not authenticated (no user ID in request).' });
  }

  try {
    const user = await authService.findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.status(200).json({ user });
  } catch (error) {
    log('error', `Error fetching current user (getMe): ${(error as Error).message}`, userId, { component: 'AuthController', stack: (error as Error).stack });
    res.status(500).json({ message: 'Failed to fetch user details.' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { name, photoURL } = req.body;

  if (!userId) {
    return res.status(401).json({ message: 'Not authenticated.' });
  }

  const updates: { name?: string; photoURL?: string } = {};
  if (name !== undefined) updates.name = name;
  if (photoURL !== undefined) updates.photoURL = photoURL;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: 'No profile data provided to update.' });
  }

  try {
    const updatedUser = await authService.updateUserProfile(userId, updates);
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found or update failed.' });
    }
    res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    log('error', `Profile update error: ${(error as Error).message}`, userId, { component: 'AuthController', stack: (error as Error).stack });
    res.status(500).json({ message: 'Failed to update profile.' });
  }
};


export const changePassword = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { currentPassword, newPassword } = req.body;

  if (!userId) {
    return res.status(401).json({ message: 'Not authenticated.' });
  }
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current password and new password are required.' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
  }


  try {
    const success = await authService.changeUserPassword(userId, currentPassword, newPassword);
    if (!success) {
      return res.status(400).json({ message: 'Password change failed. Check current password or user existence.' });
    }
    res.status(200).json({ message: 'Password changed successfully.' });
  } catch (error) {
    log('error', `Password change error: ${(error as Error).message}`, userId, { component: 'AuthController', stack: (error as Error).stack });
    res.status(500).json({ message: 'Failed to change password.' });
  }
};

// Placeholder for requestPasswordReset if you implement email sending
export const requestPasswordReset = async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'Email is required.' });
    }
    // TODO: Implement password reset token generation and email sending logic
    log('info', `Password reset requested for ${email} (Not Implemented Yet)`, undefined, { component: 'AuthController'});
    res.status(200).json({ message: 'If an account with that email exists, a password reset link will be sent (Feature Not Implemented Yet).' });
};
