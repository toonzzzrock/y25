"use client";

import { useRouter } from "next/navigation";

export function DeveloperLogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/developer/logout", {
        method: "POST",
      });

      if (response.ok) {
        router.push("/developer/login");
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <button
      onClick={handleLogout}
      style={{
        background: "linear-gradient(135deg, #ff7a2b 0%, #ff6a00 100%)",
        color: "white",
        border: "none",
        borderRadius: "6px",
        padding: "10px 20px",
        fontSize: "14px",
        fontWeight: 700,
        cursor: "pointer",
        transition: "all 0.3s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 8px 20px rgba(255, 122, 43, 0.3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      LOGOUT
    </button>
  );
}
