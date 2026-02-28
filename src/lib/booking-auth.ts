import jwt from "jsonwebtoken";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const SECRET = process.env.NEXTAUTH_SECRET;
if (!SECRET) throw new Error("NEXTAUTH_SECRET environment variable must be set");

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, SECRET!, { expiresIn: "24h" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, SECRET!) as TokenPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function getTokenFromRequest(req: Request): TokenPayload | null {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return verifyToken(auth.slice(7));
}

export async function getUserFromRequest(req: Request) {
  const payload = getTokenFromRequest(req);
  if (!payload) return null;
  return prisma.user.findUnique({
    where: { id: payload.userId },
    include: { company: true },
  });
}

export function generateOrderNumber(): string {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const seq = String(crypto.randomInt(1, 100000)).padStart(5, "0");
  return `HY-${date}-${seq}`;
}

export function generateInvoiceNumber(yearMonth: string): string {
  const seq = String(crypto.randomInt(1, 100000)).padStart(5, "0");
  return `INV-${yearMonth}-${seq}`;
}
