/** ช่วง polling ฝั่ง client — dev ยาวขึ้นเพื่อลด request ไป DB คลาวด์ */
const isDev = process.env.NODE_ENV === 'development'

export const CLIENT_POLLING = {
  presenceHeartbeatMs: isDev ? 90_000 : 60_000,
  onlineUsersMs: isDev ? 90_000 : 60_000,
  notificationsMs: isDev ? 120_000 : 60_000,
  apiHealthMs: isDev ? 300_000 : 120_000,
  meStaleMs: 5 * 60_000,
} as const
