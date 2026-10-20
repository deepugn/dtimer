const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean existing data for clean seed
  await prisma.lap.deleteMany({});
  await prisma.timeSession.deleteMany({});
  await prisma.stopwatch.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.tag.deleteMany({});
  await prisma.user.deleteMany({});

  // 1. Create Demo User
  const passwordHash = await bcrypt.hash("demo1234", 10);
  const demoUser = await prisma.user.create({
    data: {
      email: "demo@dtimer.com",
      name: "Alex Taylor",
      passwordHash,
      role: "ADMIN",
      tier: "PRO",
      timezone: "America/New_York",
      weekStart: "MONDAY",
    },
  });

  console.log(`Created demo user: ${demoUser.email} (Password: demo1234)`);

  // 2. Create Starter Tags with colors and icons
  const tagData = [
    { name: "Office Work", color: "#3B82F6", icon: "💼" },
    { name: "Reading a Book", color: "#10B981", icon: "📖" },
    { name: "Deep Work", color: "#8B5CF6", icon: "⚡" },
    { name: "Meetings", color: "#F59E0B", icon: "👥" },
    { name: "Learning / Study", color: "#EC4899", icon: "🎓" },
    { name: "Admin & Email", color: "#64748B", icon: "✉️" },
  ];

  const tags = {};
  for (const t of tagData) {
    const createdTag = await prisma.tag.create({
      data: {
        userId: demoUser.id,
        name: t.name,
        color: t.color,
        icon: t.icon,
      },
    });
    tags[t.name] = createdTag;
  }

  // 3. Create Sample Tasks
  const task1 = await prisma.task.create({
    data: {
      userId: demoUser.id,
      title: "Prepare Q3 Financial Performance Deck",
      description: "Aggregate revenue metrics, expenses, and forecast slides for executive team review.",
      estimatedMinutes: 90,
      status: "IN_PROGRESS",
      priority: "HIGH",
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      tags: { connect: [{ id: tags["Office Work"].id }, { id: tags["Deep Work"].id }] },
    },
  });

  const task2 = await prisma.task.create({
    data: {
      userId: demoUser.id,
      title: "Read Chapter 4: Designing Data-Intensive Applications",
      description: "Encoding and Evolution: Protocol Buffers, Avro, and schema compatibility rules.",
      estimatedMinutes: 60,
      status: "COMPLETED",
      priority: "MEDIUM",
      completedAt: new Date(Date.now() - 3 * 3600 * 1000),
      tags: { connect: [{ id: tags["Reading a Book"].id }, { id: tags["Learning / Study"].id }] },
    },
  });

  const task3 = await prisma.task.create({
    data: {
      userId: demoUser.id,
      title: "Client Project Architecture Sync",
      description: "Bi-weekly sprint check-in with engineering leads.",
      estimatedMinutes: 45,
      status: "COMPLETED",
      priority: "MEDIUM",
      completedAt: new Date(Date.now() - 26 * 3600 * 1000),
      tags: { connect: [{ id: tags["Office Work"].id }, { id: tags["Meetings"].id }] },
    },
  });

  const task4 = await prisma.task.create({
    data: {
      userId: demoUser.id,
      title: "Read 'Atomic Habits' - Chapters 7-9",
      description: "Make it easy and friction reduction techniques.",
      estimatedMinutes: 45,
      status: "PENDING",
      priority: "LOW",
      dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      tags: { connect: [{ id: tags["Reading a Book"].id }] },
    },
  });

  // 4. Create Active & Paused Stopwatches
  const sw1 = await prisma.stopwatch.create({
    data: {
      userId: demoUser.id,
      name: "Q3 Financial Deck Drafting",
      taskId: task1.id,
      status: "PAUSED",
      accumulatedMs: 42 * 60 * 1000 + 18 * 1000, // 42m 18s
      color: "#3B82F6",
      tags: { connect: [{ id: tags["Office Work"].id }, { id: tags["Deep Work"].id }] },
    },
  });

  const sw2 = await prisma.stopwatch.create({
    data: {
      userId: demoUser.id,
      name: "DDIA Reading Session",
      taskId: task2.id,
      status: "PAUSED",
      accumulatedMs: 54 * 60 * 1000 + 40 * 1000, // 54m 40s
      color: "#10B981",
      tags: { connect: [{ id: tags["Reading a Book"].id }] },
    },
  });

  const sw3 = await prisma.stopwatch.create({
    data: {
      userId: demoUser.id,
      name: "General Admin & Inbox Zero",
      status: "PAUSED",
      accumulatedMs: 15 * 60 * 1000 + 32 * 1000,
      color: "#64748B",
      tags: { connect: [{ id: tags["Admin & Email"].id }] },
    },
  });

  // 5. Add Sample Laps to sw2
  await prisma.lap.createMany({
    data: [
      { stopwatchId: sw2.id, lapNumber: 1, splitTimeMs: 18 * 60 * 1000, lapTimeMs: 18 * 60 * 1000, note: "Section 1: Dataflow through databases" },
      { stopwatchId: sw2.id, lapNumber: 2, splitTimeMs: 37 * 60 * 1000, lapTimeMs: 19 * 60 * 1000, note: "Section 2: RPC and REST services" },
      { stopwatchId: sw2.id, lapNumber: 3, splitTimeMs: 54 * 60 * 1000 + 40000, lapTimeMs: 17 * 60 * 1000 + 40000, note: "Section 3: Message-Passing Dataflow" },
    ],
  });

  // 6. Generate Realistic Unlimited Historical Sessions across the past 7 days
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const pastSessions = [
    // Today
    { title: "Morning Email Triage & Planning", tag: "Admin & Email", durationMin: 28, offsetDays: 0, offsetHours: 3 },
    { title: "DDIA Reading - Chap 4", tag: "Reading a Book", durationMin: 55, offsetDays: 0, offsetHours: 5, taskId: task2.id },
    // Yesterday
    { title: "Client Architecture Sync", tag: "Meetings", durationMin: 48, offsetDays: 1, offsetHours: 2, taskId: task3.id },
    { title: "Deep Focus: Financial Deck Analysis", tag: "Office Work", durationMin: 75, offsetDays: 1, offsetHours: 6 },
    { title: "Evening Reading: Atomic Habits", tag: "Reading a Book", durationMin: 40, offsetDays: 1, offsetHours: 9 },
    // 2 days ago
    { title: "Sprint Planning & Standup", tag: "Meetings", durationMin: 60, offsetDays: 2, offsetHours: 4 },
    { title: "Quarterly Target Spreadsheets", tag: "Office Work", durationMin: 110, offsetDays: 2, offsetHours: 7 },
    { title: "Tech Article: Distributed Consensus", tag: "Learning / Study", durationMin: 45, offsetDays: 2, offsetHours: 11 },
    // 3 days ago
    { title: "Reading: System Design Primer", tag: "Reading a Book", durationMin: 50, offsetDays: 3, offsetHours: 3 },
    { title: "Deep Work: API Optimization", tag: "Deep Work", durationMin: 90, offsetDays: 3, offsetHours: 6 },
    { title: "Customer Demo Call", tag: "Meetings", durationMin: 35, offsetDays: 3, offsetHours: 8 },
    // 4 days ago
    { title: "Client Status Report", tag: "Office Work", durationMin: 65, offsetDays: 4, offsetHours: 5 },
    { title: "Reading Chapter 3 DDIA", tag: "Reading a Book", durationMin: 55, offsetDays: 4, offsetHours: 9 },
    // 5 days ago
    { title: "Deep Work: Database Index Tuning", tag: "Deep Work", durationMin: 85, offsetDays: 5, offsetHours: 4 },
    { title: "Weekly 1:1 Check-in", tag: "Meetings", durationMin: 40, offsetDays: 5, offsetHours: 7 },
    // 6 days ago
    { title: "Weekend Leisure Reading", tag: "Reading a Book", durationMin: 65, offsetDays: 6, offsetHours: 3 },
    { title: "Personal Learning: TypeScript Generics", tag: "Learning / Study", durationMin: 50, offsetDays: 6, offsetHours: 6 },
  ];

  for (const s of pastSessions) {
    const end = new Date(now - s.offsetDays * dayMs - s.offsetHours * 3600 * 1000);
    const durationMs = s.durationMin * 60 * 1000;
    const start = new Date(end.getTime() - durationMs);

    await prisma.timeSession.create({
      data: {
        userId: demoUser.id,
        title: s.title,
        startTime: start,
        endTime: end,
        durationMs,
        notes: `Tracked session for ${s.tag}`,
        taskId: s.taskId || null,
        tags: { connect: [{ id: tags[s.tag].id }] },
      },
    });
  }

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
