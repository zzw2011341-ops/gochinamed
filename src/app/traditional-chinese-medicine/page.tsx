"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/locales";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Activity, Target, Zap, Shield } from "lucide-react";

export default function TraditionalChineseMedicinePage() {
  const { language } = useLanguage();
  const t = translations[language];

  const therapies = [
    {
      id: "acupuncture",
      icon: <Zap className="h-12 w-12 text-blue-600" />,
      title: {
        en: "Acupuncture (针灸)",
        zh: "针灸"
      },
      description: {
        en: "A key component of traditional Chinese medicine (TCM), acupuncture involves inserting thin needles into specific points on the body to balance energy flow (Qi). It is effective for pain relief, treating various conditions, and promoting overall wellness.",
        zh: "针灸是传统中医的核心疗法，通过在人体特定穴位插入细针来平衡能量流动（气）。对缓解疼痛、治疗各种疾病和促进整体健康非常有效。"
      },
      benefits: {
        en: [
          "Pain Management: Chronic pain, arthritis, migraines, and sports injuries",
          "Neurological Disorders: Stroke rehabilitation, neuropathy, and facial paralysis",
          "Respiratory Conditions: Asthma, allergies, and sinusitis",
          "Digestive Disorders: IBS, gastritis, and nausea",
          "Mental Health: Anxiety, depression, and insomnia",
          "Women's Health: Infertility, menstrual disorders, and menopause symptoms"
        ],
        zh: [
          "疼痛管理：慢性疼痛、关节炎、偏头痛和运动损伤",
          "神经系统疾病：脑卒中康复、神经病变和面瘫",
          "呼吸系统疾病：哮喘、过敏和鼻窦炎",
          "消化系统疾病：肠易激综合征、胃炎和恶心",
          "心理健康：焦虑、抑郁和失眠",
          "女性健康：不孕不育、月经失调和更年期症状"
        ]
      },
      process: {
        en: [
          "Diagnosis: Practitioner assesses your health condition through pulse and tongue examination",
          "Point Selection: Identifying specific acupoints based on your condition",
          "Needle Insertion: Thin, sterile needles are inserted at precise locations",
          "Stimulation: Needles may be gently manipulated or stimulated with heat/electricity",
          "Duration: Treatment typically lasts 20-30 minutes",
          "Aftercare: Rest and hydration recommended post-treatment"
        ],
        zh: [
          "诊断：通过脉诊和舌诊评估您的健康状况",
          "选穴：根据病情确定特定穴位",
          "进针：在精确位置插入细而无菌的针",
          "刺激：可能轻微捻动针具或使用热/电刺激",
          "持续时间：治疗通常持续20-30分钟",
          "护理：治疗后建议休息和补水"
        ]
      },
      featured: true
    },
    {
      id: "cupping",
      icon: <Target className="h-12 w-12 text-purple-600" />,
      title: {
        en: "Cupping Therapy (拔罐)",
        zh: "拔罐"
      },
      description: {
        en: "Cupping is an ancient Chinese therapy that uses suction to improve blood flow, reduce inflammation, and promote healing. Cups are placed on the skin, creating a vacuum that draws blood to the surface.",
        zh: "拔罐是一种古老的中国疗法，利用负压改善血液循环、减少炎症并促进愈合。将罐具放在皮肤上，产生真空将血液吸到表面。"
      },
      benefits: {
        en: [
          "Pain Relief: Back pain, neck pain, and muscle tension",
          "Blood Circulation: Improves local blood flow and lymphatic drainage",
          "Detoxification: Removes toxins and metabolic waste",
          "Respiratory Health: Cough, asthma, and bronchitis",
          "Sports Recovery: Accelerates muscle recovery after intense exercise",
          "Skin Health: Reduces cellulite and improves skin tone"
        ],
        zh: [
          "缓解疼痛：背痛、颈痛和肌肉紧张",
          "血液循环：改善局部血流和淋巴排毒",
          "排毒：清除毒素和代谢废物",
          "呼吸健康：咳嗽、哮喘和支气管炎",
          "运动恢复：加速剧烈运动后的肌肉恢复",
          "皮肤健康：减少橘皮组织并改善肤色"
        ]
      },
      process: {
        en: [
          "Preparation: Skin is cleaned with oil to allow smooth movement",
          "Cup Placement: Cups are placed on specific acupoints or muscle groups",
          "Suction Creation: Air is removed using heat (fire cupping) or pump",
          "Duration: Cups remain for 5-15 minutes depending on condition",
          "Removal: Cups are released, leaving temporary circular marks",
          "Post-Treatment: Rest and avoid cold exposure for 24 hours"
        ],
        zh: [
          "准备：用油清洁皮肤以便移动",
          "放罐：将罐具放在特定穴位或肌肉群上",
          "产生负压：使用热力（火罐）或抽气泵移除空气",
          "持续时间：罐具保持5-15分钟，视情况而定",
          "取罐：释放罐具，留下暂时的圆形印记",
          "治疗后：休息并避免24小时内受凉"
        ]
      },
      featured: true
    },
    {
      id: "tuina",
      icon: <Activity className="h-12 w-12 text-green-600" />,
      title: {
        en: "Tuina (推拿)",
        zh: "推拿"
      },
      description: {
        en: "Tuina is a therapeutic massage technique in TCM that combines acupressure, manipulation, and stretching. It works to balance the body's energy, relieve pain, and treat various musculoskeletal conditions.",
        zh: "推拿是中医的治疗按摩技术，结合穴位按压、手法操作和拉伸。旨在平衡身体能量、缓解疼痛并治疗各种肌肉骨骼疾病。"
      },
      benefits: {
        en: [
          "Musculoskeletal Pain: Neck, back, shoulder, and joint pain",
          "Sports Injuries: Sprains, strains, and overuse injuries",
          "Neurological Conditions: Headaches, migraines, and facial paralysis",
          "Pediatric Care: Colic, digestive issues, and sleep disorders in children",
          "Digestive Health: Constipation, diarrhea, and abdominal pain",
          "Stress Relief: Reduces tension and promotes relaxation"
        ],
        zh: [
          "肌肉骨骼疼痛：颈部、背部、肩部和关节疼痛",
          "运动损伤：扭伤、拉伤和过度使用损伤",
          "神经系统疾病：头痛、偏头痛和面瘫",
          "儿科护理：婴幼儿肠绞痛、消化问题和睡眠障碍",
          "消化健康：便秘、腹泻和腹痛",
          "缓解压力：减少紧张并促进放松"
        ]
      },
      process: {
        en: [
          "Assessment: Evaluation of body condition and problem areas",
          "Technique Selection: Appropriate TCM massage techniques chosen",
          "Treatment: Specific manipulations applied to acupoints and meridians",
          "Joint Mobilization: Gentle stretching and joint movements",
          "Duration: Sessions typically last 30-60 minutes",
          "Home Care: Stretching and self-massage exercises recommended"
        ],
        zh: [
          "评估：评估身体状况和问题区域",
          "选择技术：选择适当的中医按摩技术",
          "治疗：对穴位和经络施加特定手法",
          "关节活动：温和的拉伸和关节运动",
          "持续时间：治疗通常持续30-60分钟",
          "家庭护理：推荐拉伸和自我按摩练习"
        ]
      },
      featured: true
    },
    {
      id: "bone-setting",
      icon: <Shield className="h-12 w-12 text-orange-600" />,
      title: {
        en: "Bone Setting (正骨)",
        zh: "正骨"
      },
      description: {
        en: "Bone setting is a traditional Chinese orthopedic technique used to treat fractures, dislocations, and spinal misalignments. It combines manual manipulation with herbal medicine for optimal healing.",
        zh: "正骨是传统中医骨科技术，用于治疗骨折、脱位和脊柱错位。结合手法操作和草药治疗以实现最佳愈合。"
      },
      benefits: {
        en: [
          "Fracture Treatment: Accelerates bone healing and reduces recovery time",
          "Joint Dislocation: Safe reduction of dislocated joints",
          "Spinal Alignment: Corrects misalignments and relieves nerve pressure",
          "Sports Injuries: Quick recovery from sprains and strains",
          "Posture Correction: Improves overall body alignment and posture",
          "Chronic Pain: Long-term relief from persistent musculoskeletal pain"
        ],
        zh: [
          "骨折治疗：加速骨骼愈合并缩短恢复时间",
          "关节脱位：安全复位脱位关节",
          "脊柱矫正：纠正错位并缓解神经压迫",
          "运动损伤：从扭伤和拉伤中快速恢复",
          "姿势矫正：改善整体身体对齐和姿势",
          "慢性疼痛：长期缓解持续性肌肉骨骼疼痛"
        ]
      },
      process: {
        en: [
          "Diagnosis: X-rays and physical examination to assess injury",
          "Reduction: Manual manipulation to realign bones or joints",
          "Fixation: Splints, casts, or herbal bandages for stability",
          "Herbal Treatment: External herbal plasters and internal medicine",
          "Rehabilitation: Gradual exercises to restore function",
          "Follow-up: Regular monitoring and adjustment of treatment plan"
        ],
        zh: [
          "诊断：X光和体格检查评估损伤",
          "复位：手法操作重新对齐骨骼或关节",
          "固定：夹板、石膏或草药绷带保持稳定",
          "草药治疗：外敷草药膏和内服药物",
          "康复：渐进式练习恢复功能",
          "随访：定期监测和调整治疗方案"
        ]
      },
      featured: true
    },
    {
      id: "moxibustion",
      icon: <Sparkles className="h-12 w-12 text-red-600" />,
      title: {
        en: "Moxibustion (艾灸)",
        zh: "艾灸"
      },
      description: {
        en: "Moxibustion is a TCM therapy that involves burning dried mugwort (Artemisia vulgaris) on or near specific acupoints. It warms and stimulates the body's energy flow, strengthening the immune system and treating cold-related conditions.",
        zh: "艾灸是一种中医疗法，通过在特定穴位上或附近燃烧干艾叶（艾草）来温暖和刺激身体的能量流动，增强免疫系统并治疗寒冷相关疾病。"
      },
      benefits: {
        en: [
          "Warming Therapy: Effective for cold and damp conditions",
          "Digestive Health: Improves digestion and relieves stomach pain",
          "Menstrual Health: Regulates menstrual cycle and reduces cramps",
          "Immune Boost: Strengthens body's natural defenses",
          "Pain Relief: Chronic pain and arthritis",
          "Energy Restoration: Combats fatigue and low energy"
        ],
        zh: [
          "温热疗法：对寒湿疾病有效",
          "消化健康：改善消化并缓解胃痛",
          "女性健康：调节月经周期并减少痛经",
          "增强免疫：增强身体自然防御能力",
          "缓解疼痛：慢性疼痛和关节炎",
          "恢复精力：对抗疲劳和精力不足"
        ]
      },
      process: {
        en: [
          "Point Selection: Identifying appropriate acupoints for treatment",
          "Moxa Preparation: Dried mugwort shaped into cones or sticks",
          "Application: Placed directly on skin (direct) or held above (indirect)",
          "Duration: Treatment lasts 5-20 minutes per point",
          "Sensation: Warm, pleasant heat sensation felt",
          "Aftercare: Avoid cold exposure and rest after treatment"
        ],
        zh: [
          "选穴：确定合适的治疗穴位",
          "准备艾条：将干艾草制成锥形或条状",
          "应用：直接放在皮肤上（直接）或上方（间接）",
          "持续时间：每点治疗5-20分钟",
          "感觉：感到温暖、舒适的热感",
          "护理：治疗后避免受凉并休息"
        ]
      },
      featured: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {language === 'zh' ? '传统中医治疗方法' : 'Traditional Chinese Medicine Therapies'}
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              {language === 'zh'
                ? '探索千年传承的中医智慧，体验自然疗愈的力量'
                : 'Explore thousands of years of traditional wisdom and experience the healing power of nature'}
            </p>
          </div>
        </div>
      </div>

      {/* Introduction */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-2xl text-blue-900">
              {language === 'zh' ? '什么是传统中医？' : 'What is Traditional Chinese Medicine?'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed text-lg">
              {language === 'zh'
                ? '传统中医（TCM）是拥有数千年历史的完整医疗体系，包括针灸、草药、推拿、正骨、艾灸和拔罐等多种疗法。中医强调整体观念，通过平衡人体内的"气"（生命能量）、"血"、"阴"和"阳"来预防和治疗疾病。现代研究证实，中医对慢性疼痛、神经系统疾病、消化系统问题等多种疾病具有显著疗效，已被世界卫生组织（WHO）认可为重要的补充替代医疗体系。'
                : 'Traditional Chinese Medicine (TCM) is a complete medical system with thousands of years of history, encompassing various therapies including acupuncture, herbal medicine, tuina, bone setting, moxibustion, and cupping. TCM emphasizes a holistic approach, preventing and treating diseases by balancing the "Qi" (vital energy), blood, yin, and yang within the body. Modern research has confirmed TCM\'s significant efficacy for conditions such as chronic pain, neurological disorders, digestive problems, and more. It has been recognized by the World Health Organization (WHO) as an important complementary and alternative medical system.'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Therapies Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          {language === 'zh' ? '主要治疗方法' : 'Main Therapies'}
        </h2>

        <div className="grid gap-8 md:grid-cols-2">
          {therapies.map((therapy) => (
            <Card key={therapy.id} className="hover:shadow-lg transition-shadow border-2 hover:border-blue-300">
              <CardHeader>
                <div className="flex items-start justify-between mb-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    {therapy.icon}
                  </div>
                  {therapy.featured && (
                    <Badge className="bg-blue-600 hover:bg-blue-700">
                      {language === 'zh' ? '特色疗法' : 'Featured'}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-2xl text-gray-900">
                  {(language === 'zh' || language === 'en') ? therapy.title[language] : therapy.title.en}
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  {(language === 'zh' || language === 'en') ? therapy.description[language] : therapy.description.en}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Benefits */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    {language === 'zh' ? '主要功效' : 'Key Benefits'}
                  </h3>
                  <ul className="space-y-2">
                    {(language === 'zh' || language === 'en' ? therapy.benefits[language] : therapy.benefits.en).map((benefit: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-gray-700">
                        <span className="text-blue-600 mt-1">•</span>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Process */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-green-600" />
                    {language === 'zh' ? '治疗流程' : 'Treatment Process'}
                  </h3>
                  <ol className="space-y-2">
                    {(language === 'zh' || language === 'en' ? therapy.process[language] : therapy.process.en).map((step: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-gray-700">
                        <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-blue-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            {language === 'zh' ? '准备体验中医治疗？' : 'Ready to Experience TCM?'}
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            {language === 'zh'
              ? '在我们的医院列表中找到专业的中医医生，预约您专属的治疗方案'
              : 'Find professional TCM doctors in our hospital listings and book your personalized treatment plan'}
          </p>
        </div>
      </div>
    </div>
  );
}
