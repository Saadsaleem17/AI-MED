import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { authService } from "@/services/authService";
import { GoogleLogin } from "@react-oauth/google";

const SignIn = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) {
      toast.error("Google authentication failed");
      return;
    }
    setGoogleLoading(true);
    try {
      const result = await authService.googleLogin(credentialResponse.credential);
      if (result.success) {
        toast.success("Signed in with Google successfully!");
        navigate("/home");
      } else {
        toast.error(result.error || "Google sign-in failed");
      }
    } catch (error) {
      console.error('Google login error:', error);
      toast.error("Something went wrong with Google sign-in");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    
    try {
      console.log('Attempting login with rememberMe:', rememberMe);
      const result = await authService.login({ email, password, rememberMe });
      
      if (result.success) {
        toast.success("Signed in successfully!");
        console.log('Login successful, rememberMe was:', rememberMe);
        navigate("/home");
      } else {
        // Check if user needs email verification
        if (result.needsVerification) {
          toast.error(result.error || "Please verify your email");
          // Optionally redirect to resend verification page
          setTimeout(() => {
            const shouldResend = confirm('Would you like to resend the verification email?');
            if (shouldResend) {
              navigate('/resend-verification');
            }
          }, 1000);
        } else {
          toast.error(result.error || "Login failed");
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <button 
          onClick={() => navigate(-1)}
          className="mb-8 p-2 hover:bg-secondary rounded-full transition-smooth"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <h1 className="text-3xl font-bold mb-2">Sign In</h1>
        <p className="text-muted-foreground mb-8">
          Welcome back! Sign in to continue
        </p>

        {/* Form */}
        <form onSubmit={handleSignIn} className="space-y-6">
          <div>
            <Label htmlFor="email" className="text-sm font-medium mb-2 block">
              Enter your email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-2xl bg-card"
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-sm font-medium mb-2 block">
              Enter your password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-2xl bg-card pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox 
                id="remember" 
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              />
              <Label htmlFor="remember" className="text-sm cursor-pointer">
                Remember me
              </Label>
            </div>
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="text-sm text-primary font-medium"
            >
              Forgot password?
            </button>
          </div>

          <Button 
            type="submit"
            className="w-full" 
            size="lg"
            disabled={loading}
          >
            {loading ? "Signing In..." : "Sign In"}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <button
              onClick={() => navigate("/signup")}
              className="text-primary font-medium"
            >
              Sign up
            </button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-4 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => toast.error("Google sign-in failed")}
                theme="outline"
                size="large"
                width="100%"
                text="signin_with"
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignIn;
