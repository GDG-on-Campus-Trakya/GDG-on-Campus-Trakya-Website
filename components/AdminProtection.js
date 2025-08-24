"use client";
import { useEffect, useState, useRef } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter, usePathname } from "next/navigation";
import { auth } from "../firebase";
import { checkUserRole, canAccessPage } from "../utils/roleUtils";
import { logSecurityEvent, AUDIT_EVENTS } from "../utils/auditLog";

export default function AdminProtection({ children, requiredRole = null }) {
  const [user, loading] = useAuthState(auth);
  const [userRole, setUserRole] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const checkInProgress = useRef(false);
  const hasChecked = useRef(false);

  useEffect(() => {
    const checkAccess = async () => {
      // Prevent multiple simultaneous checks
      if (checkInProgress.current || loading) return;
      
      checkInProgress.current = true;
      setIsChecking(true);
      
      try {
        if (!user) {
          await logSecurityEvent(AUDIT_EVENTS.SECURITY_VIOLATION, {
            action: 'unauthorized_access_attempt',
            resource: pathname,
            actorIP: typeof window !== 'undefined' ? window.location.hostname : 'unknown'
          });
          router.push("/");
          return;
        }

        const role = await checkUserRole(user.email);
        if (!role) {
          await logSecurityEvent(AUDIT_EVENTS.SECURITY_VIOLATION, {
            action: 'invalid_role_access_attempt',
            actorEmail: user.email,
            resource: pathname
          });
          router.push("/");
          return;
        }

        setUserRole(role);

        if (requiredRole && role !== requiredRole) {
          await logSecurityEvent(AUDIT_EVENTS.SECURITY_VIOLATION, {
            action: 'insufficient_role_access_attempt',
            actorEmail: user.email,
            actorRole: role,
            requiredRole,
            resource: pathname
          });
          router.push("/admin");
          return;
        }

        if (!canAccessPage(role, pathname)) {
          await logSecurityEvent(AUDIT_EVENTS.SECURITY_VIOLATION, {
            action: 'page_access_denied',
            actorEmail: user.email,
            actorRole: role,
            resource: pathname
          });
          router.push("/admin");
          return;
        }

        setIsAuthorized(true);
        hasChecked.current = true;
        
      } catch (error) {
        console.error("Access check failed:", error);
        await logSecurityEvent(AUDIT_EVENTS.SYSTEM_ERROR, {
          action: 'access_check_failed',
          error: error.message,
          actorEmail: user?.email,
          resource: pathname
        });
        router.push("/");
      } finally {
        checkInProgress.current = false;
        setIsChecking(false);
      }
    };

    // Only run check if we haven't checked yet or if dependencies changed
    if (!hasChecked.current || user !== null) {
      checkAccess();
    }
  }, [user, loading, router, pathname, requiredRole]);

  if (loading || isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yetki kontrolü yapılıyor...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-50">
        <div className="text-center bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-white/20">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Yetkisiz Erişim</h2>
          <p className="text-gray-600 mb-6">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
          <button
            onClick={() => router.push("/admin")}
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-600 transform hover:scale-105 transition-all duration-300"
          >
            Admin Paneline Dön
          </button>
        </div>
      </div>
    );
  }

  return children;
}