import { useState, useEffect } from "react";
import { getCurrentUser, getCurrentSession, signOut } from "@/lib/auth";
import LoginModal from "./LoginModal";

export default function UserMenu() {
  const [user, setUser] = useState<any>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const session = await getCurrentSession();
      const currentUser = await getCurrentUser();

      if (session && currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error checking auth:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
      window.location.reload();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (isLoading) {
    return (
      <button className="text-gray-600 hover:text-gray-900 font-semibold">
        Cargando...
      </button>
    );
  }

  if (!user) {
    return (
      <>
        <button
          onClick={() => setIsLoginOpen(true)}
          className="text-gray-600 hover:text-gray-900 font-semibold transition-colors"
        >
          Iniciar sesión
        </button>
        <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      </>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => window.location.href = "/mi-cuenta"}
        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
      >
        <div className="hidden sm:block text-left">
          <p className="text-xs font-semibold text-gray-600">Mi Cuenta</p>
          <p className="text-sm font-bold text-gray-900">
            {user.user_metadata?.nombre || user.user_metadata?.full_name || user.email?.split("@")[0]}
          </p>
        </div>
      </button>
      <button
        onClick={handleSignOut}
        className="text-gray-600 hover:text-red-600 font-semibold text-sm transition-colors"
        title="Cerrar sesión"
      >
        Salir
      </button>
    </div>
  );
}
