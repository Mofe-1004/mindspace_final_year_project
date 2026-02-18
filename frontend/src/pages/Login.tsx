import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Mail, Lock, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import { Alert, AlertDescription } from '../components/ui/alert'

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function Login() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { signIn, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard'
  // Holds the fallback timeout set after a successful signIn response
  const signInTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  // Single source of truth for post-login navigation.
  // Fires on initial render (handles already-logged-in users) and after onAuthStateChange
  // updates isAuthenticated to true following a successful sign-in.
  useEffect(() => {
    if (isAuthenticated) {
      if (signInTimeoutRef.current) {
        clearTimeout(signInTimeoutRef.current)
        signInTimeoutRef.current = null
      }
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, from])

  // Clean up the fallback timeout if the component unmounts before auth resolves
  useEffect(() => {
    return () => {
      if (signInTimeoutRef.current) clearTimeout(signInTimeoutRef.current)
    }
  }, [])

  if (isAuthenticated) {
    return null
  }

  const onSubmit = async (data: LoginFormData) => {
    setError(null)
    setIsLoading(true)

    try {
      // Race the network request against a 10s timeout so the spinner can never
      // hang forever if an extension or network issue blocks the request.
      const { error: signInError } = await Promise.race([
        signIn(data.email, data.password),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 10000)
        ),
      ])

      if (signInError) {
        if (signInError.message.includes('Email not confirmed')) {
          setError('Please verify your email before logging in. Check your inbox for a verification link.')
        } else if (signInError.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please try again.')
        } else {
          setError(signInError.message)
        }
        setIsLoading(false)
      } else {
        // Credentials accepted. Keep the spinner active — the useEffect above will
        // navigate once onAuthStateChange updates isAuthenticated to true.
        // Set a fallback in case the auth state update itself hangs.
        signInTimeoutRef.current = setTimeout(() => {
          setIsLoading(false)
          setError('Sign-in is taking longer than expected. Please try again.')
        }, 8000)
      }
    } catch (err) {
      const message =
        err instanceof Error && err.message === 'timeout'
          ? 'Request timed out. Please check your connection and try again.'
          : 'An unexpected error occurred. Please try again.'
      setError(message)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center pt-8">
          <h1 className="font-display italic text-4xl text-primary mb-1">MindSpace</h1>
          <CardTitle className="text-xl font-semibold text-foreground">Welcome back</CardTitle>
          <CardDescription>
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="student@unilag.edu.ng"
                  className="pl-10"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="pl-10"
                  {...register('password')}
                />
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full rounded-full bg-gradient-to-r from-primary to-secondary text-white border-0 hover:opacity-90" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="text-primary hover:underline font-medium"
              >
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
