import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRegisterTenant } from '@/features/auth/useAuth';
import api from '@/lib/axios';

const fetchBusinessTypes = () => api.get('/business-types').then((res) => res.data.data);

const HIGHLIGHTS = [
  'Multi-branch management for every location',
  'Role-based access for your whole team',
  'Bookings, staff assignments and payments in one place',
];

const registerSchema = z
  .object({
    businessName: z.string().min(2, 'Business name is required').max(150),
    businessType: z.string().min(1, 'Please select a business type'),
    address: z.string().max(255).optional().or(z.literal('')),
    ownerFullName: z
      .string()
      .min(1, 'Full name is required')
      .max(200)
      .refine((v) => v.trim().includes(' '), 'Please enter your first and last name'),
    email: z.string().email('Enter a valid email address').max(150),
    phone: z.string().min(1, 'Phone number is required').max(30),
    password: z.string().min(8, 'Password must be at least 8 characters').max(100),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export default function RegisterTenantPage() {
  const navigate = useNavigate();
  const registerTenant = useRegisterTenant();
  const { data: businessTypes = [], isLoading: typesLoading } = useQuery({
    queryKey: ['business-types', 'public'],
    queryFn: fetchBusinessTypes,
    staleTime: 5 * 60 * 1000,
  });

  const form = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      businessName: '',
      businessType: undefined,
      address: '',
      ownerFullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = (values) => {
    const nameParts = values.ownerFullName.trim().split(/\s+/);
    const payload = {
      ...values,
      ownerFirstName: nameParts[0],
      ownerLastName: nameParts.slice(1).join(' '),
    };
    delete payload.ownerFullName;
    delete payload.confirmPassword;
    registerTenant.mutate(payload, {
      onSuccess: () => {
        toast.success('Account created. Welcome aboard!');
        navigate('/app', { replace: true });
      },
      onError: (error) => {
        toast.error(error?.response?.data?.message ?? 'Unable to create your account');
      },
    });
  };

  return (
    <div className="grid min-h-svh lg:grid-cols-[5fr_7fr]">
      {/* ── Brand panel ── */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-linear-to-br from-brand to-brand-2 p-10 text-white lg:flex">
        <div aria-hidden="true" className="absolute -top-24 -right-24 size-80 rounded-full bg-white/10 blur-3xl" />
        <div aria-hidden="true" className="absolute -bottom-32 -left-16 size-96 rounded-full bg-black/10 blur-3xl" />

        <Link to="/" className="relative text-lg font-semibold tracking-tight">
          VX-Workhorse
        </Link>

        <div className="relative max-w-sm space-y-6">
          <h2 className="text-3xl font-semibold tracking-tight text-balance">
            Run your service business from one place
          </h2>
          <ul className="space-y-3 text-sm text-white/90">
            {HIGHLIGHTS.map((h) => (
              <li key={h} className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                {h}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-white/70">© {new Date().getFullYear()} VX-Workhorse</p>
      </div>

      {/* ── Form panel ── */}
      <div className="flex flex-col items-center justify-center gap-6 p-6 sm:p-10">
        {/* Mobile logo */}
        <Link to="/" className="text-lg font-semibold tracking-tight lg:hidden">
          VX-Workhorse
        </Link>

        <div className="w-full max-w-2xl">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Create your account</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Set up your business and start taking bookings.
              </p>
            </div>
            <p className="shrink-0 text-sm text-muted-foreground">
              <Link to="/login" className="font-medium text-foreground hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                {/* ── Left: Business ── */}
                <div className="space-y-4">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Business
                  </p>
                  <FormField
                    control={form.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="businessType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business type</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange} disabled={typesLoading}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {businessTypes.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Address{' '}
                          <span className="font-normal text-muted-foreground">(optional)</span>
                        </FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* ── Right: Account ── */}
                <div className="space-y-4 sm:border-l sm:pl-8">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Your account
                  </p>
                  <FormField
                    control={form.control}
                    name="ownerFullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input type="tel" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                variant="brand"
                className="mt-8 w-full"
                disabled={registerTenant.isPending}
              >
                {registerTenant.isPending ? 'Creating account…' : 'Create account'}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
