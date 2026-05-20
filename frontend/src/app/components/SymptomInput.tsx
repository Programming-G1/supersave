import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import {
  Sparkles,
  AlertTriangle,
  Thermometer,
  Heart,
  Activity,
  Droplets,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useMode } from '../contexts/ModeContext';
import type { Patient } from '../types';

interface SymptomInputProps {
  onSubmit: (data: PatientSymptomData) => void | Promise<void>;
  initialData?: PatientSymptomData;
  isSubmitting?: boolean;
  hideSubmit?: boolean;
  onChange?: (data: PatientSymptomData) => void;
}

export interface PatientSymptomData {
  name: string;
  age: number;
  gender: 'male' | 'female';
  symptoms: string;
  severity: Patient['severity'];
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  oxygenSaturation?: number;
}

const commonSymptoms = [
  '흉통', '호흡곤란', '복통', '두통', '어지러움',
  '발열', '구토', '의식저하', '경련', '외상'
];

const ktasLevels: Array<{ level: Patient['severity']; name: string; color: string; desc: string }> = [
  { level: 'KTAS1', name: '소생', color: 'bg-red-600', desc: '즉각적인 치료 필요' },
  { level: 'KTAS2', name: '응급', color: 'bg-orange-500', desc: '10분 이내 치료' },
  { level: 'KTAS3', name: '긴급', color: 'bg-yellow-500', desc: '30분 이내 치료' },
  { level: 'KTAS4', name: '준긴급', color: 'bg-green-500', desc: '1시간 이내 치료' },
  { level: 'KTAS5', name: '비긴급', color: 'bg-blue-500', desc: '2시간 이내 치료' },
];

