'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from '@headlessui/react';

interface NavItem {
  label: string;
  href: string;
}

const FRESHDESK_ITEMS: NavItem[] = [
  { label: 'Export', href: '/freshdesk/export' },
  { label: 'Explore', href: '/freshdesk/explore' },
];

const CONFLUENCE_ITEMS: NavItem[] = [
  { label: 'Export', href: '/confluence/export' },
  { label: 'Explore', href: '/confluence/explore' },
];

export function Navbar() {
  const pathname = usePathname();

  // Check if current route is under a section
  const isFreshdeskActive = pathname.startsWith('/freshdesk');
  const isConfluenceActive = pathname.startsWith('/confluence');
  const isExportsActive = pathname === '/exports';

  return (
    <nav className="sticky top-0 z-50 flex h-13 items-center justify-between border-b border-zinc-200 bg-white px-6 dark:border-zinc-800 dark:bg-zinc-950">
      {/* Left: App Name */}
      <Link
        href="/"
        className="text-base font-semibold text-zinc-900 hover:text-zinc-700 dark:text-zinc-50 dark:hover:text-zinc-200 transition-colors"
      >
        Knowledge Exporter
      </Link>

      {/* Right: Navigation */}
      <div className="flex items-center gap-1">
        {/* Freshdesk Dropdown */}
        <Menu as="div" className="relative">
          <Menu.Button
            className={`
              rounded-md px-3 py-2 text-sm font-medium transition-colors
              ${
                isFreshdeskActive
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                  : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900'
              }
            `}
          >
            Freshdesk
            <svg
              className="ml-1 inline-block h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </Menu.Button>

          <Menu.Items className="absolute right-0 mt-2 w-40 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-zinc-900 dark:ring-zinc-800">
            <div className="py-1">
              {FRESHDESK_ITEMS.map((item) => (
                <Menu.Item key={item.href}>
                  {({ active }) => (
                    <Link
                      href={item.href}
                      className={`
                        block px-4 py-2 text-sm
                        ${
                          pathname === item.href
                            ? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                            : active
                            ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                            : 'text-zinc-700 dark:text-zinc-300'
                        }
                      `}
                    >
                      {item.label}
                    </Link>
                  )}
                </Menu.Item>
              ))}
            </div>
          </Menu.Items>
        </Menu>

        {/* Confluence Dropdown */}
        <Menu as="div" className="relative">
          <Menu.Button
            className={`
              rounded-md px-3 py-2 text-sm font-medium transition-colors
              ${
                isConfluenceActive
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                  : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900'
              }
            `}
          >
            Confluence
            <svg
              className="ml-1 inline-block h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </Menu.Button>

          <Menu.Items className="absolute right-0 mt-2 w-40 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-zinc-900 dark:ring-zinc-800">
            <div className="py-1">
              {CONFLUENCE_ITEMS.map((item) => (
                <Menu.Item key={item.href}>
                  {({ active }) => (
                    <Link
                      href={item.href}
                      className={`
                        block px-4 py-2 text-sm
                        ${
                          pathname === item.href
                            ? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                            : active
                            ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                            : 'text-zinc-700 dark:text-zinc-300'
                        }
                      `}
                    >
                      {item.label}
                    </Link>
                  )}
                </Menu.Item>
              ))}
            </div>
          </Menu.Items>
        </Menu>

        {/* Exports Link (no dropdown) */}
        <Link
          href="/exports"
          className={`
            rounded-md px-3 py-2 text-sm font-medium transition-colors
            ${
              isExportsActive
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900'
            }
          `}
        >
          Exports
        </Link>
      </div>
    </nav>
  );
}
