import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import type { DecodedToken } from "../types/types";

const TOKEN_KEY = "dtr_token";

export const setToken  = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const getToken  = ()              => localStorage.getItem(TOKEN_KEY);
export const removeToken = ()            => localStorage.removeItem(TOKEN_KEY);

export const decodeToken = (token: string): DecodedToken => jwtDecode(token);

export const useUser = () => {
  const [user, setUser] = useState<DecodedToken | null>(null);
  useEffect(() => {
    const token = getToken();
    if (token) {
      try { setUser(decodeToken(token)); }
      catch { removeToken(); }
    }
  }, []);
  return user;
};

export const signOut = (navigate: (path: string) => void) => {
  removeToken();
  navigate("/login");
};

export const isAuthenticated = (): boolean => {
  const token = getToken();
  if (!token) return false;
  try {
    const decoded = decodeToken(token);
    return decoded.exp * 1000 > Date.now();
  } catch { return false; }
};

export const isAdmin = (): boolean => {
  const token = getToken();
  if (!token) return false;
  try {
    return decodeToken(token).role === "ADMIN";
  } catch { return false; }
};