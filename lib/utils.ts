import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function isValidPassword(
  password: string,
  hashedPassword: string
) {
  return (await hashPassword(password)) === hashedPassword
}

async function hashPassword(password: string) {
  const arrayBuffer = await crypto.subtle.digest(
    'SHA-512',
    new TextEncoder().encode(password)
  )

  return Buffer.from(arrayBuffer).toString('base64')
}

export const wait = (duration: number) => {
  return new Promise((resolve) => setTimeout(resolve, duration))
}
