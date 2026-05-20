import { notFound } from 'next/navigation';
import { PillarBridgeCallout } from '@/components/scenarios/PillarBridgeCallout';
import { ScenarioShell } from '@/components/scenarios/ScenarioShell';
import { ScenarioStepList } from '@/components/scenarios/ScenarioStepList';
import { getScenarioBySlug } from '@/components/scenarios/scenarioData';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const scenario = getScenarioBySlug(slug);
  if (!scenario) return { title: 'Scenario not found' };
  return {
    title: `qcrypt-rng // ${scenario.slug}`,
    description: scenario.goal,
  };
}

export default async function ScenarioDetailPage({ params }: Props) {
  const { slug } = await params;
  const scenario = getScenarioBySlug(slug);
  if (!scenario) notFound();

  return (
    <ScenarioShell title={scenario.title} subtitle={scenario.subtitle}>
      <PillarBridgeCallout compact />
      <ScenarioStepList scenario={scenario} />
    </ScenarioShell>
  );
}
