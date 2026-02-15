import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '@/services/authService';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error('Invalid reset link. Please request a new one.');
      return;
    }

    if (!password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const result = await authService.resetPassword(token, password);

      if (result.success) {
        setSuccess(true);
        toast.success('Password reset successfully!');
      } else {
        toast.error(result.error || 'Failed to reset password');
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-background px-6 py-8">
        <div className="max-w-md mx-auto text-center space-y-4 pt-20">
          <h1 className="text-2xl font-bold">Invalid Reset Link</h1>
          <p className="text-muted-foreground">
            This password reset link is invalid or has expired.
          </p>
          <Button onClick={() => navigate('/forgot-password')}>
            Request New Reset Link
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="max-w-md mx-auto">
        <button
          onClick={() => navigate('/signin')}
          className="mb-8 p-2 hover:bg-secondary rounded-full transition-smooth"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        {success ? (
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold">Password Reset!</h2>
            <p className="text-muted-foreground">
              Your password has been reset successfully. You can now sign in with your new password.
            </p>
            <Button className="w-full" onClick={() => navigate('/signin')}>
              Go to Sign In
            </Button>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-bold mb-2">Reset Password</h1>
            <p className="text-muted-foreground mb-8">
              Enter your new password below.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="password" className="text-sm font-medium mb-2 block">
                  New password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
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

              <div>
                <Label htmlFor="confirmPassword" className="text-sm font-medium mb-2 block">
                  Confirm new password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12 rounded-2xl bg-card pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
