/**
 * Awaiting Approval Page - Shown to pending counselors
 */

import { LogOut, Clock, Mail } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { Button } from '../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card'

export default function AwaitingApproval() {
  const { user, signOut, refreshRole } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  const handleCheckStatus = async () => {
    await refreshRole()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-background to-amber-100/50 flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="font-display italic text-xl text-primary">MindSpace</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
            <CardTitle className="text-2xl">Awaiting Approval</CardTitle>
            <CardDescription className="text-base">
              Your counselor registration is pending review
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                An existing counselor needs to approve your request before you can
                access the counselor dashboard. This usually happens within 24-48 hours.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Check your email</p>
                  <p className="text-sm text-muted-foreground">
                    You'll receive an email notification once your request is approved.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleCheckStatus}
              >
                <Clock className="h-4 w-4 mr-2" />
                Check Status
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Click to refresh your approval status
              </p>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground text-center">
                Need help? Contact the system administrator or an existing counselor
                at your institution.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
          <p>MindSpace — Staff Registration</p>
        </div>
      </footer>
    </div>
  )
}
