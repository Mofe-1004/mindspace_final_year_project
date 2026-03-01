import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Phone, AlertCircle, Loader2, CheckCircle2, GraduationCap, HeartHandshake, UserRound } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { isValidSchoolEmail } from '../lib/utils'
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
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert'

const signupSchema = z
  .object({
    firstName: z
      .string()
      .min(2, 'First name is required')
      .max(50, 'First name is too long')
      .regex(/^[a-zA-Z\-']+$/, 'First name can only contain letters, hyphens, and apostrophes'),
    lastName: z
      .string()
      .min(2, 'Last name is required')
      .max(50, 'Last name is too long')
      .regex(/^[a-zA-Z\-']+$/, 'Last name can only contain letters, hyphens, and apostrophes'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address')
      .refine(
        (email) => isValidSchoolEmail(email),
        'Please use your Babcock University email address (e.g., student@student.babcock.edu.ng)'
      ),
    phoneNumber: z
      .string()
      .min(1, 'Phone number is required')
      .regex(/^(\+?234|0)[789]\d{9}$/, 'Please enter a valid Nigerian phone number (e.g., 08012345678)'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must be less than 128 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type SignupFormData = z.infer<typeof signupSchema>

export default function Signup() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [roleChoice, setRoleChoice] = useState<'student' | 'counselor'>('student')
  const { signUp, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  if (isAuthenticated) {
    return null
  }

  const onSubmit = async (data: SignupFormData) => {
    setError(null)
    setIsLoading(true)

    try {
      const { error: signUpError } = await signUp(data.email, data.password, roleChoice, data.phoneNumber, data.firstName, data.lastName)

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('An account with this email already exists. Please sign in instead.')
        } else {
          setError(signUpError.message)
        }
      } else {
        setSuccess(true)
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
            <CardDescription className="text-base">
              We've sent a verification link to your email address. Please click
              the link to verify your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Alert variant="success" className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Account created successfully!</AlertTitle>
              <AlertDescription className="text-green-700">
                Check your school email inbox (and spam folder) for the
                verification link.
              </AlertDescription>
            </Alert>
            {roleChoice === 'counselor' && (
              <Alert className="bg-amber-50 border-amber-200">
                <HeartHandshake className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800">Counselor approval required</AlertTitle>
                <AlertDescription className="text-amber-700">
                  After verifying your email, your counselor account will need to
                  be approved by an administrator before you can access the
                  counselor dashboard. You'll be notified once approved.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/login')}
            >
              Go to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center pt-8">
          <h1 className="font-display italic text-4xl text-primary mb-1">MindSpace</h1>
          <CardTitle className="text-xl font-semibold text-foreground">Create an account</CardTitle>
          <CardDescription>
            Track your emotional wellbeing with support
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

            {/* Role Selector */}
            <div className="space-y-2">
              <Label>I am signing up as a</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRoleChoice('student')}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                    roleChoice === 'student'
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  <GraduationCap className={`h-6 w-6 ${roleChoice === 'student' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-sm font-medium ${roleChoice === 'student' ? 'text-primary' : 'text-foreground'}`}>Student</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRoleChoice('counselor')}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                    roleChoice === 'counselor'
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  <HeartHandshake className={`h-6 w-6 ${roleChoice === 'counselor' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-sm font-medium ${roleChoice === 'counselor' ? 'text-primary' : 'text-foreground'}`}>Counselor</span>
                </button>
              </div>
              {roleChoice === 'counselor' && (
                <p className="text-xs text-amber-600">
                  Counselor accounts require admin approval before access is granted.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <div className="relative">
                  <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="e.g., Adejo"
                    className="pl-10"
                    {...register('firstName')}
                  />
                </div>
                {errors.firstName && (
                  <p className="text-sm text-destructive">{errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <div className="relative">
                  <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="e.g., Okechukwu"
                    className="pl-10"
                    {...register('lastName')}
                  />
                </div>
                {errors.lastName && (
                  <p className="text-sm text-destructive">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-blue-700 text-sm">
                <strong>School email required:</strong> Use your Babcock University email
                (e.g., @student.babcock.edu.ng)
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="email">School Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder={roleChoice === 'counselor' ? 'name@babcock.edu.ng' : 'student@student.babcock.edu.ng'}
                  className="pl-10"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="08012345678"
                  className="pl-10"
                  {...register('phoneNumber')}
                />
              </div>
              {errors.phoneNumber && (
                <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 8 characters"
                  className="pl-10"
                  {...register('password')}
                />
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  className="pl-10"
                  {...register('confirmPassword')}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="text-xs text-muted-foreground">
              <p className="font-medium mb-1">Supported university:</p>
              <p>Babcock University (@student.babcock.edu.ng, @babcock.edu.ng)</p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full rounded-full bg-gradient-to-r from-primary to-secondary text-white border-0 hover:opacity-90" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-primary hover:underline font-medium"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
