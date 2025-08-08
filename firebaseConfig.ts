import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyC3Ka9HU-_-4kjJAbj_HOiZyhbsaV-JRLM",
  authDomain: "pest-disease-app-d43c7.firebaseapp.com",
  projectId: "pest-disease-app-d43c7",
  storageBucket: "pest-disease-app-d43c7.firebasestorage.app",
  messagingSenderId: "310389960938",
  appId: "1:310389960938:web:40f4f9ac2b71f07dd76793",
  measurementId: "G-NS7BX427FB"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app, 'us-central1');

if (process.env.NODE_ENV === 'development') {
  connectFunctionsEmulator(functions, 'localhost', 5001);
}

export { auth, db, functions };