'use client'

import { Suspense, useEffect, useState } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { HaLogo } from '@/app/brand/ha-logo'
import { formResolver } from '@/app/common/form-resolver'
import { fetchApiData } from '@/app/common/api-json'
import { showErrorToast, showSuccessToast } from '@/app/common/toast-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoginBackdrop } from '@/app/common/ui/app-shell'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const loginSchema = z.object({
  username: z.string().min(3, 'ชื่อผู้ใช้งานอย่างน้อย 3 ตัวอักษร'),
  password: z.string().min(6, 'รหัสผ่านอย่างน้อย 6 ตัว'),
})

type LoginForm = z.infer<typeof loginSchema>

type AuthConfig = {
  microsoftEnabled: boolean
  devLoginEnabled: boolean
}

function MicrosoftIcon() {
  return (
    <svg className="size-5" viewBox="0 0 21 21" aria-hidden>
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  )
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { status } = useSession()
  const [authConfig, setAuthConfig] = useState<AuthConfig | null>(null)

  const isDev = process.env.NODE_ENV === 'development'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: formResolver(loginSchema),
    defaultValues: isDev ? { username: 'admin', password: 'admin1234' } : { username: '', password: '' },
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('ha:auth-redirecting')
    }
  }, [])

  useEffect(() => {
    const err = searchParams.get('error')
    if (err) {
      showErrorToast(decodeURIComponent(err))
    }
  }, [searchParams])

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard')
    }
  }, [status, router])

  useEffect(() => {
    fetchApiData<AuthConfig>('auth/config')
      .then(setAuthConfig)
      .catch(() => {
        setAuthConfig({ microsoftEnabled: false, devLoginEnabled: true })
      })
  }, [])

  const onMicrosoftLogin = () => {
    void signIn('microsoft-entra-id', { callbackUrl: '/dashboard' })
  }

  const onPasswordLogin = async (values: LoginForm) => {
    const result = await signIn('credentials', {
      username: values.username,
      password: values.password,
      redirect: false,
    })

    if (result?.error) {
      showErrorToast('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง')
      return
    }

    showSuccessToast('เข้าสู่ระบบสำเร็จ')
    router.replace('/dashboard')
  }

  const showMicrosoft = authConfig?.microsoftEnabled ?? false
  const showDev = authConfig?.devLoginEnabled ?? true

  return (
    <LoginBackdrop className="flex-col">
      <Card className="ha-card relative w-full overflow-hidden border-slate-200 shadow-[0_20px_50px_-28px_rgba(15,23,42,0.28)]">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-[#6d28d9]" aria-hidden />
        <CardHeader className="relative space-y-4 pb-2 pt-7 text-center">
          <HaLogo size="xl" className="mx-auto shadow-md" priority />
          <div>
            <CardDescription className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6d28d9]">
              โรงพยาบาลมหาวิทยาลัยพะเยา
            </CardDescription>
            <CardTitle className="mt-1 text-2xl font-bold text-slate-900">ศูนย์ HA</CardTitle>
            <CardDescription className="mt-1 text-slate-500">เข้าสู่ระบบเพื่อใช้งาน</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showMicrosoft && (
            <Button
              type="button"
              variant="default"
              size="lg"
              className="h-11 w-full gap-3 text-base font-medium shadow-md shadow-primary/20"
              onClick={onMicrosoftLogin}
            >
              <MicrosoftIcon />
              เข้าสู่ระบบ
            </Button>
          )}

          {showMicrosoft && showDev && (
            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/80" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-3 text-muted-foreground">หรือเข้าด้วยรหัสผ่าน</span>
              </div>
            </div>
          )}

          
          {showDev && (
            <form onSubmit={handleSubmit(onPasswordLogin)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">ชื่อผู้ใช้งาน</Label>
                <Input id="username" autoComplete="username" {...register('username')} />
                {errors.username && (
                  <p className="text-xs text-destructive">{errors.username.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">รหัสผ่าน</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={isSubmitting || status === 'loading'}>
                {isSubmitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
              </Button>
            </form>
          )}

          {!showMicrosoft && !showDev && (
            <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              ไม่มีช่องทางเข้าสู่ระบบ — ติดต่อผู้ดูแลระบบหรือฝ่าย IT
            </p>
          )}
        </CardContent>
      </Card>
    </LoginBackdrop>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <LoginBackdrop>
          <p className="text-sm text-muted-foreground">กำลังโหลด...</p>
        </LoginBackdrop>
      }
    >
      <LoginContent />
    </Suspense>
  )
}
