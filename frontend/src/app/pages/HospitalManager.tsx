import { useEffect, useState } from 'react';
import { fetchHospitalDepartures, fetchHospitals, updateDepartureStatus } from '../../api';
import type { DepartureQueueItem, HospitalSummary, RequesterType, DepartureStatus } from '../../types';
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

const requesterTypeLabels: Record<RequesterType, string> = {
  PARAMEDIC: '구급대원',
  PATIENT: '환자 본인',
  GUARDIAN: '보호자',
};

const requesterChannelLabels: Record<RequesterType, string> = {
  PARAMEDIC: '구급대 등록',
  PATIENT: '환자 본인 등록',
  GUARDIAN: '보호자 등록',
};

const statusLabels: Record<DepartureStatus, string> = {
  PENDING: '대기중',
  ACCEPTED: '접수완료',
  CANCELLED: '취소됨',
};

const statusBadgeClassNames: Record<DepartureStatus, string> = {
  PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-300',
  ACCEPTED: 'bg-green-50 text-green-700 border-green-300',
  CANCELLED: 'bg-red-50 text-red-700 border-red-300',
};

const hospitalManagerSelectionKey = 'hospitalManager:selectedHospitalId';

function formatSeverityLabel(severityLevel: string) {
  const match = severityLevel.match(/^KTAS(\d)$/);
  if (!match) {
    return severityLevel;
  }
  return `KTAS ${match[1]}`;
}

