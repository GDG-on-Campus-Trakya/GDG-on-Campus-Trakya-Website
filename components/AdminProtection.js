"use client";
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter, usePathname } from "next/navigation";
import { auth } from "../firebase";
import { checkUserRole, canAccessPage } from "../utils/roleUtils";

export default function AdminProtection({ children, requiredRole = null }) {
  const [user, loading] = useAuthState(auth);
  const [userRole, setUserRole] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAccess = async () => {
      if (loading) return;
      
      if (!user) {
        router.push("/");
        return;
      }

      const role = await checkUserRole(user.email);
      if (!role) {
        router.push("/");
        return;
      }

      setUserRole(role);

      if (requiredRole && role !== requiredRole) {
        router.push("/admin");
        return;
      }

      if (!canAccessPage(role, pathname)) {
        router.push("/admin");
        return;
      }

      setIsAuthorized(true);
    };

    checkAccess();
  }, [user, loading, router, pathname, requiredRole]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg text-red-500 mb-4">Yetkisiz Erişim</p>
          <p className="text-gray-600">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
        </div>
      </div>
    );
  }

  return children;
}