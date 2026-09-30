import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import EndGroup from '../EndGroup';
import { GET, POST } from '@/lib/crud';
import { messages } from '@/i18n/messages';

jest.mock('@/i18n', () => ({
  useLanguage: () => ({ locale: 'en' }),
  useTranslations: () => (key: string) => (messages.en as any)[key] || key,
}));
jest.mock('@/lib/crud', () => ({ GET: jest.fn(), POST: jest.fn() }));

const group = {
  id: 'g',
  nameEn: 'Group',
  program: { nameEn: 'Program' },
};

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = jest.fn();
});
beforeEach(() => jest.clearAllMocks());

it('previews counts and confirms completion', async () => {
  (GET as jest.Mock).mockResolvedValue({
    data: {
      criteria: { minAttendancePercent: 80, minSatisfactoryPercent: 80 },
      passedCount: 1,
      notPassedCount: 0,
      blockers: [],
    },
  });
  (POST as jest.Mock).mockResolvedValue({});
  const onEnded = jest.fn();
  render(<EndGroup group={group} onClose={jest.fn()} onEnded={onEnded} />);
  expect(await screen.findByText(/Passed: 1/)).toBeInTheDocument();
  fireEvent.click(screen.getByText(messages.en.confirmEnd));
  await waitFor(() => expect(POST).toHaveBeenCalledWith('/groups/g/end'));
  expect(onEnded).toHaveBeenCalled();
});

it('blocks completion while attendance is unresolved', async () => {
  (GET as jest.Mock).mockResolvedValue({
    data: {
      criteria: { minAttendancePercent: 80, minSatisfactoryPercent: 80 },
      passedCount: 0,
      notPassedCount: 1,
      blockers: [{ reason: 'UNFINALIZED_ATTENDANCE', sessionId: 's' }],
    },
  });
  render(<EndGroup group={group} onClose={jest.fn()} onEnded={jest.fn()} />);
  expect(
    await screen.findByText(/Finalize attendance for this session/),
  ).toBeInTheDocument();
  expect(screen.getByText(messages.en.confirmEnd)).toBeDisabled();
});
