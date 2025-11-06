import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Mail } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ResendVerification = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        setTimeout(() => navigate('/signin'), 2000);
      } else {
        toast.error(result.error || 'Failed to resend verification email');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary to-primary/90 flex items-center justify-center p-6">
      <Card className="w-full max-w-md p-8 shadow-card">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 p-2 hover:bg-secondary rounded-full transition-smooth"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Resend Verification</h1>
          <p className="text-muted-foreground">
            Enter your email to receive a new verification link
          </p>
        </div>

        <form onSubmit={handleResend} className="space-y-6">
          <div>
            <Label htmlFor="email" className="text-sm font-medium mb-2 block">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-2xl bg-card pl-10"
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? 'Sending...' : 'Resend Verification Email'}
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
      </Card>
    </div>
  );
};

export default ResendVerification;