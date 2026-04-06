import { useEffect, useState } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import {
  Building2,
  Users,
  Clock,
  Bed,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { emergencyApi } from '../api';
import { useEmergencyAppData } from '../hooks/useEmergencyAppData';
import { ArrivingPatient } from '../types';

export default function HospitalManager() {
  const { hospitals, loading, error } = useEmergencyAppData();
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<ArrivingPatient | null>(null);
  const [arrivingPatients, setArrivingPatients] = useState<ArrivingPatient[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(false);

  useEffect(() => {
    if (!selectedHospitalId && hospitals.length > 0) {
      setSelectedHospitalId(hospitals[0].id);
    }
  }, [hospitals, selectedHospitalId]);

  useEffect(() => {
    if (!selectedHospitalId) {
      return;
    }

    let active = true;
    setPatientsLoading(true);

    emergencyApi
      .getArrivals(selectedHospitalId)
      .then((data) => {
        if (!active) {
          return;
        }
        setArrivingPatients(data);
      })
      .catch((apiError: Error) => {
        if (!active) {
          return;
        }
        toast.error(apiError.message || '도착 예정 환자 정보를 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!active) {
          return;
        }
        setPatientsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedHospitalId]);

  const selectedHospital = hospitals.find((hospital) => hospital.id === selectedHospitalId) ?? null;

  const filteredPatients = arrivingPatients.filter(patient =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.symptoms.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingCount = arrivingPatients.filter(p => p.status === 'pending').length;
  const acceptedCount = arrivingPatients.filter(p => p.status === 'accepted').length;

  const handleAcceptPatient = async (patientId: string) => {
    try {
      const updated = await emergencyApi.updateArrivalStatus(patientId, 'accepted');
      setArrivingPatients((prev) => prev.map((patient) => (patient.id === patientId ? updated : patient)));
      toast.success('환자 접수가 승인되었습니다');
    } catch (apiError) {
      toast.error(apiError instanceof Error ? apiError.message : '환자 접수 처리에 실패했습니다.');
    }
  };

  const handleCancelPatient = async () => {
    if (!selectedPatient) return;

    try {
      const updated = await emergencyApi.updateArrivalStatus(selectedPatient.id, 'cancelled');
      setArrivingPatients((prev) => prev.map((patient) => (patient.id === selectedPatient.id ? updated : patient)));
      toast.success('예약이 취소되었습니다');
    } catch (apiError) {
      toast.error(apiError instanceof Error ? apiError.message : '예약 취소에 실패했습니다.');
    } finally {
      setCancelDialogOpen(false);
      setSelectedPatient(null);
    }
  };

  const openCancelDialog = (patient: ArrivingPatient) => {
    setSelectedPatient(patient);
    setCancelDialogOpen(true);
  };

  const getSeverityColor = (severity: string) => {
    if (severity.includes('1')) return 'bg-red-600';
    if (severity.includes('2')) return 'bg-orange-500';
    if (severity.includes('3')) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (error) {
    return (
      <Card className="p-8 text-center">
        <p className="text-red-600">{error}</p>
      </Card>
    );
  }

  if (loading || !selectedHospital) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500">병원 관리자 화면을 불러오는 중입니다...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">병원 관리자 대시보드</h1>
          <p className="text-sm text-gray-500 mt-1">도착 예정 환자 및 예약 관리</p>
        </div>
        <div className="flex items-center gap-3">
          <Building2 className="w-5 h-5 text-gray-500" />
          <select
            value={selectedHospital.id}
            onChange={(e) => setSelectedHospitalId(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm font-semibold"
          >
            {hospitals.map((hospital) => (
              <option key={hospital.id} value={hospital.id}>
                {hospital.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">대기 환자</p>
              <p className="text-2xl font-bold text-gray-900">{selectedHospital.waitingPatients}</p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">도착 예정</p>
              <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">접수 완료</p>
              <p className="text-2xl font-bold text-gray-900">{acceptedCount}</p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">가용 병상</p>
              <p className="text-2xl font-bold text-gray-900">
                {selectedHospital.beds.general + selectedHospital.beds.icu + selectedHospital.beds.surgery}
              </p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg">
              <Bed className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* 검색 바 */}
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-gray-400" />
          <Input
            placeholder="환자 이름 또는 증상으로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
        </div>
      </Card>

      {/* 도착 예정 환자 목록 */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">도착 예정 환자</h2>
        <div className="space-y-3">
          {filteredPatients.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500">검색 결과가 없습니다</p>
            </Card>
          ) : (
            filteredPatients.map((patient) => (
              <Card key={patient.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{patient.name}</h3>
                      <Badge className={`${getSeverityColor(patient.severity)} text-white`}>
                        {patient.severity}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {patient.age}세 / {patient.gender === 'male' ? '남' : '여'}
                      </Badge>
                      {patient.status === 'pending' && (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                          대기중
                        </Badge>
                      )}
                      {patient.status === 'accepted' && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                          접수완료
                        </Badge>
                      )}
                      {patient.status === 'cancelled' && (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
                          취소됨
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                        <span>증상: {patient.symptoms}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span className="font-semibold text-blue-600">
                          약 {patient.eta}분 후 도착 예정
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 space-y-1">
                      <p>구급대: {patient.paramedic}</p>
                      <p>등록 시각: {patient.registeredAt}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    {patient.status === 'pending' && (
                      <>
                        <Button
                          onClick={() => handleAcceptPatient(patient.id)}
                          className="bg-green-600 hover:bg-green-700"
                          size="sm"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          접수
                        </Button>
                        <Button
                          onClick={() => openCancelDialog(patient)}
                          variant="outline"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                          size="sm"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          취소
                        </Button>
                      </>
                    )}
                    {patient.status === 'accepted' && (
                      <Button
                        onClick={() => openCancelDialog(patient)}
                        variant="outline"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                        size="sm"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        취소
                      </Button>
                    )}
                    {patient.status === 'cancelled' && (
                      <Badge className="bg-gray-400 text-white">취소됨</Badge>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* 취소 확인 다이얼로그 */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>예약을 취소하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedPatient && (
                <div className="mt-2 space-y-2">
                  <p className="font-semibold text-gray-900">환자: {selectedPatient.name}</p>
                  <p>증상: {selectedPatient.symptoms}</p>
                  <p>중증도: {selectedPatient.severity}</p>
                  <p className="text-red-600 mt-3">
                    이 작업은 되돌릴 수 없으며, 구급대에 즉시 통보됩니다.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedPatient(null)}>
              아니오
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelPatient}
              className="bg-red-600 hover:bg-red-700"
            >
              예, 취소합니다
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
