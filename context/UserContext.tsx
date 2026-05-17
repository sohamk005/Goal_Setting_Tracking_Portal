"use client";

import {
  createContext,
  useCallback,
  useContext,
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
  manager_id?: string;
}

const MOCK_USERS: Record<UserRole, User> = {
  employee: {
    id: "e1111111-1111-1111-1111-111111111111",
    name: "Soham Kulkarni",
    email: "soham.kulkarni@atomquest.com",
    role: "employee",
    manager_id: "m2222222-2222-2222-2222-222222222222",
  },
  manager: {
    id: "m2222222-2222-2222-2222-222222222222",
    name: "L1 Manager",
    email: "l1.manager@atomquest.com",
    role: "manager",
  },
  admin: {
    id: "a3333333-3333-3333-3333-333333333333",
    name: "HR Central Admin",
    email: "hr.admin@atomquest.com",
    role: "admin",
  },
};

interface UserContextValue {
  currentUser: User;
  switchUser: (role: UserRole) => void;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USERS.employee);

  const switchUser = useCallback((role: UserRole) => {
    setCurrentUser(MOCK_USERS[role]);
  }, []);

  const value = useMemo(
    () => ({ currentUser, switchUser }),
    [currentUser, switchUser],
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

export { MOCK_USERS };
