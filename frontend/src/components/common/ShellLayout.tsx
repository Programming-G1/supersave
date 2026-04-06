import { Activity, BrainCircuit, Siren, Stethoscope } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';

const links = [
  { to: '/', label: '홈' },
  { to: '/emergency', label: '응급실 검색' },
  { to: '/ai-guide', label: 'AI 가이드' },
  { to: '/alerts', label: '긴급 알림' },
];

export default function ShellLayout() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(244,63,94,0.12),_transparent_34%),linear-gradient(180deg,_#fff7f5_0%,_#fff_45%,_#f7fbff_100%)] text-slate-950">
      <header className="sticky top-0 z-40 border-b border-white/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#ef4444,#0f766e)] text-white shadow-lg shadow-rose-200">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold tracking-[0.24em] text-slate-500 uppercase">SuperSave</p>
              <h1 className="text-lg font-semibold">실시간 응급실 의사결정 보조 시스템</h1>
            </div>
          </div>

          <nav className="hidden items-center gap-2 md:flex">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm font-medium transition ${isActive ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="border-t border-rose-100 bg-rose-50">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-3 text-sm text-rose-950 sm:px-6">
            <div className="flex items-center gap-2">
              <Siren className="h-4 w-4" />
              의료 진단이 아닌 응급 의사결정 보조용 MVP입니다.
            </div>
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-4 w-4" />
              AI 응답은 참고용이며 실제 수용 여부는 병원 상황에 따라 달라집니다.
            </div>
            <div className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4" />
              향후 Kakao Map, 공공데이터, Gemini API 연동 예정
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
