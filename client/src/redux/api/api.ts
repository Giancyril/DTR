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

    // ── Attendance ────────────────────────────────────────────────────────
    clockIn: build.mutation({
      query: () => ({ url: "/attendance/clock-in", method: "POST" }),
      invalidatesTags: ["attendance", "stats"],
    }),
    clockOut: build.mutation({
      query: () => ({ url: "/attendance/clock-out", method: "POST" }),
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
  useClockInMutation,
  useClockOutMutation,
  useManualEntryMutation,
  useGetAttendanceQuery,
  useGetAttendanceStatsQuery,
  useGetDTRSummaryQuery,
  useDeleteAttendanceMutation,
} = api;