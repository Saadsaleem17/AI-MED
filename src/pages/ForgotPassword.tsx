import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '@/services/authService';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);

    try {
      const result = await authService.forgotPassword(email);

      if (result.success) {
        setSent(true);
        toast.success('Password reset link sent! Check your email.');
      } else {
        toast.error(result.error || 'Failed to send reset email');
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="max-w-md mx-auto">
        <button
          onClick={() => navigate('/signin')}
          className="mb-8 p-2 hover:bg-secondary rounded-full transition-smooth"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <h1 className="text-3xl font-bold mb-2">Forgot Password</h1>
        <p className="text-muted-foreground mb-8">
          Enter your email and we'll send you a link to reset your password.
        </p>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Check your email</h2>
            <p className="text-muted-foreground">
              We've sent a password reset link to <strong>{email}</strong>. 
              The link will expire in 1 hour.
            </p>
            <div className="space-y-3 pt-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => { setSent(false); setEmail(''); }}
              >
                Try a different email
              </Button>
              <Button
                className="w-full"
                onClick={() => navigate('/signin')}
              >
                Back to Sign In
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email" className="text-sm font-medium mb-2 block">
                Email address
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

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Remember your password?{' '}
              <button
                type="button"
                onClick={() => navigate('/signin')}
                className="text-primary font-medium"
              >
                Sign in
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