function formatRegisteredAt(dateTime: string) {
  return new Date(dateTime).toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function getSeverityColor(severityLevel: string) {
  if (severityLevel.includes('1')) return 'bg-red-600';
  if (severityLevel.includes('2')) return 'bg-orange-500';
  if (severityLevel.includes('3')) return 'bg-yellow-500';
  return 'bg-green-500';
}

export default function HospitalManager() {
  const [hospitals, setHospitals] = useState<HospitalSummary[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState<number | null>(null);
  const [arrivingPatients, setArrivingPatients] = useState<DepartureQueueItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<DepartureQueueItem | null>(null);
  const [loadingHospitals, setLoadingHospitals] = useState(true);
  const [loadingPatients, setLoadingPatients] = useState(false);

  const selectedHospital = hospitals.find((hospital) => hospital.id === selectedHospitalId) ?? null;

  useEffect(() => {
    let cancelled = false;

    async function loadHospitals() {
      try {
        const hospitalList = await fetchHospitals();
        if (cancelled) {
          return;
        }
        const preferredHospitalId = Number(window.localStorage.getItem(hospitalManagerSelectionKey));
        const hasPreferredHospital = hospitalList.some((hospital) => hospital.id === preferredHospitalId);
        setHospitals(hospitalList);
        setSelectedHospitalId((current) => current ?? (hasPreferredHospital ? preferredHospitalId : hospitalList[0]?.id ?? null));
      } catch {
        if (!cancelled) {
          toast.error('병원 목록을 불러오지 못했습니다.');
        }
      } finally {
        if (!cancelled) {
          setLoadingHospitals(false);
        }
      }
    }

    loadHospitals();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedHospitalId) {
      setArrivingPatients([]);
      return;
    }

    window.localStorage.setItem(hospitalManagerSelectionKey, String(selectedHospitalId));

    const hospitalId = selectedHospitalId;
    let cancelled = false;

    async function loadDepartures(showLoading = true) {
      if (showLoading) {
        setLoadingPatients(true);
      }
      try {
        const departures = await fetchHospitalDepartures(hospitalId);
        if (!cancelled) {
          setArrivingPatients(departures);
        }
      } catch {
        if (!cancelled) {
          toast.error('도착 예정 환자 목록을 불러오지 못했습니다.');
        }
      } finally {
        if (!cancelled && showLoading) {
          setLoadingPatients(false);
        }
      }
    }

    loadDepartures();
    const interval = window.setInterval(() => {
      loadDepartures(false);
    }, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [selectedHospitalId]);

  const filteredPatients = arrivingPatients.filter((patient) => {
    const normalizedQuery = searchQuery.toLowerCase();
    return (
      patient.patientName.toLowerCase().includes(normalizedQuery) ||
      patient.symptomSummary.toLowerCase().includes(normalizedQuery) ||
      requesterTypeLabels[patient.requesterType].toLowerCase().includes(normalizedQuery) ||
      `${patient.registrationId}`.includes(normalizedQuery)
    );
  });

  const pendingCount = arrivingPatients.filter((patient) => patient.status === 'PENDING').length;
  const acceptedCount = arrivingPatients.filter((patient) => patient.status === 'ACCEPTED').length;

  async function handleUpdateStatus(patient: DepartureQueueItem, status: DepartureStatus) {
    try {
      const updated = await updateDepartureStatus(patient.registrationId, status);
      setArrivingPatients((prev) =>
        prev.map((item) => (item.registrationId === updated.registrationId ? updated : item)),
      );
      toast.success(status === 'ACCEPTED' ? '환자 접수가 승인되었습니다.' : '예약이 취소되었습니다.');
    } catch {
      toast.error('상태 변경에 실패했습니다.');
    }
  }

  function openCancelDialog(patient: DepartureQueueItem) {
    setSelectedPatient(patient);
    setCancelDialogOpen(true);
  }

  async function handleCancelPatient() {
    if (!selectedPatient) {
      return;
    }

    await handleUpdateStatus(selectedPatient, 'CANCELLED');
    setCancelDialogOpen(false);
    setSelectedPatient(null);
  }

  if (loadingHospitals) {
    return <div className="text-sm text-gray-500">병원 관리자 데이터를 불러오는 중입니다...</div>;
  }

  if (!selectedHospital) {
    return <div className="text-sm text-gray-500">표시할 병원 정보가 없습니다.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">병원 관리자 대시보드</h1>
          <p className="mt-1 text-sm text-gray-500">도착 예정 환자 및 예약 관리</p>
        </div>
        <div className="flex items-center gap-3">
          <Building2 className="h-5 w-5 text-gray-500" />
          <select
            value={selectedHospital.id}
            onChange={(event) => setSelectedHospitalId(Number(event.target.value))}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold"
          >
            {hospitals.map((hospital) => (
              <option key={hospital.id} value={hospital.id}>
                {hospital.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">대기 환자</p>
              <p className="text-2xl font-bold text-gray-900">{selectedHospital.currentPatients}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">도착 예정</p>
              <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">접수 완료</p>
              <p className="text-2xl font-bold text-gray-900">{acceptedCount}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">가용 병상</p>
              <p className="text-2xl font-bold text-gray-900">{selectedHospital.availableBeds}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
              <Bed className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-gray-400" />
          <Input
            placeholder="요청 번호, 증상, 요청 주체로 검색..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="flex-1"
          />
        </div>
      </Card>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">도착 예정 환자</h2>
        <div className="space-y-3">
          {loadingPatients ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500">도착 예정 환자 목록을 불러오는 중입니다.</p>
            </Card>
          ) : filteredPatients.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500">표시할 도착 요청이 없습니다.</p>
            </Card>
          ) : (
            filteredPatients.map((patient) => (
              <Card key={patient.registrationId} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">{patient.patientName}</h3>
                      <Badge className={`${getSeverityColor(patient.severityLevel)} text-white`}>
                        {formatSeverityLabel(patient.severityLevel)}
                      </Badge>
                      <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-700">
                        {requesterTypeLabels[patient.requesterType]}
                      </Badge>
                      <Badge variant="outline" className={statusBadgeClassNames[patient.status]}>
                        {statusLabels[patient.status]}
                      </Badge>
                    </div>

                    <div className="mb-3 grid grid-cols-1 gap-2 text-sm text-gray-600 md:grid-cols-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        <span>증상: {patient.symptomSummary}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span className="font-semibold text-blue-600">약 {patient.etaMinutes}분 후 도착 예정</span>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs text-gray-500">
                      <p>요청 번호: #{patient.registrationId}</p>
                      <p>요청 주체: {requesterTypeLabels[patient.requesterType]}</p>
                      <p>등록 채널: {requesterChannelLabels[patient.requesterType]}</p>
                      <p>등록 시각: {formatRegisteredAt(patient.createdAt)}</p>
                    </div>
                  </div>

                  <div className="ml-4 flex flex-col gap-2">
                    {patient.status === 'PENDING' && (
                      <>
                        <Button
                          onClick={() => handleUpdateStatus(patient, 'ACCEPTED')}
                          className="bg-green-600 hover:bg-green-700"
                          size="sm"
                        >
                          <CheckCircle className="mr-1 h-4 w-4" />
                          접수
                        </Button>
                        <Button
                          onClick={() => openCancelDialog(patient)}
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                          size="sm"
                        >
                          <XCircle className="mr-1 h-4 w-4" />
                          취소
                        </Button>
                      </>
                    )}
                    {patient.status === 'ACCEPTED' && (
                      <Button
                        onClick={() => openCancelDialog(patient)}
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                        size="sm"
                      >
                        <XCircle className="mr-1 h-4 w-4" />
                        취소
                      </Button>
                    )}
                    {patient.status === 'CANCELLED' && (
                      <Badge className="bg-gray-400 text-white">취소됨</Badge>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>예약을 취소하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedPatient && (
                <div className="mt-2 space-y-2">
                  <p className="font-semibold text-gray-900">{selectedPatient.patientName}</p>
                  <p>요청 번호: #{selectedPatient.registrationId}</p>
                  <p>증상: {selectedPatient.symptomSummary}</p>
                  <p>중증도: {formatSeverityLabel(selectedPatient.severityLevel)}</p>
                  <p className="mt-3 text-red-600">이 작업은 되돌릴 수 없으며, 관리자 화면에서도 즉시 반영됩니다.</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedPatient(null)}>
              아니오
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelPatient} className="bg-red-600 hover:bg-red-700">
              예, 취소합니다
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
