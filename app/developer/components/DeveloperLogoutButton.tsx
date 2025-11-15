"use client";

import { useRouter } from "next/navigation";
import styles from "../developer.module.css";

export function DeveloperLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch("/api/developer/logout", { method: "POST" });
      router.push("/developer/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  return (
    <button className={styles.logoutButton} onClick={handleLogout}>
      Logout
    </button>
  );
}
