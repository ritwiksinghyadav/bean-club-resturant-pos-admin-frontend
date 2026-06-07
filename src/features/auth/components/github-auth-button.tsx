'use client';

import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';

export default function GithubSignInButton() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');

  return (
    <Button
      className='w-full'
      variant='outline'
      type='button'
      onClick={() => {
        // In a real implementation, you would implement GitHub OAuth
        // For now, just redirect to dashboard
        window.location.href = callbackUrl || '/dashboard/overview';
      }}
    >
      <Icons.github className='mr-2 h-4 w-4' />
      Continue with Github
    </Button>
  );
}
