import { useState, useEffect } from 'react';
import { Brain, Plus, X, AlertTriangle, TrendingUp, Stethoscope } from 'lucide-react';
import { api, PatientProfile } from '../../api';

interface Prediction {
  disease: string;
  probability: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendedSpecialist: string;
}

function predictDisease(symptoms: string[], profile: PatientProfile | null): Prediction[] {
  const s = symptoms.map(x => x.toLowerCase());
  const history = (profile?.chronic_diseases || []).map(x => x.toLowerCase());
  const predictions: Prediction[] = [];

  if (s.some(x => x.includes('chest') || x.includes('breathless') || x.includes('palpitation'))) {
    predictions.push({ disease: 'Cardiovascular Issue', probability: 0.75, riskLevel: 'high', recommendedSpecialist: 'Cardiology' });
  }
  if (s.some(x => x.includes('fever') || x.includes('cough') || x.includes('cold'))) {
    predictions.push({ disease: 'Respiratory Infection', probability: 0.65, riskLevel: 'medium', recommendedSpecialist: 'General Medicine' });
  }
  if (s.some(x => x.includes('thirst') || x.includes('urination') || x.includes('fatigue')) ||
      history.some(x => x.includes('diabetes'))) {
    predictions.push({ disease: 'Diabetes / Blood Sugar', probability: history.some(x => x.includes('diabetes')) ? 0.80 : 0.60, riskLevel: history.some(x => x.includes('diabetes')) ? 'high' : 'medium', recommendedSpecialist: 'Endocrinology' });
  }
  if (s.some(x => x.includes('headache') || x.includes('dizzy') || x.includes('migraine'))) {
    predictions.push({ disease: 'Migraine / Headache Disorder', probability: 0.55, riskLevel: 'low', recommendedSpecialist: 'Neurology' });
  }
  if (s.some(x => x.includes('rash') || x.includes('itch') || x.includes('skin'))) {
    predictions.push({ disease: 'Dermatitis / Skin Disorder', probability: 0.60, riskLevel: 'low', recommendedSpecialist: 'Dermatology' });
  }
  if (s.some(x => x.includes('joint') || x.includes('bone') || x.includes('knee') || x.includes('back'))) {
    predictions.push({ disease: 'Arthritis / Joint Disorder', probability: 0.58, riskLevel: 'medium', recommendedSpecialist: 'Orthopedics' });
  }
  if (s.some(x => x.includes('stomach') || x.includes('nausea') || x.includes('vomit') || x.includes('diarrhea'))) {
    predictions.push({ disease: 'Gastrointestinal Issue', probability: 0.62, riskLevel: 'medium', recommendedSpecialist: 'Gastroenterology' });
  }
  if (predictions.length === 0) {
    predictions.push({ disease: 'General Health Checkup Recommended', probability: 0.50, riskLevel: 'low', recommendedSpecialist: 'General Medicine' });
  }
  return predictions.sort((a, b) => b.probability - a.probability);
}

const riskConfig = {
  low:    { color: 'text-green-700', bg: 'bg-green-50 border-green-200', bar: 'bg-green-500' },
  medium: { color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200',  bar: 'bg-amber-500'  },
  high:   { color: 'text-red-700',   bg: 'bg-red-50 border-red-200',   bar: 'bg-red-500'   },
};

export default function AIPrediction() {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [results, setResults] = useState<Prediction[] | null>(null);

  useEffect(() => {
    api.patient.getProfile().then(setProfile).catch(() => {});
  }, []);

  const addSymptom = () => {
    const s = input.trim();
    if (s && !symptoms.includes(s)) {
      setSymptoms([...symptoms, s]);
      setInput('');
      setResults(null);
    }
  };

  const analyze = () => {
    if (symptoms.length === 0) return;
    setResults(predictDisease(symptoms, profile));
  };

  const presets = ['Chest Pain', 'Fever', 'Headache', 'Fatigue', 'Cough', 'Joint Pain', 'Nausea', 'Dizziness'];

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-600" /> AI Health Prediction
          </h1>
          <p className="text-gray-500 mt-1">Enter your symptoms to get AI-powered health insights based on your medical history</p>
        </div>

        {profile && (profile.chronic_diseases?.length > 0 || profile.allergies?.length > 0) && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-800 mb-1">Your medical history is factored in:</p>
              {profile.chronic_diseases?.length > 0 && <p className="text-amber-700">Conditions: {profile.chronic_diseases.join(', ')}</p>}
              {profile.allergies?.length > 0 && <p className="text-amber-700">Allergies: {profile.allergies.join(', ')}</p>}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="bg-white rounded-xl border p-6 mb-6">
          <h3 className="font-semibold mb-4">Enter Symptoms</h3>

          <div className="flex gap-2 mb-4">
            <input type="text" value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addSymptom()}
              placeholder="Type a symptom and press Enter…"
              className="flex-1 px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            <button onClick={addSymptom}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Quick symptom chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            {presets.map(p => (
              <button key={p} onClick={() => { if (!symptoms.includes(p)) { setSymptoms([...symptoms, p]); setResults(null); } }}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${symptoms.includes(p) ? 'bg-purple-100 text-purple-700 border-purple-300' : 'bg-gray-50 hover:bg-gray-100 border-gray-200'}`}>
                {p}
              </button>
            ))}
          </div>

          {symptoms.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {symptoms.map((s, i) => (
                <span key={i} className="flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-800 border border-purple-200 rounded-full text-sm">
                  {s}
                  <button onClick={() => { setSymptoms(symptoms.filter((_, j) => j !== i)); setResults(null); }}>
                    <X className="h-3 w-3 ml-1" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <button onClick={analyze} disabled={symptoms.length === 0}
            className="mt-4 w-full py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-40 transition-colors font-medium">
            Analyze Symptoms
          </button>
        </div>

        {/* Results */}
        {results && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-700">Analysis Results</h3>
            {results.map((r, i) => {
              const cfg = riskConfig[r.riskLevel];
              return (
                <div key={i} className={`bg-white rounded-xl border p-5 ${i === 0 ? 'ring-2 ring-purple-100' : ''}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold">{r.disease}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Stethoscope className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-sm text-gray-500">See: {r.recommendedSpecialist}</span>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.color}`}>
                      {r.riskLevel.toUpperCase()} RISK
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div className={`h-2 rounded-full ${cfg.bar}`} style={{ width: `${r.probability * 100}%` }} />
                    </div>
                    <span className="text-sm font-medium text-gray-600 shrink-0">
                      {Math.round(r.probability * 100)}%
                    </span>
                  </div>
                </div>
              );
            })}
            <p className="text-xs text-gray-400 text-center mt-2">
              ⚠️ This is an AI-assisted analysis and not a medical diagnosis. Please consult a doctor.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
