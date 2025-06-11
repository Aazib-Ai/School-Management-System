import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateClassShortname(className: string): string {
  return className
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase()
    .slice(0, 8);
}

export function generateSubjectCode(className: string, subjectName: string): string {
  const classPrefix = className.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase();
  const subjectSuffix = subjectName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase();
  return `${classPrefix}${subjectSuffix}`;
}
