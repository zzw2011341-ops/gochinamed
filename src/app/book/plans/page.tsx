'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Check, Star, Plane, Hotel, Stethoscope, DollarSign, Calendar, MapPin, Info } from 'lucide-react';

interface PlanOption {
  id: string;
  name: string;
  description: string;
  // 基础费用
  hotelFee: number;
  flightFee: number;
  carFee: number;
  ticketFee: number;
  reservationFee: number;
  // 医疗费用详细分类
  medicalSurgeryFee: number;
  medicineFee: number;
  nursingFee: number;
  nutritionFee: number;
  // 汇总字段
  medicalFee: number;
  totalAmount: number;
  highlights: string[];
  duration: string;
  hotelName: string;
  hotelStars: number;
  flightClass: string;
}

interface BookingData {
  userId: string;
  originCity: string;
  destinationCity: string;
  travelDate: string;
  selectedHospital: string;
  selectedDoctor: string;
  treatmentType: string;
}

interface Attraction {
  id: string;
  nameEn: string;
  nameZh: string;
  description: string;
  duration: string; // 预计游览时间
  price: number; // 门票费用
  category: string; // 类别：cultural, natural, modern, etc.
}

// 不同城市的景点数据
const cityAttractions: Record<string, Attraction[]> = {
  'Beijing': [
    {
      id: 'bj-1',
      nameEn: 'Forbidden City',
      nameZh: '故宫',
      description: 'Largest ancient imperial palace complex in the world',
      duration: '3-4 hours',
      price: 60,
      category: 'cultural'
    },
    {
      id: 'bj-2',
      nameEn: 'Great Wall',
      nameZh: '长城',
      description: 'One of the greatest wonders of the world',
      duration: '4-5 hours',
      price: 45,
      category: 'cultural'
    },
    {
      id: 'bj-3',
      nameEn: 'Temple of Heaven',
      nameZh: '天坛',
      description: 'Imperial sacrificial altar complex',
      duration: '2-3 hours',
      price: 35,
      category: 'cultural'
    },
    {
      id: 'bj-4',
      nameEn: 'Summer Palace',
      nameZh: '颐和园',
      description: 'Largest and most well-preserved royal garden',
      duration: '3-4 hours',
      price: 30,
      category: 'natural'
    },
    {
      id: 'bj-5',
      nameEn: 'Tiananmen Square',
      nameZh: '天安门广场',
      description: 'One of the largest city squares in the world',
      duration: '1-2 hours',
      price: 0,
      category: 'cultural'
    },
    {
      id: 'bj-6',
      nameEn: 'Beihai Park',
      nameZh: '北海公园',
      description: 'Imperial garden with a history of over 1,000 years',
      duration: '2-3 hours',
      price: 10,
      category: 'natural'
    },
    {
      id: 'bj-7',
      nameEn: 'Hutong Tour',
      nameZh: '胡同游',
      description: 'Traditional Beijing alleyways and courtyard homes',
      duration: '2-3 hours',
      price: 50,
      category: 'cultural'
    },
    {
      id: 'bj-8',
      nameEn: 'National Museum of China',
      nameZh: '中国国家博物馆',
      description: 'China\'s supreme museum of history and art',
      duration: '3-4 hours',
      price: 0,
      category: 'cultural'
    },
    {
      id: 'bj-9',
      nameEn: '798 Art Zone',
      nameZh: '798艺术区',
      description: 'Contemporary art gallery complex in old factory buildings',
      duration: '2-3 hours',
      price: 0,
      category: 'modern'
    },
    {
      id: 'bj-10',
      nameEn: 'Olympic Park',
      nameZh: '奥林匹克公园',
      description: 'Home to Bird\'s Nest and Water Cube',
      duration: '2-3 hours',
      price: 50,
      category: 'modern'
    }
  ],
  'Shanghai': [
    {
      id: 'sh-1',
      nameEn: 'The Bund',
      nameZh: '外滩',
      description: 'Historic waterfront area with colonial architecture',
      duration: '2-3 hours',
      price: 0,
      category: 'modern'
    },
    {
      id: 'sh-2',
      nameEn: 'Yu Garden',
      nameZh: '豫园',
      description: 'Classical Chinese garden in the old city',
      duration: '2-3 hours',
      price: 40,
      category: 'cultural'
    },
    {
      id: 'sh-3',
      nameEn: 'Shanghai Tower',
      nameZh: '上海中心大厦',
      description: 'Tallest building in China with observation deck',
      duration: '2-3 hours',
      price: 180,
      category: 'modern'
    },
    {
      id: 'sh-4',
      nameEn: 'Nanjing Road',
      nameZh: '南京路',
      description: 'Famous shopping street and pedestrian mall',
      duration: '2-3 hours',
      price: 0,
      category: 'modern'
    },
    {
      id: 'sh-5',
      nameEn: 'Oriental Pearl Tower',
      nameZh: '东方明珠塔',
      description: 'Iconic TV tower and observation deck',
      duration: '2-3 hours',
      price: 220,
      category: 'modern'
    },
    {
      id: 'sh-6',
      nameEn: 'Shanghai Museum',
      nameZh: '上海博物馆',
      description: 'Museum of ancient Chinese art',
      duration: '3-4 hours',
      price: 0,
      category: 'cultural'
    },
    {
      id: 'sh-7',
      nameEn: 'Jade Buddha Temple',
      nameZh: '玉佛寺',
      description: 'Buddhist temple with two jade Buddha statues',
      duration: '1-2 hours',
      price: 20,
      category: 'cultural'
    },
    {
      id: 'sh-8',
      nameEn: 'Former French Concession',
      nameZh: '法租界',
      description: 'Historic area with tree-lined streets and cafes',
      duration: '2-3 hours',
      price: 0,
      category: 'cultural'
    },
    {
      id: 'sh-9',
      nameEn: 'Disneyland Shanghai',
      nameZh: '上海迪士尼乐园',
      description: 'World-famous theme park',
      duration: 'Full day',
      price: 499,
      category: 'modern'
    },
    {
      id: 'sh-10',
      nameEn: 'Zhujiajiao Water Town',
      nameZh: '朱家角古镇',
      description: 'Ancient water town with canals and traditional houses',
      duration: '3-4 hours',
      price: 60,
      category: 'cultural'
    }
  ],
  // 默认景点列表（用于其他城市）
  'default': [
    {
      id: 'default-1',
      nameEn: 'City Museum',
      nameZh: '市博物馆',
      description: 'Learn about local history and culture',
      duration: '2-3 hours',
      price: 30,
      category: 'cultural'
    },
    {
      id: 'default-2',
      nameEn: 'Central Park',
      nameZh: '中心公园',
      description: 'Relax in the city\'s green space',
      duration: '1-2 hours',
      price: 0,
      category: 'natural'
    },
    {
      id: 'default-3',
      nameEn: 'Historic Old Town',
      nameZh: '老城区',
      description: 'Explore traditional architecture and streets',
      duration: '2-3 hours',
      price: 0,
      category: 'cultural'
    },
    {
      id: 'default-4',
      nameEn: 'Art Gallery',
      nameZh: '美术馆',
      description: 'Contemporary and traditional art exhibitions',
      duration: '2-3 hours',
      price: 20,
      category: 'modern'
    },
    {
      id: 'default-5',
      nameEn: 'Pagoda Tower',
      nameZh: '古塔',
      description: 'Historic pagoda with city views',
      duration: '1-2 hours',
      price: 25,
      category: 'cultural'
    },
    {
      id: 'default-6',
      nameEn: 'Botanical Garden',
      nameZh: '植物园',
      description: 'Beautiful gardens with local flora',
      duration: '2-3 hours',
      price: 15,
      category: 'natural'
    },
    {
      id: 'default-7',
      nameEn: 'Night Market',
      nameZh: '夜市',
      description: 'Experience local food and culture',
      duration: '2-3 hours',
      price: 0,
      category: 'cultural'
    },
    {
      id: 'default-8',
      nameEn: 'Modern Shopping District',
      nameZh: '现代商业区',
      description: 'Latest fashion and entertainment',
      duration: '2-3 hours',
      price: 0,
      category: 'modern'
    },
    {
      id: 'default-9',
      nameEn: 'Riverside Walk',
      nameZh: '江边步道',
      description: 'Scenic walk along the river',
      duration: '1-2 hours',
      price: 0,
      category: 'natural'
    },
    {
      id: 'default-10',
      nameEn: 'Temple of Local Religion',
      nameZh: '本地寺庙',
      description: 'Traditional religious site',
      duration: '1-2 hours',
      price: 10,
      category: 'cultural'
    }
  ]
};

