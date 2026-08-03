import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Search, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '../../api';

function extractScanPayload(decoded: string): { id: string; type: 'patient' | 'family' } | null {
  const value = decoded.trim();
  if (!value) return null;

  try {
    const data = JSON.parse(value);
    if (data?.type === 'healthcard_family' && typeof data.familyId === 'string') {
      return { id: data.familyId.trim(), type: 'family' };
    }
    if (data?.type === 'healthcard_patient' && typeof data.patientId === 'string') {
      return { id: data.patientId.trim(), type: 'patient' };
    }
  } catch {
    // Not a JSON payload; continue with URL/raw parsing.
  }

  try {
    const url = new URL(value);
    const patientFromPath = url.pathname.match(/\/doctor\/patient\/([^/?#]+)/);
    if (patientFromPath?.[1]) return { id: decodeURIComponent(patientFromPath[1]).trim(), type: 'patient' };
    const patientFromQuery = url.searchParams.get('patientId');
    if (patientFromQuery) return { id: patientFromQuery.trim(), type: 'patient' };
  } catch {
    // Not a URL; treat as a raw ID.
  }

  return { id: value, type: 'patient' };
}

export default function ScanQR() {
  const navigate = useNavigate();
  const [patientId, setPatientId] = useState('');
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const scannerRef = useRef<any>(null);
  const scannerDivRef = useRef<HTMLDivElement>(null);

  const lookup = async (id: string) => {
    const payload = extractScanPayload(id);
    if (!payload?.id) return;
    setError('');
    setLoading(true);
    try {
      if (payload.type === 'family') {
        await api.family.getFamilyMembers(payload.id);
        navigate(`/doctor/family/${payload.id}`);
        return;
      }

      const patient = await api.patient.getById(payload.id);
      if (patient.family_id) {
        await api.family.getFamilyMembers(patient.family_id);
        navigate(`/doctor/family/${patient.family_id}`);
      } else {
        navigate(`/doctor/patient/${payload.id}`);
      }
    } catch (e: any) {
      try {
        await api.family.getFamilyMembers(payload.id);
        navigate(`/doctor/family/${payload.id}`);
      } catch {
        setError(e.message || 'Patient or family not found');
      }
    } finally {
      setLoading(false);
    }
  };

  const startScanner = async () => {
    setScanning(true);
    setError('');
    try {
      // Dynamically import html5-qrcode to avoid SSR issues
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('qr-scanner-div');
      let handled = false;
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const size = Math.floor(Math.min(320, minEdge * 0.75));
            return { width: size, height: size };
          },
          aspectRatio: 1,
        },
        (decoded) => {
          if (handled) return;
          const payload = extractScanPayload(decoded);
          if (!payload?.id) return;

          handled = true;
          scanner.stop().finally(() => {
            setScanning(false);
            scannerRef.current = null;
            lookup(payload.id);
          });
        },
        () => {} // ignore failures
      );
    } catch (e: any) {
      setScanning(false);
      setError('Camera not available. Use Patient ID lookup instead. On phones, open this app with HTTPS or localhost so the browser can allow camera access.');
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => () => { stopScanner(); }, []);

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">Scan QR / Patient Lookup</h1>
          <p className="text-gray-500 mt-1">Scan a patient's QR code or enter their patient or family ID to load the full family group.</p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* QR Scanner */}
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <QrCode className="h-5 w-5 text-green-600" /> QR Code Scanner
            </h3>

            {!scanning ? (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <QrCode className="h-10 w-10 text-green-600" />
                </div>
                <p className="text-gray-500 text-sm mb-4">Point your camera at a patient's QR code</p>
                <button onClick={startScanner}
                  className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
                  Start Camera
                </button>
              </div>
            ) : (
              <div>
                <div id="qr-scanner-div" ref={scannerDivRef} className="w-full rounded-lg overflow-hidden" style={{ minHeight: 280 }} />
                <button onClick={stopScanner}
                  className="mt-3 w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors">
                  Stop Scanner
                </button>
              </div>
            )}
          </div>

          {/* Manual ID lookup */}
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-600" /> Access by ID
            </h3>
            <p className="text-sm text-gray-500 mb-4">Enter the patient's or family's ID to access the record group.</p>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">
                <AlertCircle className="h-4 w-4 shrink-0" />{error}
              </div>
            )}

            <div className="flex gap-2">
              <input type="text" value={patientId} onChange={e => setPatientId(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && lookup(patientId)}
                placeholder="Patient or Family ID (UUID)…"
                className="flex-1 px-4 py-2.5 border rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button onClick={() => lookup(patientId)} disabled={loading || !patientId.trim()}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium text-sm">
                {loading ? '…' : 'Search'}
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">How to get a Patient ID</p>
              <p className="text-blue-700">Ask the patient to show their QR code from the Patient Portal, or manually enter their Patient ID.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
