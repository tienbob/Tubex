import passport from 'passport';
import { Profile as GoogleProfile, Strategy as GoogleStrategy, VerifyCallback, GoogleCallbackParameters } from 'passport-google-oauth20';
import { Profile as FacebookProfile, Strategy as FacebookStrategy } from 'passport-facebook';
import { Request } from 'express';
import { AppDataSource } from '../database/ormconfig';
import { User, Company } from '../database/models/sql';
import { config } from './';

const userRepository = AppDataSource.getRepository(User);
const companyRepository = AppDataSource.getRepository(Company);

// Helper function to transform User entity to Express.User
const transformUser = (user: User & { company: Company }): Express.User => ({
  ...user,
  companyId: user.company.id
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
      let user = await userRepository.findOne({
        where: { email: profile.emails?.[0].value },
        relations: ['company']
      });

      if (!user) {
        const company = new Company();
        company.name = profile.displayName;
        company.type = 'dealer';
        company.subscription_tier = 'free';
        await companyRepository.save(company);

        user = new User();
        user.email = profile.emails?.[0].value || '';
        user.password_hash = ''; // OAuth users don't have passwords
        user.role = 'staff'; // Default to staff role for OAuth users
        user.company = company;
        user.status = 'active';
        user.created_at = new Date();
        user.updated_at = new Date();
        await userRepository.save(user);
      }

      return done(null, transformUser(user));
    } catch (error) {
      if (error instanceof Error) {
        return done(error);
      }
      return done(new Error('An unknown error occurred'));
    }
  }
));

// Facebook OAuth Strategy
passport.use(new FacebookStrategy({
    clientID: config.oauth.facebook.appId || '',
    clientSecret: config.oauth.facebook.appSecret || '',
    callbackURL: `${config.baseUrl}/api/v1/auth/facebook/callback`,
    profileFields: ['id', 'emails', 'displayName']
  },
  async function(
    accessToken: string,
    _refreshToken: string,
    profile: FacebookProfile,
    done: VerifyCallback
  ) {
    try {
      let user = await userRepository.findOne({
        where: { email: profile.emails?.[0].value },
        relations: ['company']
      });

      if (!user) {
        const company = new Company();
        company.name = profile.displayName;
        company.type = 'dealer';
        company.subscription_tier = 'free';
        await companyRepository.save(company);

        user = new User();
        user.email = profile.emails?.[0].value || '';
        user.password_hash = ''; // OAuth users don't have passwords
        user.role = 'staff'; // Default to staff role for OAuth users
        user.company = company;
        user.status = 'active';
        user.created_at = new Date();
        user.updated_at = new Date();
        await userRepository.save(user);
      }

      return done(null, transformUser(user));
    } catch (error) {
      if (error instanceof Error) {
        return done(error);
      }
      return done(new Error('An unknown error occurred'));
    }
  }
));