export default function PlanSelectionPage() {
  const router = useRouter();
  const { language } = useLanguage();

  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanOption | null>(null);
  const [loading, setLoading] = useState(true);
  const [includeTourism, setIncludeTourism] = useState(false); // 是否包含旅游服务
  const [tourismFee, setTourismFee] = useState(0); // 旅游服务费用
  const [showAttractionDialog, setShowAttractionDialog] = useState(false); // 景点选择对话框
  const [selectedAttractions, setSelectedAttractions] = useState<string[]>([]); // 选中的景点ID列表
  const [attractions, setAttractions] = useState<Attraction[]>([]); // 当前城市的景点列表

  // 判断是否同城旅行
  const isSameCity = bookingData?.originCity === bookingData?.destinationCity;

  useEffect(() => {
    // 从sessionStorage获取方案数据
    const savedData = sessionStorage.getItem('bookingPlans');
    if (savedData) {
      const data = JSON.parse(savedData);
      setPlans(data.plans || []);
      setBookingData(data.requestData || null);
      setLoading(false);
    } else {
      // 如果没有数据，返回预订页面
      router.push('/book');
    }
  }, [router]);

  const handleSelectPlan = (plan: PlanOption) => {
    setSelectedPlan(plan);
  };

  const handleProceedToPayment = () => {
    if (!selectedPlan) return;

    // 如果选择了旅游服务，添加门票费用
    const finalPlan = includeTourism
      ? {
          ...selectedPlan,
          ticketFee: tourismFee,
          totalAmount: (selectedPlan.totalAmount || 0) + tourismFee,
        }
      : selectedPlan;

    // 保存选中的方案
    sessionStorage.setItem('selectedPlan', JSON.stringify(finalPlan));
    sessionStorage.setItem('includeTourism', JSON.stringify(includeTourism));
    
    // 如果选择了旅游服务，保存选中的景点信息
    if (includeTourism && selectedAttractions.length > 0) {
      const selectedAttractionDetails = attractions.filter(a => selectedAttractions.includes(a.id));
      sessionStorage.setItem('selectedAttractions', JSON.stringify(selectedAttractionDetails));
    }
    
    // 跳转到支付页面
    router.push('/book/payment');
  };

  // 计算旅游服务费用（基于基础估算）
  useEffect(() => {
    if (includeTourism && bookingData) {
      // 加载当前城市的景点列表
      const cityAttractionList = cityAttractions[bookingData.destinationCity] || cityAttractions['default'];
      setAttractions(cityAttractionList);
      // 默认选中前3个热门景点
      setSelectedAttractions(cityAttractionList.slice(0, 3).map(a => a.id));
    } else {
      setAttractions([]);
      setSelectedAttractions([]);
    }
  }, [includeTourism, bookingData]);

  // 当用户选择的景点变化时，更新门票费用
  useEffect(() => {
    if (includeTourism && selectedAttractions.length > 0) {
      const totalFee = selectedAttractions.reduce((sum, attractionId) => {
        const attraction = attractions.find(a => a.id === attractionId);
        return sum + (attraction?.price || 0);
      }, 0);
      setTourismFee(totalFee);
    } else if (includeTourism) {
      // 如果用户开启旅游服务但没有选择景点，使用默认费用
      setTourismFee(7 * 80);
    } else {
      setTourismFee(0);
    }
  }, [selectedAttractions, attractions, includeTourism]);

  // 处理旅游服务开关变化
  const handleTourismToggle = (checked: boolean) => {
    setIncludeTourism(checked);
    if (checked) {
      // 打开景点选择对话框
      setShowAttractionDialog(true);
    }
  };

  // 处理景点选择变化
  const handleAttractionToggle = (attractionId: string, checked: boolean) => {
    if (checked) {
      setSelectedAttractions([...selectedAttractions, attractionId]);
    } else {
      setSelectedAttractions(selectedAttractions.filter(id => id !== attractionId));
    }
  };

  // 计算实际总价
  const getTotalPrice = (plan: PlanOption) => {
    return (plan.totalAmount || 0) + (includeTourism ? tourismFee : 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {language === 'zh' ? '返回' : 'Back'}
          </Button>
          <h1 className="text-3xl font-bold">
            {language === 'zh' ? '选择您的方案' : 'Choose Your Plan'}
          </h1>
          <p className="text-gray-600 mt-2">
            {language === 'zh'
              ? `从 ${bookingData?.originCity} 到 ${bookingData?.destinationCity}`
              : `From ${bookingData?.originCity} to ${bookingData?.destinationCity}`
            }
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 旅游服务选项 */}
        <Card className="mb-8 border-2 border-blue-200 bg-blue-50/30">
          <CardHeader>
            <div className="flex items-start gap-4">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <CardTitle className="text-lg">
                  {language === 'zh' ? '旅游计划选项' : 'Tourism Options'}
                </CardTitle>
                <CardDescription className="mt-1">
                  {language === 'zh'
                    ? '这是一个医疗旅游平台，主要提供医疗服务。如需在治疗期间游览当地景点，可选择添加旅游服务。'
                    : 'This is a medical tourism platform focused on healthcare services. You can add tourism services if you wish to visit local attractions during your treatment.'}
                </CardDescription>
              </div>
              <Switch
                checked={includeTourism}
                onCheckedChange={handleTourismToggle}
                className="mt-2"
              />
            </div>
          </CardHeader>
          {includeTourism && (
            <CardContent>
              <div className="flex items-center justify-between text-sm text-blue-700 bg-blue-100 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {language === 'zh'
                      ? `已添加旅游服务（门票费：$${tourismFee.toLocaleString()}）`
                      : `Tourism services added (Ticket fee: $${tourismFee.toLocaleString()})`
                    }
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAttractionDialog(true)}
                  className="h-8"
                >
                  {language === 'zh' ? '选择景点' : 'Select Attractions'}
                </Button>
              </div>
              {selectedAttractions.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="text-xs text-gray-600">
                    {language === 'zh' ? '已选景点：' : 'Selected attractions:'}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedAttractions.map((id) => {
                      const attraction = attractions.find(a => a.id === id);
                      return (
                        <Badge key={id} variant="secondary" className="text-xs">
                          {language === 'zh' ? attraction?.nameZh : attraction?.nameEn}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {plans.map((plan, index) => {
            const isSelected = selectedPlan?.id === plan.id;
            const isRecommended = index === 1; // 推荐第二个方案

            return (
              <Card
                key={plan.id}
                className={`relative cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'ring-4 ring-blue-600 shadow-2xl scale-105 border-blue-600 bg-blue-50/30'
                    : 'hover:shadow-lg hover:scale-102 border-gray-200'
                } ${isRecommended && !isSelected ? 'border-blue-300 border-2' : ''}`}
                onClick={() => handleSelectPlan(plan)}
              >
                {/* 状态指示器 - 选中时显示蓝色圆圈和对钩 */}
                <div className="absolute top-4 right-4 z-10">
                  {isSelected ? (
                    <div className="w-12 h-12 rounded-full bg-blue-600 border-[3px] border-blue-600 flex items-center justify-center shadow-lg animate-pulse">
                      <Check className="h-7 w-7 text-white" strokeWidth={4} />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-white border-[2px] border-gray-300" />
                  )}
                </div>

                {isRecommended && !isSelected && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <Badge className="bg-blue-600 text-white px-4 py-1 shadow-md">
                      {language === 'zh' ? '推荐' : 'Recommended'}
                    </Badge>
                  </div>
                )}

                <CardHeader>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription className="text-sm">{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Price */}
                  <div className={`rounded-lg p-4 ${includeTourism ? 'bg-purple-50' : 'bg-blue-50'}`}>
                    <div className="text-sm text-gray-600 mb-1">
                      {language === 'zh' ? '总价' : 'Total Price'}
                    </div>
                    <div className={`text-3xl font-bold ${includeTourism ? 'text-purple-600' : 'text-blue-600'}`}>
                      ${getTotalPrice(plan).toLocaleString()}
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>{plan.duration}</span>
                  </div>

                  {/* Fee Breakdown */}
                  <div className="space-y-2 border-t pt-4">
                    {/* 医疗费用 - 如果有医疗服务显示详细分类 */}
                    {plan.medicalFee > 0 ? (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm font-medium text-blue-700">
                          <span className="flex items-center gap-2">
                            <Stethoscope className="h-4 w-4" />
                            {language === 'zh' ? '医疗费用（总计）' : 'Medical Fee (Total)'}
                          </span>
                          <span>${(plan.medicalFee || 0).toLocaleString()}</span>
                        </div>
                        <div className="pl-6 space-y-1 text-xs text-gray-600">
                          {/* 只显示有值的费用项 */}
                          {(plan.medicalSurgeryFee || 0) > 0 && (
                            <div className="flex justify-between">
                              <span>{language === 'zh' ? '• 手术费' : '• Surgery'}</span>
                              <span>${(plan.medicalSurgeryFee || 0).toLocaleString()}</span>
                            </div>
                          )}
                          {(plan.medicineFee || 0) > 0 && (
                            <div className="flex justify-between">
                              <span>{language === 'zh' ? '• 药费' : '• Medicine'}</span>
                              <span>${(plan.medicineFee || 0).toLocaleString()}</span>
                            </div>
                          )}
                          {(plan.nursingFee || 0) > 0 && (
                            <div className="flex justify-between">
                              <span>{language === 'zh' ? '• 护理费' : '• Nursing'}</span>
                              <span>${(plan.nursingFee || 0).toLocaleString()}</span>
                            </div>
                          )}
                          {(plan.nutritionFee || 0) > 0 && (
                            <div className="flex justify-between">
                              <span>{language === 'zh' ? '• 营养费' : '• Nutrition'}</span>
                              <span>${(plan.nutritionFee || 0).toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between text-sm text-gray-400">
                        <span className="flex items-center gap-2">
                          <Stethoscope className="h-4 w-4" />
                          {language === 'zh' ? '医疗费用' : 'Medical Fee'}
                        </span>
                        <span className="font-medium">
                          {language === 'zh' ? '未选择医疗服务' : 'Not selected'}
                        </span>
                      </div>
                    )}

                    {/* 基础费用 */}
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Hotel className="h-4 w-4" />
                        {language === 'zh' ? '酒店费用' : 'Hotel Fee'}
                      </span>
                      <span className="font-medium">${(plan.hotelFee || 0).toLocaleString()}</span>
                    </div>

                    {/* 机票或车费 */}
                    {isSameCity ? (
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          {language === 'zh' ? '车费' : 'Car Fee'}
                        </span>
                        <span className="font-medium">${(plan.carFee || 0).toLocaleString()}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <Plane className="h-4 w-4" />
                          {language === 'zh' ? '机票费用' : 'Flight Fee'}
                        </span>
                        <span className="font-medium">${(plan.flightFee || 0).toLocaleString()}</span>
                      </div>
                    )}

                    {/* 其他费用 - 旅游服务 */}
                    {includeTourism ? (
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-purple-600" />
                          {language === 'zh' ? '旅游门票' : 'Tourism Tickets'}
                        </span>
                        <span className="font-medium text-purple-600">
                          ${tourismFee.toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      /* 门票费为0时不显示此项，因为医疗旅游默认不包含旅游服务 */
                      null
                    )}

                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {language === 'zh' ? '预约费用' : 'Reservation Fee'}
                      </span>
                      <span className="font-medium">${(plan.reservationFee || 0).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Hotel & Transportation Info */}
                  <div className="space-y-2 border-t pt-4">
                    <div className="text-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <Hotel className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{plan.hotelName}</span>
                      </div>
                      <div className="flex gap-0.5">
                        {[...Array(plan.hotelStars)].map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                    {/* 根据是否同城显示不同的交通类型 */}
                    {isSameCity ? (
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        <span className="capitalize">
                          {plan.flightClass === 'local-transportation' ? (
                            language === 'zh' ? '本地出租车' : 'Local Taxi'
                          ) : plan.flightClass === 'premium-transport' ? (
                            language === 'zh' ? '专车服务' : 'Premium Car'
                          ) : plan.flightClass === 'vip-transport' ? (
                            language === 'zh' ? 'VIP专车' : 'VIP Car'
                          ) : (
                            plan.flightClass
                          )}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm">
                        <Plane className="h-4 w-4 text-gray-500" />
                        <span className="capitalize">{plan.flightClass} Class</span>
                      </div>
                    )}
                  </div>

                  {/* Highlights */}
                  <div className="border-t pt-4">
                    <div className="text-sm font-medium mb-2">
                      {language === 'zh' ? '方案亮点' : 'Highlights'}
                    </div>
                    <ul className="space-y-1">
                      {plan.highlights.map((highlight, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>


                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Proceed Button */}
        <div className="mt-8 flex justify-center">
          <Button
            size="lg"
            onClick={handleProceedToPayment}
            disabled={!selectedPlan}
            className="px-12"
          >
            {language === 'zh' ? '继续支付' : 'Proceed to Payment'}
            <DollarSign className="h-5 w-5 ml-2" />
          </Button>
        </div>

        {/* Warning */}
        {!selectedPlan && (
          <div className="mt-4 text-center text-sm text-gray-500">
            {language === 'zh' ? '请选择一个方案继续' : 'Please select a plan to continue'}
          </div>
        )}
      </div>

      {/* 景点选择对话框 */}
      <Dialog open={showAttractionDialog} onOpenChange={setShowAttractionDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {language === 'zh'
                ? `选择 ${bookingData?.destinationCity} 的景点`
                : `Select Attractions in ${bookingData?.destinationCity}`}
            </DialogTitle>
            <DialogDescription>
              {language === 'zh'
                ? '选择您想要游览的当地景点，门票费用将计入您的总费用中'
                : 'Select local attractions you want to visit. Ticket fees will be added to your total cost'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {attractions.map((attraction) => {
              const isSelected = selectedAttractions.includes(attraction.id);
              return (
                <Card
                  key={attraction.id}
                  className={`cursor-pointer transition-all ${
                    isSelected
                      ? 'ring-2 ring-blue-500 bg-blue-50/50'
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => handleAttractionToggle(attraction.id, !isSelected)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => {}}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <CardTitle className="text-base">
                          {language === 'zh' ? attraction.nameZh : attraction.nameEn}
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {attraction.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {language === 'zh' ? '游览时间' : 'Duration'}: {attraction.duration}
                        </span>
                      </div>
                      <Badge
                        variant={attraction.price === 0 ? 'secondary' : 'default'}
                        className="text-xs"
                      >
                        {attraction.price === 0
                          ? language === 'zh'
                            ? '免费'
                            : 'Free'
                          : `$${attraction.price}`}
                      </Badge>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {language === 'zh'
                        ? attraction.category === 'cultural'
                          ? '文化'
                          : attraction.category === 'natural'
                          ? '自然'
                          : attraction.category === 'modern'
                          ? '现代'
                          : attraction.category
                        : attraction.category}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <DialogFooter className="flex items-center justify-between border-t pt-4">
            <div className="text-sm text-gray-600">
              {language === 'zh'
                ? `已选 ${selectedAttractions.length} 个景点，门票总计：$${tourismFee}`
                : `${selectedAttractions.length} attractions selected, Total tickets: $${tourismFee}`}
            </div>
            <Button onClick={() => setShowAttractionDialog(false)}>
              {language === 'zh' ? '确定' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
