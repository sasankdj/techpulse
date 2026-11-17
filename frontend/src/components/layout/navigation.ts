import {
  LayoutDashboard,
  Newspaper,
  Brain,
  Code2,
  Rocket,
  ShieldAlert,
  Cpu,
  Cloud,
  GitBranch,
  Atom,
  Gamepad2,
  CheckSquare,
  BellRing,
  Bookmark,
  Radio,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  section: 'main' | 'topics' | 'productivity' | 'system';
  groupFilter?: string;
}

/**
 * All 16 required sidebar navigation entries in exact order.
 */
export const SIDEBAR_NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', path: '/', icon: LayoutDashboard, section: 'main' },
  { id: 'all-news', label: 'All News', path: '/news', icon: Newspaper, section: 'main' },

  { id: 'ai-ml', label: 'AI & Machine Learning', path: '/news/ai', icon: Brain, section: 'topics', groupFilter: 'AI & Machine Learning' },
  { id: 'programming', label: 'Programming', path: '/news/programming', icon: Code2, section: 'topics', groupFilter: 'Programming' },
  { id: 'startups', label: 'Startups', path: '/news/startups', icon: Rocket, section: 'topics', groupFilter: 'Startups' },
  { id: 'cybersecurity', label: 'Cybersecurity', path: '/news/cybersecurity', icon: ShieldAlert, section: 'topics', groupFilter: 'Cybersecurity' },
  { id: 'hardware', label: 'Hardware', path: '/news/hardware', icon: Cpu, section: 'topics', groupFilter: 'Hardware' },
  { id: 'cloud-devops', label: 'Cloud & DevOps', path: '/news/cloud-devops', icon: Cloud, section: 'topics', groupFilter: 'Cloud & DevOps' },
  { id: 'open-source', label: 'Open Source', path: '/news/open-source', icon: GitBranch, section: 'topics', groupFilter: 'Open Source' },
  { id: 'science-space', label: 'Science & Space', path: '/news/science-space', icon: Atom, section: 'topics', groupFilter: 'Science & Space' },
  { id: 'gaming', label: 'Gaming', path: '/news/gaming', icon: Gamepad2, section: 'topics', groupFilter: 'Gaming' },

  { id: 'tasks', label: 'My Tasks', path: '/tasks', icon: CheckSquare, section: 'productivity' },
  { id: 'reminders', label: 'Reminders', path: '/reminders', icon: BellRing, section: 'productivity' },
  { id: 'saved', label: 'Saved Articles', path: '/saved', icon: Bookmark, section: 'productivity' },

  { id: 'notifications', label: 'Notifications', path: '/notifications', icon: Radio, section: 'system' },
  { id: 'settings', label: 'Settings', path: '/settings', icon: Settings, section: 'system' },
];

export const ROUTE_TO_GROUP: Record<string, { title: string; subtitle: string; groupName: string }> = {
  ai: {
    title: 'AI & Machine Learning',
    subtitle: 'Artificial Intelligence, ML, LLMs, AI Agents, and Research Papers',
    groupName: 'AI & Machine Learning',
  },
  programming: {
    title: 'Programming',
    subtitle: 'Web Development, JavaScript, React, Node.js, Python & Developer Tools',
    groupName: 'Programming',
  },
  startups: {
    title: 'Startups & Big Tech',
    subtitle: 'Funding rounds, founders, acquisitions, and Big Tech announcements',
    groupName: 'Startups',
  },
  cybersecurity: {
    title: 'Cybersecurity',
    subtitle: 'Vulnerabilities, zero-days, defense engineering, and threat intelligence',
    groupName: 'Cybersecurity',
  },
  hardware: {
    title: 'Hardware & Semiconductors',
    subtitle: 'Chips, GPUs, robotics, gadgets, and mobile technology',
    groupName: 'Hardware',
  },
  'cloud-devops': {
    title: 'Cloud & DevOps',
    subtitle: 'Cloud computing, Kubernetes, infrastructure, and databases',
    groupName: 'Cloud & DevOps',
  },
  'open-source': {
    title: 'Open Source',
    subtitle: 'Linux kernel, GitHub projects, and open-source ecosystem news',
    groupName: 'Open Source',
  },
  'science-space': {
    title: 'Science & Space',
    subtitle: 'Spaceflight, astronomy, physics, and scientific breakthroughs',
    groupName: 'Science & Space',
  },
  gaming: {
    title: 'Gaming',
    subtitle: 'PC & console gaming, graphics engines, and industry releases',
    groupName: 'Gaming',
  },
};
