'use client';

import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { MessageSquare, Mic, Send, Upload, Sparkles, FileText, X } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isExpanded?: boolean;
}

interface UploadedFile {
  fileKey: string;
  downloadUrl: string;
  fileName: string;
}

export default function AIAssistantPage() {
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && uploadedFiles.length === 0) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage + (uploadedFiles.length > 0 ? `\n\n[Attached ${uploadedFiles.length} file(s)]` : ''),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          userId: 'demo-user', // In production, get from auth
          language,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let assistantMessage: Message = {
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                setMessages((prev) =>
                  prev.map((msg, idx) =>
                    idx === prev.length - 1
                      ? { ...msg, content: msg.content + parsed.content }
                      : msg
                  )
                );
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: language === 'zh' ? '抱歉，我遇到了一些问题。请稍后再试。' : 'Sorry, I encountered an issue. Please try again later.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
      setUploadedFiles([]);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const data = await response.json();
      setUploadedFiles((prev) => [...prev, data]);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert(language === 'zh' ? '文件上传失败' : 'Failed to upload file');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVoiceInput = () => {
    // Placeholder for voice input functionality
    alert(language === 'zh' ? '语音输入功能即将推出' : 'Voice input coming soon');
  };

  const toggleMessageExpand = (index: number) => {
    setMessages((prev) =>
      prev.map((msg, idx) =>
        idx === index ? { ...msg, isExpanded: !msg.isExpanded } : msg
      )
    );
  };

  const getMessageSummary = (content: string) => {
    const plainText = content.replace(/\n/g, ' ');
    if (plainText.length <= 150) return plainText;
    return plainText.substring(0, 150) + '...';
  };

  const renderMessageContent = (msg: Message, idx: number) => {
    const isLongMessage = msg.content.length > 150;
    const shouldShowFull = msg.isExpanded || !isLongMessage;

    return (
      <div
        className={`max-w-[85%] rounded-xl ${
          msg.role === 'user'
            ? 'bg-blue-600 text-white ml-auto'
            : 'bg-white border border-gray-200 shadow-sm'
        }`}
      >
        {/* Card Header */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {msg.role === 'assistant' && (
                <div className="bg-blue-100 rounded-full p-1.5">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                </div>
              )}
              <span className="text-sm font-medium">
                {msg.role === 'user'
                  ? (language === 'zh' ? '我' : 'You')
                  : (language === 'zh' ? 'AI助手' : 'AI Assistant')}
              </span>
            </div>
            <span className="text-xs text-gray-500">
              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Card Content */}
        <div className="px-4 py-3">
          <div className={`prose prose-sm ${msg.role === 'user' ? 'text-white' : 'text-gray-700'}`}>
            {shouldShowFull ? (
              <div className="whitespace-pre-wrap">{msg.content}</div>
            ) : (
              <div className="whitespace-pre-wrap">{getMessageSummary(msg.content)}</div>
            )}
          </div>

          {/* Expand/Collapse Button */}
          {isLongMessage && (
            <button
              onClick={() => toggleMessageExpand(idx)}
              className={`mt-2 text-sm font-medium flex items-center gap-1 ${
                msg.role === 'user'
                  ? 'text-blue-200 hover:text-blue-100'
                  : 'text-blue-600 hover:text-blue-700'
              }`}
            >
              {msg.isExpanded
                ? (language === 'zh' ? '收起' : 'Show less')
                : (language === 'zh' ? '展开查看详情' : 'Show more')}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-blue-100 rounded-full p-4 mb-4">
            <Sparkles className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            {t('ai.title')}
          </h1>
          <p className="text-gray-600">
            {language === 'zh'
              ? '我可以帮您了解医疗信息、推荐医生和医院、规划旅行行程'
              : 'I can help you understand medical information, recommend doctors and hospitals, and plan your travel itinerary'}
          </p>
        </div>

        {/* Chat Container */}
        <Card className="mb-4">
          <CardContent className="p-6">
            {/* Messages */}
            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>
                    {language === 'zh'
                      ? '开始与我对话，我会帮助您...'
                      : 'Start a conversation with me, I will help you...'}
                  </p>
                </div>
              )}

              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {renderMessageContent(msg, idx)}
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-4">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (
              <div className="mb-4 space-y-2">
                {uploadedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-blue-50 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">{file.fileName}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile(idx)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Input Area */}
            <div className="space-y-3">
              <Textarea
                placeholder={t('ai.inputPlaceholder')}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="min-h-[100px]"
                disabled={isLoading}
              />

              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,.pdf"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {t('ai.uploadFiles')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleVoiceInput}
                    disabled={isLoading}
                    className={isRecording ? 'bg-red-100' : ''}
                  >
                    <Mic className="h-4 w-4 mr-2" />
                    {t('ai.voiceInput')}
                  </Button>
                </div>

                <Button
                  onClick={handleSendMessage}
                  disabled={isLoading || (!inputMessage.trim() && uploadedFiles.length === 0)}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {t('ai.send')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">
                {language === 'zh' ? '查找医生' : 'Find a Doctor'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                {language === 'zh'
                  ? '根据您的症状推荐合适的医生'
                  : 'Get doctor recommendations based on your symptoms'}
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">
                {language === 'zh' ? '了解医院' : 'Learn About Hospitals'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                {language === 'zh'
                  ? '了解中国顶级医院的信息'
                  : 'Get information about top Chinese hospitals'}
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">
                {language === 'zh' ? '规划行程' : 'Plan Your Trip'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                {language === 'zh'
                  ? '生成个性化的医疗+旅游方案'
                  : 'Generate personalized medical + travel plan'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
