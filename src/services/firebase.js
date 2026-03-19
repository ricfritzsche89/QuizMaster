import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: User must provide their Firebase configuration here
const firebaseConfig = {
  apiKey: "AIzaSyAhNw4ItEmcUWnvd5U9neCPCzmP86qxZpI",
  authDomain: "studio-6734762811-c1c00.firebaseapp.com",
  projectId: "studio-6734762811-c1c00",
  storageBucket: "studio-6734762811-c1c00.firebasestorage.app",
  messagingSenderId: "267087308367",
  appId: "1:267087308367:web:4ef72e2e7281331c292c3a"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
