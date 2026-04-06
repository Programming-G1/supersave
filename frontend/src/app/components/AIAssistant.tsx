import { useState } from 'react';
import { X, Send, Sparkles, User, Bot } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { ChatMessage } from '../types';

interface AIAssistantProps {
  onClose: () => void;
}

export default function AIAssistant({ onClose }: AIAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: '안녕하세요! SuperSave AI 도우미입니다. 응급실 이송과 관련하여 무엇을 도와드릴까요?',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');

  const generateAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('병원') && lowerMessage.includes('추천')) {
      return '환자의 증상과 위치 정보를 고려하여 최적의 병원을 추천해드립니다. 현재 "삼성서울병원"과 "서울아산병원"이 가용 병상이 많고 대기 시간이 짧습니다. 환자의 증상이 무엇인가요?';
    }

    if (lowerMessage.includes('흉부') || lowerMessage.includes('심장')) {
      return '흉부 통증은 심근경색 등 중증 질환의 가능성이 있습니다. KTAS 2등급으로 분류되며, 심장내과 전문의가 있는 병원으로 신속한 이송이 필요합니다. 서울대학교병원, 삼성서울병원, 세브란스병원 모두 심장내과 전문의가 상주하고 있습니다.';
    }

    if (lowerMessage.includes('대기') || lowerMessage.includes('시간')) {
      return '현재 대기 시간이 가장 짧은 병원은 서울아산병원(25분)과 삼성서울병원(30분)입니다. 단, 이송 시간을 고려하면 거리가 가까운 병원이 더 유리할 수 있습니다.';
    }

    if (lowerMessage.includes('중증도') || lowerMessage.includes('ktas')) {
      return 'KTAS(한국형 응급환자 분류도구)는 1등급부터 5등급까지 있습니다:\n\n- KTAS 1: 소생(즉각 처치)\n- KTAS 2: 응급(10분 이내)\n- KTAS 3: 긴급(30분 이내)\n- KTAS 4: 준긴급(60분 이내)\n- KTAS 5: 비긴급(120분 이내)\n\n환자의 증상을 말씀해 주시면 중증도를 판단해드리겠습니다.';
    }

    if (lowerMessage.includes('응급처치') || lowerMessage.includes('cpr')) {
      return '심폐소생술(CPR) 방법:\n\n1. 환자의 반응과 호흡 확인\n2. 119 신고 및 자동심장충격기(AED) 요청\n3. 가슴 압박 30회 (분당 100-120회 속도)\n4. 인공호흡 2회\n5. 위 과정 반복\n\n※ 전문 구급대원 도착 시까지 계속 실시하세요.';
    }

    if (lowerMessage.includes('비교') || lowerMessage.includes('차이')) {
      return '병원 비교 분석:\n\n서울대학교병원: 거리가 가깝고(2.3km) 전문 의료진 완비, 중간 혼잡도\n\n삼성서울병원: 가용 병상 가장 많음(21개), 낮은 혼잡도, 약간 멀음(5.7km)\n\n서울아산병원: 대기 시간 가장 짧음(25분), 충분한 의료 장비\n\n환자 상태와 긴급도에 따라 적합한 병원이 달라집니다.';
    }

    return '네, 이해했습니다. 더 자세한 정보를 위해 환자의 증상, 나이, 기저질환 등을 알려주시면 더 정확한 도움을 드릴 수 있습니다. 또한 실시간 현황 페이지에서 병원별 상세 정보를 확인하실 수 있습니다.';
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');

    // AI 응답 시뮬레이션
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateAIResponse(inputValue),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 1000);
  };

  const quickQuestions = [
    '가장 가까운 병원 추천',
    '대기 시간이 짧은 병원',
    '심장내과 전문의 병원',
    'KTAS 등급 설명',
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-end p-6">
      <Card className="w-full max-w-md h-[600px] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">AI 의사결정 지원</h3>
              <p className="text-xs text-gray-500">Gemini 기반</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 ${
                    message.role === 'user'
                      ? 'bg-blue-600'
                      : 'bg-gradient-to-br from-blue-500 to-purple-600'
                  }`}
                >
                  {message.role === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>

                <div
                  className={`flex-1 rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-line">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Quick Questions */}
        {messages.length <= 1 && (
          <div className="p-4 border-t bg-gray-50">
            <p className="text-xs text-gray-500 mb-2">자주 묻는 질문</p>
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputValue(question);
                  }}
                  className="text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="질문을 입력하세요..."
              className="flex-1"
            />
            <Button onClick={handleSend} size="icon" className="bg-blue-600 hover:bg-blue-700">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
