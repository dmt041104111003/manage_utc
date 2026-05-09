import * as jose from "jose";
import { getSecretKey } from "@/lib/auth/jwt";

export type RespondPurpose = "respond_interview" | "respond_offer";
export type RespondAction = "CONFIRM" | "DECLINE";

export interface RespondTokenPayload {
  purpose: RespondPurpose;
  appId: string;
  action: RespondAction;
}


export async function signRespondToken(
  payload: RespondTokenPayload,
  deadline: Date
): Promise<string> {
  const nowSec = Math.floor(Date.now() / 1000);
  const expSec = Math.floor(deadline.getTime() / 1000);
  const ttl = Math.max(expSec - nowSec, 1);
  return new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ttl + "s")
    .sign(getSecretKey());
}

export async function verifyRespondToken(token: string): Promise<RespondTokenPayload> {
  const { payload } = await jose.jwtVerify(token, getSecretKey());
  const { purpose, appId, action } = payload as Record<string, unknown>;
  if (
    typeof purpose !== "string" ||
    typeof appId !== "string" ||
    typeof action !== "string" ||
    !["respond_interview", "respond_offer"].includes(purpose) ||
    !["CONFIRM", "DECLINE"].includes(action)
  ) {
    throw new Error("Invalid respond token");
  }
  return { purpose: purpose as RespondPurpose, appId: appId as string, action: action as RespondAction };
}
