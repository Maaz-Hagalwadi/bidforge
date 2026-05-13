export interface SidebarLink {
  icon: string;
  label: string;
  short: string;
  path: string;
}

export const CLIENT_SIDEBAR: readonly SidebarLink[] = [
  { icon: 'dashboard',    label: 'Dashboard',         short: 'Home',        path: '/client/dashboard'     },
  { icon: 'work',         label: 'My Projects',       short: 'Projects',    path: '/client/jobs'          },
  { icon: 'inventory_2',  label: 'Archived Jobs',     short: 'Archive',     path: '/client/archived-jobs' },
  { icon: 'mail',         label: 'Invites',           short: 'Invites',     path: '/client/invites'       },
  { icon: 'gavel',        label: 'Bids',              short: 'Bids',        path: '/client/bids'          },
  { icon: 'person_search',label: 'Find Freelancers',  short: 'Freelancers', path: '/client/freelancers'   },
  { icon: 'chat',         label: 'Messages',          short: 'Messages',    path: '/messages'             },
  { icon: 'receipt_long', label: 'Contracts',         short: 'Contracts',   path: '/contracts'            },
  { icon: 'balance',      label: 'Disputes',          short: 'Disputes',    path: '/disputes'             },
  { icon: 'payments',     label: 'Payments',          short: 'Payments',    path: '/payments'             },
];

export const FREELANCER_SIDEBAR: readonly SidebarLink[] = [
  { icon: 'dashboard',    label: 'Dashboard',   short: 'Home',      path: '/freelancer/dashboard' },
  { icon: 'search',       label: 'Browse Jobs', short: 'Browse',    path: '/browse'               },
  { icon: 'mail',         label: 'My Invites',  short: 'Invites',   path: '/freelancer/invites'   },
  { icon: 'gavel',        label: 'My Bids',     short: 'Bids',      path: '/freelancer/bids'      },
  { icon: 'chat',         label: 'Messages',    short: 'Messages',  path: '/messages'             },
  { icon: 'receipt_long', label: 'Contracts',   short: 'Contracts', path: '/contracts'            },
  { icon: 'balance',      label: 'Disputes',    short: 'Disputes',  path: '/disputes'             },
  { icon: 'payments',     label: 'Payments',    short: 'Payments',  path: '/payments'             },
];

export const ADMIN_SIDEBAR: readonly SidebarLink[] = [
  { icon: 'dashboard',        label: 'Dashboard',       short: 'Dash',     path: '/admin/dashboard' },
  { icon: 'analytics',        label: 'Analytics',       short: 'Analytics',path: '/admin/analytics' },
  { icon: 'group',            label: 'User Management', short: 'Users',    path: '/admin/users'     },
  { icon: 'fact_check',       label: 'Job Moderation',  short: 'Jobs',     path: '/admin/jobs'      },
  { icon: 'gavel',            label: 'Disputes',         short: 'Disputes', path: '/admin/disputes'  },
  { icon: 'payments',         label: 'Revenue',          short: 'Revenue',  path: '/admin/revenue'   },
];

export function withActive(links: readonly SidebarLink[], pathname: string): (SidebarLink & { active: boolean })[] {
  return links.map(l => ({ ...l, active: !!l.path && pathname === l.path }));
}
