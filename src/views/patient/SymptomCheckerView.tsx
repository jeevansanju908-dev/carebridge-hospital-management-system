import React, { useState } from 'react';
import {
  Stethoscope,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Upload,
  Image,
  Camera,
  Video,
  X,
  Building2,
  User,
  HeartPulse,
} from 'lucide-react';
import type { SymptomCheckResult, Doctor, HospitalUser } from '../../types/index.js';

interface SymptomCheckerViewProps {
  onBookDoctor: (doctor: Doctor) => void;
  onExploreHospitals: () => void;
  onEmergencySOS: () => void;
}

const commonSymptoms = [
  'Cough, Cold & Sneezing',
  'Sore Throat',
  'Fever & Chills',
  'Headache',
  'Common Body Pain / Fatigue',
  'Skin Problems (Rash / Itching / Acne)',
  'Eye Problems (Redness / Blurred Vision)',
  'Bone & Joint Pain (Knee / Sprain / Swelling)',
  'Heart Symptoms (Palpitations / Fluttering)',
  'Stomach Upset / Acidity / Nausea',
  'Earache / Ear Discharge',
  'Accident / Severe Injury (Emergency)',
  'Crushing Chest Pain / Severe Breathlessness (Emergency)',
  'Sudden Numbness or Facial Droop (Emergency)',
];

