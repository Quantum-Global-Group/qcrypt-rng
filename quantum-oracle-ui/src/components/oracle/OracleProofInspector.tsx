'use client';

import { useState, useCallback } from 'react';
import {
  Panel,
  PanelHeader,
  PanelBody,
  Field,
  RunButton,
  MonoOut,
  Chip,
  MetaRow,
} from '@/components/research/shared';
import { getOracleRequestStatus, vrfVerify } from '@/utils/api';

export function OracleProofInspector() {
  const [rid, setRid] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusOut, setStatusOut] = useState<string>('');

  const [vC, setVC] = useState('');
  const [vA, setVA] = useState('');
  const [vO, setVO] = useState('');
  const [vS, setVS] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [valid, setValid] = useState<boolean | null>(null);

  const lookup = useCallback(async () => {
    if (!rid.trim()) return;
    setStatusLoading(true);
    setStatusOut('');
    try {
      const r = await getOracleRequestStatus(rid.trim());
      setStatusOut(JSON.stringify(r.data, null, 2));
    } catch (e) {
      setStatusOut(e instanceof Error ? e.message : 'Failed');
    } finally {
      setStatusLoading(false);
    }
  }, [rid]);

  const verify = useCallback(async () => {
    setVerifyLoading(true);
    setValid(null);
    try {
      const r = await vrfVerify({
        commitment: vC.trim(),
        alpha: vA.trim(),
        output: vO.trim(),
        seed: vS.trim(),
      });
      setValid(r.data.valid);
    } catch {
      setValid(false);
    } finally {
      setVerifyLoading(false);
    }
  }, [vC, vA, vO, vS]);

  return (
    <div className="grid grid-cols-1 gap-4">
        <Panel>
          <PanelHeader title="Oracle request lookup" />
          <PanelBody>
            <Field label="Request ID">
              <input value={rid} onChange={(e) => setRid(e.target.value)} placeholder="req_…" />
            </Field>
            <RunButton onClick={lookup} loading={statusLoading}>
              Fetch status
            </RunButton>
            {statusOut && (
              <div className="mt-3">
                <MetaRow label="Raw" value="" mono={false} />
                <MonoOut value={statusOut} minHeight="120px" highlight="none" copyable />
              </div>
            )}
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader
            title="VRF verification"
            right={valid != null ? <Chip variant={valid ? 'verified' : 'degraded'}>{valid ? 'OK' : 'FAIL'}</Chip> : undefined}
          />
          <PanelBody>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Commitment">
                <input value={vC} onChange={(e) => setVC(e.target.value)} />
              </Field>
              <Field label="Alpha">
                <input value={vA} onChange={(e) => setVA(e.target.value)} />
              </Field>
              <Field label="Output">
                <input value={vO} onChange={(e) => setVO(e.target.value)} />
              </Field>
              <Field label="Seed">
                <input value={vS} onChange={(e) => setVS(e.target.value)} />
              </Field>
            </div>
            <RunButton onClick={verify} loading={verifyLoading}>
              Verify VRF
            </RunButton>
          </PanelBody>
        </Panel>
    </div>
  );
}
