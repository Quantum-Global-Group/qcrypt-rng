export type Pillar = 'Prove' | 'Protect' | 'Randomize';

export type ScenarioStep = {
  title: string;
  description: string;
  pillars: Pillar[];
  routes: { label: string; href: string }[];
  endpoints?: string[];
  gap?: string;
  manual?: boolean;
};

export type ScenarioDef = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  goal: string;
  steps: ScenarioStep[];
  gaps: string[];
};