export const SymptomCheckerView: React.FC<SymptomCheckerViewProps> = ({
  onBookDoctor,
  onExploreHospitals,
  onEmergencySOS,
}) => {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [manualDescription, setManualDescription] = useState('');
  const [duration, setDuration] = useState('1-3 days');
  const [severity, setSeverity] = useState<'Mild' | 'Moderate' | 'Severe'>('Moderate');

  // Media upload (Image / Video up to 10MB)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileBase64, setUploadedFileBase64] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);

  // AI Result
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<SymptomCheckResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const toggleSymptom = (sym: string) => {
    if (selectedSymptoms.includes(sym)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== sym));
    } else {
      setSelectedSymptoms([...selectedSymptoms, sym]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMediaError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Check 10 MB limit as specified in Section 11
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      setMediaError('File size exceeds the 10 MB upload limit. Please upload a smaller image or video clip.');
      return;
    }

    setUploadedFileName(`${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`);

    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedFileBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (selectedSymptoms.length === 0 && !manualDescription.trim()) {
      setApiError('Please select at least one symptom or describe your symptoms.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/ai/symptom-checker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms: selectedSymptoms,
          manualDescription,
          duration,
          severity,
          imageBase64: uploadedFileBase64,
        }),
      });

      const data = await res.json();
      setIsAnalyzing(false);

      if (res.ok) {
        setResult(data);
      } else {
        setApiError(data.error || 'Failed to analyze symptoms.');
      }
    } catch (err: any) {
      setIsAnalyzing(false);
      setApiError('Unable to connect to AI Triage server.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>CareBridge AI Clinical Triage</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          AI Symptom Checker
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Receive preliminary clinical triage guidance, specialty recommendations, and matched physicians powered by Gemini AI.
        </p>
      </div>

      {/* Mandatory Clinical Disclaimer Banner */}
      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/80 flex items-start gap-3 text-xs text-amber-900">
        <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-bold text-amber-950">Important Medical Evaluation Notice</h4>
          <p className="leading-relaxed">
            CareBridge AI provides preliminary triage guidance for educational and scheduling support only.
            <strong> It is NOT a confirmed clinical medical diagnosis.</strong> Always consult a qualified physician or call 112 immediately in severe emergencies.
          </p>
        </div>
      </div>

      {/* Form or Result View */}
      {!result ? (
        <form onSubmit={handleAnalyze} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl space-y-6">
          {apiError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              {apiError}
            </div>
          )}

          {/* 1. Select Symptoms from List */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              1. Select Reported Symptoms
            </label>
            <div className="flex flex-wrap gap-2">
              {commonSymptoms.map((sym) => {
                const isSelected = selectedSymptoms.includes(sym);
                return (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => toggleSymptom(sym)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-[#0284c7] text-white shadow-xs scale-105'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {sym}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Manual Symptom Description */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              2. Describe Symptoms in Your Own Words (Optional)
            </label>
            <textarea
              rows={3}
              value={manualDescription}
              onChange={(e) => setManualDescription(e.target.value)}
              placeholder="e.g. Sharp pain in lower back after lifting a heavy box yesterday, aggravated when sitting..."
              className="w-full p-4 rounded-2xl border border-slate-200 text-xs sm:text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
            />
          </div>

          {/* 3. Duration & Severity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                3. Symptom Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-purple-500 outline-none bg-white font-medium"
              >
                <option value="Few hours">Few hours</option>
                <option value="1-3 days">1 to 3 days</option>
                <option value="1 week">About 1 week</option>
                <option value="More than 2 weeks">More than 2 weeks</option>
                <option value="Chronic (Months)">Chronic (Months)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                4. Reported Severity
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Mild', 'Moderate', 'Severe'] as const).map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setSeverity(sev)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      severity === sev
                        ? sev === 'Severe'
                          ? 'bg-red-600 text-white border-red-600 shadow-sm'
                          : 'bg-[#0284c7] text-white border-[#0284c7] shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Take Photo or Upload Image */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                5. Take Photo or Upload Image (Optional)
              </label>
              <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                Gemini Vision AI Enabled
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Take a clear picture of a skin rash, eye redness, swelling, throat, or medical report to help the AI analyse visual symptoms.
            </p>

            {/* Photo Capture & Upload Controls */}
            {!uploadedFileBase64 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Take Photo button */}
                <label className="p-4 rounded-2xl border-2 border-dashed border-purple-200 hover:border-purple-400 bg-purple-50/40 hover:bg-purple-50/80 cursor-pointer flex items-center justify-center gap-3 transition-all text-center group">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-900 group-hover:text-purple-700">
                      Take a Photo
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Use camera or webcam
                    </p>
                  </div>
                </label>

                {/* Upload Image button */}
                <label className="p-4 rounded-2xl border-2 border-dashed border-slate-200 hover:border-sky-400 bg-slate-50/40 hover:bg-sky-50/50 cursor-pointer flex items-center justify-center gap-3 transition-all text-center group">
                  <input
                    type="file"
                    accept="image/*,video/mp4"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-900 group-hover:text-sky-700">
                      Upload Image File
                    </p>
                    <p className="text-[10px] text-slate-500">
                      JPG, PNG, or scan (max 10MB)
                    </p>
                  </div>
                </label>
              </div>
            ) : (
              /* Image Thumbnail Preview */
              <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-200 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={uploadedFileBase64}
                    alt="Symptom preview"
                    className="w-16 h-16 rounded-xl object-cover border border-purple-200 shadow-xs shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {uploadedFileName || 'Image attached for AI analysis'}
                      </span>
                    </div>
                    <p className="text-[11px] text-purple-700 font-medium mt-0.5">
                      ✓ Ready for Gemini multimodal vision evaluation
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setUploadedFileName(null);
                    setUploadedFileBase64(null);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-red-200 bg-white hover:bg-red-50 text-red-600 text-xs font-bold shrink-0 transition-colors"
                >
                  Remove / Retake
                </button>
              </div>
            )}

            {mediaError && (
              <p className="text-xs text-red-600 font-semibold">{mediaError}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isAnalyzing}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-700 via-indigo-600 to-[#0284c7] hover:opacity-95 text-white font-black text-sm shadow-xl shadow-purple-900/20 flex items-center justify-center gap-2.5 transition-all disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Gemini Clinical Triage in Progress...</span>
              </>
            ) : (
              <>
                <Stethoscope className="w-4 h-4" />
                <span>Run AI Clinical Symptom Check</span>
              </>
            )}
          </button>
        </form>
      ) : (
        /* RESULT VIEW */
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl space-y-6 animate-fadeIn">
          {/* Urgency & Category Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                  result.isEmergency || result.urgencyLevel === 'Emergency'
                    ? 'bg-red-600 text-white animate-pulse'
                    : result.triageCategory === 'Common Illness (Primary Care)'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#0284c7] text-white'
                }`}
              >
                {result.isEmergency || result.urgencyLevel === 'Emergency'
                  ? '🚨 Emergency Medical Attention Required'
                  : result.triageCategory || `Triage Level: ${result.urgencyLevel}`}
              </span>

              <span className="text-xs text-slate-500 font-semibold">
                CareBridge AI Clinical Evaluation
              </span>
            </div>

            <button
              onClick={() => {
                setResult(null);
                setSelectedSymptoms([]);
                setManualDescription('');
              }}
              className="text-xs font-bold text-[#0284c7] hover:underline self-start sm:self-auto"
            >
              ← Start New Symptom Check
            </button>
          </div>

          {/* CRITICAL EMERGENCY ALERT (Accidents, Trauma, Acute Cardiac, Stroke) */}
          {(result.isEmergency || result.urgencyLevel === 'Emergency') && (
            <div className="p-6 bg-red-50 border-2 border-red-600 rounded-3xl text-red-900 space-y-4 shadow-lg shadow-red-600/10 animate-pulse">
              <div className="flex items-center gap-2.5 text-base sm:text-lg font-black text-red-700">
                <AlertTriangle className="w-6 h-6 shrink-0 text-red-600" />
                <span>CRITICAL EMERGENCY ALERT: Immediate Medical Care Required</span>
              </div>

              <p className="text-xs sm:text-sm text-red-800 leading-relaxed font-medium">
                {result.emergencyWarning ||
                  'Your reported symptoms indicate an emergency medical condition. In emergency situations, please prioritize immediate emergency medical assistance rather than scheduling an ordinary clinic appointment.'}
              </p>

              <div className="p-3.5 bg-white/90 rounded-2xl border border-red-200 text-xs text-red-900 space-y-1">
                <p className="font-bold">🚨 Emergency Protocol Instructions:</p>
                <p className="text-[11px] leading-relaxed text-red-800">
                  • <strong>Do not delay</strong> by waiting for an outpatient appointment slot.
                  <br />• Contact national emergency services immediately or visit the nearest 24/7 Hospital Emergency Room (ER) / Trauma Centre.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={onEmergencySOS}
                  className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs sm:text-sm font-black shadow-md shadow-red-600/30 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Dispatch Ambulance & Emergency SOS</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={onExploreHospitals}
                  className="px-5 py-3 bg-white border border-red-300 hover:bg-red-50 text-red-700 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Building2 className="w-4 h-4 text-red-600" />
                  <span>Locate Nearest 24/7 Emergency Room</span>
                </button>

                <a
                  href="tel:112"
                  className="px-4 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-colors"
                >
                  📞 Call 112 / 108 (India Emergency)
                </a>
              </div>
            </div>
          )}

          {/* COMMON ILLNESS PRIMARY CARE BANNER */}
          {!result.isEmergency && result.triageCategory === 'Common Illness (Primary Care)' && (
            <div className="p-5 bg-emerald-50/80 border border-emerald-200 rounded-3xl flex items-start gap-3.5 text-xs text-emerald-950">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm text-emerald-900">
                  Primary Care Illness — General Physician Recommended
                </h4>
                <p className="leading-relaxed text-emerald-800">
                  Symptoms such as cough, cold, sore throat, fever, mild headache, or body pain are common primary-care conditions.
                  A <strong>General Physician</strong> is the appropriate primary-care specialist to evaluate these symptoms, conduct physical examinations,
                  and prescribe targeted medication without requiring an unnecessary or expensive specialist referral.
                </p>
              </div>
            </div>
          )}

          {/* SPECIALIST CONSULTATION BANNER */}
          {!result.isEmergency && result.triageCategory === 'Specialist Consultation' && (
            <div className="p-5 bg-sky-50/80 border border-sky-200 rounded-3xl flex items-start gap-3.5 text-xs text-slate-800">
              <div className="w-10 h-10 rounded-2xl bg-[#0284c7] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm text-[#0284c7]">
                  Specialist Consultation Recommended — {result.recommendedSpecialty}
                </h4>
                <p className="leading-relaxed text-slate-600">
                  Your reported symptoms specifically involve the {result.recommendedSpecialty.toLowerCase()} domain.
                  Consulting a specialized physician ensures specialized diagnostic testing and targeted medical therapy.
                </p>
              </div>
            </div>
          )}

          {/* Clinical Triage Summary */}
          <div className="space-y-2">
            <h3 className="font-extrabold text-base text-slate-900">Clinical Triage Summary</h3>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
              {result.triageSummary}
            </p>
          </div>

          {/* Recommended Specialty Card */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0 ${
                  result.isEmergency ? 'bg-red-600' : 'bg-[#0284c7]'
                }`}
              >
                <Stethoscope className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Recommended Doctor Specialty
                </span>
                <h4 className="text-base sm:text-lg font-black text-slate-900">
                  {result.recommendedSpecialty}
                </h4>
              </div>
            </div>

            <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200 self-start sm:self-auto">
              {result.isEmergency ? '24/7 Emergency Staff On Duty' : 'Verified Available Doctors'}
            </span>
          </div>

          {/* Differential Considerations */}
          {result.possibleConditions && result.possibleConditions.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                Differential Considerations & Potential Conditions
              </h4>
              <div className="space-y-2.5">
                {result.possibleConditions.map((cond, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-slate-900">{cond.name}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          cond.likelihood === 'High'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        Likelihood: {cond.likelihood}
                      </span>
                    </div>
                    <p className="text-slate-600 text-xs mt-1 leading-relaxed">{cond.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Next Steps */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
              Recommended Next Steps & Clinical Guidance
            </h4>
            <ul className="space-y-2 text-xs text-slate-700">
              {result.recommendedActions.map((act, idx) => (
                <li key={idx} className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{act}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Matched Available Doctors */}
          {result.recommendedDoctors && result.recommendedDoctors.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    {result.isEmergency
                      ? 'Hospital Emergency Clinical Doctors'
                      : `Recommended Doctors (${result.recommendedSpecialty})`}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {result.isEmergency
                      ? 'On-duty emergency clinicians available for acute stabilization.'
                      : `Board-certified doctors matching your reported symptoms.`}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {result.recommendedDoctors.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 rounded-3xl border border-slate-200 flex items-center justify-between gap-3 bg-white hover:border-[#0284c7] transition-all shadow-xs group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={doc.avatar}
                        alt={doc.name}
                        className="w-13 h-13 rounded-2xl object-cover shrink-0 border border-slate-200"
                      />
                      <div className="min-w-0 text-xs space-y-0.5">
                        <p className="font-black text-slate-900 truncate group-hover:text-[#0284c7] transition-colors">
                          {doc.name}
                        </p>
                        <p className="text-[11px] text-[#0284c7] font-bold">{doc.specialization}</p>
                        <p className="text-[10px] text-slate-400 truncate">{doc.hospitalName}</p>
                        <p className="text-[10px] text-slate-500 font-medium">Fee: ₹{doc.consultationFee}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onBookDoctor(doc)}
                      className="px-3.5 py-2 rounded-xl bg-[#0284c7] hover:bg-sky-700 text-white font-bold text-xs shadow-xs shrink-0 transition-colors"
                    >
                      {result.isEmergency ? 'Urgent Visit' : 'Book Visit'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prominent Medical Disclaimer as Required */}
          <div className="p-4 bg-amber-50/80 rounded-2xl text-xs text-amber-900 leading-relaxed border border-amber-200 space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-amber-950">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              Clinical Medical Disclaimer:
            </p>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              CareBridge AI results are intended strictly as <strong>preliminary guidance and educational triage</strong>, and are <strong>not a definitive medical diagnosis</strong>. Symptoms can be caused by multiple underlying conditions that require in-person clinical examination, diagnostic laboratory assays, or radiological evaluation. Always consult a licensed medical professional for personal diagnosis and treatment. In emergencies, call 112 / 108 or go to the nearest emergency department immediately.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
