import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';

const navLinkClass = ({ isActive }) =>
  cn(
    'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:py-2',
    isActive && 'bg-muted text-foreground'
  );

function NavGroup({ item, onNavigate }) {
  const location = useLocation();
  const hasActiveChild = item.children.some((child) =>
    child.end ? location.pathname === child.to : location.pathname.startsWith(child.to)
  );
  const [open, setOpen] = useState(hasActiveChild);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:py-2',
          hasActiveChild && 'text-foreground'
        )}
      >
        <span className="flex items-center gap-2">
          <item.icon className="size-4" />
          {item.label}
        </span>
        <ChevronRight className={cn('size-3.5 transition-transform duration-200', open && 'rotate-90')} />
      </button>

      {open && (
        <div className="ml-3 mt-0.5 flex flex-col gap-0.5 border-l pl-3">
          {item.children.map((child) => (
            <NavLink
              key={child.to}
              to={child.to}
              end={child.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:py-1.5',
                  isActive && 'text-foreground'
                )
              }
            >
              <child.icon className="size-3.5" />
              {child.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SidebarNav({ items, className, onNavigate }) {
  return (
    <nav className={cn('flex flex-col gap-1', className)}>
      {items.map((item) =>
        item.type === 'group' ? (
          <NavGroup key={item.label} item={item} onNavigate={onNavigate} />
        ) : (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={navLinkClass}
          >
            <item.icon className="size-4" />
            {item.label}
          </NavLink>
        )
      )}
    </nav>
  );
}