export default function SymptomInput({
  onSubmit,
  initialData,
  isSubmitting = false,
  hideSubmit = false,
  onChange,
}: SymptomInputProps) {
  const { mode } = useMode();
  const [showVitals, setShowVitals] = useState(false);
  const [aiSuggesting, setAiSuggesting] = useState(false);

  const [formData, setFormData] = useState<PatientSymptomData>(
    initialData || {
      name: mode === 'patient' ? '' : '환자',
      age: 45,
      gender: 'male',
      symptoms: '',
      severity: 'KTAS3',
      bloodPressure: '120/80',
      heartRate: 80,
      temperature: 36.5,
      oxygenSaturation: 98,
    }
  );

  const updateFormData = (nextData: PatientSymptomData) => {
    setFormData(nextData);
    onChange?.(nextData);
  };

  const addSymptom = (symptom: string) => {
    const current = formData.symptoms;
    const newSymptoms = current ? `${current}, ${symptom}` : symptom;
    updateFormData({ ...formData, symptoms: newSymptoms });
  };

  const suggestSeverity = () => {
    setAiSuggesting(true);

    // AI 기반 중증도 판단 시뮬레이션
    setTimeout(() => {
      const symptoms = formData.symptoms.toLowerCase();
      let suggestedLevel: Patient['severity'] = 'KTAS3';

      if (symptoms.includes('의식') || symptoms.includes('경련') || symptoms.includes('쇼크')) {
        suggestedLevel = 'KTAS1';
      } else if (symptoms.includes('흉통') || symptoms.includes('호흡곤란') || symptoms.includes('뇌졸중')) {
        suggestedLevel = 'KTAS2';
      } else if (symptoms.includes('복통') || symptoms.includes('외상') || symptoms.includes('골절')) {
        suggestedLevel = 'KTAS3';
      } else if (symptoms.includes('발열') || symptoms.includes('두통')) {
        suggestedLevel = 'KTAS4';
      }

      // 활력징후 고려
      if (formData.heartRate && (formData.heartRate < 50 || formData.heartRate > 120)) {
        suggestedLevel = suggestedLevel === 'KTAS1' ? 'KTAS1' : 'KTAS2';
      }
      if (formData.oxygenSaturation && formData.oxygenSaturation < 90) {
        suggestedLevel = 'KTAS1';
      }
      if (formData.temperature && formData.temperature > 39) {
        suggestedLevel = suggestedLevel === 'KTAS1' ? 'KTAS1' : 'KTAS3';
      }

      updateFormData({ ...formData, severity: suggestedLevel });
      setAiSuggesting(false);
    }, 1000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hideSubmit) {
      return;
    }
    await onSubmit(formData);
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              {mode === 'patient' ? '내 증상 입력' : '환자 증상 입력'}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {hideSubmit
                ? '환자 정보를 입력한 뒤 출발 위치를 설정하고 추천을 실행합니다'
                : '증상을 입력하면 AI가 최적의 병원을 추천합니다'}
            </p>
          </div>
        </div>

        {/* 기본 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="name">{mode === 'patient' ? '이름' : '환자명'} *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => updateFormData({ ...formData, name: e.target.value })}
              required
              placeholder={mode === 'patient' ? '홍길동' : '환자 이름'}
            />
          </div>

          <div>
            <Label htmlFor="age">나이 *</Label>
            <Input
              id="age"
              type="number"
              value={formData.age}
              onChange={(e) => updateFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
              required
              min="0"
              max="120"
            />
          </div>

          <div>
            <Label htmlFor="gender">성별 *</Label>
            <select
              id="gender"
              value={formData.gender}
              onChange={(e) => updateFormData({ ...formData, gender: e.target.value as 'male' | 'female' })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            >
              <option value="male">남성</option>
              <option value="female">여성</option>
            </select>
          </div>
        </div>

        {/* 증상 입력 */}
        <div>
          <Label htmlFor="symptoms">주요 증상 *</Label>
          <textarea
            id="symptoms"
            value={formData.symptoms}
            onChange={(e) => updateFormData({ ...formData, symptoms: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[100px]"
            placeholder="예: 급성 흉통, 호흡곤란, 식은땀"
            required
          />

          {/* 빠른 증상 선택 */}
          <div className="mt-2 flex flex-wrap gap-2">
            {commonSymptoms.map((symptom) => (
              <Badge
                key={symptom}
                variant="outline"
                className="cursor-pointer hover:bg-blue-50"
                onClick={() => addSymptom(symptom)}
              >
                + {symptom}
              </Badge>
            ))}
          </div>
        </div>

        {/* 중증도 선택 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>중증도 (KTAS) *</Label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={suggestSeverity}
              disabled={!formData.symptoms || aiSuggesting}
              className="text-blue-600"
            >
              <Sparkles className="w-4 h-4 mr-1" />
              {aiSuggesting ? 'AI 분석 중...' : 'AI 판단'}
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {ktasLevels.map((ktas) => (
              <button
                key={ktas.level}
                type="button"
                onClick={() => updateFormData({ ...formData, severity: ktas.level })}
                className={`p-3 rounded-lg border-2 transition-all ${
                  formData.severity === ktas.level
                    ? `${ktas.color} text-white border-transparent ring-2 ring-offset-2 ring-${ktas.color.replace('bg-', '')}`
                    : 'border-gray-300 hover:border-gray-400 bg-white'
                }`}
              >
                <div className={`text-sm font-semibold ${
                  formData.severity === ktas.level ? 'text-white' : 'text-gray-900'
                }`}>
                  {ktas.name}
                </div>
                <div className={`text-xs mt-1 ${
                  formData.severity === ktas.level ? 'text-white/90' : 'text-gray-500'
                }`}>
                  {ktas.level.replace('KTAS', '')}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 활력징후 (선택사항 - 토글) */}
        <div>
          <button
            type="button"
            onClick={() => setShowVitals(!showVitals)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            {showVitals ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            활력징후 입력 (선택사항)
          </button>

          {showVitals && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <Label htmlFor="bloodPressure" className="flex items-center gap-1 text-xs">
                  <Activity className="w-3 h-3" />
                  혈압
                </Label>
                <Input
                  id="bloodPressure"
                  value={formData.bloodPressure}
                  onChange={(e) => updateFormData({ ...formData, bloodPressure: e.target.value })}
                  placeholder="120/80"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="heartRate" className="flex items-center gap-1 text-xs">
                  <Heart className="w-3 h-3" />
                  심박수 (bpm)
                </Label>
                <Input
                  id="heartRate"
                  type="number"
                  value={formData.heartRate}
                  onChange={(e) => updateFormData({ ...formData, heartRate: parseInt(e.target.value) || 0 })}
                  placeholder="80"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="temperature" className="flex items-center gap-1 text-xs">
                  <Thermometer className="w-3 h-3" />
                  체온 (°C)
                </Label>
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) => updateFormData({ ...formData, temperature: parseFloat(e.target.value) || 0 })}
                  placeholder="36.5"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="oxygenSaturation" className="flex items-center gap-1 text-xs">
                  <Droplets className="w-3 h-3" />
                  산소포화도 (%)
                </Label>
                <Input
                  id="oxygenSaturation"
                  type="number"
                  value={formData.oxygenSaturation}
                  onChange={(e) => updateFormData({ ...formData, oxygenSaturation: parseInt(e.target.value) || 0 })}
                  placeholder="98"
                  className="mt-1"
                />
              </div>
            </div>
          )}
        </div>

        {!hideSubmit && (
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            size="lg"
            disabled={isSubmitting}
          >
            <Sparkles className="w-5 h-5 mr-2" />
            {isSubmitting ? '추천 계산 중...' : 'AI 병원 추천 받기'}
          </Button>
        )}
      </form>
    </Card>
  );
}
