"use client";

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { db } from '@/lib/firebase';
import { exportEncryptedVault } from './export-vault-logic';

export function ExportVaultButton() {
  const { user, masterKey } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    if (!user || !masterKey) {
      setError("Vault is locked or you are not authenticated.");
      return;
    }
    
    setExporting(true);
    setError(null);
    try {
      await exportEncryptedVault(db, user, masterKey);
    } catch (err) {
      setError("An error occurred during export.");
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <button
        onClick={handleExport}
        disabled={exporting || !masterKey}
        className="w-full py-3 rounded-lg border border-cyan-700/60 bg-cyan-950/20 text-cyan-300 text-sm font-headline uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:bg-cyan-950/40 active:scale-[0.98] disabled:opacity-50"
      >
        {exporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        {exporting ? "Decrypting & Exporting..." : "Export Encrypted Vault"}
      </button>
      {error && <p className="text-red-400 text-xs font-headline uppercase tracking-widest">{error}</p>}
      <p className="text-[10px] text-zinc-500 uppercase tracking-widest text-center">
        Offline Export • Zero-Knowledge preserved
      </p>
    </div>
  );
}
