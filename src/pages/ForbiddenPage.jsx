import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-4xl font-semibold">403</h1>
      <p className="text-muted-foreground">You don&apos;t have permission to access this page.</p>
      <Button render={<Link to="/" />}>Go home</Button>
    </div>
  );
}
