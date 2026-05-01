export interface SidebarLink {
  icon: string;
  label: string;
  short: string;
  path: string;
}

export const CLIENT_SIDEBAR: readonly SidebarLink[] = [
  { icon: 'dashboard',    label: 'Dashboard',   short: 'Home',      path: '/client/dashboard' },
  { icon: 'work',         label: 'My Projects', short: 'Projects',  path: '/client/jobs'      },
  { icon: 'mail',         label: 'Invites',     short: 'Invites',   path: '/client/invites'   },
  { icon: 'gavel',        label: 'Bids',        short: 'Bids',      path: '/client/bids'      },
  { icon: 'chat',         label: 'Messages',    short: 'Messages',  path: '/messages'         },
  { icon: 'receipt_long', label: 'Contracts',   short: 'Contracts', path: '/contracts'        },
  { icon: 'payments',     label: 'Payments',    short: 'Payments',  path: ''                  },
];

export const FREELANCER_SIDEBAR: readonly SidebarLink[] = [
  { icon: 'dashboard',    label: 'Dashboard',   short: 'Home',      path: '/freelancer/dashboard' },
  { icon: 'search',       label: 'Browse Jobs', short: 'Browse',    path: '/browse'               },
  { icon: 'mail',         label: 'My Invites',  short: 'Invites',   path: '/freelancer/invites'   },
  { icon: 'gavel',        label: 'My Bids',     short: 'Bids',      path: '/freelancer/bids'      },
  { icon: 'chat',         label: 'Messages',    short: 'Messages',  path: '/messages'             },
  { icon: 'receipt_long', label: 'Contracts',   short: 'Contracts', path: '/contracts'            },
  { icon: 'payments',     label: 'Payments',    short: 'Payments',  path: ''                      },
];

export function withActive(links: readonly SidebarLink[], pathname: string): (SidebarLink & { active: boolean })[] {
  return links.map(l => ({ ...l, active: !!l.path && pathname === l.path }));
}
