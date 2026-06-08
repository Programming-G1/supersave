import { useState } from 'react';
import { X, Send, Sparkles, User, Bot } from 'lucide-react';
import { fetchRecommendations, requestAiGuide, requestAiTriage, searchLocations } from '../../api';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { ChatMessage } from '../types';
import { inferSeverityFromSymptoms } from '../utils/severity';
import type { LocationSearchResult, RecommendationResult, SeverityLevel } from '../../types';

interface AIAssistantProps {
  onClose: () => void;
}

interface AssistantContext {
  symptomText?: string;
  severityLevel?: SeverityLevel;
  location?: LocationSearchResult;
  pendingRecommendation?: boolean;
}

export default function AIAssistant({ onClose }: AIAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: '증상을 입력해주세요. 예: "가슴 통증과 호흡곤란이 있어요"처럼 현재 상태를 알려주시면 응급실 이송 판단을 도와드릴게요.',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [assistantContext, setAssistantContext] = useState<AssistantContext>({});

  const inferSeverityLevel = (userMessage: string): SeverityLevel => {
    return inferSeverityFromSymptoms(userMessage);
  };

  const normalizeMessage = (userMessage: string) => userMessage.trim().toLowerCase().replace(/\s+/g, '');

  const hasMedicalContext = (userMessage: string): boolean => {
    const lowerMessage = userMessage.toLowerCase();
    const medicalKeywords = [
      '증상',
      '아파',
      '아픔',
      '통증',
      '열',
      '발열',
      '숙취',
      '과음',
      '음주',
      '어지러움',
      '메스꺼움',
      '구토',
      '호흡',
      '숨',
      '가슴',
      '흉부',
      '심장',
      '의식',
      '실신',
      '출혈',
      '경련',
      '쇼크',
      '뇌졸중',
      '외상',
      '골절',
      '복통',
      '두통',
      '응급',
      '병원',
      '이송',
      'ktas',
      '중증도',
      '대기',
      '고열',
      '발작',
    ];

    return medicalKeywords.some((keyword) => lowerMessage.includes(keyword));
  };

  const isRecommendationIntent = (userMessage: string): boolean => {
    const normalizedMessage = normalizeMessage(userMessage);
    return [
      '가까운',
      '근처',
      '어디',
      '어디냐',
      '어디냐고',
      '추천',
      '병원추천',
      '응급실추천',
      '가까운곳',
      '대기짧',
      '빨리',
    ].some((keyword) => normalizedMessage.includes(keyword));
  };

  const shouldTreatAsLocation = (userMessage: string, context: AssistantContext): boolean => {
    const normalizedMessage = normalizeMessage(userMessage);
    if (hasMedicalContext(userMessage) || isRecommendationIntent(userMessage)) {
      return false;
    }

    return Boolean(context.pendingRecommendation) || [
      '대학교',
      '캠퍼스',
      '캠',
      '단국',
      '역',
      '터미널',
      '동',
      '구',
      '시',
      '로',
      '길',
      '주소',
      '현재위치',
    ].some((keyword) => normalizedMessage.includes(keyword));
  };

  const sortRecommendations = (items: RecommendationResult[], userMessage: string) => {
    const normalizedMessage = normalizeMessage(userMessage);
    const sorted = [...items];

    if (normalizedMessage.includes('대기')) {
      return sorted.sort((a, b) => a.estimatedWaitMinutes - b.estimatedWaitMinutes);
    }

    if (normalizedMessage.includes('총') || normalizedMessage.includes('빨리')) {
      return sorted.sort((a, b) => a.totalEstimatedMinutes - b.totalEstimatedMinutes);
    }

    if (normalizedMessage.includes('가까') || normalizedMessage.includes('근처') || normalizedMessage.includes('어디')) {
      return sorted.sort((a, b) => a.etaMinutes - b.etaMinutes || a.distanceKm - b.distanceKm);
    }

    return sorted;
  };

  const buildLocationQueries = (userMessage: string) => {
    const trimmedMessage = userMessage.trim();
    const expandedCampus = trimmedMessage
      .replace(/죽전캠(?!퍼스)/g, '죽전캠퍼스')
      .replace(/천안캠(?!퍼스)/g, '천안캠퍼스');
    const queries = [trimmedMessage, expandedCampus];

    if (trimmedMessage.includes('단국') && trimmedMessage.includes('죽전')) {
      queries.push('단국대학교 죽전캠퍼스');
    }

    return [...new Set(queries.filter(Boolean))];
  };

  const findLocation = async (userMessage: string) => {
    for (const query of buildLocationQueries(userMessage)) {
      const locations = await searchLocations(query);
      if (locations.length > 0) {
        return locations[0];
      }
    }

    return null;
  };

  const buildRecommendationMessage = (
    recommendations: RecommendationResult[],
    context: Required<Pick<AssistantContext, 'location' | 'symptomText' | 'severityLevel'>>,
    userMessage: string,
  ) => {
    const topRecommendations = sortRecommendations(recommendations, userMessage).slice(0, 3);
    if (topRecommendations.length === 0) {
      return '현재 조건으로 추천 가능한 병원을 찾지 못했습니다. 위치를 조금 더 넓게 보거나 증상 정보를 다시 확인해주세요.';
    }

    const lines = topRecommendations.map((item, index) => (
      `${index + 1}. ${item.hospitalName}\n` +
      `   거리 ${item.distanceKm}km · 이동 ${item.etaMinutes}분 · 대기 ${item.estimatedWaitMinutes}분 · 총 ${item.totalEstimatedMinutes}분 예상 · 가용 병상 ${item.availableBeds}개`
    ));

    return [
      `현재 기준으로는 ${topRecommendations[0].hospitalName}이 가장 적합해 보여요.`,
      `출발 위치: ${context.location.name}`,
      `증상: ${context.symptomText} / AI 참고 중증도: ${context.severityLevel}`,
      '',
      ...lines,
      '',
      '이 결과는 의사결정 보조용입니다. 증상이 악화되거나 호흡곤란, 의식저하가 있으면 즉시 119에 연락하세요.',
    ].join('\n');
  };

  const recommendHospitals = async (context: AssistantContext, userMessage: string) => {
    if (!context.location) {
      setAssistantContext((prev) => ({ ...prev, pendingRecommendation: true }));
      return '가까운 병원을 추천하려면 출발 위치가 필요해요. 예: "단국대학교 죽전캠퍼스", "서울역"처럼 현재 위치를 알려주세요.';
    }

    if (!context.symptomText || !context.severityLevel) {
      setAssistantContext((prev) => ({ ...prev, pendingRecommendation: true }));
      return `출발 위치는 ${context.location.name}으로 잡았어요. 이제 환자 증상을 알려주세요. 예: "38도 열이 나요", "가슴 통증과 호흡곤란이 있어요"`;
    }

    const recommendations = await fetchRecommendations({
      latitude: context.location.latitude,
      longitude: context.location.longitude,
      severityLevel: context.severityLevel,
      symptomSummary: context.symptomText,
    });

    setAssistantContext((prev) => ({ ...prev, pendingRecommendation: false }));
    return buildRecommendationMessage(
      recommendations,
      {
        location: context.location,
        symptomText: context.symptomText,
        severityLevel: context.severityLevel,
      },
      userMessage,
    );
  };

  const getLocalResponse = (userMessage: string): string | null => {
    const normalizedMessage = normalizeMessage(userMessage);

    if (['하이', '안녕', '안녕하세요', 'ㅎㅇ', 'hello', 'hi'].includes(normalizedMessage)) {
      return '안녕하세요! 증상을 입력해주세요. 환자의 증상, 나이, 기저질환, 현재 위치를 알려주시면 응급실 선택을 도와드릴게요.';
    }

    if (
      normalizedMessage.includes('이름') ||
      normalizedMessage.includes('누구') ||
      ((normalizedMessage.includes('너') ||
        normalizedMessage.includes('니') ||
        normalizedMessage.includes('당신')) &&
        (normalizedMessage.includes('뭐') ||
          normalizedMessage.includes('무엇') ||
          normalizedMessage.includes('정체')))
    ) {
      return '저는 SuperSave AI 도우미입니다. 응급실 이송 판단을 돕기 위해 증상과 상황을 정리해드려요. 먼저 환자 증상을 입력해주세요.';
    }

    if (normalizedMessage.includes('고마워') || normalizedMessage.includes('감사')) {
      return '도움이 됐다니 다행입니다. 추가 증상이나 병원 선택 기준이 있으면 이어서 알려주세요.';
    }

    return null;
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const prompt = inputValue.trim();
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: prompt,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const localResponse = getLocalResponse(prompt);
      if (localResponse) {
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: localResponse,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, aiMessage]);
        return;
      }

      if (shouldTreatAsLocation(prompt, assistantContext)) {
        const selectedLocation = await findLocation(prompt);
        if (!selectedLocation) {
          const aiMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: '위치를 찾지 못했어요. 건물명이나 주소를 조금 더 정확히 입력해주세요. 예: "단국대학교 죽전캠퍼스"',
            timestamp: new Date(),
          };

          setMessages((prev) => [...prev, aiMessage]);
          return;
        }

        const nextContext = { ...assistantContext, location: selectedLocation, pendingRecommendation: true };
        setAssistantContext(nextContext);

        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: await recommendHospitals(nextContext, prompt),
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, aiMessage]);
        return;
      }

      if (isRecommendationIntent(prompt)) {
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: await recommendHospitals(assistantContext, prompt),
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, aiMessage]);
        return;
      }

      if (hasMedicalContext(prompt)) {
        const triage = await requestAiTriage({ symptomText: prompt });
        const nextContext = {
          ...assistantContext,
          symptomText: prompt,
          severityLevel: triage.severityLevel,
        };
        setAssistantContext(nextContext);

        if (assistantContext.pendingRecommendation && nextContext.location) {
          const aiMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: await recommendHospitals(nextContext, prompt),
            timestamp: new Date(),
          };

          setMessages((prev) => [...prev, aiMessage]);
          return;
        }

        const response = await requestAiGuide({
          symptomText: prompt,
          severityLevel: triage.severityLevel,
          userQuestion: prompt,
        });

        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `${response.answer}\n\nAI 참고 중증도: ${triage.severityLevel}\n${triage.reasoning}`,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, aiMessage]);
        return;
      }

      if (!assistantContext.symptomText && !hasMedicalContext(prompt)) {
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '응급 판단을 위해 증상을 입력해주세요. 예: "38도 열이 나고 숨이 차요", "가슴 통증이 있어요"처럼 현재 상태를 알려주시면 됩니다.',
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, aiMessage]);
        return;
      }

      const response = await requestAiGuide({
        symptomText: assistantContext.symptomText ?? prompt,
        severityLevel: assistantContext.severityLevel ?? inferSeverityLevel(prompt),
        userQuestion: prompt,
      });

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'AI 응답을 불러오지 못했습니다. 백엔드 서버와 Gemini 환경변수 설정을 확인해주세요.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickQuestions = [
    '가장 가까운 병원 추천',
    '대기 시간이 짧은 병원',
    '심장내과 전문의 병원',
    'KTAS 등급 설명',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:items-end sm:justify-end sm:p-6">
      <Card className="flex h-[calc(100dvh-1.5rem)] max-h-[600px] w-full max-w-md flex-col overflow-hidden shadow-2xl sm:h-[min(600px,calc(100dvh-3rem))]">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b p-4">
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
        <ScrollArea className="min-h-0 flex-1 p-4">
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
          <div className="shrink-0 border-t bg-gray-50 p-4">
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
        <div className="shrink-0 border-t p-4">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.nativeEvent.isComposing) return;
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="질문을 입력하세요..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button onClick={handleSend} size="icon" className="bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
