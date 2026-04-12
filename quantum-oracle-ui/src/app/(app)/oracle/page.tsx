import { redirect } from 'next/navigation';

/** /oracle is not a standalone page — redirect to the operator request form. */
export default function OracleIndexPage() {
  redirect('/oracle/request');
}
