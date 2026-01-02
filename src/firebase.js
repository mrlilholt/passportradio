import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCTe45KEO7SGGe8pPM7kb4QMsXqDxAFqXs",
  authDomain: "passportradio-d236a.firebaseapp.com",
  projectId: "passportradio-d236a",
  storageBucket: "passportradio-d236a.firebasestorage.app",
  messagingSenderId: "421866309378",
  appId: "1:421866309378:web:0cbc9f3b2972c91419641b",
  measurementId: "G-0Z98BK7120"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);