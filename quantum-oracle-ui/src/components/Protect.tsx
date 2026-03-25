import { useRef, useState } from 'react';
import {
  decryptData,
  decryptFile,
  encryptData,
  encryptFile,
  generatePQCKey,
  hashData,
  kemDecapsulate,
  kemEncapsulate,
  kemGenerate,
  signData,
  signPqc,
  verifyDataSignature,
  verifyPqc,
} from '@/utils/api';
import { Badge, CopyButton, DownloadButton, InfoPopover, KVRow, MonoValue } from './ui';

type EncAlgo = 'AES-256-GCM' | 'AES-128-GCM' | 'AES-256-CBC';
type SignAlgo = 'HMAC-SHA256' | 'HMAC-SHA512';
type HashAlgo = 'SHA3-256' | 'SHA3-512' | 'PBKDF2-SHA256' | 'BLAKE2b-256';

interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  tag: string;
  key: string;
  algorithm: string;
  quantum_enhanced: boolean;
  original_filename?: string;
  original_size?: number;
}

export const Protect = () => {
  // Encrypt / Decrypt
  const [encMode, setEncMode] = useState<'text' | 'file'>('text');
  const [encAlgo, setEncAlgo] = useState<EncAlgo>('AES-256-GCM');
  const [useCustomKey, setUseCustomKey] = useState(false);
  const [customKey, setCustomKey] = useState('');
  const [plainText, setPlainText] = useState('');
  const [encFile, setEncFile] = useState<File | null>(null);
  const [encrypted, setEncrypted] = useState<EncryptedPayload | null>(null);
  const [decryptedText, setDecryptedText] = useState<string | null>(null);
  const [decryptedFileB64, setDecryptedFileB64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sign / Verify
  const [signAlgo, setSignAlgo] = useState<SignAlgo>('HMAC-SHA256');
  const [signaturePayload, setSignaturePayload] = useState('');
  const [signatureResult, setSignatureResult] = useState<{ signature: string; public_key: string; algorithm: string; data_hash?: string } | null>(null);
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null);
  // Standalone verify
  const [svMessage, setSvMessage] = useState('');
  const [svSignature, setSvSignature] = useState('');
  const [svKey, setSvKey] = useState('');
  const [svAlgo, setSvAlgo] = useState<SignAlgo>('HMAC-SHA256');
  const [svResult, setSvResult] = useState<boolean | null>(null);

  // Hash
  const [hashMode, setHashMode] = useState<'data' | 'password'>('data');
  const [hashInput, setHashInput] = useState('');
  const [hashAlgorithm, setHashAlgorithm] = useState<HashAlgo>('SHA3-256');
  const [hashIterations, setHashIterations] = useState(100000);
  const [hashResult, setHashResult] = useState<{ hash: string; salt: string; algorithm: string; iterations?: number | null } | null>(null);

  // PQC
  const [pqcAlgorithm, setPqcAlgorithm] = useState('DILITHIUM3');
  const [pqcEncoding, setPqcEncoding] = useState<'base64' | 'hex'>('base64');
  const [pqcKeypair, setPqcKeypair] = useState<{ public_key: string; private_key: string; algorithm: string; nist_level: number; key_sizes?: { public_key_bytes: number; private_key_bytes: number } } | null>(null);
  const [pqcSignMessage, setPqcSignMessage] = useState('');
  const [pqcSignature, setPqcSignature] = useState<{ signature: string; algorithm: string; signature_size_bytes: number } | null>(null);
  const [pqcVerifyResult, setPqcVerifyResult] = useState<boolean | null>(null);

  // Kyber KEM
  const [kemAlgorithm, setKemAlgorithm] = useState<'KYBER512' | 'KYBER768' | 'KYBER1024'>('KYBER768');
  const [kemEncoding, setKemEncoding] = useState<'base64' | 'hex'>('base64');
  const [kemKeypair, setKemKeypair] = useState<{ public_key: string; private_key: string; algorithm: string } | null>(null);
  const [kemSenderPubkey, setKemSenderPubkey] = useState('');
  const [kemEncapsulateResult, setKemEncapsulateResult] = useState<{ ciphertext: string; shared_secret: string; algorithm: string } | null>(null);
  const [kemCiphertext, setKemCiphertext] = useState('');
  const [kemRecipientPrivkey, setKemRecipientPrivkey] = useState('');
  const [kemDecapsulateResult, setKemDecapsulateResult] = useState<{ shared_secret: string } | null>(null);

  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- helpers ---
  const dl = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // --- Encrypt handlers ---
  const onEncrypt = async () => {
    setError(null);
    setDecryptedText(null);
    setDecryptedFileB64(null);
    setLoadingAction('encrypt');
    try {
      if (encMode === 'file' && encFile) {
        const response = await encryptFile(encFile, encAlgo, useCustomKey ? customKey : undefined);
        setEncrypted(response.data);
      } else {
        const response = await encryptData(plainText, !useCustomKey, encAlgo, useCustomKey ? customKey : undefined);
        setEncrypted(response.data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Encryption failed');
    } finally {
      setLoadingAction(null);
    }
  };

  const onDecrypt = async () => {
    if (!encrypted) return;
    setError(null);
    setLoadingAction('decrypt');
    try {
      if (encrypted.original_filename) {
        const response = await decryptFile({
          ciphertext: encrypted.ciphertext,
          key: encrypted.key,
          iv: encrypted.iv,
          tag: encrypted.tag,
          algorithm: encrypted.algorithm,
        });
        setDecryptedFileB64(response.data.content_base64);
      } else {
        const response = await decryptData({
          ciphertext: encrypted.ciphertext,
          key: encrypted.key,
          iv: encrypted.iv,
          tag: encrypted.tag,
          algorithm: encrypted.algorithm,
        });
        setDecryptedText(response.data.plaintext);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Decryption failed');
    } finally {
      setLoadingAction(null);
    }
  };

  const downloadDecryptedFile = () => {
    if (!decryptedFileB64) return;
    const bytes = Uint8Array.from(atob(decryptedFileB64), (c) => c.charCodeAt(0));
    const blob = new Blob([bytes]);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = encrypted?.original_filename ?? 'decrypted_file';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // --- Sign handlers ---
  const onSign = async () => {
    setError(null);
    setVerifyResult(null);
    setLoadingAction('sign');
    try {
      const response = await signData(signaturePayload, signAlgo);
      setSignatureResult(response.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Signing failed');
    } finally {
      setLoadingAction(null);
    }
  };

  const onVerify = async () => {
    if (!signatureResult) return;
    setError(null);
    setLoadingAction('verify');
    try {
      const response = await verifyDataSignature({
        data: signaturePayload,
        signature: signatureResult.signature,
        public_key: signatureResult.public_key,
        algorithm: signatureResult.algorithm,
      });
      setVerifyResult(response.data.valid);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verification failed');
    } finally {
      setLoadingAction(null);
    }
  };

  const onStandaloneVerify = async () => {
    setError(null);
    setSvResult(null);
    setLoadingAction('sv');
    try {
      const response = await verifyDataSignature({
        data: svMessage,
        signature: svSignature,
        public_key: svKey,
        algorithm: svAlgo,
      });
      setSvResult(response.data.valid);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verification failed');
    } finally {
      setLoadingAction(null);
    }
  };

  // --- Hash handlers ---
  const onHash = async () => {
    setError(null);
    setLoadingAction('hash');
    try {
      const algo = hashMode === 'password' ? 'PBKDF2-SHA256' as HashAlgo : hashAlgorithm;
      const response = await hashData({
        data: hashInput,
        algorithm: algo,
        use_quantum_salt: true,
        iterations: algo === 'PBKDF2-SHA256' ? hashIterations : undefined,
      });
      setHashResult(response.data as { hash: string; salt: string; algorithm: string; iterations?: number | null });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hashing failed');
    } finally {
      setLoadingAction(null);
    }
  };

  // --- PQC handlers ---
  const onPqcGenerate = async () => {
    setError(null);
    setPqcSignature(null);
    setPqcVerifyResult(null);
    setLoadingAction('pqc-gen');
    try {
      const response = await generatePQCKey(pqcAlgorithm, pqcEncoding);
      setPqcKeypair(response.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'PQC key generation failed');
    } finally {
      setLoadingAction(null);
    }
  };

  const onPqcSign = async () => {
    if (!pqcKeypair || !pqcSignMessage) return;
    setError(null);
    setPqcVerifyResult(null);
    setLoadingAction('pqc-sign');
    try {
      const response = await signPqc({
        message: pqcSignMessage,
        private_key: pqcKeypair.private_key,
        algorithm: pqcKeypair.algorithm,
        encoding: pqcEncoding,
      });
      setPqcSignature(response.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'PQC signing failed');
    } finally {
      setLoadingAction(null);
    }
  };

  const onPqcVerify = async () => {
    if (!pqcKeypair || !pqcSignature) return;
    setError(null);
    setLoadingAction('pqc-verify');
    try {
      const response = await verifyPqc({
        message: pqcSignMessage,
        signature: pqcSignature.signature,
        public_key: pqcKeypair.public_key,
        algorithm: pqcKeypair.algorithm,
        encoding: pqcEncoding,
      });
      setPqcVerifyResult(response.data.valid);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'PQC verification failed');
    } finally {
      setLoadingAction(null);
    }
  };

  // Kyber KEM handlers
  const onKemGenerate = async () => {
    setError(null);
    setKemEncapsulateResult(null);
    setKemDecapsulateResult(null);
    setLoadingAction('kem-gen');
    try {
      const response = await kemGenerate(kemAlgorithm, kemEncoding);
      setKemKeypair(response.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kyber KEM key generation failed');
    } finally {
      setLoadingAction(null);
    }
  };

  const onKemEncapsulate = async () => {
    if (!kemSenderPubkey.trim()) return;
    setError(null);
    setKemDecapsulateResult(null);
    setLoadingAction('kem-encap');
    try {
      const response = await kemEncapsulate(kemSenderPubkey.trim(), kemAlgorithm, kemEncoding);
      setKemEncapsulateResult(response.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kyber encapsulation failed');
    } finally {
      setLoadingAction(null);
    }
  };

  const onKemDecapsulate = async () => {
    if (!kemCiphertext.trim() || !kemRecipientPrivkey.trim()) return;
    setError(null);
    setLoadingAction('kem-decap');
    try {
      const response = await kemDecapsulate(kemCiphertext.trim(), kemRecipientPrivkey.trim(), kemAlgorithm, kemEncoding);
      setKemDecapsulateResult(response.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kyber decapsulation failed');
    } finally {
      setLoadingAction(null);
    }
  };

  const isPqcKemAlgo = (a: string) =>
    /^KYBER|^NTRU|^SABER/i.test(a);

  const canEncrypt = encMode === 'text' ? !!plainText : !!encFile;

  return (
    <div className="space-y-6">
      {error && <div className="error-banner">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Encrypt / Decrypt ──────────────────────────────── */}
        <div className="section space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">Encrypt / Decrypt <InfoPopover title="Encrypt / Decrypt" description="AES encryption with quantum-generated keys. Supports AES-256-GCM, AES-128-GCM, and AES-256-CBC modes, custom keys, and file encryption up to 10 MB." useCases={['Encrypt sensitive documents', 'Protect API payloads', 'File encryption with quantum keys']} /></h2>

          {/* Algorithm */}
          <div>
            <label className="label">Algorithm</label>
            <select value={encAlgo} onChange={(e) => setEncAlgo(e.target.value as EncAlgo)} className="field">
              <option value="AES-256-GCM">AES-256-GCM (recommended)</option>
              <option value="AES-128-GCM">AES-128-GCM</option>
              <option value="AES-256-CBC">AES-256-CBC</option>
            </select>
          </div>

          {/* BYO key */}
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input type="checkbox" checked={useCustomKey} onChange={(e) => setUseCustomKey(e.target.checked)} className="rounded border-slate-600" />
            Use custom key (base64)
          </label>
          {useCustomKey && (
            <input type="text" value={customKey} onChange={(e) => setCustomKey(e.target.value)} placeholder="Paste base64-encoded AES key..." className="field" />
          )}

          {/* Input mode toggle */}
          <div className="flex gap-2">
            <button onClick={() => setEncMode('text')} className={encMode === 'text' ? 'btn-primary flex-1' : 'btn-secondary flex-1'}>Text</button>
            <button onClick={() => setEncMode('file')} className={encMode === 'file' ? 'btn-primary flex-1' : 'btn-secondary flex-1'}>File</button>
          </div>

          {encMode === 'text' ? (
            <textarea
              value={plainText}
              onChange={(e) => setPlainText(e.target.value)}
              placeholder="Enter text to encrypt..."
              className="field h-28 resize-none"
            />
          ) : (
            <div>
              <input ref={fileInputRef} type="file" onChange={(e) => setEncFile(e.target.files?.[0] ?? null)} className="field file:mr-3 file:btn-secondary file:border-0 file:text-sm" />
              {encFile && <p className="text-xs text-slate-400 mt-1">{encFile.name} ({(encFile.size / 1024).toFixed(1)} KB)</p>}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={onEncrypt} disabled={!canEncrypt || loadingAction === 'encrypt'} className="flex-1 btn-primary">
              {loadingAction === 'encrypt' ? 'Encrypting...' : 'Encrypt'}
            </button>
            <button onClick={onDecrypt} disabled={!encrypted || loadingAction === 'decrypt'} className="flex-1 btn-secondary">
              {loadingAction === 'decrypt' ? 'Decrypting...' : 'Decrypt'}
            </button>
          </div>

          {encrypted && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-sm font-medium text-slate-300">Encrypted Output</span>
                <div className="flex gap-2">
                  <CopyButton value={JSON.stringify(encrypted, null, 2)} label="Copy All" />
                  <DownloadButton
                    filename={`quantum_key_${Date.now()}.json`}
                    content={JSON.stringify({ key: encrypted.key, iv: encrypted.iv, tag: encrypted.tag, algorithm: encrypted.algorithm }, null, 2)}
                    label="Download Key"
                  />
                </div>
              </div>
              <MonoValue label="Ciphertext" value={encrypted.ciphertext} truncate={80} />
              <KVRow label="IV" value={encrypted.iv} mono />
              <KVRow label="Tag" value={encrypted.tag} mono />
              <KVRow label="Algorithm" value={encrypted.algorithm} />
              <KVRow label="Quantum Enhanced" value={encrypted.quantum_enhanced ? 'Yes' : 'No'} />
              {encrypted.original_filename && <KVRow label="File" value={`${encrypted.original_filename} (${encrypted.original_size} bytes)`} />}
            </div>
          )}

          {decryptedText !== null && (
            <div className="flex items-center gap-3 pt-2 border-t border-slate-700/30">
              <Badge label="Verified" />
              <span className="text-base text-white select-all">{decryptedText}</span>
            </div>
          )}

          {decryptedFileB64 !== null && (
            <div className="flex items-center gap-3 pt-2 border-t border-slate-700/30">
              <Badge label="Verified" />
              <button onClick={downloadDecryptedFile} className="btn-primary">Download Decrypted File</button>
            </div>
          )}
        </div>

        {/* ── Sign / Verify ──────────────────────────────────── */}
        <div className="section space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">Sign / Verify <InfoPopover title="Sign / Verify" description="Create and verify HMAC signatures using quantum-random keys. Supports SHA-256 and SHA-512 for message authentication and data integrity." useCases={['API request signing', 'Message authentication', 'Data integrity verification']} /></h2>

          <div>
            <label className="label">Algorithm</label>
            <select value={signAlgo} onChange={(e) => setSignAlgo(e.target.value as SignAlgo)} className="field">
              <option value="HMAC-SHA256">HMAC-SHA256</option>
              <option value="HMAC-SHA512">HMAC-SHA512</option>
            </select>
          </div>
          <div>
            <label className="label">Message</label>
            <textarea
              value={signaturePayload}
              onChange={(e) => setSignaturePayload(e.target.value)}
              placeholder="Message to sign..."
              className="field h-28 resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={onSign} disabled={!signaturePayload || loadingAction === 'sign'} className="flex-1 btn-primary">
              {loadingAction === 'sign' ? 'Signing...' : 'Sign'}
            </button>
            <button onClick={onVerify} disabled={!signatureResult || loadingAction === 'verify'} className="flex-1 btn-secondary">
              {loadingAction === 'verify' ? 'Verifying...' : 'Verify'}
            </button>
          </div>

          {signatureResult && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-sm font-medium text-slate-300">Signature</span>
                <div className="flex gap-2">
                  <CopyButton value={signatureResult.signature} label="Copy" />
                  <DownloadButton
                    filename={`signature_${Date.now()}.json`}
                    content={JSON.stringify(signatureResult, null, 2)}
                    label="Download"
                  />
                </div>
              </div>
              <MonoValue label="Signature" value={signatureResult.signature} truncate={80} />
              <KVRow label="Algorithm" value={signatureResult.algorithm} />
              <KVRow label="Key" value={signatureResult.public_key} mono />
            </div>
          )}

          {verifyResult !== null && (
            <div className="flex items-center gap-3 pt-2 border-t border-slate-700/30">
              <Badge label={verifyResult ? 'Valid' : 'Invalid'} />
              <span className="text-base text-slate-200">
                {verifyResult ? 'Signature verified successfully' : 'Signature verification failed'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Standalone Verify ────────────────────────────────── */}
      <div className="section space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">Verify Any Signature <InfoPopover title="Verify Any Signature" description="Standalone signature verification. Paste any message, signature, and key to verify independently -- not limited to signatures created in this session." useCases={['Verify externally-produced signatures', 'Audit signature validity', 'Cross-system verification']} /></h2>
        <p className="text-sm text-slate-400">Paste an externally-produced message, signature, and key to verify independently.</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="label">Message</label>
            <textarea value={svMessage} onChange={(e) => setSvMessage(e.target.value)} placeholder="Original message..." className="field h-20 resize-none" />
          </div>
          <div className="space-y-3">
            <div>
              <label className="label">Signature (base64)</label>
              <input type="text" value={svSignature} onChange={(e) => setSvSignature(e.target.value)} placeholder="Paste signature..." className="field" />
            </div>
            <div>
              <label className="label">Key (base64)</label>
              <input type="text" value={svKey} onChange={(e) => setSvKey(e.target.value)} placeholder="Paste key..." className="field" />
            </div>
          </div>
        </div>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="label">Algorithm</label>
            <select value={svAlgo} onChange={(e) => setSvAlgo(e.target.value as SignAlgo)} className="field">
              <option value="HMAC-SHA256">HMAC-SHA256</option>
              <option value="HMAC-SHA512">HMAC-SHA512</option>
            </select>
          </div>
          <button
            onClick={onStandaloneVerify}
            disabled={!svMessage || !svSignature || !svKey || loadingAction === 'sv'}
            className="btn-primary"
          >
            {loadingAction === 'sv' ? 'Verifying...' : 'Verify'}
          </button>
        </div>
        {svResult !== null && (
          <div className="flex items-center gap-3 pt-2 border-t border-slate-700/30">
            <Badge label={svResult ? 'Valid' : 'Invalid'} />
            <span className="text-base text-slate-200">{svResult ? 'Signature is valid' : 'Signature verification failed'}</span>
          </div>
        )}
      </div>

      {/* ── Hash / Password Protection ───────────────────────── */}
      <div className="section space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">Hash / Password Protection <InfoPopover title="Hash / Password Protection" description="Quantum-salted hashing for data integrity and password storage. Supports SHA3-256, SHA3-512, PBKDF2-SHA256, and BLAKE2b-256 with configurable iterations." useCases={['Password hashing for storage', 'Data integrity checksums', 'Key derivation from passwords']} /></h2>

        {/* Mode toggle */}
        <div className="flex gap-2">
          <button onClick={() => { setHashMode('data'); setHashAlgorithm('SHA3-256'); }} className={hashMode === 'data' ? 'btn-primary flex-1' : 'btn-secondary flex-1'}>Data Hash</button>
          <button onClick={() => { setHashMode('password'); setHashAlgorithm('PBKDF2-SHA256'); }} className={hashMode === 'password' ? 'btn-primary flex-1' : 'btn-secondary flex-1'}>Password Hash</button>
        </div>

        <div>
          <label className="label">{hashMode === 'password' ? 'Password' : 'Data to Hash'}</label>
          <textarea
            value={hashInput}
            onChange={(e) => setHashInput(e.target.value)}
            placeholder={hashMode === 'password' ? 'Enter password...' : 'Enter data to hash...'}
            className="field h-24 resize-none"
          />
        </div>

        {hashMode === 'data' && (
          <div>
            <label className="label">Algorithm</label>
            <select value={hashAlgorithm} onChange={(e) => setHashAlgorithm(e.target.value as HashAlgo)} className="field">
              <option value="SHA3-256">SHA3-256</option>
              <option value="SHA3-512">SHA3-512</option>
              <option value="PBKDF2-SHA256">PBKDF2-SHA256</option>
              <option value="BLAKE2b-256">BLAKE2b-256</option>
            </select>
          </div>
        )}

        {(hashMode === 'password' || hashAlgorithm === 'PBKDF2-SHA256') && (
          <div>
            <label className="label">Iterations: {hashIterations.toLocaleString()}</label>
            <input
              type="range"
              min={10000}
              max={1000000}
              step={10000}
              value={hashIterations}
              onChange={(e) => setHashIterations(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>10k</span>
              <span>1M</span>
            </div>
          </div>
        )}

        <button onClick={onHash} disabled={!hashInput || loadingAction === 'hash'} className="w-full btn-primary">
          {loadingAction === 'hash' ? 'Hashing...' : hashMode === 'password' ? 'Hash Password' : 'Generate Hash'}
        </button>

        {hashResult && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-sm font-medium text-slate-300">{hashMode === 'password' ? 'Storable Hash' : 'Hash'}</span>
              <div className="flex gap-2">
                <CopyButton value={hashResult.hash} label="Copy Hash" />
                <DownloadButton
                  filename={`hash_package_${Date.now()}.json`}
                  content={JSON.stringify(hashResult, null, 2)}
                  label="Download"
                />
              </div>
            </div>
            <MonoValue label="Hash" value={hashResult.hash} />
            <KVRow label="Algorithm" value={hashResult.algorithm} />
            <KVRow label="Salt" value={hashResult.salt} mono />
            {hashResult.iterations != null && <KVRow label="Iterations" value={hashResult.iterations.toLocaleString()} />}
          </div>
        )}
      </div>

      {/* ── Post-Quantum Cryptography ────────────────────────── */}
      <div className="border-t border-slate-700/40 pt-6">
        <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">Post-Quantum Cryptography <InfoPopover title="Post-Quantum Cryptography" description="NIST-standardized lattice-based algorithms (DILITHIUM for signatures, KYBER for key exchange) that remain secure even against quantum computer attacks." useCases={['Future-proof digital signatures', 'Quantum-resistant key exchange', 'Blockchain wallet protection']} /></h2>
        <p className="text-sm text-slate-400 mb-5">
          Quantum-safe signatures using NIST-standardized lattice-based algorithms. These keys remain secure even against quantum computers.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* PQC Generate Key */}
          <div className="section space-y-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">Generate Quantum-Safe Key <InfoPopover title="Generate Quantum-Safe Key" description="Create DILITHIUM (signature) or KYBER (key exchange) key pairs at various NIST security levels. Keys can be exported as Base64 or Hex." useCases={['Generate post-quantum signing keys', 'Create quantum-resistant key pairs', 'Export keys for external systems']} /></h3>
            <div>
              <label className="label">Algorithm</label>
              <select value={pqcAlgorithm} onChange={(e) => setPqcAlgorithm(e.target.value)} className="field">
                <optgroup label="Signatures">
                  <option value="DILITHIUM2">DILITHIUM2 (Level 2)</option>
                  <option value="DILITHIUM3">DILITHIUM3 (Level 3 - Recommended)</option>
                  <option value="DILITHIUM5">DILITHIUM5 (Level 5)</option>
                  <option value="FALCON512">FALCON512 (Level 1, compact)</option>
                  <option value="FALCON1024">FALCON1024 (Level 5)</option>
                  <option value="SPHINCS+-SHA2-128f">SPHINCS+-SHA2-128f (Level 1, hash-based)</option>
                </optgroup>
                <optgroup label="Key Encapsulation (KEM)">
                  <option value="KYBER512">KYBER512 (Level 1)</option>
                  <option value="KYBER768">KYBER768 (Level 3)</option>
                  <option value="KYBER1024">KYBER1024 (Level 5)</option>
                  <option value="NTRU-HPS-2048-509">NTRU-HPS-2048-509 (Level 1)</option>
                  <option value="NTRU-HPS-2048-677">NTRU-HPS-2048-677 (Level 3)</option>
                  <option value="SABER-LIGHTSABER">SABER-LIGHTSABER (Level 1)</option>
                  <option value="SABER-SABER">SABER-SABER (Level 3)</option>
                  <option value="SABER-FIRESABER">SABER-FIRESABER (Level 5)</option>
                </optgroup>
              </select>
            </div>
            <div>
              <label className="label">Encoding</label>
              <select value={pqcEncoding} onChange={(e) => setPqcEncoding(e.target.value as 'base64' | 'hex')} className="field">
                <option value="base64">Base64</option>
                <option value="hex">Hex</option>
              </select>
            </div>
            <button onClick={onPqcGenerate} disabled={loadingAction === 'pqc-gen'} className="w-full btn-primary">
              {loadingAction === 'pqc-gen' ? 'Generating...' : 'Generate Key Pair'}
            </button>

            {pqcKeypair && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-sm font-medium text-slate-300">Key Pair</span>
                  <div className="flex gap-2">
                    <CopyButton value={JSON.stringify(pqcKeypair, null, 2)} label="Copy All" />
                    <DownloadButton
                      filename={`pqc_keypair_${pqcKeypair.algorithm}_${Date.now()}.json`}
                      content={JSON.stringify(pqcKeypair, null, 2)}
                      label="Download"
                    />
                  </div>
                </div>
                <KVRow label="Algorithm" value={pqcKeypair.algorithm} />
                <KVRow label="NIST Level" value={String(pqcKeypair.nist_level)} />
                {pqcKeypair.key_sizes && (
                  <>
                    <KVRow label="Public Key" value={`${pqcKeypair.key_sizes.public_key_bytes} bytes`} />
                    <KVRow label="Private Key" value={`${pqcKeypair.key_sizes.private_key_bytes} bytes`} />
                  </>
                )}
                <MonoValue label="Public Key" value={pqcKeypair.public_key} truncate={60} />
              </div>
            )}
          </div>

          {/* PQC Sign / Verify (signature algorithms only) */}
          <div className="section space-y-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">Quantum-Safe Sign / Verify <InfoPopover title="Quantum-Safe Sign / Verify" description="Sign and verify messages using post-quantum DILITHIUM, FALCON, or SPHINCS+ signatures. These signatures cannot be forged even with a quantum computer." useCases={['Quantum-resistant document signing', 'Blockchain transaction signatures', 'Long-term non-repudiation']} /></h3>
            {isPqcKemAlgo(pqcAlgorithm) ? (
              <p className="text-sm text-slate-400">KEM algorithms (KYBER, NTRU, SABER) are for key encapsulation only. Use the Kyber KEM section below for encapsulate/decapsulate workflow.</p>
            ) : (
              <>
                <div>
                  <label className="label">Message</label>
                  <textarea
                    value={pqcSignMessage}
                    onChange={(e) => setPqcSignMessage(e.target.value)}
                    placeholder="Message to sign with PQC..."
                    className="field h-24 resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={onPqcSign}
                    disabled={!pqcKeypair || !pqcSignMessage || loadingAction === 'pqc-sign'}
                    className="flex-1 btn-primary"
                  >
                    {loadingAction === 'pqc-sign' ? 'Signing...' : 'Sign (PQC)'}
                  </button>
                  <button
                    onClick={onPqcVerify}
                    disabled={!pqcSignature || loadingAction === 'pqc-verify'}
                    className="flex-1 btn-secondary"
                  >
                    {loadingAction === 'pqc-verify' ? 'Verifying...' : 'Verify (PQC)'}
                  </button>
                </div>
                {!pqcKeypair && (
                  <p className="text-xs text-slate-500">Generate a signature key pair (DILITHIUM, FALCON, SPHINCS+) first to sign and verify.</p>
                )}
              </>
            )}

            {pqcSignature && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-sm font-medium text-slate-300">PQC Signature</span>
                  <div className="flex gap-2">
                    <CopyButton value={pqcSignature.signature} label="Copy" />
                    <DownloadButton
                      filename={`pqc_signature_${Date.now()}.json`}
                      content={JSON.stringify(pqcSignature, null, 2)}
                      label="Download"
                    />
                  </div>
                </div>
                <MonoValue label="Signature" value={pqcSignature.signature} truncate={60} />
                <KVRow label="Algorithm" value={pqcSignature.algorithm} />
                <KVRow label="Size" value={`${pqcSignature.signature_size_bytes} bytes`} />
              </div>
            )}

            {pqcVerifyResult !== null && (
              <div className="flex items-center gap-3 pt-2 border-t border-slate-700/30">
                <Badge label={pqcVerifyResult ? 'Valid' : 'Invalid'} />
                <span className="text-base text-slate-200">
                  {pqcVerifyResult ? 'Post-quantum signature verified' : 'PQC signature verification failed'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Kyber Key Encapsulation (KEM) ─────────────────────── */}
      <div className="section space-y-4 border-t border-slate-700/40 pt-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">Kyber Key Encapsulation (KEM) <InfoPopover title="Kyber KEM" description="Key Encapsulation Mechanism for quantum-safe shared secrets. Recipient generates a keypair; sender encapsulates a shared secret with the public key; recipient decapsulates with the private key. Both obtain the same secret for symmetric encryption." useCases={['Quantum-safe key exchange', 'Establish shared secret between parties', 'Pre-quantum key agreement replacement']} /></h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 1. Recipient: Generate keypair */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-300">1. Recipient: Generate Keypair</h3>
            <div>
              <label className="label">Algorithm</label>
              <select value={kemAlgorithm} onChange={(e) => setKemAlgorithm(e.target.value as 'KYBER512' | 'KYBER768' | 'KYBER1024')} className="field">
                <option value="KYBER512">KYBER512 (Level 1)</option>
                <option value="KYBER768">KYBER768 (Level 3)</option>
                <option value="KYBER1024">KYBER1024 (Level 5)</option>
              </select>
            </div>
            <div>
              <label className="label">Encoding</label>
              <select value={kemEncoding} onChange={(e) => setKemEncoding(e.target.value as 'base64' | 'hex')} className="field">
                <option value="base64">Base64</option>
                <option value="hex">Hex</option>
              </select>
            </div>
            <button onClick={onKemGenerate} disabled={loadingAction === 'kem-gen'} className="btn-primary w-full">
              {loadingAction === 'kem-gen' ? 'Generating...' : 'Generate Keypair'}
            </button>
            {kemKeypair && (
              <div className="space-y-2 pt-2">
                <div className="flex gap-2">
                  <CopyButton value={kemKeypair.public_key} label="Copy Public" />
                  <CopyButton value={kemKeypair.private_key} label="Copy Private" />
                </div>
                <MonoValue label="Public Key" value={kemKeypair.public_key} truncate={50} />
                <p className="text-xs text-slate-500">Share public key with sender; keep private key secret.</p>
              </div>
            )}
          </div>
          {/* 2. Sender: Encapsulate */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-300">2. Sender: Encapsulate</h3>
            <div>
              <label className="label">Recipient&apos;s Public Key</label>
              <textarea value={kemSenderPubkey} onChange={(e) => setKemSenderPubkey(e.target.value)} placeholder="Paste recipient's public key..." className="field h-20 resize-none text-sm" />
            </div>
            <button onClick={onKemEncapsulate} disabled={!kemSenderPubkey.trim() || loadingAction === 'kem-encap'} className="btn-primary w-full">
              {loadingAction === 'kem-encap' ? 'Encapsulating...' : 'Encapsulate'}
            </button>
            {kemEncapsulateResult && (
              <div className="space-y-2 pt-2">
                <MonoValue label="Ciphertext" value={kemEncapsulateResult.ciphertext} truncate={50} />
                <MonoValue label="Shared Secret" value={kemEncapsulateResult.shared_secret} truncate={50} />
                <p className="text-xs text-slate-500">Send ciphertext to recipient; use shared secret for encryption.</p>
              </div>
            )}
          </div>
          {/* 3. Recipient: Decapsulate */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-300">3. Recipient: Decapsulate</h3>
            <div>
              <label className="label">Ciphertext</label>
              <textarea value={kemCiphertext} onChange={(e) => setKemCiphertext(e.target.value)} placeholder="Paste ciphertext from sender..." className="field h-20 resize-none text-sm" />
            </div>
            <div>
              <label className="label">Your Private Key</label>
              <textarea value={kemRecipientPrivkey} onChange={(e) => setKemRecipientPrivkey(e.target.value)} placeholder="Paste your private key..." className="field h-20 resize-none text-sm" />
            </div>
            <button onClick={onKemDecapsulate} disabled={!kemCiphertext.trim() || !kemRecipientPrivkey.trim() || loadingAction === 'kem-decap'} className="btn-secondary w-full">
              {loadingAction === 'kem-decap' ? 'Decapsulating...' : 'Decapsulate'}
            </button>
            {kemDecapsulateResult && (
              <div className="space-y-2 pt-2">
                <MonoValue label="Shared Secret" value={kemDecapsulateResult.shared_secret} truncate={50} />
                {kemEncapsulateResult && (
                  <p className={`text-xs ${kemDecapsulateResult.shared_secret === kemEncapsulateResult.shared_secret ? 'text-green-400' : 'text-amber-400'}`}>
                    {kemDecapsulateResult.shared_secret === kemEncapsulateResult.shared_secret ? 'Match! Shared secret verified.' : 'Mismatch (different algorithm/encoding?).'}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
