import { Link, Outlet } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

const HIGHLIGHTS = [
  'Multi-branch management for every location',
  'Role-based access for your whole team',
  'Bookings, staff assignments and payments in one place',
];

export default function AuthLayout() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-linear-to-br from-brand to-brand-2 p-10 text-white lg:flex">
        <div aria-hidden="true" className="absolute -top-24 -right-24 size-80 rounded-full bg-white/10 blur-3xl" />
        <div aria-hidden="true" className="absolute -bottom-32 -left-16 size-96 rounded-full bg-black/10 blur-3xl" />

        <Link to="/" className="relative text-lg font-semibold tracking-tight">
          VX-Workhorse
        </Link>

        <div className="relative max-w-md space-y-6">
          <h2 className="text-3xl font-semibold tracking-tight text-balance">
            Run your service business from one place
          </h2>
          <ul className="space-y-3 text-sm text-white/90">
            {HIGHLIGHTS.map((highlight) => (
              <li key={highlight} className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                {highlight}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-white/70">© {new Date().getFullYear()} VX-Workhorse</p>
      </div>

      <div className="flex flex-col items-center justify-center gap-8 p-6 sm:p-10">
        <Link to="/" className="text-lg font-semibold tracking-tight lg:hidden">
          VX-Workhorse
        </Link>
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
