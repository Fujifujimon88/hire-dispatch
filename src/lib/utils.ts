import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateDispatchOrderNumber(): string {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const seq = String(Math.floor(Math.random() * 99999) + 1).padStart(5, "0");
  return `DP-${date}-${seq}`;
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("ja-JP");
}

export function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}
