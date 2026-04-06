import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { Activity, MapPin, Send, MessageSquare, Building2, LogOut, Ambulance, User } from 'lucide-react';
import { useState } from 'react';
import AIAssistant from './AIAssistant';
import { useMode } from '../contexts/ModeContext';
import { Badge } from './ui/badge';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { mode, setMode } = useMode();
  const [showAI, setShowAI] = useState(false);

  const handleLogout = () => {
    setMode(null);
    navigate('/');
  };

  const getModeLabel = () => {
    if (mode === 'paramedic') return '구급대원';
    if (mode === 'hospital') return '병원관계자';
    if (mode === 'patient') return '환자';
    return '';
  };

  const getModeIcon = () => {
    if (mode === 'paramedic') return <Ambulance className="w-4 h-4" />;
    if (mode === 'hospital') return <Building2 className="w-4 h-4" />;
    if (mode === 'patient') return <User className="w-4 h-4" />;
    return null;
  };

  const getModeColor = () => {
    if (mode === 'paramedic') return 'bg-red-600';
    if (mode === 'hospital') return 'bg-green-600';
    if (mode === 'patient') return 'bg-purple-600';
    return 'bg-gray-600';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className={`flex items-center justify-center w-10 h-10 ${getModeColor()} rounded-lg`}>
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-xl text-gray-900">SuperSave</h1>
                <p className="text-xs text-gray-500">응급실 이송 최적화 시스템</p>
              </div>
              {mode && (
                <Badge className={`${getModeColor()} text-white flex items-center gap-1`}>
                  {getModeIcon()}
                  {getModeLabel()}
                </Badge>
              )}
            </div>

            <nav className="flex items-center gap-6">
              {/* 구급대원/환자 모드: 대시보드 + 이송요청 */}
              {(mode === 'paramedic' || mode === 'patient') && (
                <>
                  <Link
                    to="/dashboard"
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      location.pathname === '/dashboard'
                        ? 'bg-red-50 text-red-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm font-medium">실시간 현황</span>
                  </Link>

                  {mode === 'paramedic' && (
                    <Link
                      to="/transfer"
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                        location.pathname === '/transfer'
                          ? 'bg-red-50 text-red-600'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <Send className="w-4 h-4" />
                      <span className="text-sm font-medium">이송 요청</span>
                    </Link>
                  )}
                </>
              )}

              {/* 병원관계자 모드: 환자 관리 */}
              {mode === 'hospital' && (
                <Link
                  to="/hospital-manager"
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    location.pathname === '/hospital-manager'
                      ? 'bg-green-50 text-green-600'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span className="text-sm font-medium">환자 관리</span>
                </Link>
              )}

              {mode && (
                <button
                  onClick={() => setShowAI(!showAI)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-sm font-medium">AI 도우미</span>
                </button>
              )}

              {mode && (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">모드 변경</span>
                </button>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      {/* AI Assistant Drawer */}
      {showAI && <AIAssistant onClose={() => setShowAI(false)} />}
    </div>
  );
}
