import { compare, hash } from "bcryptjs";

export function hashPassword(plain: string) {
  return hash(plain, 12);
}

export function verifyPassword(plain: string, hashValue: string) {
  return compare(plain, hashValue);
}
