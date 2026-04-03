import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import type { DecodedToken } from "../types/types";

const TOKEN_KEY   = "dtr_token";
const TOKEN_EVENT = "dtr_token_updated";

export const setToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
  window.dispatchEvent(new Event(TOKEN_EVENT));
};

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new Event(TOKEN_EVENT));
};

export const decodeToken = (token: string): DecodedToken => jwtDecode(token);

export const useUser = () => {
  const [user, setUser] = useState<DecodedToken | null>(() => {
    const token = getToken();
    if (!token) return null;
    try { return decodeToken(token); } catch { return null; }
  });

  useEffect(() => {
    const refresh = () => {
      const token = getToken();
      if (token) {
        try { setUser(decodeToken(token)); }
        catch { removeToken(); setUser(null); }
      } else {
        setUser(null);
      }
    };
    window.addEventListener(TOKEN_EVENT, refresh);
    return () => window.removeEventListener(TOKEN_EVENT, refresh);
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