export type Role = "ADMIN" | "EMPLOYEE";
export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY";

export interface DecodedToken {
  id:    string;
  name:  string;
  email: string;
  role:  Role;
  exp:   number;
  iat:   number;
}

export interface User {
  id:         string;
  name:       string;
  email:      string;
  role:       Role;
  department: string | null;
  position:   string | null;
  createdAt:  string;
}

export interface AttendanceRecord {
  id:          string;
  userId:      string;
  user?:       Pick<User, "id" | "name" | "department" | "position">;
  date:        string;
  timeIn:      string | null;
  timeOut:     string | null;
  hoursWorked: number | null;
  status:      AttendanceStatus;
  remarks:     string | null;
  isManual:    boolean;
  createdAt:   string;
}

export interface DTRSummary {
  totalHours:  number;
  presentDays: number;
  absentDays:  number;
  lateDays:    number;
  halfDays:    number;
  totalDays:   number;
}

export interface AttendanceStats {
  totalEmployees: number;
  presentToday:   number;
  absentToday:    number;
  lateToday:      number;
}