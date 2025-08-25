import { useState, useEffect } from 'react';
import { useLogin } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Lock, User, Eye, EyeOff, Shield, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const login = useLogin();
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast({
        title: 'Authentication Required',
        description: 'Please provide both username and password to continue',
        variant: 'destructive',
      });
      return;
    }

    if (username.length < 3) {
      toast({
        title: 'Invalid Username',
        description: 'Username must be at least 3 characters long',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Invalid Password',
        description: 'Password must be at least 6 characters long',
        variant: 'destructive',
      });
      return;
    }

    try {
      await login.mutateAsync({ username, password });
      toast({
        title: 'Access Granted',
        description: 'Welcome to the Operator Dashboard',
        className: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      });
    } catch (error) {
      toast({
        title: 'Authentication Failed',
        description: error instanceof Error ? error.message : 'Invalid credentials. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950 flex items-center justify-center px-4 py-6 sm:p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5 dark:opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366f1' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className={`w-full max-w-sm sm:max-w-md transform transition-all duration-700 ease-out ${
        mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      }`}>
        <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 border-0 shadow-2xl shadow-indigo-500/10 dark:shadow-indigo-400/5 mx-auto">
          <CardHeader className="space-y-4 sm:space-y-6 pb-6 sm:pb-8 px-6 pt-8">
            
            <div className="flex flex-col items-center space-y-3 sm:space-y-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl blur-lg opacity-25 group-hover:opacity-40 transition-opacity duration-300" />
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden ring-4 ring-white dark:ring-gray-800 shadow-lg">
                  <img 
                    src="/ACTIEF-ERT.jpg" 
                    alt="ACT Emergency Response Team Logo" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="text-center space-y-1 sm:space-y-2">
                <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-red-600 via-orange-600 to-red-700 dark:from-red-400 dark:via-orange-400 dark:to-red-500 bg-clip-text text-transparent leading-tight">
                  ERT ACCESS PORTAL
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400 font-medium text-sm sm:text-base px-2">
                  ACT MAIN - EMERGENCY RESPONSE TEAM
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-full">
                <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs sm:text-sm font-medium text-emerald-700 dark:text-emerald-300">SECURED ACCESS</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 sm:space-y-6 px-6 pb-6">
            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
             
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Username
                </Label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg opacity-0 group-focus-within:opacity-10 transition-opacity duration-300 pointer-events-none" />
                  <User className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-slate-400 dark:text-slate-500 transition-colors duration-200 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400" />
                  <Input
                    id="username"
                    data-testid="input-username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 sm:pl-12 h-12 sm:h-12 border-2 border-slate-200 dark:border-slate-700 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:border-blue-500 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-gray-800 transition-all duration-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-base"
                    disabled={login.isPending}
                    required
                    minLength={3}
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </Label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg opacity-0 group-focus-within:opacity-10 transition-opacity duration-300 pointer-events-none" />
                  <Lock className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-slate-400 dark:text-slate-500 transition-colors duration-200 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400" />
                  <Input
                    id="password"
                    data-testid="input-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 sm:pl-12 pr-12 h-12 sm:h-12 border-2 border-slate-200 dark:border-slate-700 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:border-blue-500 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-gray-800 transition-all duration-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-base"
                    disabled={login.isPending}
                    required
                    minLength={6}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-200 touch-manipulation p-1"
                    disabled={login.isPending}
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                data-testid="button-login"
                className="w-full h-12 sm:h-12 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 dark:from-red-500 dark:to-orange-500 dark:hover:from-red-600 dark:hover:to-orange-600 text-white font-semibold rounded-lg shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-300 transform active:scale-95 disabled:scale-100 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation text-base"
                disabled={login.isPending || !username || !password}
              >
                {login.isPending ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span className="text-sm sm:text-base">Authenticating...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-sm sm:text-base">Access Dashboard</span>
                  </div>
                )}
              </Button>
            </form>

            {/* Back to User Panel Button */}
            <div className="pt-4">
              <Link href="/">
                <Button
                  type="button"
                  variant="outline"
                  data-testid="button-back-to-user-panel"
                  className="w-full h-11 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-500 transition-all duration-200 font-medium"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to User Panel
                </Button>
              </Link>
            </div>

            {/* Security Notice */}
            <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-start space-x-2 sm:space-x-3">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm font-semibold text-amber-800 dark:text-amber-200">
                    AUTHORIZED PERSONNEL ONLY
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                    This system is restricted to non-authorized ERT member. 
                    All access attempts are monitored and logged for security purposes.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center pt-3 sm:pt-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 px-2">
                Emergency Response Team • Access Portal • {new Date().getFullYear()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}