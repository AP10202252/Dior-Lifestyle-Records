// Auth logic for Dior Lifestyle - uses Firebase v9 modular SDK
import firebaseConfig from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, fetchSignInMethodsForEmail } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';
import { getFirestore, collection, addDoc, getDocs } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Admin credentials (auto-create if doesn't exist)
const ADMIN_EMAIL = 'admin@diorll.com';
const ADMIN_PASSWORD = 'DiorLL@030912';

// Convenience: create admin user if doesn't exist (safe only because password provided by owner)
async function ensureAdminAccount() {
  try {
    const methods = await fetchSignInMethodsForEmail(auth, ADMIN_EMAIL);
    if (methods.length === 0) {
      // create admin account
      await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
      console.log('Admin account created.');
    } else {
      console.log('Admin account exists.');
    }
  } catch (e) {
    console.warn('Could not ensure admin account:', e);
  }
}

// Call ensureAdminAccount on load (non-blocking)
ensureAdminAccount();

// Signup function - used by signup.html
export async function signup(email, password) {
  const userCred = await createUserWithEmailAndPassword(auth, email, password);
  // Save minimal user record in Firestore for admin listing
  try {
    await addDoc(collection(db, 'users'), { uid: userCred.user.uid, email: email, createdAt: new Date().toISOString() });
  } catch (e) {
    console.warn('Could not save user to Firestore:', e);
  }
  return userCred;
}

// Login function - used by login.html
export async function login(email, password) {
  const userCred = await signInWithEmailAndPassword(auth, email, password);
  return userCred;
}

// Logout
export async function logout() {
  await signOut(auth);
}

// Auth state listener - accepts callbacks
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

// Utility to check if current user is admin
export function isAdminUser(user) {
  if (!user || !user.email) return false;
  return user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

// Get users from Firestore (for admin dashboard)
export async function fetchRegisteredUsers() {
  const q = await getDocs(collection(db, 'users'));
  const items = [];
  q.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
  return items;
}
