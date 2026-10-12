const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['pdfkit', '@prisma/client', 'prisma', 'googleapis', 'xlsx'],
  typescript: {
    ignoreBuildErrors: true,
  },
  // PDF ใช้ html2canvas-pro โดยตรงแล้ว — ไม่ต้อง alias webpack
  // เก็บ turbopack ว่างไว้กัน Next 16 ฟ้องเรื่อง webpack/turbopack
  turbopack: {},
  async rewrites() {
    return {
      // Proxy sibling apps before HA Center page routes (no IIS on this host)
      beforeFiles: [
        {
          source: '/system-rls',
          destination: 'http://127.0.0.1:3003/system-rls',
        },
        {
          source: '/system-rls/:path*',
          destination: 'http://127.0.0.1:3003/system-rls/:path*',
        },
      ],
      afterFiles: [
        // Dashboard UI URLs (unchanged)
        { source: '/dashboard', destination: '/home' },
        { source: '/dashboard/:path*', destination: '/:path*' },
        // Backend handlers colocated under app/<feature>/api/ — keep /api/v1/* URLs
        { source: '/api/health', destination: '/common/health' },
        { source: '/api/v1/presence/:path*', destination: '/common/api/presence/:path*' },
        { source: '/api/v1/presence', destination: '/common/api/presence' },
        { source: '/api/v1/:feature/:path*', destination: '/:feature/api/:path*' },
        { source: '/api/v1/:feature', destination: '/:feature/api' },
      ],
    }
  },
}

module.exports = nextConfig
