'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  Smartphone,
  QrCode,
  CheckCircle2,
  Star,
  Shield,
  Zap,
  Globe,
  UserCheck,
  FileText,
  Calendar,
  MapPin,
  Plane,
  Stethoscope,
  ArrowRight,
  AlertCircle,
  Info,
} from 'lucide-react';

export default function AppDownloadPage() {
  const { language } = useLanguage();
  const [selectedPlatform, setSelectedPlatform] = useState<'android' | 'ios'>('android');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  const appInfo = {
    name: 'GoChinaMed',
    version: '1.0.0',
    status: language === 'zh' ? '测试中' : 'Testing',
    size: {
      android: '45.2 MB',
      ios: '52.8 MB',
    },
    rating: 4.8,
    downloads: '10,000+',
    lastUpdate: '2026-01-30',
  };

  const features = language === 'zh' ? [
    { icon: Globe, title: '多语言支持', desc: '支持中文、英文、德文、法文' },
    { icon: Stethoscope, title: '医生预约', desc: '一键预约知名专家' },
    { icon: Plane, title: '行程规划', desc: '智能医疗旅游行程定制' },
    { icon: MapPin, title: '景点推荐', desc: '特色旅游景点和康复推荐' },
    { icon: FileText, title: '健康档案', desc: '云端存储，随时查看' },
    { icon: Calendar, title: '预约管理', desc: '在线管理所有医疗预约' },
  ] : [
    { icon: Globe, title: 'Multi-language', desc: 'Support EN, DE, FR, ZH' },
    { icon: Stethoscope, title: 'Doctor Booking', desc: 'One-tap appointment booking' },
    { icon: Plane, title: 'Trip Planning', desc: 'Smart medical tourism itineraries' },
    { icon: MapPin, title: 'Attractions', desc: 'Featured attractions & recovery spots' },
    { icon: FileText, title: 'Health Records', desc: 'Cloud storage, access anytime' },
    { icon: Calendar, title: 'Appointment Mgmt', desc: 'Manage all medical appointments' },
  ];

  const screenshots = [
    '/screenshots/home.png',
    '/screenshots/doctors.png',
    '/screenshots/booking.png',
    '/screenshots/profile.png',
  ];

  const handleDownload = async (platform: 'android' | 'ios') => {
    setIsDownloading(true);
    setDownloadProgress(0);

    // 模拟下载进度
    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsDownloading(false);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    // 触发下载
    const fileName = platform === 'android' ? 'gochinamed-1.0.0.apk' : 'GoChinaMed-1.0.0.ipa';
    const fileUrl = `/downloads/${fileName}`;

    // 创建下载链接
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.click();
  };

  const currentLanguage = language === 'zh' ? 'zh' : 'en';
  const isMobile = typeof window !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center shadow-lg">
                <Stethoscope className="w-10 h-10 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-gray-900">{appInfo.name}</h1>
                  <Badge className="bg-orange-500 hover:bg-orange-600">
                    {appInfo.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  {language === 'zh' ? '智能医疗旅游平台' : 'Smart Medical Tourism Platform'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= 4
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'fill-gray-200 text-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">{appInfo.rating}</span>
                  <span className="text-sm text-gray-400">|</span>
                  <span className="text-sm text-gray-600">{appInfo.downloads}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Download Section */}
          <div className="space-y-6">
            <Card className="border-2 border-blue-200 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl">
                  {language === 'zh' ? '下载APP' : 'Download App'}
                </CardTitle>
                <CardDescription>
                  {language === 'zh'
                    ? `版本 ${appInfo.version} • 更新于 ${appInfo.lastUpdate}`
                    : `Version ${appInfo.version} • Updated ${appInfo.lastUpdate}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Tabs
                  value={selectedPlatform}
                  onValueChange={(v) => setSelectedPlatform(v as 'android' | 'ios')}
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="android" className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4" />
                      {language === 'zh' ? 'Android' : 'Android'}
                    </TabsTrigger>
                    <TabsTrigger value="ios" className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4" />
                      iOS
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="android" className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-5 h-5 text-green-600" />
                          <span className="font-medium text-green-900">
                            {language === 'zh' ? 'Android 版本' : 'Android Version'}
                          </span>
                        </div>
                        <Badge className="bg-green-600">
                          {appInfo.size.android}
                        </Badge>
                      </div>
                      <div className="space-y-2 text-sm text-green-800">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            {language === 'zh'
                              ? '支持 Android 5.0 及以上'
                              : 'Supports Android 5.0 and above'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            {language === 'zh'
                              ? '支持 ARM64 架构'
                              : 'Supports ARM64 architecture'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      size="lg"
                      className="w-full h-14 text-lg bg-gray-400 hover:bg-gray-500 cursor-not-allowed"
                      disabled={true}
                    >
                      <Download className="w-5 h-5 mr-2" />
                      {language === 'zh' ? '即将推出' : 'Coming Soon'}
                    </Button>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                      <div className="flex items-start gap-2">
                        <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-blue-900">
                          <p className="font-medium mb-1">
                            {language === 'zh' ? '应用正在开发中' : 'App Under Development'}
                          </p>
                          <p className="text-blue-700">
                            {language === 'zh'
                              ? 'Android 和 iOS 版本正在测试中，即将正式发布。敬请期待！'
                              : 'Android and iOS versions are under testing and will be released soon. Stay tuned!'}
                          </p>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-blue-200">
                        <p className="text-sm text-blue-800 font-medium">
                          {language === 'zh' ? '如何获取应用？' : 'How to get the app?'}
                        </p>
                        <ul className="text-sm text-blue-700 mt-1 space-y-1">
                          <li>
                            {language === 'zh'
                              ? '• 关注我们的官方公告'
                              : '• Follow our official announcements'}
                          </li>
                          <li>
                            {language === 'zh'
                              ? '• 注册账号，应用上线后第一时间通知您'
                              : '• Register to get notified when the app is released'}
                          </li>
                          <li>
                            {language === 'zh'
                              ? '• 联系客服获取测试版资格'
                              : '• Contact customer service for beta access'}
                          </li>
                        </ul>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="ios" className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-5 h-5 text-blue-600" />
                          <span className="font-medium text-blue-900">
                            {language === 'zh' ? 'iOS 版本' : 'iOS Version'}
                          </span>
                        </div>
                        <Badge className="bg-blue-600">
                          {appInfo.size.ios}
                        </Badge>
                      </div>
                      <div className="space-y-2 text-sm text-blue-800">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            {language === 'zh'
                              ? '支持 iOS 12.0 及以上'
                              : 'Supports iOS 12.0 and above'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            {language === 'zh'
                              ? '支持 iPhone 6s 及以上'
                              : 'Supports iPhone 6s and above'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      size="lg"
                      className="w-full h-14 text-lg bg-gray-400 hover:bg-gray-500 cursor-not-allowed"
                      disabled={true}
                    >
                      <Download className="w-5 h-5 mr-2" />
                      {language === 'zh' ? '即将推出' : 'Coming Soon'}
                    </Button>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                      <div className="flex items-start gap-2">
                        <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-blue-900">
                          <p className="font-medium mb-1">
                            {language === 'zh' ? '应用正在开发中' : 'App Under Development'}
                          </p>
                          <p className="text-blue-700">
                            {language === 'zh'
                              ? 'Android 和 iOS 版本正在测试中，即将正式发布。敬请期待！'
                              : 'Android and iOS versions are under testing and will be released soon. Stay tuned!'}
                          </p>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-blue-200">
                        <p className="text-sm text-blue-800 font-medium">
                          {language === 'zh' ? '如何获取应用？' : 'How to get the app?'}
                        </p>
                        <ul className="text-sm text-blue-700 mt-1 space-y-1">
                          <li>
                            {language === 'zh'
                              ? '• 关注我们的官方公告'
                              : '• Follow our official announcements'}
                          </li>
                          <li>
                            {language === 'zh'
                              ? '• 注册账号，应用上线后第一时间通知您'
                              : '• Register to get notified when the app is released'}
                          </li>
                          <li>
                            {language === 'zh'
                              ? '• 联系客服获取测试版资格'
                              : '• Contact customer service for beta access'}
                          </li>
                        </ul>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* QR Code Section */}
                <div className="border-t pt-6">
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-gray-700" />
                    {language === 'zh' ? '访问下载页面' : 'Access Download Page'}
                  </h3>

                  {/* Deployment Options */}
                  <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200 mb-4">
                    <p className="text-sm font-medium text-green-900 mb-2">
                      🚀 {language === 'zh' ? '🚀 推荐部署方式' : '🚀 Recommended Deployment'}
                    </p>
                    
                    <div className="bg-white rounded p-3 border border-green-300 mb-3">
                      <p className="text-sm font-medium text-green-800 mb-2">
                        {language === 'zh' ? '🌟 使用 Railway 部署' : '🌟 Deploy with Railway'}
                      </p>
                      <p className="text-xs text-green-700 mb-2 leading-relaxed">
                        {language === 'zh'
                          ? 'Railway 是一个快速的云平台，支持一键部署 Next.js 应用。部署后可以通过公网域名访问，手机可直接扫码下载。'
                          : 'Railway is a fast cloud platform that supports one-click Next.js deployment. After deployment, you can access via public domain and scan QR code directly on mobile.'}
                      </p>
                      
                      <ol className="text-xs text-green-700 space-y-1 list-decimal list-inside">
                        <li>
                          {language === 'zh'
                            ? '登录 Railway.app 并创建新项目'
                            : 'Login to Railway.app and create a new project'}
                        </li>
                        <li>
                          {language === 'zh'
                            ? '连接 GitHub 仓库（或从当前项目部署）'
                            : 'Connect GitHub repository (or deploy from current project)'}
                        </li>
                        <li>
                          {language === 'zh'
                            ? 'Railway 会自动检测 Next.js 并部署'
                            : 'Railway will automatically detect Next.js and deploy'}
                        </li>
                        <li>
                          {language === 'zh'
                            ? '获取部署后的 URL（如：https://your-app.railway.app）'
                            : 'Get the deployed URL (e.g., https://your-app.railway.app)'}
                        </li>
                        <li>
                          {language === 'zh'
                            ? '使用 URL/app-download 在手机上访问'
                            : 'Access on mobile with URL/app-download'}
                        </li>
                      </ol>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded p-2">
                      <p className="text-xs text-blue-800">
                        <strong>{language === 'zh' ? '✅ 优势：' : '✅ Benefits:'}</strong>
                        {language === 'zh'
                          ? ' 公网访问、HTTPS 支持、自动域名、免费额度、手机可直接访问'
                          : ' Public access, HTTPS support, auto domain, free tier, mobile friendly'}
                      </p>
                    </div>
                  </div>

                  {/* Local Development */}
                  <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200 mb-4">
                    <p className="text-sm font-medium text-blue-900 mb-2">
                      💻 {language === 'zh' ? '💻 本地开发' : '💻 Local Development'}
                    </p>
                    <div className="bg-white rounded p-3 border border-blue-300">
                      <p className="text-xs text-blue-800 mb-2 leading-relaxed">
                        {language === 'zh'
                          ? '如果您想在本地测试（需要电脑和手机在同一 WiFi 网络）：'
                          : 'If you want to test locally (requires computer and mobile on same WiFi):'}
                      </p>
                      <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                        <li>
                          {language === 'zh'
                            ? '在您的本地电脑上运行项目'
                            : 'Run the project on your local computer'}
                        </li>
                        <li>
                          {language === 'zh'
                            ? '找到电脑的局域网 IP（如 192.168.1.x）'
                            : 'Find your computer\'s local IP (e.g., 192.168.1.x)'}
                        </li>
                        <li>
                          {language === 'zh'
                            ? '手机访问：http://192.168.1.x:5000/app-download'
                            : 'Access on mobile: http://192.168.1.x:5000/app-download'}
                        </li>
                      </ol>
                    </div>
                  </div>

                  {/* QR Code Section - Placeholder */}
                  <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-3">
                      {language === 'zh' ? '📷 二维码下载' : '📷 QR Code Download'}
                    </p>
                    
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-sm text-gray-600 text-center mb-3">
                        {language === 'zh' 
                          ? '部署后二维码将显示在这里' 
                          : 'QR code will appear here after deployment'}
                      </p>
                      
                      <div className="aspect-square max-w-[200px] mx-auto bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                        <div className="text-center">
                          <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-xs text-gray-500">
                            {language === 'zh' ? '部署后生成' : 'Generate after deployment'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded p-2">
                        <p className="text-xs text-yellow-800">
                          <strong>{language === 'zh' ? '提示：' : 'Tip:'}</strong>
                          {language === 'zh'
                            ? ' 使用 Railway 部署后，输入您的域名即可生成可扫描的二维码。'
                            : ' After Railway deployment, enter your domain to generate a scannable QR code.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Version Info */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {language === 'zh' ? '版本信息' : 'Version Info'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">{language === 'zh' ? '当前版本' : 'Current Version'}</span>
                  <span className="font-medium">{appInfo.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{language === 'zh' ? '发布日期' : 'Release Date'}</span>
                  <span className="font-medium">{appInfo.lastUpdate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{language === 'zh' ? '最低系统要求' : 'Min System'}</span>
                  <span className="font-medium">
                    {selectedPlatform === 'android' ? 'Android 5.0+' : 'iOS 12.0+'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Features and Screenshots */}
          <div className="space-y-6">
            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {language === 'zh' ? '主要功能' : 'Key Features'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <feature.icon className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-sm mb-1">{feature.title}</h4>
                        <p className="text-xs text-gray-600">{feature.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Update Log */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {language === 'zh' ? '更新日志' : 'Update Log'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-l-2 border-blue-600 pl-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold">{appInfo.version}</span>
                      <span className="text-sm text-gray-600">{appInfo.lastUpdate}</span>
                    </div>
                    <ul className="space-y-1 text-sm text-gray-700">
                      <li className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span>
                          {language === 'zh'
                            ? '新增多语言支持（中文、英文、德文、法文）'
                            : 'Added multi-language support (EN, DE, FR, ZH)'}
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span>
                          {language === 'zh'
                            ? '优化医生预约流程'
                            : 'Optimized doctor booking flow'}
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span>
                          {language === 'zh'
                            ? '新增景点推荐功能'
                            : 'Added attraction recommendation feature'}
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span>
                          {language === 'zh'
                            ? '提升应用性能和稳定性'
                            : 'Improved app performance and stability'}
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  {language === 'zh' ? '安全认证' : 'Security Certifications'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-900">
                      {language === 'zh' ? '病毒扫描通过' : 'Virus Scanned'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-900">
                      {language === 'zh' ? '数据加密' : 'Data Encrypted'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-900">
                      {language === 'zh' ? '安全认证' : 'Security Certified'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-900">
                      {language === 'zh' ? '隐私保护' : 'Privacy Protected'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-12 text-center">
          <Card className="bg-gradient-to-r from-blue-600 to-blue-800 text-white border-0">
            <CardContent className="py-8">
              <h2 className="text-2xl font-bold mb-4">
                {language === 'zh'
                  ? '立即下载，开启医疗之旅'
                  : 'Download Now, Start Your Medical Journey'}
              </h2>
              <p className="text-blue-100 mb-6">
                {language === 'zh'
                  ? '访问中国顶级医疗资源，享受专业的医疗旅游服务'
                  : 'Access top-tier Chinese medical resources and professional medical tourism services'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => handleDownload('android')}
                  disabled={isDownloading}
                >
                  <Smartphone className="w-5 h-5 mr-2" />
                  {language === 'zh' ? '下载 Android 版' : 'Download for Android'}
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => handleDownload('ios')}
                  disabled={isDownloading}
                >
                  <Smartphone className="w-5 h-5 mr-2" />
                  {language === 'zh' ? '下载 iOS 版' : 'Download for iOS'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}
