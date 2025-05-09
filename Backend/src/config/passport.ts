import passport from 'passport';
import { Profile as GoogleProfile, Strategy as GoogleStrategy, VerifyCallback, GoogleCallbackParameters } from 'passport-google-oauth20';
import { Profile as FacebookProfile, Strategy as FacebookStrategy } from 'passport-facebook';
import { Request } from 'express';
import { AppDataSource } from '../database/ormconfig';
import { User, Company } from '../database/models/sql';
import { config } from './';
import { redisClient } from '../database';

// Define the User type expected by Passport
declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      role: string;
      companyId: string; // Make this required to match other declarations
      needsRegistration?: boolean;
      provider?: string;
    }
  }
}

const userRepository = AppDataSource.getRepository(User);
const companyRepository = AppDataSource.getRepository(Company);

// Store temporary OAuth profile data for account completion
const storeOAuthProfileData = async (userId: string, profile: any, provider: 'google' | 'facebook') => {
  const profileData = {
    provider,
    id: profile.id,
    displayName: profile.displayName,
    emails: profile.emails,
    photos: profile.photos,
    name: profile._json?.name || profile.name,
    firstName: profile.name?.givenName || profile._json?.first_name,
    lastName: profile.name?.familyName || profile._json?.last_name,
  };
  
  await redisClient.set(`oauth_profile:${userId}`, JSON.stringify(profileData), {
    EX: 30 * 60 // 30 minutes
  });
};

// Helper function to transform User entity to Express.User
const transformUserToPassport = (user: User): Express.User => ({
  id: user.id,
  email: user.email,
  role: user.role || 'user', // Ensure role is never undefined
  companyId: user.company?.id || '', // Ensure companyId is never undefined
});

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: config.oauth.google.clientId || '',
    clientSecret: config.oauth.google.clientSecret || '',
    callbackURL: `${config.baseUrl}/api/v1/auth/google/callback`,
    passReqToCallback: true
  },
  async function(
    req: Request,
    accessToken: string,
    _refreshToken: string,
    params: GoogleCallbackParameters,
    profile: GoogleProfile,
    done: VerifyCallback
  ) {
    try {
      const email = profile.emails?.[0].value;
      
      if (!email) {
        return done(new Error('Email not provided by Google. Email is required for authentication.'));
      }

      // Check if we have an existing user with this email
      let user = await userRepository.findOne({
        where: { email },
        relations: ['company']
      });

      // If user exists
      if (user) {
        // Link this OAuth provider to user if not already linked
        if (!user.metadata?.oauthProvider) {
          user.metadata = {
            ...user.metadata,
            oauthProvider: 'google',
            googleId: profile.id,
            profilePictureUrl: profile.photos?.[0]?.value,
            firstName: user.metadata?.firstName || profile.name?.givenName || '',
            lastName: user.metadata?.lastName || profile.name?.familyName || '',
            lastLogin: new Date().toISOString()
          };
          await userRepository.save(user);
        }
        
        // If user exists but account is not active
        if (user.status !== 'active') {
          if (user.status === 'pending') {
            // Auto-activate OAuth users that were pending email verification
            user.status = 'active';
            await userRepository.save(user);
          } else {
            // For suspended or other non-active states, don't allow login
            return done(null, false, { message: `Your account is ${user.status}. Please contact support.` });
          }
        }
        
        return done(null, transformUserToPassport(user));
      }

      // New user - create account
      // Store profile data in Redis temporarily and redirect to complete registration
      const tempUserId = require('crypto').randomUUID();
      await storeOAuthProfileData(tempUserId, profile, 'google');
      
      // Return temporary user data for registration completion
      const tempUser: Express.User = {
        id: tempUserId,
        email,
        role: 'pending',
        companyId: '', // Add empty string as temporary value
        needsRegistration: true,
        provider: 'google'
      };
      
      return done(null, tempUser);
    } catch (error) {
      console.error('Google OAuth error:', error);
      if (error instanceof Error) {
        return done(error);
      }
      return done(new Error('An error occurred during Google authentication'));
    }
  }
));

// Facebook OAuth Strategy
passport.use(new FacebookStrategy({
    clientID: config.oauth.facebook.appId || '',
    clientSecret: config.oauth.facebook.appSecret || '',
    callbackURL: `${config.baseUrl}/api/v1/auth/facebook/callback`,
    profileFields: ['id', 'emails', 'displayName', 'name', 'photos']
  },
  async function(
    accessToken: string,
    _refreshToken: string,
    profile: FacebookProfile,
    done: VerifyCallback
  ) {
    try {
      const email = profile.emails?.[0].value;
      
      if (!email) {
        return done(new Error('Email not provided by Facebook. Email is required for authentication.'));
      }

      // Check if we have an existing user with this email
      let user = await userRepository.findOne({
        where: { email },
        relations: ['company']
      });

      // If user exists
      if (user) {
        // Link this OAuth provider to user if not already linked
        if (!user.metadata?.oauthProvider) {
          user.metadata = {
            ...user.metadata,
            oauthProvider: 'facebook',
            facebookId: profile.id,
            profilePictureUrl: profile.photos?.[0]?.value,
            firstName: user.metadata?.firstName || profile._json?.first_name || '',
            lastName: user.metadata?.lastName || profile._json?.last_name || '',
            lastLogin: new Date().toISOString()
          };
          await userRepository.save(user);
        }
        
        // If user exists but account is not active
        if (user.status !== 'active') {
          if (user.status === 'pending') {
            // Auto-activate OAuth users that were pending email verification
            user.status = 'active';
            await userRepository.save(user);
          } else {
            // For suspended or other non-active states, don't allow login
            return done(null, false, { message: `Your account is ${user.status}. Please contact support.` });
          }
        }
        
        return done(null, transformUserToPassport(user));
      }

      // New user - create account
      // Store profile data in Redis temporarily and redirect to complete registration
      const tempUserId = require('crypto').randomUUID();
      await storeOAuthProfileData(tempUserId, profile, 'facebook');
      
      // Return temporary user data for registration completion
      const tempUser: Express.User = {
        id: tempUserId,
        email,
        role: 'pending',
        companyId: '', // Add empty string as temporary value
        needsRegistration: true,
        provider: 'facebook'
      };
      
      return done(null, tempUser);
    } catch (error) {
      console.error('Facebook OAuth error:', error);
      if (error instanceof Error) {
        return done(error);
      }
      return done(new Error('An error occurred during Facebook authentication'));
    }
  }
));