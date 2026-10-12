import { hash } from 'bcryptjs'
import { prisma } from '../app/common/server/prisma'
import { formatRoleId } from '../app/admin/server/role-id'
import { formatDepartmentId } from '../app/admin/server/department-id'

async function main() {
  console.log('🌱 Seeding HA Center database...')

  const roleDefs = [
    { name: 'admin', displayName: 'ผู้ดูแลระบบ', description: 'สิทธิ์เต็มระบบ' },
    { name: 'qa_manager', displayName: 'ผู้จัดการคุณภาพ', description: 'จัดการตัวชี้วัดและ CQI' },
    {
      name: 'document_manager',
      displayName: 'ผู้จัดการเอกสาร',
      description: 'จัดการเอกสารและ Service Profile',
    },
    { name: 'staff', displayName: 'เจ้าหน้าที่', description: 'ใช้งานระบบทั่วไป' },
    { name: 'viewer', displayName: 'ผู้เข้าชม', description: 'อ่านข้อมูลอย่างเดียว' },
  ] as const

  const roles = await Promise.all(
    roleDefs.map((r) =>
      prisma.role.upsert({
        where: { name: r.name },
        update: { displayName: r.displayName, description: r.description },
        create: {
          id: formatRoleId(r.name),
          name: r.name,
          displayName: r.displayName,
          description: r.description,
        },
      })
    )
  )
  console.log(`  ✓ Roles: ${roles.length}`)

  const departments = await Promise.all(
    [
      { code: 'GEN', name: 'ทั่วไป', nameEn: 'General' },
      { code: 'HA', name: 'ศูนย์ประสานงาน HA', nameEn: 'HA Coordination Center' },
      { code: 'QA', name: 'งานพัฒนาคุณภาพ', nameEn: 'Quality Assurance' },
      { code: 'NUR', name: 'งานการพยาบาล', nameEn: 'Nursing Department' },
      { code: 'MED', name: 'งานแพทย์', nameEn: 'Medical Department' },
      { code: 'PHA', name: 'งานเภสัชกรรม', nameEn: 'Pharmacy Department' },
    ].map((d) =>
      prisma.department.upsert({
        where: { code: d.code },
        update: {},
        create: { id: formatDepartmentId(d.code), ...d },
      })
    )
  )
  console.log(`  ✓ Departments: ${departments.length}`)

  const adminRole = roles.find((r) => r.name === 'admin')!
  const passwordHash = await hash('admin1234', 10)

  await prisma.user.upsert({
    where: { email: 'admin@up.ac.th' },
    update: { username: 'admin', passwordHash, isActive: true },
    create: {
      id: 'USR-0001',
      username: 'admin',
      email: 'admin@up.ac.th',
      passwordHash,
      firstName: 'ผู้ดูแล',
      lastName: 'ระบบ HA',
      employeeId: 'HA001',
      roleId: adminRole.id,
      departmentId: departments[0].id,
    },
  })
  console.log('  ✓ Admin user: admin / admin@up.ac.th / admin1234')

  const meetingRooms = await Promise.all([
    { code: 'MR-01', name: 'ห้องประชุม HA 1', capacity: 20, location: 'อาคารศูนย์ HA ชั้น 2' },
    { code: 'MR-02', name: 'ห้องประชุม HA 2', capacity: 10, location: 'อาคารศูนย์ HA ชั้น 2' },
    { code: 'MR-03', name: 'ห้องสัมมนา', capacity: 50, location: 'อาคารบริหาร ชั้น 3' },
  ].map((r) =>
    prisma.meetingRoom.upsert({
      where: { code: r.code },
      update: {},
      create: r,
    })
  ))
  console.log(`  ✓ Meeting rooms: ${meetingRooms.length}`)



  const docCategories = await Promise.all([
    { code: 'STD', name: 'มาตรฐาน HA', description: 'เอกสารมาตรฐานโรงพยาบาลและสถานพยาบาล', sortOrder: 1 },
    { code: 'POL', name: 'นโยบายและระเบียบ', description: 'นโยบาย ระเบียบ ข้อบังคับ', sortOrder: 2 },
    { code: 'SOP', name: 'ขั้นตอนการปฏิบัติ (SOP)', description: 'Standard Operating Procedures', sortOrder: 3 },
    { code: 'FORM', name: 'แบบฟอร์ม', description: 'แบบฟอร์มและเทมเพลต', sortOrder: 4 },
    { code: 'GUIDE', name: 'คู่มือและแนวทาง', description: 'คู่มือการใช้งานและแนวปฏิบัติ', sortOrder: 5 },
    { code: 'QT-ORDER', name: 'คำสั่งแต่งตั้งทีมนำคุณภาพ', description: 'คำสั่งคณะกรรมการและโครงสร้างทีมนำคุณภาพ', sortOrder: 6 },
    { code: 'QT-MINUTES', name: 'รายงานการประชุมทีมนำคุณภาพ', description: 'รายงานการประชุม (PDF) ของทีมนำคุณภาพ', sortOrder: 7 },
    { code: 'GOV', name: 'เอกสารราชการ', description: 'คำสั่ง หนังสือเวียน และเอกสารราชการด้านคุณภาพ', sortOrder: 8 },
    { code: 'GOV-IN', name: 'หนังสือภายใน', description: 'หนังสือเวียน / หนังสือภายในองค์กร', sortOrder: 9 },
    { code: 'GOV-OUT', name: 'หนังสือภายนอก', description: 'หนังสือโต้ตอบหน่วยงานภายนอก', sortOrder: 10 },
  ].map((c) =>
    prisma.documentCategory.upsert({
      where: { code: c.code },
      update: {},
      create: c,
    })
  ))
  console.log(`  ✓ Document categories: ${docCategories.length}`)

  const newsCategories = await Promise.all([
    { name: 'ข่าวประชาสัมพันธ์', slug: 'announcement' },
    { name: 'กิจกรรม', slug: 'activity' },
    { name: 'ประกาศ', slug: 'notice' },
  ].map((c) =>
    prisma.newsCategory.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    })
  ))
  console.log(`  ✓ News categories: ${newsCategories.length}`)

  const linkSeeds = [
    {
      title: 'โรงพยาบาลมหาวิทยาลัยพะเยา — หน่วยงาน/แผนก',
      url: 'https://uphb.up.ac.th/department',
      description: 'เว็บไซต์หน่วยงานและแผนก โรงพยาบาลมหาวิทยาลัยพะเยา',
      sortOrder: 0,
    },
  ]
  const seedUrls = linkSeeds.map((l) => l.url)
  for (const link of linkSeeds) {
    const exists = await prisma.relatedLink.findFirst({ where: { url: link.url } })
    if (exists) {
      await prisma.relatedLink.update({
        where: { id: exists.id },
        data: {
          title: link.title,
          description: link.description,
          sortOrder: link.sortOrder,
          isActive: true,
        },
      })
    } else {
      await prisma.relatedLink.create({ data: link })
    }
  }
  await prisma.relatedLink.updateMany({
    where: { url: { notIn: seedUrls } },
    data: { isActive: false },
  })
  console.log(`  ✓ Related links: ${linkSeeds.length} (UPHB only)`)

  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@up.ac.th' } })
  const haDept = departments.find((d) => d.code === 'HA')
  if (adminUser && haDept) {
    const kmTitle = 'KM รายงานการประชุมทีมนำคุณภาพ ครั้งที่ 1/2568'
    let kmSession = await prisma.kmSession.findFirst({ where: { title: kmTitle } })
    if (!kmSession) {
      kmSession = await prisma.kmSession.create({
        data: {
          title: kmTitle,
          description:
            'บันทึกความรู้จากการประชุมทีมนำคุณภาพ — สรุปประเด็น ข้อตกลง และแนวทางพัฒนาคุณภาพ',
          sessionDate: new Date(),
          fiscalYear: new Date().getFullYear() + 543,
          departmentId: haDept.id,
          presenterId: adminUser.id,
          location: 'ห้องประชุม HA 1',
          status: 'completed',
        },
      })
      await prisma.kmResult.create({
        data: {
          sessionId: kmSession.id,
          type: 'system',
          title: 'ระบบติดตามตัวชี้วัด KPI (UPH Services)',
          description: 'เชื่อมโยงข้อมูล KPI กับศูนย์ HA สำหรับติดตามผล',
          systemUrl: 'https://uphservices.up.ac.th/kpi',
          year: kmSession.fiscalYear,
          authorId: adminUser.id,
        },
      })
      await prisma.kmInnovation.create({
        data: {
          sessionId: kmSession.id,
          title: 'แบบฟอร์มบันทึก KM ดิจิทัล',
          innovationType: 'กระบวนการ',
          description: 'นำรูปแบบการจัดทำ KM หลังการประชุมมาใช้ในระบบ HA Center',
          result: 'ลดเวลาจัดทำรายงานและค้นหาความรู้ย้อนหลังได้ง่ายขึ้น',
          year: kmSession.fiscalYear,
          status: 'published',
          authorId: adminUser.id,
          departmentId: haDept.id,
        },
      })
    }
    const kmCount = await prisma.kmSession.count({ where: { isActive: true } })
    console.log(`  ✓ KM sessions: ${kmCount} (sample)`)

    const fiscalYear = new Date().getFullYear() + 543
    const cqiSamples = [
      {
        title: 'ลดระยะเวลารอรับบริการผู้ป่วยนอก (OPD)',
        deptCode: 'NUR',
        status: 'completed' as const,
        outstanding: true,
        awardName: 'รางวัล CQI ระดับโรงพยาบาล 2567',
        plan: 'วิเคราะห์ปัญหาเวลารอคอยยาวเกินเกณฑ์ 30 นาที ด้วยแผนภูมิกระบวนการและข้อมูล 3 เดือน',
        do: 'จัดทีม Fast Track ปรับจุดคัดกรอง และใช้คิวดิจิทัลแจ้งเตือนผู้ป่วย',
        check: 'เวลารอเฉลี่ยลดจาก 42 เป็น 26 นาที ความพึงพอใจผู้ป่วยเพิ่ม 18%',
        act: 'กำหนดเป็นมาตรฐานงาน OPD และขยายผลแผนกอื่น',
      },
      {
        title: 'เพิ่มความถูกต้องการบันทึกเวชระเบียน',
        deptCode: 'MED',
        status: 'active' as const,
        outstanding: false,
        awardName: null,
        plan: 'สำรวจจุดอ่อนการบันทึกข้อมูลและออกแบบ checklist',
        do: 'อบรมแพทย์และพยาบาล ใช้เทมเพลตบันทึกมาตรฐาน',
        check: 'อัตราข้อมูลครบถ้วนเพิ่มจาก 78% เป็น 91%',
        act: 'ติดตามรายเดือนและสอบทานรายไตรมาส',
      },
      {
        title: 'ลดข้อผิดพลาดการจ่ายยา',
        deptCode: 'PHA',
        status: 'completed' as const,
        outstanding: true,
        awardName: 'นวัตกรรมด้านความปลอดภัยยา ระดับภาคเหนือ',
        plan: 'วิเคราะห์ near-miss และกำหนด barcode verification',
        do: 'ติดตั้งระบบสแกนยาและ double-check ก่อนจ่าย',
        check: 'ข้อผิดพลาดลดลง 65% ไม่มีเหตุรุนแรงใน 6 เดือน',
        act: 'จัดทำ SOP และอบรมเวรใหม่ทุกเดือน',
      },
      {
        title: 'พัฒนาระบบติดตามเอกสารคุณภาพ HA',
        deptCode: 'QA',
        status: 'active' as const,
        outstanding: false,
        awardName: null,
        plan: 'ออกแบบ workflow เอกสารและสิทธิ์การเข้าถึง',
        do: 'พัฒนา HA Center โมดูลเอกสารและแจ้งเตือนเวอร์ชัน',
        check: 'เอกสารออนไลน์ครบ 95% ลดเวลาค้นหาเหลือ 2 นาที',
        act: 'เชื่อมกับ KM และ CQI dashboard',
      },
      {
        title: 'ศูนย์ HA ประสานงานคุณภาพทั้งโรงพยาบาล',
        deptCode: 'HA',
        status: 'completed' as const,
        outstanding: true,
        awardName: 'ผลงานโดดเด่น ศูนย์ HA ม.พ.',
        plan: 'จัดตั้งศูนย์ประสานและกำหนดบทบาททีมคุณภาพ',
        do: 'เปิดระบบ HA Center อบรมทีมงาน และจัด KM รายไตรมาส',
        check: 'หน่วยงานเข้าร่วม CQI 100% มี dashboard ติดตาม',
        act: 'ต่อยอดเชื่อม KPI และรายงานทีมนำ',
      },


    ]

    for (const sample of cqiSamples) {
      const dept = departments.find((d) => d.code === sample.deptCode)
      if (!dept) continue
      const exists = await prisma.cqiProject.findFirst({
        where: { title: sample.title, departmentId: dept.id },
      })
      if (exists) continue
      const project = await prisma.cqiProject.create({
        data: {
          title: sample.title,
          description: sample.plan.slice(0, 120) + '...',
          departmentId: dept.id,
          leadId: adminUser.id,
          year: fiscalYear,
          status: sample.status,
          planDetail: sample.plan,
          doDetail: sample.do,
          checkDetail: sample.check,
          actDetail: sample.act,
          isOutstanding: sample.outstanding,
          awardName: sample.awardName,
        },
      })
      if (sample.outstanding && sample.awardName) {
        await prisma.cqiAward.create({
          data: {
            projectId: project.id,
            awardName: sample.awardName,
            awardLevel: 'โรงพยาบาล',
            awardedAt: new Date(),
            description: 'บันทึกจาก seed ตัวอย่าง',
          },
        })
      }
    }
    const cqiCount = await prisma.cqiProject.count({ where: { isActive: true } })
    console.log(`  ✓ CQI projects: ${cqiCount} (sample)`)

    const courseTitle = 'พื้นฐาน Hospital Accreditation (HA)'
    let course = await prisma.course.findFirst({ where: { title: courseTitle } })
    if (!course) {
      course = await prisma.course.create({
        data: {
          title: courseTitle,
          description:
            'หลักสูตรออนไลน์สำหรับบุคลากร รพ.ม.พ. — ทำความเข้าใจ HA ตั้งแต่แนวคิด มาตรฐาน บทบาททีมคุณภาพ จนถึงแนวปฏิบัติ และทดสอบวัดผลเพื่อรับใบรับรอง',
          passScore: 70,
          durationHours: 2,
          isPublished: true,
          sortOrder: 0,
        },
      })

      const lessonDefs = [
        {
          orderNo: 1,
          title: 'ความหมายและความสำคัญของ HA',
          content:
            'Hospital Accreditation (HA) คือการรับรองว่าโรงพยาบาลมีระบบคุณภาพที่ได้มาตรฐาน ตอบสนองความปลอดภัยของผู้ป่วยและความพึงพอใจของผู้รับบริการ\n\nการมุ่งสู่ HA ช่วยให้หน่วยงานทำงานเป็นระบบ ลดความเสี่ยง และพัฒนาอย่างต่อเนื่องตามวงจร PDCA',
        },
        {
          orderNo: 2,
          title: 'หลักเกณฑ์และมาตรฐาน HA',
          content:
            'มาตรฐาน HA ครอบคลุมด้านการนำองค์กร การส่งเสริมคุณภาพ ความปลอดภัย การจัดการความเสี่ยง และการมีส่วนร่วมของบุคลากร\n\nศูนย์ HA ประสานงานให้ทุกแผนกเข้าใจเกณฑ์และเตรียมหลักฐานแนวโน้มผลลัพธ์',
        },
        {
          orderNo: 3,
          title: 'บทบาททีมคุณภาพและหน่วยงาน',
          content:
            'ทีมนำคุณภาพและทีมคุณภาพในระดับหน่วยงานมีบทบาทขับเคลื่อน CQI KM และการเตรียมรับการประเมิน\n\nการทำงานร่วมกับศูนย์ HA ช่วยให้ข้อมูลตัวชี้วัด เอกสาร และผลงานเชื่อมโยงเป็นภาพเดียว',
        },
        {
          orderNo: 4,
          title: 'แนวทางปฏิบัติและการเตรียมรับการประเมิน',
          content:
            'แนวปฏิบัติที่ดี ได้แก่ การบันทึกหลักฐาน การสื่อสารผลลัพธ์ และการปิดวงจร PDCA หลังพบประเด็น\n\nการเตรียมรับการประเมินต้องอาศัยความเข้าใจร่วมของบุคลากรทุกระดับ — E-learning นี้เป็นจุดเริ่มต้นสำคัญ',
        },
      ]

      for (const L of lessonDefs) {
        await prisma.lesson.create({
          data: {
            courseId: course.id,
            title: L.title,
            orderNo: L.orderNo,
            sortOrder: L.orderNo,
            contentType: 'text',
            content: L.content,
            duration: 15,
          },
        })
      }

      const quiz = await prisma.quiz.upsert({
        where: { courseId: course.id },
        update: { passScore: 70 },
        create: { courseId: course.id, passScore: 70, title: 'แบบทดสอบวัดผล HA พื้นฐาน' },
      })

      const questions = [
        {
          question: 'HA ย่อมาจากอะไร?',
          A: 'Hospital Administration',
          B: 'Hospital Accreditation',
          C: 'Health Assessment',
          D: 'Humanitarian Aid',
          correct: 'B',
          explanation: 'HA คือ Hospital Accreditation — การรับรองคุณภาพโรงพยาบาล',
        },
        {
          question: 'วงจร PDCA ขั้นแรก (Plan) เน้นเรื่องใด?',
          A: 'วัดผลและประเมิน',
          B: 'วางแผนและกำหนดปัญหา',
          C: 'ขยายผลทั่วองค์กร',
          D: 'มอบรางวัล',
          correct: 'B',
          explanation: 'Plan คือการวางแผนและระบุปัญหา/เป้าหมาย',
        },
        {
          question: 'ใครมีบทบาทประสานงานคุณภาพทั้งโรงพยาบาลในแบบจำลอง HA Center?',
          A: 'เฉพาะแผนกการเงิน',
          B: 'ศูนย์ประสานงาน HA',
          C: 'ผู้ป่วยนอกเท่านั้น',
          D: 'หน่วยงานภายนอกเท่านั้น',
          correct: 'B',
          explanation: 'ศูนย์ HA ทำหน้าที่ประสานมาตรฐานและสนับสนุนทุกหน่วยงาน',
        },
        {
          question: 'ข้อใดสะท้อนเป้าหมายหลักของ HA?',
          A: 'เพิ่มรายได้โรงพยาบาลเท่านั้น',
          B: 'ความปลอดภัยและคุณภาพการบริการ',
          C: 'ลดจำนวนบุคลากร',
          D: 'ยกเลิกการบันทึกเอกสาร',
          correct: 'B',
          explanation: 'HA มุ่งเน้นคุณภาพและความปลอดภัยของผู้รับบริการ',
        },
        {
          question: 'หลังเรียนครบทุกบท ผู้เรียนควรทำอะไรก่อนรับใบรับรอง?',
          A: 'ลาออก',
          B: 'ทำแบบทดสอบวัดผลและผ่านเกณฑ์',
          C: 'ไม่ต้องทำอะไร',
          D: 'สอบเฉพาะแผนกเดียว',
          correct: 'B',
          explanation: 'ต้องเรียนครบและสอบผ่านตามเกณฑ์หลักสูตร (เช่น 70%)',
        },
      ]

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i]
        const exists = await prisma.quizQuestion.findFirst({
          where: { quizId: quiz.id, question: q.question },
        })
        if (!exists) {
          await prisma.quizQuestion.create({
            data: {
              quizId: quiz.id,
              question: q.question,
              optionA: q.A,
              optionB: q.B,
              optionC: q.C,
              optionD: q.D,
              correctOption: q.correct,
              explanation: q.explanation,
              sortOrder: i,
            },
          })
        }
      }
    }
    const courseCount = await prisma.course.count({ where: { isActive: true, isPublished: true } })
    console.log(`  ✓ E-learning courses: ${courseCount} (published)`)
  }

  console.log('✅ Seed completed.')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
