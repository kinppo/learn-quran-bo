import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import GroupDetail from '../page';
import { messages } from '@/i18n/messages';
import { GET_FILE } from '@/lib/crud';
let mockEnded = false;
let mockError = false;
let mockResultCount = 1;
let mockResults: any[];
let mockSummary = { passingCount: 1, readyCount: 1 };
jest.mock('@/lib/crud', () => ({ GET_FILE: jest.fn() }));
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
          response: mockError
            ? undefined
            : {
                data: mockResults,
                count: mockResultCount,
                certificateSummary: mockSummary,
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
  mockSummary = { passingCount: 1, readyCount: 1 };
  mockResults = [
    {
      id: 'r',
      studentName: 'Sara',
      passed: true,
      presentCount: 4,
      applicableCount: 5,
      satisfactoryCount: 4,
      certificate: { id: 'c', status: 'READY' },
    },
    {
      id: 'r2',
      studentName: 'Layla',
      passed: false,
      presentCount: 2,
      applicableCount: 5,
      satisfactoryCount: 2,
    },
  ];
  (GET_FILE as jest.Mock).mockResolvedValue(new Blob(['data']));
});
it('shows individual downloads only for passing students with ready certificates', () => {
  mockEnded = true;
  render(<GroupDetail />);
  expect(screen.getAllByText(messages.en.downloadCertificate)).toHaveLength(1);
  expect(screen.getByText('Sara')).toBeInTheDocument();
  expect(screen.getByText('Layla')).toBeInTheDocument();
});
it('disables the group download and marks passing certificates as preparing', () => {
  mockEnded = true;
  mockResults[0].certificate.status = 'PENDING';
  mockSummary.readyCount = 0;
  render(<GroupDetail />);
  expect(
    screen.getByText(messages.en.certificateDownloadPreparing),
  ).toBeDisabled();
  expect(
    screen.getByText(messages.en.certificatesPreparing),
  ).toBeInTheDocument();
  expect(screen.getByText(messages.en.downloadAllCertificates)).toBeDisabled();
  expect(
    screen.queryByText(messages.en.downloadCertificate),
  ).not.toBeInTheDocument();
});
it('disables the group download with an empty passing roster', () => {
  mockEnded = true;
  mockResults = mockResults.map((row) => ({ ...row, passed: false }));
  mockSummary = { passingCount: 0, readyCount: 0 };
  render(<GroupDetail />);
  expect(
    screen.getByText(messages.en.noPassingCertificates),
  ).toBeInTheDocument();
  expect(screen.getByText(messages.en.downloadAllCertificates)).toBeDisabled();
});
it('downloads ready certificates and reports errors that can be retried', async () => {
  mockEnded = true;
  const createUrl = jest.fn().mockReturnValue('blob:test');
  const revokeUrl = jest.fn();
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: createUrl,
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    value: revokeUrl,
  });
  const click = jest
    .spyOn(HTMLAnchorElement.prototype, 'click')
    .mockImplementation(() => {});
  (GET_FILE as jest.Mock)
    .mockRejectedValueOnce(new Error('network'))
    .mockResolvedValueOnce(new Blob(['data']));
  render(<GroupDetail />);
  await fireEvent.click(screen.getByText(messages.en.downloadAllCertificates));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    messages.en.downloadFailed,
  );
  await fireEvent.click(screen.getByText(messages.en.downloadAllCertificates));
  await waitFor(() => expect(click).toHaveBeenCalledTimes(1));
  expect(createUrl).toHaveBeenCalledTimes(1);
  await waitFor(() => expect(revokeUrl).toHaveBeenCalledWith('blob:test'), {
    timeout: 2000,
  });
  click.mockRestore();
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
