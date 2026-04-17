'use client';

import { Panel, PanelHeader, PanelBody } from '@/components/research/shared';

const CONTRACTS = [
  {
    name: 'QuantumRandomnessOracle',
    address: '0xSimulation…000001',
    functions: ['requestRandomness(uint256 numBytes)', 'fulfillRandomness(bytes32 requestId, bytes memory randomness)', 'getOracleStatus()'],
    description: 'Core oracle contract that coordinates VRF-proven randomness delivery to dApps.',
  },
  {
    name: 'PQCVerifier',
    address: '0xSimulation…000002',
    functions: ['verifyDilithiumSignature(bytes pk, bytes sig, bytes msg)', 'verifyKyberEncapsulation(bytes ct, bytes pk)'],
    description: 'On-chain verifier for Dilithium signatures and Kyber ciphertext integrity.',
  },
  {
    name: 'QuantumVault',
    address: '0xSimulation…000003',
    functions: ['protectData(bytes32 dataHash, bytes pqcSig)', 'verifyAttestation(bytes32 dataHash, bytes32 commitment)'],
    description: 'Data protection vault that anchors quantum-signed hashes on-chain.',
  },
];

export default function ContractsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Smart Contracts</h2>
        <p className="text-sm text-slate-400 mt-1">
          Simulation-mode contract registry. Connect a live network wallet to deploy on-chain.
        </p>
      </div>
      <div className="space-y-4">
        {CONTRACTS.map((c) => (
          <Panel key={c.name}>
            <PanelHeader>
              <div>
                <span className="text-sm font-semibold text-white">{c.name}</span>
                <code className="ml-3 text-xs font-mono text-slate-500">{c.address}</code>
              </div>
              <span className="text-xs text-amber-400 border border-amber-400/30 bg-amber-400/10 rounded px-2 py-0.5">
                Simulation
              </span>
            </PanelHeader>
            <PanelBody className="space-y-3">
              <p className="text-sm text-slate-400">{c.description}</p>
              <div>
                <div className="text-xs text-slate-500 mb-1">Functions</div>
                <ul className="space-y-1">
                  {c.functions.map((f) => (
                    <li key={f}>
                      <code className="text-xs font-mono text-indigo-300">{f}</code>
                    </li>
                  ))}
                </ul>
              </div>
            </PanelBody>
          </Panel>
        ))}
      </div>
    </div>
  );
}
