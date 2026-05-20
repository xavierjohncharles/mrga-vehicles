import {
  type User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { ADMIN_EMAIL, auth, googleAuthProvider } from '../firebase';

export class AdminAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AdminAuthError';
  }
}

export const isAdminUser = (user: User | null): boolean =>
  Boolean(user && user.email === ADMIN_EMAIL && user.emailVerified);

export const subscribeToAdminAuth = (
  listener: (user: User | null, isAdmin: boolean) => void
) =>
  onAuthStateChanged(auth, (user) => {
    listener(user, isAdminUser(user));
  });

export const signInAsAdmin = async (): Promise<User> => {
  const result = await signInWithPopup(auth, googleAuthProvider);

  if (!isAdminUser(result.user)) {
    await signOut(auth);
    throw new AdminAuthError(
      `Access denied. Only ${ADMIN_EMAIL} is permitted.`
    );
  }

  return result.user;
};

export const signOutAdmin = () => signOut(auth);
