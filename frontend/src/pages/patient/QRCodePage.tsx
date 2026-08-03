import { useEffect, useState } from 'react';
import { QrCode, Download, Shield, Copy, CheckCircle } from 'lucide-react';
import QRCode from 'qrcode.react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function QRCodePage() {
  const { user } = useAuth();
  const [qrData, setQrData] = useState<{ patientId?: string; familyId?: string; qrPayload?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const appBaseUrl = import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin;
  const qrValue = qrData?.qrPayload || (qrData?.patientId ? `${appBaseUrl.replace(/\/$/, '')}/doctor/patient/${qrData.patientId}` : undefined);

  useEffect(() => {
    api.patient.getQR()
      .then(setQrData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = () => {
    if (!qrValue) return;
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `healthcard-qr-${user?.name?.replace(/\s+/g, '-')}.png`;
      a.click();
    }
  };

  const handleCopyId = () => {
    const idToCopy = qrData?.familyId || qrData?.patientId;
    if (!idToCopy) return;
    navigator.clipboard.writeText(idToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Loading QR code…</div>;

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">My QR Code</h1>
          <p className="text-gray-500 mt-1">Doctors can scan this QR to access your full family health records.</p>
        </div>

        <div className="bg-white rounded-2xl border p-8 text-center shadow-sm">
          {qrValue ? (
            <>
              <div className="inline-block p-5 bg-white border-2 border-gray-100 rounded-2xl shadow-sm mb-6">
                <QRCode
                  value={qrValue}
                  size={240}
                  level="M"
                  includeMargin
                />
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-1">{qrData?.familyId ? 'Family ID' : 'Patient ID'}</p>
                <div className="flex items-center justify-center gap-2">
                  <code className="text-xs bg-gray-100 px-3 py-1.5 rounded-lg text-gray-700 font-mono max-w-xs truncate">
                    {qrData?.familyId || qrData?.patientId}
                  </code>
                  <button onClick={handleCopyId}
                    className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors">
                    {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <button onClick={handleDownload}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                  <Download className="h-4 w-4" /> Download QR
                </button>
              </div>
              <p className="mt-4 text-xs text-gray-400 break-all">
                {qrValue}
              </p>
            </>
          ) : (
            <div className="py-12">
              <QrCode className="h-16 w-16 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400">QR code not available</p>
            </div>
          )}
        </div>

        {/* Info cards */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: <QrCode className="h-5 w-5 text-blue-600" />, bg: 'bg-blue-50', title: 'Easy Access', desc: 'Share with doctors for instant access to your family records' },
            { icon: <Shield className="h-5 w-5 text-green-600" />, bg: 'bg-green-50', title: 'Secure', desc: 'Only contains the family QR payload — no personal data exposed' },
            { icon: <CheckCircle className="h-5 w-5 text-purple-600" />, bg: 'bg-purple-50', title: 'Always Valid', desc: 'Your QR code never expires' },
          ].map(({ icon, bg, title, desc }) => (
            <div key={title} className="bg-white rounded-xl border p-4">
              <div className={`${bg} p-2 rounded-lg inline-block mb-3`}>{icon}</div>
              <p className="text-sm font-medium mb-1">{title}</p>
              <p className="text-xs text-gray-500">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
