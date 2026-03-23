import { initializeApp } from "firebase/app";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDalFqu2wmlMAfknV3oi7o9C6Xf_pZitfc",
  authDomain: "social-31c81.firebaseapp.com",
  projectId: "social-31c81",
  storageBucket: "social-31c81.firebasestorage.app",
  messagingSenderId: "805162523939",
  appId: "1:805162523939:web:8e879f42b33b3d32bb4096",
  measurementId: "G-JLJQZWHP11",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

const monitorAuthState = (callback) => onAuthStateChanged(auth, callback);

const SignWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
};

const createUser = async (email, password) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

const logout = () => signOut(auth);

const Login = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

const syncAuthProfile = async (profile) => {
  if (!auth.currentUser) {
    return;
  }

  await updateProfile(auth.currentUser, profile);
};

export { Login, SignWithGoogle, createUser, logout, monitorAuthState, syncAuthProfile };
