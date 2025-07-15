'use client';

import { useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface UseSidebarNavigationOptions {
  onMenuClick?: (section: string) => void;
  debounceMs?: number;
}

export const useSidebarNavigation = (options: UseSidebarNavigationOptions = {}) => {
  const { onMenuClick, debounceMs = 100 } = options;
  const router = useRouter();
  const pathname = usePathname();
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastNavigationRef = useRef<string>('');

  const navigate = useCallback((route: string, itemId: string) => {
    // Clear any pending navigation
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }

    // Prevent duplicate navigation
    if (pathname === route || lastNavigationRef.current === route) {
      return;
    }

    // Debounce navigation to prevent rapid clicks
    navigationTimeoutRef.current = setTimeout(() => {
      try {
        lastNavigationRef.current = route;
        router.push(route);
        
        // Call onMenuClick for any additional handling
        if (onMenuClick) {
          onMenuClick(itemId);
        }
      } catch (error) {
        console.error('Navigation error:', error);
      }
    }, debounceMs);
  }, [router, pathname, onMenuClick, debounceMs]);

  const isCurrentRoute = useCallback((route: string) => {
    return pathname === route;
  }, [pathname]);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }
  }, []);

  return {
    navigate,
    isCurrentRoute,
    cleanup,
    currentPath: pathname
  };
};