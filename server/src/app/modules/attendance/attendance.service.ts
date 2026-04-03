import prisma from "../../config/prisma";

// ── Helpers ───────────────────────────────────────────────────────────────────
const calcHours = (timeIn: Date, timeOut: Date): number => {
  const diff = timeOut.getTime() - timeIn.getTime();
  return Math.round((diff / 1000 / 60 / 60) * 100) / 100;
};

/**
 * FIX: Instead of setUTCHours(0,0,0,0) which shifts the date back 8 hours
 * (causing April 2 PH → April 1 UTC), we now get the current date in
 * Asia/Manila time and store it as UTC midnight of that local date.
 */
const startOfDay = (date: Date): Date => {
  const ph = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
  return new Date(Date.UTC(ph.getFullYear(), ph.getMonth(), ph.getDate()));
};

/**
 * FIX: For manual entry where date comes in as a "YYYY-MM-DD" string,
 * parse it directly into UTC midnight so it is never shifted by timezone offset.
 */
const parseDateString = (dateStr: string): Date => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};

const calcTotalHours = (
  amTimeIn?: Date | null,
  amTimeOut?: Date | null,
  pmTimeIn?: Date | null,
  pmTimeOut?: Date | null
): number => {
  let total = 0;
  if (amTimeIn && amTimeOut) total += calcHours(amTimeIn, amTimeOut);
  if (pmTimeIn && pmTimeOut) total += calcHours(pmTimeIn, pmTimeOut);
  return Math.round(total * 100) / 100;
};

// ── AM Clock In ───────────────────────────────────────────────────────────────
export const amClockIn = async (userId: string) => {
  const now  = new Date();
  const date = startOfDay(now); // uses PH local date now

  const existing = await prisma.attendanceRecord.findUnique({
    where: { userId_date: { userId, date } },
  });
  if (existing?.amTimeIn) throw new Error("Already clocked in for AM session today");

  return prisma.attendanceRecord.upsert({
    where:  { userId_date: { userId, date } },
    create: { userId, date, amTimeIn: now, status: "PRESENT" },
    update: { amTimeIn: now, status: "PRESENT" },
  });
};

// ── AM Clock Out ──────────────────────────────────────────────────────────────
export const amClockOut = async (userId: string) => {
  const now  = new Date();
  const date = startOfDay(now);

  const record = await prisma.attendanceRecord.findUnique({
    where: { userId_date: { userId, date } },
  });
  if (!record?.amTimeIn)  throw new Error("You have not clocked in for AM session");
  if (record.amTimeOut)   throw new Error("Already clocked out for AM session");

  const hoursWorked = calcTotalHours(record.amTimeIn, now, record.pmTimeIn, record.pmTimeOut);

  return prisma.attendanceRecord.update({
    where: { userId_date: { userId, date } },
    data:  { amTimeOut: now, hoursWorked },
  });
};

// ── PM Clock In ───────────────────────────────────────────────────────────────
export const pmClockIn = async (userId: string) => {
  const now  = new Date();
  const date = startOfDay(now);

  const existing = await prisma.attendanceRecord.findUnique({
    where: { userId_date: { userId, date } },
  });
  if (existing?.pmTimeIn) throw new Error("Already clocked in for PM session today");

  return prisma.attendanceRecord.upsert({
    where:  { userId_date: { userId, date } },
    create: { userId, date, pmTimeIn: now, status: "PRESENT" },
    update: { pmTimeIn: now },
  });
};

// ── PM Clock Out ──────────────────────────────────────────────────────────────
export const pmClockOut = async (userId: string) => {
  const now  = new Date();
  const date = startOfDay(now);

  const record = await prisma.attendanceRecord.findUnique({
    where: { userId_date: { userId, date } },
  });
  if (!record?.pmTimeIn) throw new Error("You have not clocked in for PM session");
  if (record.pmTimeOut)  throw new Error("Already clocked out for PM session");

  const hoursWorked = calcTotalHours(record.amTimeIn, record.amTimeOut, record.pmTimeIn, now);

  return prisma.attendanceRecord.update({
    where: { userId_date: { userId, date } },
    data:  { pmTimeOut: now, hoursWorked },
  });
};

// ── Manual Entry (admin) ──────────────────────────────────────────────────────
export const manualEntry = async (body: {
  userId:     string;
  date:       string;
  amTimeIn?:  string;
  amTimeOut?: string;
  pmTimeIn?:  string;
  pmTimeOut?: string;
  status:     "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY";
  remarks?:   string;
}) => {
  // FIX: use parseDateString so "2025-04-02" always becomes 2025-04-02T00:00:00Z
  // and never slips back a day due to UTC offset
  const date      = parseDateString(body.date);
  const amTimeIn  = body.amTimeIn  ? new Date(body.amTimeIn)  : undefined;
  const amTimeOut = body.amTimeOut ? new Date(body.amTimeOut) : undefined;
  const pmTimeIn  = body.pmTimeIn  ? new Date(body.pmTimeIn)  : undefined;
  const pmTimeOut = body.pmTimeOut ? new Date(body.pmTimeOut) : undefined;

  const hoursWorked = calcTotalHours(amTimeIn, amTimeOut, pmTimeIn, pmTimeOut);

  return prisma.attendanceRecord.upsert({
    where:  { userId_date: { userId: body.userId, date } },
    create: {
      userId: body.userId, date,
      amTimeIn, amTimeOut, pmTimeIn, pmTimeOut,
      hoursWorked: hoursWorked > 0 ? hoursWorked : undefined,
      status:   body.status,
      remarks:  body.remarks,
      isManual: true,
    },
    update: {
      amTimeIn, amTimeOut, pmTimeIn, pmTimeOut,
      hoursWorked: hoursWorked > 0 ? hoursWorked : undefined,
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
    // FIX: use parseDateString for filter dates too
    if (params.dateFrom) where.date.gte = parseDateString(params.dateFrom);
    if (params.dateTo)   where.date.lte = parseDateString(params.dateTo);
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
  userId:   string;
  dateFrom: string;
  dateTo:   string;
}) => {
  const where = {
    userId: params.userId,
    date: {
      // FIX: use parseDateString for filter dates too
      gte: parseDateString(params.dateFrom),
      lte: parseDateString(params.dateTo),
    },
  };

  const records = await prisma.attendanceRecord.findMany({
    where,
    orderBy: { date: "desc" },
    include: { user: { select: { id: true, name: true, department: true, position: true } } },
  });

  const totalHours  = records.reduce((sum, r) => sum + (r.hoursWorked ?? 0), 0);
  const presentDays = records.filter(r => r.status === "PRESENT" || r.status === "LATE").length;
  const absentDays  = records.filter(r => r.status === "ABSENT").length;
  const lateDays    = records.filter(r => r.status === "LATE").length;
  const halfDays    = records.filter(r => r.status === "HALF_DAY").length;

  return {
    records,
    summary: {
      totalHours:  Math.round(totalHours * 100) / 100,
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