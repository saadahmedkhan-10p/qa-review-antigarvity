"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { getCurrentUser, logoutAction } from "@/app/actions/user";
import { Role } from "@/types/roles";

interface User {
    id: string;
    name: string;
    email: string;
    roles: Role[];
}

interface AuthContextType {
    user: User | null;
    login: (email: string) => Promise<void>; // Kept for compatibility but not used
    logout: () => Promise<void>;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadUser() {
            try {
                const currentUser = await getCurrentUser();
                setUser(currentUser as User);
            } catch (error) {
                console.error("Failed to load user", error);
            } finally {
                setLoading(false);
            }
        }
        loadUser();
    }, []);

    const login = useCallback(async (email: string) => {
        // Reload the user from the session
        const currentUser = await getCurrentUser();
        setUser(currentUser as User);
    }, []);

    const logout = useCallback(async () => {
        setUser(null); // Clear state immediately to prevent stale data
        await logoutAction();
    }, []);

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
