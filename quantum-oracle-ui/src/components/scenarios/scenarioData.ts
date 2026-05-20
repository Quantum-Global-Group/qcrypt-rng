import type { ScenarioDef } from './types';

export const SCENARIOS: ScenarioDef[] = [
  {
    id: 'lottery',
    slug: 'lottery',
    title: 'Fair lottery with audit trail',
    subtitle: 'Scenario A',
    goal: 'Run a fair draw with tamper-evident inputs and a traceable randomness record.',
    steps: [
      {
        title: 'Fingerprint the draw pool',
        description:
          'Hash or sign the participant or ticket manifest before the draw. Retain the digest as public evidence of who was eligible.',
        pillars: ['Protect', 'Prove'],
        routes: [
          { label: 'Home → protect tab', href: '/?tab=protect' },
          { label: 'Blockchain → Protect', href: '/blockchain/protect' },
        ],
        endpoints: ['POST /api/v2/protect/hash', 'POST /api/v2/protect/sign', 'POST /api/v2/protect/encrypt'],
      },
      {
        title: 'Commit to entropy',
        description:
          'Run Quantum VRF: create a seed commitment, then prove with round or draw parameters bound in the proof input.',
        pillars: ['Prove', 'Randomize'],
        routes: [
          { label: 'Home → oracle tab (VRF)', href: '/?tab=oracle' },
          { label: 'Blockchain → Randomize', href: '/blockchain/randomize' },
        ],
        endpoints: ['POST /api/v2/oracle/vrf/seed', 'POST /api/v2/oracle/vrf/prove'],
      },
      {
        title: 'Execute and verify the draw',
        description: 'Reveal the seed and verify the VRF proof. Archive commitment, proof, and verification output for audit.',
        pillars: ['Prove'],
        routes: [
          { label: 'Home → oracle tab (VRF verify)', href: '/?tab=oracle' },
          { label: 'Blockchain → Randomize', href: '/blockchain/randomize' },
        ],
        endpoints: ['POST /api/v2/oracle/vrf/reveal', 'POST /api/v2/oracle/vrf/verify'],
      },
      {
        title: 'Optional: trace oracle requests',
        description: 'If also using batch oracle requests, monitor fulfillment in the network view.',
        pillars: ['Randomize'],
        routes: [{ label: 'Home → network tab', href: '/?tab=network' }],
        endpoints: ['GET /api/v2/oracle/network-info', 'GET /api/v2/oracle/status/{request_id}'],
        manual: true,
      },
    ],
    gaps: [
      'No single guided lottery wizard — compose steps across dashboard tabs and blockchain pages.',
      'POST /oracle/request does not persist seed/randomness by request_id for consistent reveal (prefer VRF).',
      'VRF state is in-memory — audit trail is lost on API restart.',
    ],
  },
  {
    id: 'sealed-bid',
    slug: 'sealed-bid',
    title: 'Sealed bid',
    subtitle: 'Scenario B',
    goal: 'Collect bids that stay confidential until open, then reveal verifiably.',
    steps: [
      {
        title: 'Seal each bid',
        description: 'Encrypt bid content; distribute only ciphertext to participants or a bulletin board.',
        pillars: ['Protect'],
        routes: [
          { label: 'Home → protect tab', href: '/?tab=protect' },
          { label: 'Blockchain → Protect (encrypt)', href: '/blockchain/protect' },
        ],
        endpoints: ['POST /api/v2/protect/encrypt', 'POST /api/v2/protect/encrypt-file'],
      },
      {
        title: 'Commit publicly',
        description: 'Hash or sign the ciphertext (or a Merkle root). Optional PQC signature for long-term integrity.',
        pillars: ['Prove', 'Protect'],
        routes: [
          { label: 'Home → protect tab', href: '/?tab=protect' },
          { label: 'Blockchain → Protect', href: '/blockchain/protect' },
          { label: 'Blockchain → Prove', href: '/blockchain/prove' },
        ],
        endpoints: ['POST /api/v2/protect/hash', 'POST /api/v2/protect/sign', 'POST /api/v2/pqc/sign'],
      },
      {
        title: 'Close collection',
        description: 'Record deadline and published commitments — operational step outside the product today.',
        pillars: ['Protect'],
        routes: [],
        manual: true,
        gap: 'No auction-round model, round IDs, or deadlines in API/UI.',
      },
      {
        title: 'Open and verify',
        description: 'Decrypt bids with the saved key material, then verify signatures or hashes.',
        pillars: ['Protect', 'Prove'],
        routes: [
          { label: 'Home → protect tab (decrypt)', href: '/?tab=protect' },
          { label: 'Blockchain → Protect (decrypt)', href: '/blockchain/protect' },
          { label: 'Blockchain → Prove (verify)', href: '/blockchain/prove' },
        ],
        endpoints: ['POST /api/v2/protect/decrypt', 'POST /api/v2/protect/verify', 'POST /api/v2/pqc/verify'],
      },
    ],
    gaps: [
      'No time-lock or conditional reveal — encrypt-only demo until manual open.',
      'No first-class auction-round or open-phase workflow.',
    ],
  },
  {
    id: 'committee',
    slug: 'committee',
    title: 'Committee-style selection',
    subtitle: 'Scenario C',
    goal: 'Unbiased selection of a subset (e.g. jurors, reviewers) with auditability.',
    steps: [
      {
        title: 'Attest the pool',
        description: 'Hash and optionally PQC-sign the canonical roster so later selection can reference a fixed candidate set.',
        pillars: ['Prove', 'Protect'],
        routes: [
          { label: 'Blockchain → Prove', href: '/blockchain/prove' },
          { label: 'Blockchain → Protect (hash)', href: '/blockchain/protect' },
          { label: 'Home → protect tab', href: '/?tab=protect' },
        ],
        endpoints: ['POST /api/v2/protect/hash', 'POST /api/v2/pqc/sign', 'POST /api/v2/pqc/verify'],
      },
      {
        title: 'Bind randomness to the round',
        description: 'VRF seed → prove with round ID in proof input to obtain a committed beacon for this selection.',
        pillars: ['Randomize', 'Prove'],
        routes: [
          { label: 'Home → oracle tab (VRF)', href: '/?tab=oracle' },
          { label: 'Blockchain → Randomize', href: '/blockchain/randomize' },
        ],
        endpoints: ['POST /api/v2/oracle/vrf/seed', 'POST /api/v2/oracle/vrf/prove'],
      },
      {
        title: 'Reveal and verify',
        description: 'Reveal and verify VRF output to obtain auditable randomness for the round.',
        pillars: ['Prove'],
        routes: [
          { label: 'Home → oracle tab', href: '/?tab=oracle' },
          { label: 'Blockchain → Randomize', href: '/blockchain/randomize' },
        ],
        endpoints: ['POST /api/v2/oracle/vrf/reveal', 'POST /api/v2/oracle/vrf/verify'],
      },
      {
        title: 'Select committee members',
        description:
          'Apply a documented deterministic shuffle or sampling algorithm to roster + verified VRF output.',
        pillars: ['Prove'],
        routes: [],
        manual: true,
        gap: 'No select-committee API or UI — mapping VRF output to roster indices is external.',
        endpoints: ['POST /api/v2/protect/secure-random (type=integer, optional)'],
      },
    ],
    gaps: [
      'Committee selection algorithm and UI are not first-class — manual step required.',
      'Optional integer sampling exists on API only (secure-random); no dedicated committee flow.',
    ],
  },
];

export function getScenarioBySlug(slug: string): ScenarioDef | undefined {
  return SCENARIOS.find((s) => s.slug === slug);
}
