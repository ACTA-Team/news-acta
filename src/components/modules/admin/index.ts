import { buildAdminMetadata } from '@/lib/seo';

export { AdminShell } from './ui/AdminShell';
export { AdminLoginPageContent } from './pages/AdminLoginPage';
export { AdminDashboardPageContent } from './pages/AdminDashboardPage';
export { AdminNewsPageContent } from './pages/AdminNewsPage';
export { AdminTranslationsPageContent } from './pages/AdminTranslationsPage';
export { AdminNewsEditorPageContent } from './pages/AdminNewsEditorPage';
export { AdminMonthlyReviewsPageContent } from './pages/AdminMonthlyReviewsPage';
export { AdminMonthlyReviewEditorPageContent } from './pages/AdminMonthlyReviewEditorPage';
export { AdminReviewQueuePageContent } from './pages/AdminReviewQueuePage';
export { AdminCalendarPageContent } from './pages/AdminCalendarPage';
export { AdminTeamPageContent } from './pages/AdminTeamPage';

// Editorial UI
export { RoleBadge } from './ui/RoleBadge';
export { TranslationEditor } from './ui/TranslationEditor';
export { TranslationStatusBadge } from './ui/TranslationStatusBadge';
export { StatusBadge } from './ui/StatusBadge';
export { StatusTransitionMenu } from './ui/StatusTransitionMenu';
export { SchedulePicker } from './ui/SchedulePicker';
export { ReviewQueue } from './ui/ReviewQueue';
export { ReviewCommentThread } from './ui/ReviewCommentThread';
export { EditorialCalendar } from './ui/EditorialCalendar';

// Actions
export {
  saveAdminNewsArticleAction,
  deleteAdminNewsArticleAction,
  restoreArticleVersionAction,
  transitionArticleStatusAction,
  scheduleArticleAction,
  unscheduleArticleAction,
  rescheduleArticleAction,
  requestReviewAction,
  approveReviewAction,
  requestChangesAction,
  updateTeamMemberRoleAction,
  saveArticleTranslationAction,
  deleteArticleTranslationAction,
  markArticleTranslationCurrentAction,
} from './actions';

// Services
export {
  fetchAdminArticleVersions,
  fetchAdminArticleVersionByNumber,
} from './services/versions.service';
export { getCurrentRole, listTeam, requireRole, ForbiddenError } from './services/roles.service';
export { listOpen, listThread } from './services/reviews.service';
export {
  deleteTranslation,
  fetchArticleTranslationFieldHashes,
  fetchArticleTranslations,
  fetchTranslationSource,
  fieldStaleness,
  getTranslationStatus,
  getTranslationStatusForArticles,
  markTranslationCurrent,
  upsertTranslation,
  type UpsertTranslationInput,
} from './services/translations.service';
export {
  publishScheduledArticles,
  listCalendarEntries,
  schedule,
  unschedule,
} from './services/scheduling.service';

export const adminLoginMetadata = buildAdminMetadata({
  title: 'Admin Login',
  description: 'Secure email-only access for authorized ACTA editors.',
});
