import { Link, usePage } from '@inertiajs/react';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

type InertiaLinkProps = React.ComponentProps<typeof Link>;

interface NavLinkProps extends Omit<InertiaLinkProps, 'className' | 'href'> {
    to: string;
    className?: string;
    activeClassName?: string;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
    ({ className, activeClassName, to, ...props }, ref) => {
        const page = usePage();
        const isActive = page.url === to;

        return (
            <Link
                ref={ref}
                href={to}
                className={cn(className, isActive && activeClassName)}
                {...props}
            />
        );
    },
);

NavLink.displayName = 'NavLink';

export { NavLink };
