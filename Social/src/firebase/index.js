import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut 
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

// Listen to auth state changes
const monitorAuthState = (callback) => {
  onAuthStateChanged(auth, (user) => {
    callback(user); // Pass the user to your app state management
  });
};

const SignWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (e) {
    console.error("Google Sign-In Error:", e);
    throw e;
  }
};

const createUser = async (email, pass) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    return userCredential.user;
  } catch (e) {
    throw e;
  }
};

const logout = () => {
  signOut(auth);
};

const Login = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("User logged in:", userCredential.user);
  } catch (error) {
    console.error("Error logging in:", error.message);
  }
};

export { logout, SignWithGoogle, createUser, monitorAuthState, Login };
