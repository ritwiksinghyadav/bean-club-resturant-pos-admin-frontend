import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserAvatarProfile } from '@/components/user-avatar-profile';

export default function ProfileViewPage() {
  // Mock user data - in a real app, you'd get this from your auth system
  const user = {
    fullName: 'Demo User',
    emailAddresses: [{ emailAddress: 'demo@example.com' }],
    imageUrl: '/placeholder-avatar.jpg'
  };

  return (
    <div className='flex w-full flex-col space-y-6 p-4'>
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='flex items-center space-x-4'>
            <UserAvatarProfile user={user} className='h-20 w-20' />
            <div>
              <Button variant='outline' size='sm'>
                Change Avatar
              </Button>
            </div>
          </div>

          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='name'>Full Name</Label>
              <Input
                id='name'
                defaultValue={user.fullName || ''}
                placeholder='Enter your full name'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                type='email'
                defaultValue={user.emailAddresses[0]?.emailAddress || ''}
                placeholder='Enter your email'
              />
            </div>
          </div>

          <div className='flex justify-end space-x-2'>
            <Button variant='outline'>Cancel</Button>
            <Button>Save Changes</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <Button variant='outline'>Change Password</Button>
          <Button variant='destructive'>Delete Account</Button>
        </CardContent>
      </Card>
    </div>
  );
}
