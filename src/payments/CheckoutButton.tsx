import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { openCheckout, formatAmount, type Plan } from './index';
import { Check, Loader2 } from 'lucide-react';

interface CheckoutButtonProps {
  plan: Plan;
  userInfo?: { name?: string; email?: string; phone?: string };
  onSuccess?: () => void;
  onError?: (error: string) => void;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function CheckoutButton({
  plan,
  userInfo,
  onSuccess,
  onError,
  variant = 'default',
  size = 'md',
  className = ''
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    setSuccess(false);
    
    try {
      const response = await openCheckout(plan.id, userInfo);
      
      if (response) {
        setSuccess(true);
        onSuccess?.();
      } else {
        onError?.('Payment was not completed');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      onError?.(error.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Button 
        variant="outline" 
        size={size === 'md' ? 'default' : size} 
        className={`bg-green-50 border-green-200 text-green-700 ${className}`}
        disabled
      >
        <Check className="h-4 w-4 mr-2" />
        Subscribed!
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size === 'md' ? 'default' : size}
      onClick={handleClick}
      disabled={loading}
      className={className}
    >
      {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
      {formatAmount(plan)}
    </Button>
  );
}

export default CheckoutButton;
