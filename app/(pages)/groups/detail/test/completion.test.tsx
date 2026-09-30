import { render, screen } from '@testing-library/react';
import GroupDetail from '../page';
import { messages } from '@/i18n/messages';
let mockEnded = false;
let mockError = false;
let mockResultCount = 1;
jest.mock('react-router-dom', () => ({
  useParams: () => ({ id: 'g' }),
  Link: ({ children }: any) => <a>{children}</a>,
}));
jest.mock('@/i18n', () => ({
  useLanguage: () => ({ locale: 'en' }),
  useTranslations: () => (key: string) => (messages.en as any)[key] || key,
}));
jest.mock('@/hooks/useRequest', () => ({
  useRequest: (path: string) =>
    path.includes('/results')
      ? {
          error: mockError,
          response: {
            data: [
              {
                id: 'r',
                studentName: 'Sara',
                passed: true,
                presentCount: 4,
                applicableCount: 5,
                satisfactoryCount: 4,
              },
            ],
            count: mockResultCount,
          },
        }
      : {
          response: {
            data: {
              id: 'g',
              nameEn: 'Group',
              program: { nameEn: 'Program' },
              endedAt: mockEnded ? '2026-01-01' : null,
              minAttendancePercent: 80,
              minSatisfactoryPercent: 80,
            },
          },
        },
}));
beforeEach(() => {
  jest.clearAllMocks();
  mockEnded = false;
  mockError = false;
  mockResultCount = 1;
});
it('shows saved roster without edit or end controls', () => {
  mockEnded = true;
  render(<GroupDetail />);
  expect(screen.getByText('Sara')).toBeInTheDocument();
  expect(screen.getByText('4/5 · 80.0%')).toBeInTheDocument();
  expect(screen.queryByText(messages.en.endGroup)).not.toBeInTheDocument();
  expect(screen.queryByText(messages.en.edit)).not.toBeInTheDocument();
  expect(screen.queryByText(messages.en.previous)).not.toBeInTheDocument();
  expect(screen.queryByText(messages.en.next)).not.toBeInTheDocument();
});
it('shows pagination when completion results exceed the page limit', () => {
  mockEnded = true;
  mockResultCount = 21;
  render(<GroupDetail />);
  expect(screen.getByText(messages.en.previous)).toBeInTheDocument();
  expect(screen.getByText(messages.en.next)).toBeInTheDocument();
});
it('does not show stale roster when results fail', () => {
  mockEnded = true;
  mockError = true;
  render(<GroupDetail />);
  expect(screen.getByRole('alert')).toHaveTextContent(
    messages.en.resultsFailed,
  );
  expect(screen.queryByText('Sara')).not.toBeInTheDocument();
});
