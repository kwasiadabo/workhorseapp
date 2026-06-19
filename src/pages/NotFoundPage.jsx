import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-4xl font-semibold">404</h1>
      <p className="text-muted-foreground">The page you are looking for doesn&apos;t exist.</p>
      <Button render={<Link to="/" />}>Go home</Button>
    </div>
  );
}
