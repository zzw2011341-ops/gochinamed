"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/gochinamed/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(language === 'zh' ? '重置链接已发送到您的邮箱，请查收。' : 'Reset link sent to your email.');
      } else {
        setMessage(data.error || (language === 'zh' ? '发送失败，请重试。' : 'Failed to send. Please try again.'));
      }
    } catch (error) {
      setMessage(language === 'zh' ? '网络错误，请重试。' : 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Button variant="ghost" onClick={() => router.push('/login')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {language === 'zh' ? '返回登录' : 'Back to Login'}
          </Button>
          <CardTitle>{language === 'zh' ? '忘记密码' : 'Forgot Password'}</CardTitle>
          <CardDescription>
            {language === 'zh' ? '输入您的邮箱，我们将发送密码重置链接。' : 'Enter your email and we will send a password reset link.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder={language === 'zh' ? '邮箱地址' : 'Email address'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (language === 'zh' ? '发送中...' : 'Sending...') : (language === 'zh' ? '发送重置链接' : 'Send Reset Link')}
            </Button>
            {message && (
              <p className={`text-sm ${message.includes('已发送') || message.includes('sent') ? 'text-green-600' : 'text-red-600'}`}>
                {message}
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
