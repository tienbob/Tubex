import jwt from 'jsonwebtoken';
import { config } from '../../config';

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export const generateTokens = (userId: string, rememberMe: boolean = false): Tokens => {
  // Set access token expiry based on rememberMe option
  const accessTokenExpiry = rememberMe ? '30d' : '15m'; // 30 days if rememberMe, 15 minutes otherwise
  
  const accessToken = jwt.sign({ id: userId }, config.jwt.secret as jwt.Secret, {
    expiresIn: accessTokenExpiry
  });
  
  const refreshToken = jwt.sign({ id: userId }, config.jwt.secret as jwt.Secret, {
    expiresIn: '7d'
  });

  return { accessToken, refreshToken };
};