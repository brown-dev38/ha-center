import { randomUUID } from 'crypto'
import jwt from 'jsonwebtoken'

export type AccessTokenPayload = {
  sub: string
  email: string
  role: string
  departmentId?: string
  typ: 'access'
  jti: string
}

export type RefreshTokenPayload = {
  sub: string
  typ: 'refresh'
  jti: string
}

const ACCESS_TOKEN_TTL_SEC = Number(process.env.ACCESS_TOKEN_TTL_SEC ?? 8 * 60 * 60)
const REFRESH_TOKEN_TTL_SEC = Number(process.env.REFRESH_TOKEN_TTL_SEC ?? 7 * 24 * 60 * 60)

const ACCESS_SECRET = process.env.JWT_SECRET ?? 'dev-access-secret-change-me'
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET ?? 'dev-refresh-secret-change-me'

export function buildAccessPayload(user: {
  id: string
  email: string
  role: { name: string }
  departmentId?: string | null
}): AccessTokenPayload {
  return {
    sub: user.id,
    email: user.email,
    role: user.role.name,
    typ: 'access',
    jti: randomUUID(),
    ...(user.departmentId ? { departmentId: user.departmentId } : {}),
  }
}

export function buildRefreshPayload(userId: string): RefreshTokenPayload {
  return {
    sub: userId,
    typ: 'refresh',
    jti: randomUUID(),
  }
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_TTL_SEC })
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_TTL_SEC })
}

export function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    const decoded = jwt.verify(token, ACCESS_SECRET) as AccessTokenPayload
    return decoded.typ === 'access' ? decoded : null
  } catch {
    return null
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload | null {
  try {
    const decoded = jwt.verify(token, REFRESH_SECRET) as RefreshTokenPayload
    return decoded.typ === 'refresh' ? decoded : null
  } catch {
    return null
  }
}

