import jwt from 'jsonwebtoken';
import { config } from '../../config';

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export const generateTokens = (userId: string): Tokens => {
  const accessToken = jwt.sign({ id: userId }, config.jwt.secret as jwt.Secret, {
    expiresIn: '15m'
  });
  
  const refreshToken = jwt.sign({ id: userId }, config.jwt.secret as jwt.Secret, {
    expiresIn: '7d'
  });

  return { accessToken, refreshToken };
};