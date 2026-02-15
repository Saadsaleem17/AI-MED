import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User';
import { createRequire } from 'module';
import { OAuth2Client } from 'google-auth-library';

const require = createRequire(import.meta.url);
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');

const router = express.Router();

// Lazy-init to ensure dotenv has loaded before we read the env var
let googleClient: OAuth2Client;
function getGoogleClient() {
  if (!googleClient) {
    googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }
  return googleClient;
}

// Register new user
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, dateOfBirth, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Create new user
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      dateOfBirth,
      phone,
      isVerified: false,
      verificationToken,
      verificationExpires
    });

    await user.save();

    // Send verification email
    const emailResult = await sendVerificationEmail(email, verificationToken, firstName);

    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error);
    }

    // Generate JWT token (but user still needs to verify email to login)
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isVerified: user.isVerified
        },
        emailSent: emailResult.success
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// Login user
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        error: 'Please verify your email before logging in. Check your inbox for the verification link.',
        needsVerification: true,
        email: user.email
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          dateOfBirth: user.dateOfBirth,
          bloodGroup: user.bloodGroup,
          height: user.height,
          weight: user.weight,
          gender: user.gender,
          allergies: user.allergies,
          chronicConditions: user.chronicConditions,
          emergencyContact: user.emergencyContact,
          isVerified: user.isVerified,
          profilePicture: user.profilePicture,
          authProvider: user.authProvider
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// Get current user profile
router.get('/me', async (req: Request, res: Response) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const userData = user.toObject();
    userData.id = userData._id;

    res.json({
      success: true,
      data: userData
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
});

// Verify email
router.get('/verify-email/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    // Find user with this token
    const user = await User.findOne({
      verificationToken: token,
      verificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired verification token'
      });
    }

    // Mark user as verified
    user.isVerified = true;
    user.emailVerifiedAt = new Date();
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully! You can now log in.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// Update user profile
router.put('/profile', async (req: Request, res: Response) => {
  try {
    const userId = req.body.userId;
    const updates = req.body;

    // Remove sensitive fields that shouldn't be updated via this endpoint
    delete updates.password;
    delete updates.email;
    delete updates.isVerified;
    delete updates.verificationToken;
    delete updates.userId;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        bloodGroup: user.bloodGroup,
        height: user.height,
        weight: user.weight,
        gender: user.gender,
        allergies: user.allergies,
        chronicConditions: user.chronicConditions,
        emergencyContact: user.emergencyContact
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// Resend verification email
router.post('/resend-verification', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        error: 'Email is already verified'
      });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.verificationToken = verificationToken;
    user.verificationExpires = verificationExpires;
    await user.save();

    // Send verification email
    const emailResult = await sendVerificationEmail(email, verificationToken, user.firstName);

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to send verification email'
      });
    }

    res.json({
      success: true,
      message: 'Verification email sent! Please check your inbox.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// Forgot Password - send reset email
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists - always return success
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    if (user.authProvider === 'google' && !user.password) {
      return res.status(400).json({
        success: false,
        error: 'This account uses Google sign-in. Please sign in with Google instead.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetExpires;
    await user.save();

    // Send password reset email
    const emailResult = await sendPasswordResetEmail(email, resetToken, user.firstName);

    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error);
      return res.status(500).json({
        success: false,
        error: 'Failed to send password reset email. Please try again.'
      });
    }

    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: 'Something went wrong. Please try again.'
    });
  }
});

// Reset Password - verify token and set new password
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        error: 'Token and new password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters'
      });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token. Please request a new password reset.'
      });
    }

    // Set new password (will be hashed by the pre-save hook)
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now sign in with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: 'Something went wrong. Please try again.'
    });
  }
});

// Google Authentication
router.post('/google', async (req: Request, res: Response) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        error: 'Google credential is required'
      });
    }

    // Verify the Google ID token
    const ticket = await getGoogleClient().verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Google token'
      });
    }

    const { sub: googleId, email, given_name, family_name, picture, email_verified } = payload;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email not provided by Google'
      });
    }

    // Check if a user with this Google ID already exists
    let user = await User.findOne({ googleId });

    if (!user) {
      // Check if a user with this email exists (registered via email/password)
      user = await User.findOne({ email });

      if (user) {
        // Link Google account to existing user
        user.googleId = googleId;
        user.authProvider = user.authProvider === 'local' ? 'local' : 'google';
        if (picture && !user.profilePicture) {
          user.profilePicture = picture;
        }
        if (!user.isVerified) {
          user.isVerified = true;
          user.emailVerifiedAt = new Date();
        }
        await user.save();
      } else {
        // Create a new user with Google info
        user = new User({
          email,
          googleId,
          firstName: given_name || 'User',
          lastName: family_name || given_name || 'User',
          authProvider: 'google',
          profilePicture: picture,
          isVerified: true,
          emailVerifiedAt: new Date()
        });
        await user.save();
      }
    } else {
      // Update profile picture if changed
      if (picture && user.profilePicture !== picture) {
        user.profilePicture = picture;
        await user.save();
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isVerified: user.isVerified,
          profilePicture: user.profilePicture,
          authProvider: user.authProvider
        }
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({
      success: false,
      error: 'Google authentication failed. Please try again.'
    });
  }
});

export default router;