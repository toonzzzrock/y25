"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeveloperLogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/developer/logout", {
        method: "POST",
      });

      if (response.ok) {
        console.log("[Logout] Successfully logged out");
        router.push("/developer/login");
      } else {
        console.error("[Logout] Failed to logout");
      }
    } catch (error) {
      console.error("[Logout] Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      style={{
        padding: "8px 16px",
        backgroundColor: "#d73a2c",
        color: "#fff",
        border: "none",
        borderRadius: "4px",
        cursor: isLoading ? "not-allowed" : "pointer",
        fontSize: "14px",
        fontWeight: "500",
        transition: "background-color 0.2s",
        opacity: isLoading ? 0.7 : 1,
      }}
      onMouseEnter={(e) => {
        if (!isLoading) e.currentTarget.style.backgroundColor = "#b92a1f";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "#d73a2c";
      }}
    >
      {isLoading ? "Logging out..." : "Logout"}
    </button>
  );
}
