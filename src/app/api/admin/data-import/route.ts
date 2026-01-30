import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { hospitals, doctors, attractions } from '@/storage/database/shared/schema';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';
import { hospitalInternationalServices, expandedDoctors, featuredAttractions } from '@/lib/data/expandedData';

/**
 * 数据导入API
 * 导入医院国际医疗部信息、扩充医生库、景点数据
 */
export async function POST(request: NextRequest) {
  try {
    const { importType } = await request.json();

    const db = await getDb();
    const results = {
      success: false,
      message: '',
      imported: {
        hospitals: 0,
        doctors: 0,
        attractions: 0,
      },
    };

    // 1. 导入医院国际医疗部信息
    if (!importType || importType === 'hospitals') {
      let hospitalsUpdated = 0;

      console.log('[Data Import] Starting hospital import...');
      console.log('[Data Import] Number of international services:', Object.keys(hospitalInternationalServices).length);

      // 创建医院名称到ID的映射
      const allHospitals = await db.select().from(hospitals);
      console.log('[Data Import] Total hospitals in DB:', allHospitals.length);

      const hospitalNameToIdMap = new Map<string, string>();
      allHospitals.forEach(h => {
        hospitalNameToIdMap.set(h.nameEn.toLowerCase(), h.id);
        hospitalNameToIdMap.set(h.nameZh, h.id);
      });

      // 医院名称映射（从扩充数据中的key到实际医院名称）
      const hospitalNameMapping: Record<string, string> = {
        'peking-union-medical-college': 'Peking Union Medical College Hospital',
        'beijing-jishuitan-hospital': 'Beijing Jishuitan Hospital',
        'beijing-301-hospital': 'PLA General Hospital (301 Hospital)',
        'shanghai-hua-dong-hospital': 'Huadong Hospital',
        'shanghai-renji-hospital': 'Shanghai Renji Hospital',
        'guangzhou-first-peoples-hospital': 'Guangzhou First People\'s Hospital',
        'guangdong-provincial-hospital': 'Guangdong Provincial Hospital',
        'shenzhen-peoples-hospital': 'Shenzhen People\'s Hospital',
        'shenzhen-university-general-hospital': 'Shenzhen University General Hospital',
        'west-china-hospital': 'West China Hospital',
        'sichuan-provincial-hospital': 'Sichuan Provincial Hospital',
        'chongqing-first-peoples-hospital': 'Chongqing First People\'s Hospital',
        'xijing-hospital': 'Xijing Hospital',
        'zhejiang-provincial-hospital': 'Zhejiang Provincial Hospital',
        'nanjing-drum-tower-hospital': 'Nanjing Drum Tower Hospital',
        'wuhan-union-hospital': 'Wuhan Union Hospital',
        'shandong-provincial-hospital': 'Shandong Provincial Hospital',
        'tianjin-medical-university-general-hospital': 'Tianjin Medical University General Hospital',
      };

      console.log('[Data Import] Processing hospitals...');

      for (const [hospitalKey, internationalData] of Object.entries(hospitalInternationalServices)) {
        try {
          console.log(`[Data Import] Processing hospital key: ${hospitalKey}`);

          // 通过映射获取实际医院名称，再查找ID
          const hospitalName = hospitalNameMapping[hospitalKey];
          if (!hospitalName) {
            console.log(`[Data Import] Hospital ${hospitalKey} not found in mapping, skipping`);
            continue;
          }

          console.log(`[Data Import] Looking for hospital: ${hospitalName}`);
          const hospitalId = hospitalNameToIdMap.get(hospitalName.toLowerCase());
          if (!hospitalId) {
            console.log(`[Data Import] Hospital ID for ${hospitalName} not found, skipping`);
            continue;
          }

          console.log(`[Data Import] Found hospital ID: ${hospitalId}`);

          // 更新医院的 metadata，添加国际医疗部信息
          const updateResult = await db
            .update(hospitals)
            .set({
              metadata: {
                internationalDepartment: internationalData,
              },
              updatedAt: new Date(),
            })
            .where(eq(hospitals.id, hospitalId))
            .returning();

          if (updateResult.length > 0) {
            hospitalsUpdated++;
            console.log(`[Data Import] ✓ Updated international department for ${hospitalName}`);
          } else {
            console.log(`[Data Import] ✗ Update failed for ${hospitalName}`);
          }
        } catch (error) {
          console.error(`[Data Import] Error updating hospital ${hospitalKey}:`, error);
        }
      }

      console.log(`[Data Import] Hospital import complete. Updated: ${hospitalsUpdated}`);
      results.imported.hospitals = hospitalsUpdated;
    }

    // 2. 导入扩充医生库
    if (!importType || importType === 'doctors') {
      let doctorsAdded = 0;

      // 获取所有医院，创建名称到ID的映射
      const allHospitals = await db.select().from(hospitals);
      const hospitalNameToIdMap = new Map<string, string>();
      allHospitals.forEach(h => {
        hospitalNameToIdMap.set(h.nameEn.toLowerCase(), h.id);
        hospitalNameToIdMap.set(h.nameZh, h.id);
      });

      // 医院名称映射（从扩充数据中的key到实际医院名称）
      const hospitalNameMapping: Record<string, string> = {
        'peking-union-medical-college': 'Peking Union Medical College Hospital',
        'beijing-301-hospital': 'PLA General Hospital (301 Hospital)',
        'shanghai-hua-dong-hospital': 'Huadong Hospital',
        'shanghai-renji-hospital': 'Shanghai Renji Hospital',
        'guangzhou-first-peoples-hospital': 'Guangzhou First People\'s Hospital',
        'guangdong-provincial-hospital': 'Guangdong Provincial Hospital',
        'shenzhen-peoples-hospital': 'Shenzhen People\'s Hospital',
        'shenzhen-university-general-hospital': 'Shenzhen University General Hospital',
        'west-china-hospital': 'West China Hospital',
        'sichuan-provincial-hospital': 'Sichuan Provincial Hospital',
        'chongqing-first-peoples-hospital': 'Chongqing First People\'s Hospital',
        'xijing-hospital': 'Xijing Hospital',
        'zhejiang-provincial-hospital': 'Zhejiang Provincial Hospital',
        'nanjing-drum-tower-hospital': 'Nanjing Drum Tower Hospital',
        'wuhan-union-hospital': 'Wuhan Union Hospital',
        'shandong-provincial-hospital': 'Shandong Provincial Hospital',
        'tianjin-medical-university-general-hospital': 'Tianjin Medical University General Hospital',
      };

      for (const doctorData of expandedDoctors) {
        try {
          // 通过映射获取实际医院名称，再查找ID
          const hospitalName = hospitalNameMapping[doctorData.hospitalId];
          if (!hospitalName) {
            console.log(`Hospital ${doctorData.hospitalId} not found in mapping for doctor ${doctorData.nameEn}, skipping`);
            continue;
          }

          const hospitalId = hospitalNameToIdMap.get(hospitalName.toLowerCase());
          if (!hospitalId) {
            console.log(`Hospital ID for ${hospitalName} not found for doctor ${doctorData.nameEn}, skipping`);
            continue;
          }

          const newDoctor = {
            id: uuidv4(),
            hospitalId: hospitalId, // 使用映射后的实际hospitalId
            cityId: doctorData.cityId,
            nameEn: doctorData.nameEn,
            nameZh: doctorData.nameZh,
            title: doctorData.title,
            specialtiesEn: doctorData.specialtiesEn,
            specialtiesZh: doctorData.specialtiesZh,
            descriptionEn: `Specialist in ${JSON.parse(doctorData.specialtiesEn).join(', ')}`,
            descriptionZh: `${JSON.parse(doctorData.specialtiesZh).join(', ')}专家`,
            experienceYears: doctorData.experienceYears,
            consultationFee: doctorData.consultationFee,
            metadata: doctorData.metadata,
            isActive: true,
            isFeatured: true, // 新增的医生标记为推荐
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await db.insert(doctors).values(newDoctor);
          doctorsAdded++;
          console.log(`Added doctor: ${doctorData.nameEn}`);
        } catch (error) {
          console.error(`Error adding doctor ${doctorData.nameEn}:`, error);
        }
      }

      results.imported.doctors = doctorsAdded;
    }

    // 3. 导入特色景点数据
    if (!importType || importType === 'attractions') {
      let attractionsAdded = 0;

      for (const attractionData of featuredAttractions) {
        try {
          const newAttraction = {
            id: uuidv4(),
            nameEn: attractionData.nameEn,
            nameZh: attractionData.nameZh,
            descriptionEn: attractionData.descriptionEn,
            descriptionZh: attractionData.descriptionZh,
            category: attractionData.category,
            location: attractionData.location,
            city: attractionData.city,
            ticketPrice: attractionData.ticketPrice.toString(),
            currency: 'CNY',
            averageDuration: attractionData.averageDuration,
            rating: attractionData.rating.toString(),
            isRecommendedForPatients: attractionData.isRecommendedForPatients,
            tipsEn: attractionData.tipsEn,
            tipsZh: attractionData.tipsZh,
            website: attractionData.website,
            openingHours: attractionData.openingHours,
            isActive: true,
            isFeatured: true,
            metadata: {},
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await db.insert(attractions).values(newAttraction);
          attractionsAdded++;
        } catch (error) {
          console.error(`Error adding attraction ${attractionData.nameEn}:`, error);
        }
      }

      results.imported.attractions = attractionsAdded;
    }

    results.success = true;
    results.message = 'Data import completed successfully';

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error importing data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to import data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET - 查询导入状态
 */
export async function GET(request: NextRequest) {
  try {
    const db = await getDb();

    // 统计当前数据量
    const hospitalCount = await db.select({ count: 1 }).from(hospitals);
    const doctorCount = await db.select({ count: 1 }).from(doctors);
    const attractionCount = await db.select({ count: 1 }).from(attractions);

    return NextResponse.json({
      success: true,
      currentData: {
        hospitals: hospitalCount.length,
        doctors: doctorCount.length,
        attractions: attractionCount.length,
      },
      pendingImport: {
        hospitals: Object.keys(hospitalInternationalServices).length,
        doctors: expandedDoctors.length,
        attractions: featuredAttractions.length,
      },
    });
  } catch (error) {
    console.error('Error querying data status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to query data status' },
      { status: 500 }
    );
  }
}
