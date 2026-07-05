import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInAnonymously, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBG8XLBfNfd0v9QQLtqClMgdkGqHoe13YE",
  authDomain: "adroit-crane-5fs6l.firebaseapp.com",
  projectId: "adroit-crane-5fs6l",
  storageBucket: "adroit-crane-5fs6l.firebasestorage.app",
  messagingSenderId: "533143162879",
  appId: "1:533143162879:web:28f440c40311b3980d61ca"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-eduvault-aaeace79-aff5-4779-9474-68d5571d26af");
export const googleProvider = new GoogleAuthProvider();

// Connection Validation as required by Skill
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase Connection verified successfully.");
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('offline')) {
      console.error("Please check your Firebase configuration or network status.", error);
    }
  }
}

testConnection();

export { signInAnonymously, signOut, onAuthStateChanged, signInWithPopup };
export type { FirebaseUser };
