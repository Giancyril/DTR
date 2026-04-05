import { baseApi } from "./baseApi";

const api = baseApi.injectEndpoints({
  endpoints: (build) => ({

    // ── Auth ──────────────────────────────────────────────────────────────
    login: build.mutation({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
    }),
    register: build.mutation({
      query: (body) => ({ url: "/auth/register", method: "POST", body }),
      invalidatesTags: ["users"],
    }),
    getUsers: build.query({
      query: () => "/auth/users",
      providesTags: ["users"],
    }),
    updateUser: build.mutation({
      query: ({ id, ...body }) => ({ url: `/auth/users/${id}`, method: "PUT", body }),
      invalidatesTags: ["users"],
    }),
    deleteUser: build.mutation({
      query: (id: string) => ({ url: `/auth/users/${id}`, method: "DELETE" }),
      invalidatesTags: ["users", "stats"],
    }),
    changePassword: build.mutation({
      query: (body) => ({ url: "/auth/change-password", method: "PUT", body }),
    }),
    updateProfile: build.mutation({
      query: (body) => ({ url: "/auth/profile", method: "PUT", body }),
    }),

    // ── Print
    exportDTR: build.mutation<{ base64: string }, { userId: string; dateFrom: string; dateTo: string }>({
      query: (body) => ({
        url: "/attendance/export-dtr",
        method: "POST",
        body,
        // No responseHandler — server already returns { success: true, base64: "..." } as JSON
      }),
    }),

    // ── Attendance ────────────────────────────────────────────────────────
    amClockIn: build.mutation({
      query: () => ({ url: "/attendance/am-clock-in", method: "POST" }),
      invalidatesTags: ["attendance", "stats"],
    }),
    amClockOut: build.mutation({
      query: () => ({ url: "/attendance/am-clock-out", method: "POST" }),
      invalidatesTags: ["attendance", "stats"],
    }),
    pmClockIn: build.mutation({
      query: () => ({ url: "/attendance/pm-clock-in", method: "POST" }),
      invalidatesTags: ["attendance", "stats"],
    }),
    pmClockOut: build.mutation({
      query: () => ({ url: "/attendance/pm-clock-out", method: "POST" }),
      invalidatesTags: ["attendance", "stats"],
    }),
    manualEntry: build.mutation({
      query: (body) => ({ url: "/attendance/manual", method: "POST", body }),
      invalidatesTags: ["attendance", "stats"],
    }),
    getAttendance: build.query({
      query: (params) => ({ url: "/attendance", params }),
      providesTags: ["attendance"],
    }),
    getAttendanceStats: build.query({
      query: () => "/attendance/stats",
      providesTags: ["stats"],
    }),
    updateAttendance: build.mutation({
      query: ({ id, ...body }) => ({ url: `/attendance/${id}`, method: "PUT", body }),
      invalidatesTags: ["attendance", "stats"],
    }),
    getDTRSummary: build.query({
      query: (params: { userId: string; dateFrom: string; dateTo: string }) => ({
        url: "/attendance/dtr",
        params,
      }),
      providesTags: ["attendance"],
    }),
    deleteAttendance: build.mutation({
      query: (id: string) => ({ url: `/attendance/${id}`, method: "DELETE" }),
      invalidatesTags: ["attendance", "stats"],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetUsersQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useChangePasswordMutation,
  useAmClockInMutation,
  useAmClockOutMutation,
  usePmClockInMutation,
  usePmClockOutMutation,
  useManualEntryMutation,
  useGetAttendanceQuery,
  useGetAttendanceStatsQuery,
  useGetDTRSummaryQuery,
  useDeleteAttendanceMutation,
  useUpdateProfileMutation,
  useExportDTRMutation,
  useUpdateAttendanceMutation,
} = api;