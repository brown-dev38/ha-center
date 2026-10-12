/** Client-safe: ระบบทดลองบน Vercel (ไม่ใช่ production รพ.) */
export function isPublicDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
}
