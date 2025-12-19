import crypto from "crypto";

export function generateJoinPassword(length = 16) {
  const password = crypto.randomBytes(length).toString("base64url");
  return password.slice(0, length);
}

export function hashJoinPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");

  return {
    hash,
    salt,
    updatedAt: new Date(),
  };
}
