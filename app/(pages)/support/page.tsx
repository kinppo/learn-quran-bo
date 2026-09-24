import dayjs from 'dayjs';
import { Link } from 'react-router-dom';
import Loading from '@/components/Loaders/Loading';
import { useRequest } from '@/hooks/useRequest';
import { useTranslations } from '@/i18n';
import type { RecordData } from '@/types';

export default function SupportPage() {
  const t = useTranslations();
  const tickets = useRequest<RecordData[]>('/support/tickets?limit=100&page=1');
  const rows = tickets.response?.data || [];

  return (
    <>
      <div className='page-title'>
        <h1>{t('supportTickets')}</h1>
      </div>
      <section className='card'>
        <p className='muted'>{t('supportHelp')}</p>
        {tickets.loading ? (
          <Loading />
        ) : tickets.error ? (
          <p role='alert' className='error'>
            {t('error')}
          </p>
        ) : !rows.length ? (
          <p className='empty'>{t('supportNoTickets')}</p>
        ) : (
          <div className='table-wrap'>
            <table>
              <thead>
                <tr>
                  <th>{t('supportSubject')}</th>
                  <th>{t('supportOwner')}</th>
                  <th>{t('status')}</th>
                  <th>{t('createdAt')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((ticket) => (
                  <tr key={ticket.id}>
                    <td>
                      <Link
                        to={`/support/${ticket.id}`}
                        className='support-link'
                      >
                        {ticket.subject}
                      </Link>
                    </td>
                    <td>
                      {ticket.owner?.firstName} {ticket.owner?.lastName}
                    </td>
                    <td>
                      <span
                        className={`badge ${ticket.closed ? 'INACTIVE' : 'ACTIVE'}`}
                      >
                        {t(ticket.closed ? 'supportClosed' : 'supportOpen')}
                      </span>
                    </td>
                    <td>
                      {dayjs(ticket.updatedAt).format('YYYY-MM-DD HH:mm')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
