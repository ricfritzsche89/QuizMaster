import { useState, useEffect } from "react";
import { db } from "../services/firebase";
import { 
  doc, 
  onSnapshot, 
  updateDoc, 
  setDoc, 
  collection, 
  getDoc 
} from "firebase/firestore";

export const useGameState = (sessionId) => {
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;

    const docRef = doc(db, "sessions", sessionId);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setGameState(docSnap.data());
      } else {
        setGameState(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [sessionId]);

  const updateGame = async (updates) => {
    const docRef = doc(db, "sessions", sessionId);
    await updateDoc(docRef, updates);
  };

  const createSession = async (id, initialData) => {
    const docRef = doc(db, "sessions", id);
    await setDoc(docRef, initialData);
  };

  return { gameState, updateGame, createSession, loading };
};
