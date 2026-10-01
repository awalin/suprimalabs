import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Absolute URL to an app path, respecting the deploy base path (e.g. GitHub Pages /repo/). */
export const appUrl = (path: string) =>
  `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, "")}${path}`;
