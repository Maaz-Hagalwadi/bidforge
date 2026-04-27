export interface Overview {
  activeJobs: number;
  activeJobsChangePercent: number;
  totalBids: number;
  bidsChange: string;
  ongoingContracts: number;
  contractsChangePercent: number;
  totalSpent: number;
}

export interface RecentProject {
  title: string;
  status: 'OPEN' | 'ASSIGNED' | 'COMPLETED';
  description?: string;
  bidsReceived: number;
  budget?: string;
  postedTime?: string;
  assignedTo?: string;
  milestonesCompleted?: number;
  totalMilestones?: number;
  dueDate?: string;
  totalValue?: number;
  paidOut: boolean;
}

export interface RecommendedFreelancer {
  name: string;
  title: string;
  rating: number;
  reviewsCount: number;
}

export interface NewsItem {
  title: string;
  description: string;
}

export interface ClientDashboardData {
  overview: Overview;
  recentProjects: RecentProject[];
  recommendedFreelancers: RecommendedFreelancer[];
  news: NewsItem[];
}

export interface FreelancerOverview {
  activeBids: number;
  bidsEndingSoon: number;
  ongoingContracts: number;
  successRate: number;
  completedJobs: number;
  totalEarned: number;
}

export interface FreelancerActivity {
  type: 'BID' | 'PAYMENT' | 'REVIEW';
  title: string;
  description: string;
  time: string;
}

export interface FreelancerProfileCompletion {
  percentage: number;
  portfolioAdded: boolean;
  skillsAdded: boolean;
  bioAdded: boolean;
}

export interface FreelancerDashboardData {
  welcomeMessage: string;
  overview: FreelancerOverview;
  recentActivities: FreelancerActivity[];
  profileCompletion: FreelancerProfileCompletion;
}
