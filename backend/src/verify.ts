import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import lodash from 'lodash';

const jwtAccessTokenSecret = hashPassword('NuhahraethieShooy5hee7zeidu8ieK3');
const jwtRefreshTokenSecret = 'Iha`k$ah8tee$z_o!uf6ib0UiL3oot1rieD=o)Xoh;Qu7Ahg>i-yoo4ahshoo"pe';

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  return salt + ':' + crypto.pbkdf2Sync(password, salt, 1000, 64, `sha512`).toString(`hex`);
}

export function verifyPassword(hash: string, password: string) {
  const [salt, currentHash] = hash.split(':', 2);
  const challengeHash = crypto.pbkdf2Sync(password, salt, 1000, 64, `sha512`).toString(`hex`);
  return challengeHash === currentHash;
}

export function issueRefreshToken(data: string | Object, expirationSeconds: number = 86400) {
  return jwt.sign(data, jwtRefreshTokenSecret, { expiresIn: expirationSeconds });
}

export function verifyRefreshToken(token: string, data: string | Object = null) {
  const result = jwt.verify(token, jwtRefreshTokenSecret);
  if (data) {
    const compareResult = lodash.omit(result as object, ['iss', 'sub', 'aud', 'exp', 'nbf', 'iat', 'jti']);
    if (!lodash.isEqual(data, compareResult)) {
      throw Error('verifyRefreshToken data verification failed. does not match.');
    }
  }
  return lodash.omit(result as object, ['iss', 'sub', 'aud', 'exp', 'nbf', 'iat', 'jti']);
}

export function issueAccessToken(data: string | Object, expirationSeconds: number = 86400) {
  return jwt.sign(data, jwtAccessTokenSecret, { expiresIn: expirationSeconds });
}

export function verifyAccessToken(token: string, data: string | Object = null) {
  const result = jwt.verify(token, jwtAccessTokenSecret);
  if (data) {
    const compareResult = lodash.omit(result as object, ['iss', 'sub', 'aud', 'exp', 'nbf', 'iat', 'jti']);
    if (!lodash.isEqual(data, compareResult)) {
      throw Error('verifyRefreshToken data verification failed. does not match.');
    }
  }
  return lodash.omit(result as object, ['iss', 'sub', 'aud', 'exp', 'nbf', 'iat', 'jti']);
}