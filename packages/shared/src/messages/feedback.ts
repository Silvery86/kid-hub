/**
 * The words the app uses to say a thing worked, or did not.
 *
 * Every component that calls an action used to invent its own Vietnamese
 * string, so the same event was phrased four ways across four files and success
 * was usually phrased not at all. Living here rather than in apps/web means web
 * and mobile say the same thing about the same event.
 *
 * Two conventions, both deliberate:
 *
 *  - A success line names what changed, not that something happened. "Đã lưu
 *    thời khóa biểu tuần 38" tells a parent which week; "Đã lưu" does not.
 *  - A failure line is a fallback only. Actions return their own `error` when
 *    they know something specific — a closed period, a duplicate slot — and that
 *    always wins over the generic text here.
 */

export const FEEDBACK = {
  schedule: {
    saved: (week: string): string => `Đã lưu thời khóa biểu ${week}`,
    savedForward: (week: string): string => `Đã áp dụng từ ${week} trở đi`,
    saveFailed: 'Không lưu được thời khóa biểu',
    copied: (count: number): string => `Đã sao chép sang ${count} tuần`,
    copyFailed: 'Không sao chép được thời khóa biểu',
  },

  bellSchedule: {
    saved: 'Đã lưu khung giờ học',
    saveFailed: 'Không lưu được khung giờ học',
    reverted: 'Đã khôi phục khung giờ đã lưu',
  },

  subjects: {
    added: 'Đã thêm môn học',
    addFailed: 'Không thêm được môn học',
    saved: 'Đã lưu môn học',
    saveFailed: 'Không lưu được môn học',
    deleted: 'Đã xoá môn học',
    deleteFailed: 'Không xoá được môn học',
    loadFailed: 'Không tải được danh sách môn',
    duplicateName: 'Lớp của bé đã có môn trùng tên này',
    notFound: 'Không tìm thấy môn học này',
    /**
     * Countable on purpose. "Không xoá được" alone leaves the parent with
     * nowhere to go; the numbers say which screen to open and change first.
     */
    inUse: (usage: { periods: number; homework: number; grades: number }): string => {
      const parts: string[] = []
      if (usage.periods > 0) parts.push(`${usage.periods} tiết học`)
      if (usage.homework > 0) parts.push(`${usage.homework} bài tập`)
      if (usage.grades > 0) parts.push(`${usage.grades} cột điểm`)
      return `Môn này đang được dùng ở ${parts.join(' và ')}. Hãy đổi sang môn khác trước khi xoá.`
    },
  },

  students: {
    added: (name: string): string => `Đã thêm bé ${name}`,
    addFailed: 'Không thêm được bé',
    switched: (name: string): string => `Đang quản lý bé ${name}`,
    switchFailed: 'Không đổi được bé',
    classSaved: 'Đã lưu thông tin lớp',
    classSaveFailed: 'Không lưu được thông tin lớp',
    inviteCreated: 'Đã tạo mã mời',
    inviteFailed: 'Không tạo được mã mời',
  },

  devices: {
    revoked: 'Đã đăng xuất thiết bị',
    revokeFailed: 'Không đăng xuất được thiết bị',
  },

  approvals: {
    approved: (name: string): string => `Đã duyệt ${name}`,
    rejected: (name: string): string => `Đã từ chối ${name}`,
    suspended: (name: string): string => `Đã vô hiệu hóa ${name}`,
    failed: 'Thao tác thất bại',
    loadFailed: 'Không tải được danh sách',
  },

  grades: {
    saved: 'Đã lưu điểm',
    saveFailed: 'Không thể lưu điểm',
  },

  breaks: {
    saved: 'Đã lưu kỳ nghỉ',
    saveFailed: 'Không lưu được kỳ nghỉ',
    deleted: 'Đã xóa kỳ nghỉ',
    deleteFailed: 'Không xóa được kỳ nghỉ',
    presetsAdded: (count: number): string => `Đã thêm ${count} ngày lễ`,
    presetsFailed: 'Không thêm được ngày lễ',
    promoted: (grade: number): string => `Đã chuyển lên lớp ${grade}`,
    promoteFailed: 'Không chuyển lớp được',
  },
} as const
