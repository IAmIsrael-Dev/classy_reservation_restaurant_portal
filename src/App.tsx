import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Toaster } from './components/ui/sonner';
import { AuthProvider, useAuth } from './components/auth-provider';
import { RestaurantOnboarding } from './components/restaurant-onboarding';
import HostSection from './components/host-station-complete';
import { ManagerApp } from './components/manager-app';
import { 
  Sparkles, 
  Users, 
  BarChart3, 
  Shield, 
  Lock,
  Mail,
  LogOut,
  Crown,
  User
} from 'lucide-react';

type UserRole = 'host' | 'manager' | null;

interface UserAccount {
  email: string;
  password: string;
  role: UserRole;
  name: string;
}

// Demo accounts for testing
const demoAccounts: UserAccount[] = [
  { email: 'host@demo.com', password: 'demo123', role: 'host', name: 'Sarah Johnson' },
  { email: 'manager@demo.com', password: 'demo123', role: 'manager', name: 'Michael Chen' },
];

function AppContent() {
  const { user: firebaseUser, restaurantProfile, loading: firebaseLoading, signInWithGoogle, signInWithEmail, signUpWithEmail, logout: firebaseLogout } = useAuth();
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSignInLoading, setIsSignInLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [authView, setAuthView] = useState<'initial' | 'signin' | 'signup'>('initial');
  
  // Sign up form states
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [isSignupLoading, setIsSignupLoading] = useState(false);

  // Show loading spinner for Firebase
  if (firebaseLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Firebase user authenticated but hasn't completed onboarding
  if (firebaseUser && !restaurantProfile?.hasCompletedOnboarding) {
    return <RestaurantOnboarding />;
  }

  const handleDemoLogout = () => {
    setCurrentUser(null);
  };

  const handleFirebaseLogout = async () => {
    await firebaseLogout();
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Google Sign-In Error:', err);
      
      // Check if it's a Firebase configuration error
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to sign in with Google');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSignInLoading(true);

    try {
      await signInWithEmail(email, password);
      setEmail('');
      setPassword('');
      setAuthView('initial');
    } catch (err) {
      console.error('Email Sign-In Error:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to sign in');
      }
    } finally {
      setIsSignInLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSignupLoading(true);

    if (signupPassword !== signupConfirmPassword) {
      setError('Passwords do not match');
      setIsSignupLoading(false);
      return;
    }

    try {
      await signUpWithEmail(signupEmail, signupPassword, signupName);
      setAuthView('initial');
    } catch (err) {
      console.error('Sign Up Error:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create account');
      }
    } finally {
      setIsSignupLoading(false);
    }
  };

  const quickLogin = (role: UserRole) => {
    const user = demoAccounts.find((acc) => acc.role === role);
    if (user) {
      setCurrentUser(user);
    }
  };

  // Determine which user is active (demo or Firebase)
  const activeUser = currentUser || (firebaseUser && restaurantProfile?.hasCompletedOnboarding ? {
    email: firebaseUser.email || '',
    role: 'manager' as UserRole,
    name: restaurantProfile?.displayName || firebaseUser.email || 'User',
  } : null);

  // If user is logged in (demo or Firebase), show their appropriate interface
  if (activeUser) {
    const isDemoUser = !!currentUser; // Demo user if currentUser is set (via quickLogin)
    const roleInfo = {
      host: { title: 'Host Dashboard', icon: Users, gradient: 'from-cyan-500 to-blue-500' },
      manager: { title: 'Manager Console', icon: BarChart3, gradient: 'from-blue-600 to-indigo-600' },
    }[activeUser.role!];

    const RoleIcon = roleInfo.icon;
    const isFirebaseUser = !!firebaseUser;

    return (
      <>
        <Toaster richColors position="top-right" />
        <div className="min-h-screen bg-slate-900">
          {/* App Header */}
          <div className="border-b bg-slate-800/50 backdrop-blur-sm sticky top-0 z-50 border-slate-700">
            <div className="container mx-auto px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${roleInfo.gradient} rounded-lg flex items-center justify-center shadow-lg`}
                  >
                    <RoleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </motion.div>
                  <div>
                    <h1 className="text-base sm:text-lg md:text-xl text-slate-100">
                      {isFirebaseUser && restaurantProfile?.restaurantName ? restaurantProfile.restaurantName : 'ReserveAI'}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-400">{roleInfo.title}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                  <div className="hidden sm:flex items-center gap-2 sm:gap-3 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-slate-700/50 rounded-lg">
                    <User className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
                    <span className="text-xs sm:text-sm text-slate-200">{activeUser.name}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={isFirebaseUser ? handleFirebaseLogout : handleDemoLogout}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white h-8 sm:h-9 px-2 sm:px-3"
                  >
                    <LogOut className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Logout</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {activeUser.role === 'manager' ? (
            <ManagerApp isDemo={isDemoUser} />
          ) : (
            <HostSection isDemo={isDemoUser} />
          )}
        </div>
      </>
    );
  }

  // Login Screen
  return (
    <>
      <Toaster richColors position="top-right" />
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="w-full max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Branding */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-xl">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl text-slate-100">ReserveAI</h1>
                  <p className="text-slate-400">Restaurant Ecosystem</p>
                </div>
              </div>

              <div className="space-y-4 pt-8">
                <h2 className="text-4xl text-slate-100">
                  Welcome to the Future of{' '}
                  <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    Hospitality
                  </span>
                </h2>
                <p className="text-lg text-slate-400">
                  One unified platform with role-based access for diners, hosts, managers, and administrators.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-6">
                <Card className="p-4 bg-slate-800 border-slate-700">
                  <div className="flex items-center gap-3 mb-2">
                    <Sparkles className="w-5 h-5 text-blue-400" />
                    <span className="text-slate-200">AI-Powered</span>
                  </div>
                  <p className="text-sm text-slate-400">Intelligent automation throughout</p>
                </Card>
                
                <Card className="p-4 bg-slate-800 border-slate-700">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="w-5 h-5 text-cyan-400" />
                    <span className="text-slate-200">Secure Access</span>
                  </div>
                  <p className="text-sm text-slate-400">Role-based permissions</p>
                </Card>
              </div>
            </motion.div>

            {/* Right Side - Login Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="p-8 bg-slate-800 border-slate-700 shadow-2xl">
                <AnimatePresence mode="wait">
                  {/* Initial View - Choose Action */}
                  {authView === 'initial' && (
                    <motion.div
                      key="initial"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div className="text-center space-y-2">
                        <h3 className="text-3xl text-slate-100">Get Started</h3>
                        <p className="text-slate-400">Choose how you'd like to continue</p>
                      </div>

                      <div className="space-y-4 pt-4">
                        <Button
                          onClick={() => setAuthView('signup')}
                          className="w-full h-14 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg text-lg"
                        >
                          Create Account
                        </Button>

                        <Button
                          onClick={() => setAuthView('signin')}
                          variant="outline"
                          className="w-full h-14 border-slate-600 text-slate-100 hover:bg-slate-700 hover:text-white text-lg"
                        >
                          Sign In
                        </Button>
                      </div>

                      <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-slate-700"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-slate-800 text-slate-400">or try demo</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="text-sm text-slate-400 text-center">Quick Access - Demo Accounts:</p>
                        <div className="grid grid-cols-2 gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => quickLogin('host')}
                            className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-cyan-500"
                          >
                            <Users className="w-4 h-4 mr-2" />
                            Host
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => quickLogin('manager')}
                            className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-indigo-500"
                          >
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Manager
                          </Button>
                        </div>
                        <p className="text-xs text-slate-500 text-center">
                          Password: <code className="text-slate-400">demo123</code>
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* Sign In View */}
                  {authView === 'signin' && (
                    <motion.div
                      key="signin"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-2xl text-slate-100 mb-2">Sign In</h3>
                          <p className="text-slate-400">Welcome back to your portal</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setAuthView('initial');
                            setError('');
                            setEmail('');
                            setPassword('');
                          }}
                          className="text-slate-400 hover:text-slate-100"
                        >
                          ← Back
                        </Button>
                      </div>

                      <form onSubmit={handleEmailSignIn} className="space-y-5">
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-slate-200">Email Address</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <Input
                              id="email"
                              type="email"
                              placeholder="your@email.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="pl-10 bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500 focus:border-blue-500"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="password" className="text-slate-200">Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <Input
                              id="password"
                              type="password"
                              placeholder="••••••••"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="pl-10 bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500 focus:border-blue-500"
                              required
                            />
                          </div>
                        </div>

                        <AnimatePresence>
                          {error && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg space-y-2"
                            >
                              <p className="text-sm text-red-400">{error}</p>
                              {error.includes('Invalid email or password') && (
                                <p className="text-xs text-slate-400">
                                  Don't have an account?{' '}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAuthView('signup');
                                      setError('');
                                    }}
                                    className="text-blue-400 hover:text-blue-300 underline"
                                  >
                                    Create one here
                                  </button>
                                </p>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <Button
                          type="submit"
                          disabled={isSignInLoading}
                          className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg"
                        >
                          {isSignInLoading ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Signing in...</span>
                            </div>
                          ) : (
                            'Sign In'
                          )}
                        </Button>
                      </form>

                      <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-slate-700"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-slate-800 text-slate-400">or continue with</span>
                        </div>
                      </div>

                      <Button
                        onClick={handleGoogleSignIn}
                        disabled={isGoogleLoading}
                        className="w-full h-12 bg-white hover:bg-slate-100 text-slate-900 border border-slate-300"
                        variant="outline"
                      >
                        {isGoogleLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                            <span>Signing in...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                              <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                              />
                              <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                              />
                              <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                              />
                              <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                              />
                            </svg>
                            <span>Continue with Google</span>
                          </div>
                        )}
                      </Button>

                      <div className="mt-6 pt-6 border-t border-slate-700">
                        <p className="text-sm text-slate-400 mb-4">Quick Access - Demo Accounts:</p>
                        <div className="grid grid-cols-2 gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => quickLogin('host')}
                            className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-cyan-500"
                          >
                            <Users className="w-4 h-4 mr-2" />
                            Host
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => quickLogin('manager')}
                            className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-indigo-500"
                          >
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Manager
                          </Button>
                        </div>
                        <p className="text-xs text-slate-500 mt-4 text-center">
                          All demo accounts use password: <code className="text-slate-400">demo123</code>
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* Sign Up View */}
                  {authView === 'signup' && (
                    <motion.div
                      key="signup"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-2xl text-slate-100 mb-2">Create Account</h3>
                          <p className="text-slate-400">Set up your restaurant profile</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setAuthView('initial');
                            setError('');
                            setSignupName('');
                            setSignupEmail('');
                            setSignupPassword('');
                            setSignupConfirmPassword('');
                          }}
                          className="text-slate-400 hover:text-slate-100"
                        >
                          ← Back
                        </Button>
                      </div>

                      <form onSubmit={handleSignup} className="space-y-5">
                        <div className="space-y-2">
                          <Label htmlFor="signupName" className="text-slate-200">Full Name</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <Input
                              id="signupName"
                              type="text"
                              placeholder="John Doe"
                              value={signupName}
                              onChange={(e) => setSignupName(e.target.value)}
                              className="pl-10 bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500 focus:border-blue-500"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="signupEmail" className="text-slate-200">Email Address</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <Input
                              id="signupEmail"
                              type="email"
                              placeholder="your@email.com"
                              value={signupEmail}
                              onChange={(e) => setSignupEmail(e.target.value)}
                              className="pl-10 bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500 focus:border-blue-500"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="signupPassword" className="text-slate-200">Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <Input
                              id="signupPassword"
                              type="password"
                              placeholder="••••••••"
                              value={signupPassword}
                              onChange={(e) => setSignupPassword(e.target.value)}
                              className="pl-10 bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500 focus:border-blue-500"
                              required
                              minLength={6}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="signupConfirmPassword" className="text-slate-200">Confirm Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <Input
                              id="signupConfirmPassword"
                              type="password"
                              placeholder="••••••••"
                              value={signupConfirmPassword}
                              onChange={(e) => setSignupConfirmPassword(e.target.value)}
                              className="pl-10 bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500 focus:border-blue-500"
                              required
                              minLength={6}
                            />
                          </div>
                        </div>

                        <AnimatePresence>
                          {error && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
                            >
                              <p className="text-sm text-red-400">{error}</p>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <Button
                          type="submit"
                          disabled={isSignupLoading}
                          className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg"
                        >
                          {isSignupLoading ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Creating account...</span>
                            </div>
                          ) : (
                            'Create Account'
                          )}
                        </Button>
                      </form>

                      <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-slate-700"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-slate-800 text-slate-400">or continue with</span>
                        </div>
                      </div>

                      <Button
                        onClick={handleGoogleSignIn}
                        disabled={isGoogleLoading}
                        className="w-full h-12 bg-white hover:bg-slate-100 text-slate-900 border border-slate-300"
                        variant="outline"
                      >
                        {isGoogleLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                            <span>Signing in...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                              <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                              />
                              <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                              />
                              <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                              />
                              <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                              />
                            </svg>
                            <span>Continue with Google</span>
                          </div>
                        )}
                      </Button>

                      <div className="mt-6 pt-6 border-t border-slate-700">
                        <p className="text-sm text-slate-400 mb-4">Quick Access - Demo Accounts:</p>
                        <div className="grid grid-cols-2 gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => quickLogin('host')}
                            className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-cyan-500"
                          >
                            <Users className="w-4 h-4 mr-2" />
                            Host
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => quickLogin('manager')}
                            className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-indigo-500"
                          >
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Manager
                          </Button>
                        </div>
                        <p className="text-xs text-slate-500 text-center">
                          Password: <code className="text-slate-400">demo123</code>
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}