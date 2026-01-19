/**
 * Seed Attractions Data
 * Run this script to populate the database with tourist attractions data
 *
 * Usage:
 * npx tsx src/storage/database/seedAttractionsData.ts
 */

import { getDb } from "coze-coding-dev-sdk";
import { attractions } from "./shared/schema";

const SAMPLE_ATTRACTIONS = [
  // 北京景点
  {
    nameEn: "The Great Wall of China",
    nameZh: "长城",
    descriptionEn: "One of the greatest wonders of the world, spanning thousands of miles across northern China.",
    descriptionZh: "世界七大奇迹之一，横跨中国北部数千英里。",
    category: "Historical",
    location: "Beijing",
    openingHours: "8:00-17:00",
    averageDuration: "3-4 hours",
    ticketPrice: "45",
    currency: "USD",
    rating: "4.8",
    isRecommendedForPatients: false,
    tipsEn: "Wear comfortable shoes and bring water. Avoid steep sections if you have mobility issues.",
    tipsZh: "穿舒适的鞋子并带上水。如果有行动不便问题，请避开陡峭路段。",
    accessibilityFeatures: JSON.stringify(["Elevator at Mutianyu section", "Wheelchair accessible cable car"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Forbidden City",
    nameZh: "故宫博物院",
    descriptionEn: "The imperial palace complex from the Ming and Qing dynasties, now a UNESCO World Heritage site.",
    descriptionZh: "明清两朝的皇家宫殿，联合国教科文组织世界遗产。",
    category: "Historical",
    location: "Beijing",
    openingHours: "8:30-17:00",
    averageDuration: "2-3 hours",
    ticketPrice: "20",
    currency: "USD",
    rating: "4.7",
    isRecommendedForPatients: true,
    tipsEn: "Book tickets in advance. Flat terrain, suitable for most visitors.",
    tipsZh: "提前预订门票。地势平坦，适合大多数游客。",
    accessibilityFeatures: JSON.stringify(["Wheelchair accessible", "Accessible restrooms"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Temple of Heaven",
    nameZh: "天坛公园",
    descriptionEn: "A UNESCO World Heritage site where emperors prayed for good harvests.",
    descriptionZh: "皇帝祈求丰收的场所，联合国教科文组织世界遗产。",
    category: "Religious",
    location: "Beijing",
    openingHours: "6:00-22:00",
    averageDuration: "2 hours",
    ticketPrice: "15",
    currency: "USD",
    rating: "4.6",
    isRecommendedForPatients: true,
    tipsEn: "Visit early morning to see locals practicing Tai Chi.",
    tipsZh: "清晨游览可以看到当地人打太极。",
    accessibilityFeatures: JSON.stringify(["Wheelchair accessible"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Summer Palace",
    nameZh: "颐和园",
    descriptionEn: "A masterpiece of Chinese landscape garden design with UNESCO World Heritage status.",
    descriptionZh: "中国园林设计的杰作，联合国教科文组织世界遗产。",
    category: "Natural",
    location: "Beijing",
    openingHours: "6:30-18:00",
    averageDuration: "3-4 hours",
    ticketPrice: "10",
    currency: "USD",
    rating: "4.5",
    isRecommendedForPatients: true,
    tipsEn: "Beautiful in spring and autumn. Boating available on Kunming Lake.",
    tipsZh: "春秋两季景色最美。昆明湖可划船。",
    accessibilityFeatures: JSON.stringify(["Wheelchair accessible main paths", "Accessible boat dock"]),
    isFeatured: true,
    isActive: true,
  },

  // 上海景点
  {
    nameEn: "The Bund",
    nameZh: "外滩",
    descriptionEn: "Iconic waterfront promenade showcasing Shanghai's historic and modern architecture.",
    descriptionZh: "标志性的滨水长廊，展示上海的历史和现代建筑。",
    category: "Modern",
    location: "Shanghai",
    openingHours: "24 hours",
    averageDuration: "1-2 hours",
    ticketPrice: "0",
    currency: "USD",
    rating: "4.6",
    isRecommendedForPatients: true,
    tipsEn: "Best views at night when buildings are illuminated. Flat, easy walking.",
    tipsZh: "夜晚灯光亮起时景色最佳。平坦，易于步行。",
    accessibilityFeatures: JSON.stringify(["Wheelchair accessible", "Benches available"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Yu Garden",
    nameZh: "豫园",
    descriptionEn: "Classical Chinese garden dating back to the Ming Dynasty.",
    descriptionZh: "可追溯至明代的古典园林。",
    category: "Cultural",
    location: "Shanghai",
    openingHours: "8:30-17:30",
    averageDuration: "1-2 hours",
    ticketPrice: "10",
    currency: "USD",
    rating: "4.4",
    isRecommendedForPatients: false,
    tipsEn: "Crowded on weekends. Nearby Yu Bazaar for shopping.",
    tipsZh: "周末人多。附近的豫园商场可以购物。",
    accessibilityFeatures: JSON.stringify(["Limited wheelchair access"]),
    isFeatured: false,
    isActive: true,
  },
  {
    nameEn: "Shanghai Tower",
    nameZh: "上海中心大厦",
    descriptionEn: "China's tallest building with observation deck offering panoramic city views.",
    descriptionZh: "中国最高建筑，拥有观景台，可俯瞰城市全景。",
    category: "Modern",
    location: "Shanghai",
    openingHours: "9:00-21:00",
    averageDuration: "1-2 hours",
    ticketPrice: "40",
    currency: "USD",
    rating: "4.5",
    isRecommendedForPatients: false,
    tipsEn: "Fast elevators to top floors. Clear day offers best views.",
    tipsZh: "高速电梯直达顶层。晴天视野最佳。",
    accessibilityFeatures: JSON.stringify(["Wheelchair accessible", "Accessible elevators"]),
    isFeatured: true,
    isActive: true,
  },

  // 西安景点
  {
    nameEn: "Terracotta Army",
    nameZh: "兵马俑",
    descriptionEn: "UNESCO World Heritage site featuring thousands of life-size terracotta soldiers.",
    descriptionZh: "联合国教科文组织世界遗产，展示数千个真人大小的兵马俑。",
    category: "Historical",
    location: "Xi'an",
    openingHours: "8:30-18:00",
    averageDuration: "2-3 hours",
    ticketPrice: "20",
    currency: "USD",
    rating: "4.7",
    isRecommendedForPatients: true,
    tipsEn: "Hire a guide for detailed history. Accessible paths available.",
    tipsZh: "雇佣导游了解详细历史。有无障碍通道。",
    accessibilityFeatures: JSON.stringify(["Wheelchair accessible main pits", "Accessible restrooms"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "City Wall of Xi'an",
    nameZh: "西安城墙",
    descriptionEn: "Best-preserved ancient city wall in China, perfect for cycling or walking.",
    descriptionZh: "中国保存最完好的古城墙，适合骑行或步行。",
    category: "Historical",
    location: "Xi'an",
    openingHours: "8:00-22:00",
    averageDuration: "2-3 hours",
    ticketPrice: "12",
    currency: "USD",
    rating: "4.5",
    isRecommendedForPatients: false,
    tipsEn: "Rent a bicycle to circle the wall (14km). Sunset views are spectacular.",
    tipsZh: "租自行车绕城骑行（14公里）。日落景色壮观。",
    accessibilityFeatures: JSON.stringify(["Wheelchair accessible sections", "Accessible stairs"]),
    isFeatured: false,
    isActive: true,
  },

  // 成都景点
  {
    nameEn: "Panda Breeding Research Base",
    nameZh: "成都大熊猫繁育研究基地",
    descriptionEn: "World-famous conservation center for giant pandas.",
    descriptionZh: "世界闻名的大熊猫保护研究中心。",
    category: "Natural",
    location: "Chengdu",
    openingHours: "7:30-18:00",
    averageDuration: "2-3 hours",
    ticketPrice: "15",
    currency: "USD",
    rating: "4.6",
    isRecommendedForPatients: true,
    tipsEn: "Visit early morning when pandas are most active. Flat, easy walking.",
    tipsZh: "清晨游览，熊猫最活跃。平坦，易于步行。",
    accessibilityFeatures: JSON.stringify(["Wheelchair accessible", "Golf cart service available"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Jinli Ancient Street",
    nameZh: "锦里古街",
    descriptionEn: "Historic pedestrian street with traditional architecture and local snacks.",
    descriptionZh: "历史悠久的步行街，传统建筑和当地小吃。",
    category: "Cultural",
    location: "Chengdu",
    openingHours: "All day",
    averageDuration: "1-2 hours",
    ticketPrice: "0",
    currency: "USD",
    rating: "4.4",
    isRecommendedForPatients: true,
    tipsEn: "Great for food and souvenirs. Can be crowded on weekends.",
    tipsZh: "美食和纪念品的好去处。周末人多。",
    accessibilityFeatures: JSON.stringify(["Wheelchair accessible main paths"]),
    isFeatured: false,
    isActive: true,
  },

  // 杭州景点
  {
    nameEn: "West Lake",
    nameZh: "西湖",
    descriptionEn: "UNESCO World Heritage site, famous for its scenic beauty and cultural significance.",
    descriptionZh: "联合国教科文组织世界遗产，以风景优美和文化意义闻名。",
    category: "Natural",
    location: "Hangzhou",
    openingHours: "All day",
    averageDuration: "3-4 hours",
    ticketPrice: "0",
    currency: "USD",
    rating: "4.7",
    isRecommendedForPatients: true,
    tipsEn: "Rent a boat, bike around the lake, or take a leisurely walk. Spring and autumn are best.",
    tipsZh: "可以划船、环湖骑行或悠闲散步。春秋两季最佳。",
    accessibilityFeatures: JSON.stringify(["Wheelchair accessible paths", "Accessible boat docks"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Lingyin Temple",
    nameZh: "灵隐寺",
    descriptionEn: "One of the oldest and most significant Buddhist temples in China.",
    descriptionZh: "中国最古老、最重要的佛教寺庙之一。",
    category: "Religious",
    location: "Hangzhou",
    openingHours: "7:00-18:00",
    averageDuration: "2-3 hours",
    ticketPrice: "7",
    currency: "USD",
    rating: "4.5",
    isRecommendedForPatients: false,
    tipsEn: "Peaceful atmosphere with ancient trees. Some stairs to climb.",
    tipsZh: "古树参天，环境宁静。需要爬一些楼梯。",
    accessibilityFeatures: JSON.stringify(["Limited wheelchair access", "Benches throughout"]),
    isFeatured: false,
    isActive: true,
  },

  // 广州景点
  {
    nameEn: "Canton Tower",
    nameZh: "广州塔",
    descriptionEn: "Tallest tower in China with observation decks and thrilling attractions.",
    descriptionZh: "中国最高塔，拥有观景台和刺激的游乐项目。",
    category: "Modern",
    location: "Guangzhou",
    openingHours: "9:00-23:00",
    averageDuration: "2-3 hours",
    ticketPrice: "30",
    currency: "USD",
    rating: "4.5",
    isRecommendedForPatients: false,
    tipsEn: "Evening views of Pearl River are spectacular. Sky Drop for thrill seekers.",
    tipsZh: "夜晚珠江景色壮观。勇敢者可尝试空中速降。",
    accessibilityFeatures: JSON.stringify(["Wheelchair accessible", "Accessible elevators"]),
    isFeatured: true,
    isActive: true,
  },
  {
    nameEn: "Chimelong Paradise",
    nameZh: "长隆欢乐世界",
    descriptionEn: "One of China's largest theme parks with thrilling rides and shows.",
    descriptionZh: "中国最大的主题公园之一，有刺激的游乐设施和表演。",
    category: "Entertainment",
    location: "Guangzhou",
    openingHours: "9:30-18:00",
    averageDuration: "Full day",
    ticketPrice: "60",
    currency: "USD",
    rating: "4.4",
    isRecommendedForPatients: false,
    tipsEn: "Arrive early, wear comfortable shoes. Express pass recommended on weekends.",
    tipsZh: "早到，穿舒适的鞋子。周末建议购买快速通道票。",
    accessibilityFeatures: JSON.stringify(["Wheelchair accessible main paths", "Accessible restrooms"]),
    isFeatured: false,
    isActive: true,
  },

  // 苏州景点
  {
    nameEn: "Humble Administrator's Garden",
    nameZh: "拙政园",
    descriptionEn: "UNESCO World Heritage site, one of China's most famous classical gardens.",
    descriptionZh: "联合国教科文组织世界遗产，中国最著名的古典园林之一。",
    category: "Cultural",
    location: "Suzhou",
    openingHours: "7:30-17:30",
    averageDuration: "1-2 hours",
    ticketPrice: "12",
    currency: "USD",
    rating: "4.6",
    isRecommendedForPatients: false,
    tipsEn: "Beautiful in all seasons. Crowded during Chinese holidays.",
    tipsZh: "四季皆美。中国节假日人多。",
    accessibilityFeatures: JSON.stringify(["Limited wheelchair access"]),
    isFeatured: true,
    isActive: true,
  },

  // 南京景点
  {
    nameEn: "Dr. Sun Yat-sen's Mausoleum",
    nameZh: "中山陵",
    descriptionEn: "The resting place of Dr. Sun Yat-sen, founder of modern China.",
    descriptionZh: "现代中国之父孙中山先生的安息之地。",
    category: "Historical",
    location: "Nanjing",
    openingHours: "8:30-17:00",
    averageDuration: "2-3 hours",
    ticketPrice: "0",
    currency: "USD",
    rating: "4.5",
    isRecommendedForPatients: false,
    tipsEn: "Many stairs to climb. Impressive architecture and history.",
    tipsZh: "需要爬很多楼梯。建筑和历史令人印象深刻。",
    accessibilityFeatures: JSON.stringify(["Limited accessibility", "Shuttle bus available"]),
    isFeatured: false,
    isActive: true,
  },

  // 武汉景点
  {
    nameEn: "Yellow Crane Tower",
    nameZh: "黄鹤楼",
    descriptionEn: "Iconic tower with stunning views of the Yangtze River.",
    descriptionZh: "标志性建筑，可欣赏长江壮丽景色。",
    category: "Historical",
    location: "Wuhan",
    openingHours: "8:00-18:00",
    averageDuration: "1-2 hours",
    ticketPrice: "10",
    currency: "USD",
    rating: "4.4",
    isRecommendedForPatients: false,
    tipsEn: "Climb to the top for panoramic views. Famous poems inspired by this tower.",
    tipsZh: "爬到顶楼可俯瞰全景。许多著名诗歌灵感来源于此。",
    accessibilityFeatures: JSON.stringify(["Elevator to upper floors", "Wheelchair accessible"]),
    isFeatured: true,
    isActive: true,
  },

  // 深圳景点
  {
    nameEn: "Window of the World",
    nameZh: "世界之窗",
    descriptionEn: "Theme park featuring miniature replicas of world-famous landmarks.",
    descriptionZh: "主题公园，展示世界著名地标的微缩复制品。",
    category: "Entertainment",
    location: "Shenzhen",
    openingHours: "9:00-22:30",
    averageDuration: "4-5 hours",
    ticketPrice: "50",
    currency: "USD",
    rating: "4.3",
    isRecommendedForPatients: true,
    tipsEn: "Wear comfortable shoes. Evening shows are spectacular.",
    tipsZh: "穿舒适的鞋子。晚间表演壮观。",
    accessibilityFeatures: JSON.stringify(["Wheelchair accessible", "Accessible restrooms"]),
    isFeatured: false,
    isActive: true,
  },
];

async function seedAttractions() {
  try {
    console.log("🎡 Connecting to database...");
    const db = await getDb();

    console.log("📋 Checking existing data...");
    let hasExistingData = false;
    try {
      const existingAttractions = await db.select().from(attractions).limit(1);
      hasExistingData = existingAttractions.length > 0;
    } catch (error: any) {
      console.log("⚠️  Could not check existing data (schema may be different), skipping check...");
      hasExistingData = false;
    }

    if (hasExistingData) {
      console.log("⚠️  Attractions already exist. Clearing and reseeding...");
      await db.delete(attractions);
      console.log("✅ Cleared existing data");
    }

    console.log(`🎡 Creating ${SAMPLE_ATTRACTIONS.length} attractions...`);
    const insertedAttractions = await db
      .insert(attractions)
      .values(SAMPLE_ATTRACTIONS)
      .returning();
    console.log(`✅ Created ${insertedAttractions.length} attractions`);

    // Calculate statistics
    const locationStats: Record<string, number> = {};
    const categoryStats: Record<string, number> = {};

    insertedAttractions.forEach(a => {
      locationStats[a.location] = (locationStats[a.location] || 0) + 1;
      if (a.category) {
        categoryStats[a.category] = (categoryStats[a.category] || 0) + 1;
      }
    });

    console.log("\n📊 Summary:");
    console.log(`   Total Attractions: ${insertedAttractions.length}`);
    console.log("\n🏙️ Attractions by Location:");
    Object.entries(locationStats)
      .sort((a, b) => b[1] - a[1])
      .forEach(([location, count]) => {
        console.log(`     ${location}: ${count} attractions`);
      });
    console.log("\n🎯 Attractions by Category:");
    Object.entries(categoryStats)
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, count]) => {
        console.log(`     ${category}: ${count} attractions`);
      });

    console.log("\n✨ Attractions data seeded successfully!");
  } catch (error) {
    console.error("❌ Failed to seed attractions data:", error);
    process.exit(1);
  }
}

seedAttractions()
  .then(() => {
    console.log("\n✅ Seed completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
