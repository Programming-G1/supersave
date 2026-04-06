import { useEffect, useState } from 'react';
import { fetchAlerts } from '@/api';
import AlertStrip from '@/components/alert/AlertStrip';
import type { AlertItem } from '@/types';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  useEffect(() => {
    fetchAlerts().then(setAlerts);
  }, []);

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm uppercase tracking-[0.28em] text-slate-400">System Alerts</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-950">지역별 병상 부족 및 중증 수용 경고 상태</h2>
        <p className="mt-3 text-sm text-slate-600">향후 실제 공공데이터 API 연동 시 이 페이지는 실시간 경보 패널로 확장될 수 있습니다.</p>
      </section>

      <div className="grid gap-4">
        {alerts.map((alert) => (
          <AlertStrip key={alert.id} alert={alert} />
        ))}
      </div>
    </div>
  );
}
