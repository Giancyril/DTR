import prisma from "../../config/prisma";

// ── Helpers ───────────────────────────────────────────────────────────────────
const calcHours = (timeIn: Date, timeOut: Date): number => {
  const diff = timeOut.getTime() - timeIn.getTime();
  return Math.round((diff / 1000 / 60 / 60) * 100) / 100;
};

const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// ── Clock In ──────────────────────────────────────────────────────────────────
export const clockIn = async (userId: string) => {
  const now  = new Date();
  const date = startOfDay(now);

  const existing = await prisma.attendanceRecord.findUnique({
    where: { userId_date: { userId, date } },
  });
  if (existing?.timeIn) throw new Error("Already clocked in today");

  return prisma.attendanceRecord.upsert({
    where:  { userId_date: { userId, date } },
    create: { userId, date, timeIn: now, status: "PRESENT" },
    update: { timeIn: now, status: "PRESENT" },
  });
};

// ── Clock Out ─────────────────────────────────────────────────────────────────
export const clockOut = async (userId: string) => {
  const now  = new Date();
  const date = startOfDay(now);

  const record = await prisma.attendanceRecord.findUnique({
    where: { userId_date: { userId, date } },
  });
  if (!record?.timeIn) throw new Error("You have not clocked in yet");
  if (record.timeOut)  throw new Error("Already clocked out today");

  const hoursWorked = calcHours(record.timeIn, now);

  return prisma.attendanceRecord.update({
    where: { userId_date: { userId, date } },
    data:  { timeOut: now, hoursWorked },
  });
};

// ── Manual Entry (admin) ──────────────────────────────────────────────────────
export const manualEntry = async (body: {
  userId:     string;
  date:       string;
  timeIn?:    string;
  timeOut?:   string;
  status:     "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY";
  remarks?:   string;
}) => {
  const date    = startOfDay(new Date(body.date));
  const timeIn  = body.timeIn  ? new Date(body.timeIn)  : undefined;
  const timeOut = body.timeOut ? new Date(body.timeOut) : undefined;
  const hoursWorked = timeIn && timeOut ? calcHours(timeIn, timeOut) : undefined;

  return prisma.attendanceRecord.upsert({
    where:  { userId_date: { userId: body.userId, date } },
    create: {
      userId: body.userId, date,
      timeIn, timeOut, hoursWorked,
      status:   body.status,
      remarks:  body.remarks,
      isManual: true,
    },
    update: {
      timeIn, timeOut, hoursWorked,
      status:   body.status,
      remarks:  body.remarks,
      isManual: true,
    },
  });
};

// ── Get Records ───────────────────────────────────────────────────────────────
export const getRecords = async (params: {
  userId?:   string;
  dateFrom?: string;
  dateTo?:   string;
  status?:   string;
  page?:     number;
  limit?:    number;
}) => {
  const page  = Number(params.page  ?? 1);
  const limit = Number(params.limit ?? 20);

  const where: any = {};
  if (params.userId) where.userId = params.userId;
  if (params.status) where.status = params.status;
  if (params.dateFrom || params.dateTo) {
    where.date = {};
    if (params.dateFrom) where.date.gte = startOfDay(new Date(params.dateFrom));
    if (params.dateTo)   where.date.lte = startOfDay(new Date(params.dateTo));
  }

  const [records, total] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where,
      include: { user: { select: { id: true, name: true, department: true, position: true } } },
      orderBy: { date: "desc" },
      skip:    (page - 1) * limit,
      take:    limit,
    }),
    prisma.attendanceRecord.count({ where }),
  ]);

  return { records, total, page, limit };
};

// ── DTR Summary ───────────────────────────────────────────────────────────────
export const getDTRSummary = async (params: {
  userId:    string;
  dateFrom:  string;
  dateTo:    string;
}) => {
  const where = {
    userId: params.userId,
    date: {
      gte: startOfDay(new Date(params.dateFrom)),
      lte: startOfDay(new Date(params.dateTo)),
    },
  };

  const records = await prisma.attendanceRecord.findMany({
    where,
    orderBy: { date: "asc" },
    include: { user: { select: { id: true, name: true, department: true, position: true } } },
  });

  const totalHours   = records.reduce((sum, r) => sum + (r.hoursWorked ?? 0), 0);
  const presentDays  = records.filter(r => r.status === "PRESENT" || r.status === "LATE").length;
  const absentDays   = records.filter(r => r.status === "ABSENT").length;
  const lateDays     = records.filter(r => r.status === "LATE").length;
  const halfDays     = records.filter(r => r.status === "HALF_DAY").length;

  return {
    records,
    summary: {
      totalHours:   Math.round(totalHours * 100) / 100,
      presentDays,
      absentDays,
      lateDays,
      halfDays,
      totalDays: records.length,
    },
  };
};

// ── Delete Record ─────────────────────────────────────────────────────────────
export const deleteRecord = async (id: string) => {
  return prisma.attendanceRecord.delete({ where: { id } });
};

// ── Dashboard Stats ───────────────────────────────────────────────────────────
export const getStats = async () => {
  const today = startOfDay(new Date());

  const [totalEmployees, presentToday, absentToday, lateToday] = await Promise.all([
    prisma.user.count({ where: { role: "EMPLOYEE" } }),
    prisma.attendanceRecord.count({ where: { date: today, status: "PRESENT" } }),
    prisma.attendanceRecord.count({ where: { date: today, status: "ABSENT" } }),
    prisma.attendanceRecord.count({ where: { date: today, status: "LATE" } }),
  ]);

  return { totalEmployees, presentToday, absentToday, lateToday };
};