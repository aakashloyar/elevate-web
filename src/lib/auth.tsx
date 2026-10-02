"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { serviceUrls } from "@/lib/api/config";

type OTPRequest = { user_id: string; verification_required: boolean };
type AuthContextValue = { token: string | null; ready: boolean; requestOtp: (identifier: string) => Promise<OTPRequest>; register: (username: string, email: string) => Promise<OTPRequest>; verifyOtp: (userId: string, otp: string) => Promise<void>; logout: () => void };
const storageKey = "elevate_access_token";
const AuthContext = createContext<AuthContextValue | null>(null);
export function getAuthenticatedUserId(token?: string | null): string {
  const accessToken = token ?? (typeof window !== "undefined" ? window.localStorage.getItem(storageKey) : null);
  if (!accessToken) return "";

  try {
    const encodedPayload = accessToken.split(".")[1];
    if (!encodedPayload) return "";
    const normalizedPayload = encodedPayload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = normalizedPayload.padEnd(normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4), "=");
    const payload = JSON.parse(atob(paddedPayload)) as { sub?: unknown };
    return typeof payload.sub === "string" ? payload.sub : "";
  } catch {
    return "";
  }
}
async function post<T>(path: string, body: unknown): Promise<T> { const response = await fetch(`${serviceUrls.auth}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); if (!response.ok) throw new Error((await response.text()) || "Request failed"); return response.json() as Promise<T>; }
export function AuthProvider({ children }: { children: React.ReactNode }) { const [token,setToken]=useState<string|null>(null); const [ready,setReady]=useState(false); useEffect(()=>{const timer=window.setTimeout(()=>{setToken(window.localStorage.getItem(storageKey));setReady(true)},0);return()=>window.clearTimeout(timer)},[]); const value=useMemo<AuthContextValue>(()=>({token,ready,requestOtp:(identifier)=>post<OTPRequest>("/auth/login",{identifier}),register:(username,email)=>post<OTPRequest>("/auth/register",{username,email}),verifyOtp:async(userId,otp)=>{const result=await post<{access_token:string}>("/auth/verify-otp",{user_id:userId,otp});window.localStorage.setItem(storageKey,result.access_token);setToken(result.access_token)},logout:()=>{window.localStorage.removeItem(storageKey);setToken(null)}}),[ready,token]); return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>; }
export function useAuth(){const value=useContext(AuthContext);if(!value)throw new Error("useAuth must be used inside AuthProvider");return value}
