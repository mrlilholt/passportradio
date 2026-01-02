import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, googleProvider, db } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // 1. Listen for User Changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    // 2. Login Function (With Data Merge Logic)
    const login = async (localData) => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            
            // Check if user exists in DB
            const userRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(userRef);

            if (!docSnap.exists()) {
                // NEW USER: Upload local storage data to Cloud ☁️
                await setDoc(userRef, {
                    favorites: localData.favorites || [],
                    travelLogs: localData.travelLogs || {},
                    userHome: localData.userHome || null,
                    highScore: localData.highScore || 0,
                    email: user.email,
                    joinedAt: new Date()
                });
                console.log("Synced local data to new account.");
            } else {
                console.log("User exists, pulling cloud data...");
            }
        } catch (error) {
            console.error("Login failed", error);
        }
    };

    const logout = () => signOut(auth);

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};