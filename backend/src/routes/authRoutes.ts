
// backend/src/routes/authRoutes.ts
import express from 'express';
import * as authController from '../controllers/authController';
import { authenticateToken } from '../middleware/authMiddleware'; // Assuming you have this

const router = express.Router();

// POST /api/auth/signup - Register a new user
router.post('/signup', authController.signup);

// POST /api/auth/login - Login an existing user
router.post('/login', authController.login);

// GET /api/auth/me - Get current user details (protected)
router.get('/me', authenticateToken, authController.getMe);

// PUT /api/auth/profile - Update current user's profile (protected)
router.put('/profile', authenticateToken, authController.updateProfile);

// POST /api/auth/change-password - Change current user's password (protected)
router.post('/change-password', authenticateToken, authController.changePassword);

// POST /api/auth/request-password-reset - Request a password reset email
router.post('/request-password-reset', authController.requestPasswordReset);


// Example: Placeholder for a logout route (JWTs are often stateless on server, client deletes token)
router.post('/logout', (req, res) => {
  // For JWT, logout is typically handled client-side by deleting the token.
  // Server might blacklist token if using a more complex setup.
  res.status(200).json({ message: 'Logout successful (client should clear token).' });
});

export default router;
