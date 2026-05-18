"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type UserRole = "employee" | "manager" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  manager_id?: string | null;
}

export const MOCK_USERS: User[] = [
  {
    id: "33333333-3333-3333-3333-333333333333",
    name: "Soham (Employee)",
    email: "employee@atomquest.com",
    role: "employee",
    manager_id: "22222222-2222-2222-2222-222222222222",
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Sarah (Manager)",
    email: "manager@atomquest.com",
    role: "manager",
  },
  {
    id: "11111111-1111-1111-1111-111111111111",
    name: "HR (Admin)",
    email: "admin@atomquest.com",
    role: "admin",
  },
];

interface UserContextValue {
  currentUser: User | null;
  loading: boolean;
  switchUser: (role: UserRole) => void;
  signOut: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load from localStorage or default to employee
  useEffect(() => {
    const savedRole = localStorage.getItem("atomquest_role") as UserRole | null;
    const initialUser =
      MOCK_USERS.find((u) => u.role === savedRole) || MOCK_USERS[0];
    setCurrentUser(initialUser);
    setLoading(false);
  }, []);

  const switchUser = useCallback((role: UserRole) => {
    const user = MOCK_USERS.find((u) => u.role === role);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem("atomquest_role", role);
    }
  }, []);

  const signOut = useCallback(async () => {
    setCurrentUser(null);
    localStorage.removeItem("atomquest_role");
  }, []);

  const value = useMemo(
    () => ({ currentUser, loading, switchUser, signOut }),
    [currentUser, loading, switchUser, signOut],
  );

  return (
    <UserContext.Provider value={value}>{children}</UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
