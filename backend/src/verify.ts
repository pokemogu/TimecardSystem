import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import lodash from 'lodash';

const jwtTokenSecret = hashPassword('NuhahraethieShooy5hee7zeidu8ieK3');
let jwtTokenPrivateKey = '';
let jwtTokenPublicKey = '';

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  return salt + ':' + crypto.pbkdf2Sync(password, salt, 1000, 64, `sha512`).toString(`hex`);
}

export function verifyPassword(hash: string, password: string) {
  const [salt, currentHash] = hash.split(':', 2);
  const challengeHash = crypto.pbkdf2Sync(password, salt, 1000, 64, `sha512`).toString(`hex`);
  return challengeHash === currentHash;
}

/*
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
*/

export function generateKeyPair() {
  return crypto.generateKeyPairSync('ec', {
    namedCurve: 'P-256',
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem', }
  });
}

export function setJsonWebTokenKey(privateKey: string, publicKey: string) {
  jwtTokenPrivateKey = privateKey;
  jwtTokenPublicKey = publicKey;
}

export function issueJsonWebToken(data: string | Object, expirationSeconds: number = 86400) {
  return jwt.sign(
    data,
    (jwtTokenPrivateKey !== '' && jwtTokenPublicKey !== '') ? jwtTokenPrivateKey : jwtTokenSecret,
    { algorithm: 'ES256', expiresIn: expirationSeconds }
  );
}

export function verifyJsonWebToken(token: string, data: string | Object = null) {
  const result = jwt.verify(token, (jwtTokenPrivateKey !== '' && jwtTokenPublicKey !== '') ? jwtTokenPublicKey : jwtTokenSecret);
  if (data) {
    const compareResult = lodash.omit(result as object, ['iss', 'sub', 'aud', 'exp', 'nbf', 'iat', 'jti']);
    if (!lodash.isEqual(data, compareResult)) {
      throw Error('verifyRefreshToken data verification failed. does not match.');
    }
  }
  return lodash.omit(result as object, ['iss', 'sub', 'aud', 'exp', 'nbf', 'iat', 'jti']);
}