import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Building, Menu, Users, Layers } from 'lucide-react';

import SidebarNav from '@/components/layout/SidebarNav';
import UserMenu from '@/components/layout/UserMenu';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

const NAV_ITEMS = [
  { to: '/admin/tenants', label: 'Tenants', icon: Building },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/business-types', label: 'Business Types', icon: Layers },
];

export default function SuperAdminLayout() {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="flex min-h-svh">
      <aside className="hidden w-56 shrink-0 border-r bg-card md:flex md:flex-col">
        <div className="flex h-14 items-center border-b px-4">
          <span className="text-base font-semibold">Platform Admin</span>
        </div>
        <SidebarNav items={NAV_ITEMS} className="flex-1 p-2" />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setNavOpen(true)}>
            <Menu />
            <span className="sr-only">Open menu</span>
          </Button>
          <span className="text-sm font-medium md:hidden">Platform Admin</span>
          <div className="ml-auto">
            <UserMenu />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>

      <Sheet open={navOpen} onOpenChange={setNavOpen}>
        <SheetContent side="left" className="gap-0 p-0">
          <SheetHeader className="h-14 justify-center border-b">
            <SheetTitle>Platform Admin</SheetTitle>
          </SheetHeader>
          <SidebarNav items={NAV_ITEMS} className="flex-1 p-2" onNavigate={() => setNavOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
