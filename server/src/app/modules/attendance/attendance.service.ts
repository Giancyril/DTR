import prisma from "../../config/prisma";
import PDFDocument from "pdfkit";

// ── Helpers ───────────────────────────────────────────────────────────────────
const calcHours = (timeIn: Date, timeOut: Date): number => {
  const diff = timeOut.getTime() - timeIn.getTime();
  return Math.round((diff / 1000 / 60 / 60) * 100) / 100;
};

const startOfDay = (date: Date): Date => {
  const ph = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
  return new Date(Date.UTC(ph.getFullYear(), ph.getMonth(), ph.getDate()));
};

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

// FIX: accepts Date | null | undefined (Prisma returns Date, not string)
const fmtTime = (d: Date | null | undefined): string => {
  if (!d) return "";
  return new Date(d).toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Manila",
  });
};

// ── AM Clock In ───────────────────────────────────────────────────────────────
export const amClockIn = async (userId: string) => {
  const now  = new Date();
  const date = startOfDay(now);

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
  if (!record?.amTimeIn) throw new Error("You have not clocked in for AM session");
  if (record.amTimeOut)  throw new Error("Already clocked out for AM session");

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
      gte: parseDateString(params.dateFrom),
      lte: parseDateString(params.dateTo),
    },
  };

  const records = await prisma.attendanceRecord.findMany({
    where,
    orderBy: { date: "asc" }, // asc so PDF rows are in order
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

// ── Export DTR as CS Form 48 PDF ──────────────────────────────────────────────
export const exportDTRPdf = async (params: {
  userId:   string;
  dateFrom: string;
  dateTo:   string;
}): Promise<Buffer> => {
  const { records, summary } = await getDTRSummary(params);
  const user = records[0]?.user;

  // ── Parse date range ───────────────────────────────────────────────────────
  const [fromY, fromM, fromD] = params.dateFrom.split("-").map(Number);
  const [toY,   toM,   toD]   = params.dateTo.split("-").map(Number);

  // ── Build month segments — always full month (1–31), data shown only within range ──
  type Segment = {
    year:      number;
    month:     number;
    activeFrom: number; // first day with data (inclusive)
    activeTo:   number; // last day with data (inclusive)
  };
  const segments: Segment[] = [];

  let curY = fromY, curM = fromM;
  while (curY < toY || (curY === toY && curM <= toM)) {
    const isFirst        = curY === fromY && curM === fromM;
    const isLast         = curY === toY   && curM === toM;
    const lastDayOfMonth = new Date(curY, curM, 0).getDate();
    segments.push({
      year:       curY,
      month:      curM,
      activeFrom: isFirst ? fromD : 1,
      activeTo:   isLast  ? toD   : lastDayOfMonth,
    });
    curM++;
    if (curM > 12) { curM = 1; curY++; }
  }

  // ── Build record map keyed by "YYYY-MM-DD" ─────────────────────────────────
  const recordMap = new Map<string, (typeof records)[0]>();
  for (const r of records) {
    let key: string;
    if (r.date instanceof Date) {
      const yy = r.date.getUTCFullYear();
      const mm = String(r.date.getUTCMonth() + 1).padStart(2, "0");
      const dd = String(r.date.getUTCDate()).padStart(2, "0");
      key = `${yy}-${mm}-${dd}`;
    } else {
      key = (r.date as string).split("T")[0];
    }
    recordMap.set(key, r);
  }

  // ── Layout constants ───────────────────────────────────────────────────────
  const ROW_H   = 13;
  const HDR_H   = 16;
  const HDR_H2  = 11;
  const TOTAL_R = 14;
  const ROWS    = 31; // always render 31 rows regardless of month length

  // Fixed page height based on 31 rows — consistent across all pages
  const PAGE_H = Math.max(
    792,
    105 + HDR_H + HDR_H2 + ROWS * ROW_H + TOTAL_R + 100
  );

  // Pair segments onto pages (2 per page, side by side)
  const pages: Segment[][] = [];
  for (let i = 0; i < segments.length; i += 2) {
    pages.push(segments.slice(i, i + 2));
  }

  const W = 612;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size:          [W, PAGE_H],
      margin:        0,
      layout:        "portrait",
      autoFirstPage: false,
    });

    const chunks: Buffer[] = [];
    doc.on("data",  (c: Buffer) => chunks.push(c));
    doc.on("end",   () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // ── Draw one form column ─────────────────────────────────────────────────
    const drawForm = (offsetX: number, seg: Segment) => {
      const col = offsetX;
      const cw  = W / 2 - 20;
      const cx  = col + cw;

      const monthName  = new Date(seg.year, seg.month - 1, 1)
        .toLocaleString("en-PH", { month: "long" });
      const monthLabel = `${monthName} ${seg.year}`;

      let y = 40;

      // Title
      doc.font("Helvetica-Bold").fontSize(7).fillColor("black");
      doc.text("CS Form 48", col, y, { width: cw, align: "center" });
      y += 11;
      doc.fontSize(9);
      doc.text("DAILY TIME RECORD", col, y, { width: cw, align: "center" });
      y += 20;

      // Name
      const nameVal = user ? user.name.toUpperCase() : "________________________";
      doc.font("Helvetica-Bold").fontSize(7.5).fillColor("black");
      // Center the name text manually without any decoration
      const nameY = y;
      doc.text(nameVal, col, nameY, { width: cw, align: "center" });
      y += 10;
      // Draw underline manually below the text
      doc.moveTo(col + 4, y).lineTo(cx - 4, y).lineWidth(0.5).stroke();
      y += 4;
      doc.font("Helvetica").fontSize(6).fillColor("#555555");
      doc.text("Name", col, y, { width: cw, align: "center" });
      doc.fillColor("black");
      y += 12;

     // Header info
      const headerRight = col + (W / 2 - 20);

      doc.font("Helvetica").fontSize(6.5).fillColor("black");

      // Row 1: draw full underline first, then text on top
      const row1y = y;
      doc.font("Helvetica").fontSize(6.5);
      const prefixW = doc.widthOfString("For the month of ");
      doc.font("Helvetica-Bold").fontSize(6.5);
      const monthW = doc.widthOfString(monthLabel);
      const lineStart1 = col + 4 + prefixW;
      // Full underline from after "For the month of" to end
      doc.moveTo(lineStart1, row1y + 7).lineTo(headerRight - 4, row1y + 7).lineWidth(0.5).stroke();
      // Text drawn on top
      doc.font("Helvetica").fontSize(6.5);
      doc.text("For the month of ", col + 4, row1y, { continued: false });
      doc.font("Helvetica-Bold").fontSize(6.5);
      doc.text(monthLabel, col + 4 + prefixW, row1y, { continued: false });
      y += 11;

      doc.font("Helvetica").fontSize(6.5);
      const ohW = doc.widthOfString("Official Hours (Regular Days):");
      doc.moveTo(col + 4 + ohW + 3, y + 7).lineTo(headerRight - 4, y + 7).lineWidth(0.5).stroke();
      doc.text("Official Hours (Regular Days):", col + 4, y, { continued: false });
      y += 10;

      const adW = doc.widthOfString("Arrival & Departure:");
      doc.moveTo(col + 4 + adW + 3, y + 7).lineTo(headerRight - 4, y + 7).stroke();
      doc.text("Arrival & Departure:", col + 4, y, { continued: false });
      y += 10;

      const satW = doc.widthOfString("Saturdays:");
      doc.moveTo(col + 4 + satW + 3, y + 7).lineTo(headerRight - 4, y + 7).stroke();
      doc.text("Saturdays:", col + 4, y, { continued: false });
      y += 14;

      // Table setup
      const tableLeft  = col + 4;
      const tableRight = cx - 4;
      const tableW     = tableRight - tableLeft;

      const cols = {
        day:   tableW * 0.10,
        amArr: tableW * 0.18,
        amDep: tableW * 0.18,
        pmArr: tableW * 0.18,
        pmDep: tableW * 0.18,
        under: tableW * 0.09,
        over:  tableW * 0.09,
      };

      let ty = y;

      // Header row 1
      doc.rect(tableLeft, ty, tableW, HDR_H).lineWidth(0.5).stroke();
      doc.font("Helvetica-Bold").fontSize(6.5);

      let cx2 = tableLeft;
      doc.moveTo(cx2 + cols.day, ty).lineTo(cx2 + cols.day, ty + HDR_H).stroke();
      cx2 += cols.day;

      doc.text("A M", cx2, ty + 5, { width: cols.amArr + cols.amDep, align: "center" });
      doc.moveTo(cx2, ty).lineTo(cx2, ty + HDR_H).stroke();
      cx2 += cols.amArr + cols.amDep;

      doc.text("P M", cx2, ty + 5, { width: cols.pmArr + cols.pmDep, align: "center" });
      doc.moveTo(cx2, ty).lineTo(cx2, ty + HDR_H).stroke();
      cx2 += cols.pmArr + cols.pmDep;

      doc.text("Under\nTime", cx2, ty + 2, { width: cols.under, align: "center" });
      doc.moveTo(cx2, ty).lineTo(cx2, ty + HDR_H).stroke();
      cx2 += cols.under;

      doc.text("Over\nTime", cx2, ty + 2, { width: cols.over, align: "center" });
      doc.moveTo(cx2, ty).lineTo(cx2, ty + HDR_H).stroke();
      ty += HDR_H;

      // Header row 2
      doc.rect(tableLeft, ty, tableW, HDR_H2).stroke();
      cx2 = tableLeft;
      doc.font("Helvetica-Bold").fontSize(6);

      doc.text("Day", cx2, ty + 3, { width: cols.day, align: "center" });
      doc.moveTo(cx2 + cols.day, ty).lineTo(cx2 + cols.day, ty + HDR_H2).stroke();
      cx2 += cols.day;

      doc.text("Arr.", cx2, ty + 3, { width: cols.amArr, align: "center" });
      doc.moveTo(cx2 + cols.amArr, ty).lineTo(cx2 + cols.amArr, ty + HDR_H2).stroke();
      cx2 += cols.amArr;

      doc.text("Dep.", cx2, ty + 3, { width: cols.amDep, align: "center" });
      doc.moveTo(cx2 + cols.amDep, ty).lineTo(cx2 + cols.amDep, ty + HDR_H2).stroke();
      cx2 += cols.amDep;

      doc.text("Arr.", cx2, ty + 3, { width: cols.pmArr, align: "center" });
      doc.moveTo(cx2 + cols.pmArr, ty).lineTo(cx2 + cols.pmArr, ty + HDR_H2).stroke();
      cx2 += cols.pmArr;

      doc.text("Dep.", cx2, ty + 3, { width: cols.pmDep, align: "center" });
      doc.moveTo(cx2 + cols.pmDep, ty).lineTo(cx2 + cols.pmDep, ty + HDR_H2).stroke();
      cx2 += cols.pmDep;

      doc.text("Hrs.", cx2, ty + 3, { width: cols.under, align: "center" });
      doc.moveTo(cx2 + cols.under, ty).lineTo(cx2 + cols.under, ty + HDR_H2).stroke();
      cx2 += cols.under;

      doc.text("Min.", cx2, ty + 3, { width: cols.over, align: "center" });
      ty += HDR_H2;

      // ── Data rows — always 31, data only shown within activeFrom..activeTo ──
      doc.font("Helvetica").fontSize(6);
      let segTotalHours = 0;

      for (let day = 1; day <= ROWS; day++) {
        const isActive = day >= seg.activeFrom && day <= seg.activeTo;
        const mm  = String(seg.month).padStart(2, "0");
        const dd  = String(day).padStart(2, "0");
        const rec = isActive ? recordMap.get(`${seg.year}-${mm}-${dd}`) : undefined;

        doc.rect(tableLeft, ty, tableW, ROW_H).stroke();
        cx2 = tableLeft;

        doc.font("Helvetica-Bold").fontSize(6);
        doc.text(String(day), cx2, ty + 3.5, { width: cols.day, align: "center" });
        doc.moveTo(cx2 + cols.day, ty).lineTo(cx2 + cols.day, ty + ROW_H).stroke();
        cx2 += cols.day;

        doc.font("Helvetica").fontSize(6);

        doc.text(rec ? fmtTime(rec.amTimeIn)  : "", cx2, ty + 3.5, { width: cols.amArr, align: "center" });
        doc.moveTo(cx2 + cols.amArr, ty).lineTo(cx2 + cols.amArr, ty + ROW_H).stroke();
        cx2 += cols.amArr;

        doc.text(rec ? fmtTime(rec.amTimeOut) : "", cx2, ty + 3.5, { width: cols.amDep, align: "center" });
        doc.moveTo(cx2 + cols.amDep, ty).lineTo(cx2 + cols.amDep, ty + ROW_H).stroke();
        cx2 += cols.amDep;

        doc.text(rec ? fmtTime(rec.pmTimeIn)  : "", cx2, ty + 3.5, { width: cols.pmArr, align: "center" });
        doc.moveTo(cx2 + cols.pmArr, ty).lineTo(cx2 + cols.pmArr, ty + ROW_H).stroke();
        cx2 += cols.pmArr;

        doc.text(rec ? fmtTime(rec.pmTimeOut) : "", cx2, ty + 3.5, { width: cols.pmDep, align: "center" });
        doc.moveTo(cx2 + cols.pmDep, ty).lineTo(cx2 + cols.pmDep, ty + ROW_H).stroke();
        cx2 += cols.pmDep;

        // Undertime (blank — fill manually)
        doc.moveTo(cx2 + cols.under, ty).lineTo(cx2 + cols.under, ty + ROW_H).stroke();
        cx2 += cols.under;

        // Overtime minutes
        const overtimeMins = rec?.hoursWorked && rec.hoursWorked > 8
          ? String(Math.round((rec.hoursWorked - 8) * 60))
          : "";
        doc.text(overtimeMins, cx2, ty + 3.5, { width: cols.over, align: "center" });

        if (rec?.hoursWorked) segTotalHours += rec.hoursWorked;
        ty += ROW_H;
      }

      // Total row
      doc.rect(tableLeft, ty, tableW, TOTAL_R).stroke();
      doc.font("Helvetica-Bold").fontSize(6);

      const labelW = cols.day + cols.amArr + cols.amDep + cols.pmArr + cols.pmDep;
      doc.text("TOTAL", tableLeft, ty + 4, { width: labelW - 4, align: "right" });

      const totalX = tableLeft + labelW;
      doc.moveTo(totalX, ty).lineTo(totalX, ty + TOTAL_R).stroke();
      const totalHrsDisplay = segTotalHours > 0
        ? `${Math.round(segTotalHours * 100) / 100}h`
        : "";
      doc.text(totalHrsDisplay, totalX, ty + 4, { width: cols.under, align: "center" });
      doc.moveTo(totalX + cols.under, ty).lineTo(totalX + cols.under, ty + TOTAL_R).stroke();
      ty += TOTAL_R + 14;

      // Certification text
      doc.font("Helvetica").fontSize(6).fillColor("black");
      doc.text(
        "I certify on my honor that the above is true and correct record of the hours of work performed, " +
        "record of which was made daily at the time of arrival and departure from the office.",
        tableLeft, ty, { width: tableW, align: "justify" }
      );
      ty += 32;

      // Signature line
      const sigIndent = 15;
      doc.moveTo(tableLeft + sigIndent, ty).lineTo(tableRight - sigIndent, ty).lineWidth(0.5).stroke();
      ty += 4;
      doc.fontSize(6).fillColor("#555555");
      doc.text("(Signature)", tableLeft, ty, { width: tableW, align: "center" });
      doc.fillColor("black");
      ty += 16;

      doc.font("Helvetica").fontSize(6);
      doc.text("Verified as to the prescribed office hours:", tableLeft, ty, { width: tableW, align: "center" });
      ty += 20;

      doc.moveTo(tableLeft + sigIndent, ty).lineTo(tableRight - sigIndent, ty).stroke();
      ty += 4;
      doc.fillColor("#555555");
      doc.text("(In-charge)", tableLeft, ty, { width: tableW, align: "center" });
      doc.fillColor("black");
    };

    // ── Render each page ─────────────────────────────────────────────────────
    pages.forEach((pair) => {
      doc.addPage({ size: [W, PAGE_H], margin: 0 });

      // Left form
      drawForm(10, pair[0]);

      // Dashed center divider
      doc.moveTo(W / 2, 30).lineTo(W / 2, PAGE_H - 30)
         .lineWidth(0.5).dash(3, { space: 3 }).stroke().undash();

      // Right form — second segment if available, otherwise duplicate left
      drawForm(W / 2 + 10, pair[1] ?? pair[0]);
    });

    doc.end();
  });
};