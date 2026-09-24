import { FormEvent, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { Link, useParams } from 'react-router-dom';
import Button from '@/components/Buttons/Button';
import Loading from '@/components/Loaders/Loading';
import { useRequest } from '@/hooks/useRequest';
import { PATCH, POST } from '@/lib/crud';
import { useLanguage, useTranslations } from '@/i18n';
import { errorKey } from '@/utils/errors';
import type { RecordData } from '@/types';

export default function SupportDetailPage() {
  const t = useTranslations();
  const { locale } = useLanguage();
  const { id = '' } = useParams();
  const replyInput = useRef<HTMLTextAreaElement>(null);
  const [revision, setRevision] = useState(0);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const request = useRequest<{
    ticket: RecordData;
    messages: RecordData[];
    count: number;
  }>(`/support/tickets/${id}?limit=100&page=1`, revision);
  const ticket = request.response?.data.ticket;
  const messages = [...(request.response?.data.messages || [])].reverse();

  async function reply(event: FormEvent) {
    event.preventDefault();
    if (!body.trim() || busy) return;
    setBusy(true);
    setNotice('');
    try {
      await POST(`/support/tickets/${id}/replies`, { body: body.trim() });
      setBody('');
      if (replyInput.current) replyInput.current.style.height = '';
      setRevision((value) => value + 1);
    } catch (error) {
      setNotice(errorKey(error));
    } finally {
      setBusy(false);
    }
  }

  async function toggleStatus() {
    if (!ticket || busy) return;
    setBusy(true);
    setNotice('');
    try {
      await PATCH(`/support/tickets/${id}`, { closed: !ticket.closed });
      setRevision((value) => value + 1);
    } catch (error) {
      setNotice(errorKey(error));
    } finally {
      setBusy(false);
    }
  }

  if (request.loading && !ticket) return <Loading />;
  if (request.error || !ticket)
    return (
      <p role='alert' className='error'>
        {t('error')}
      </p>
    );

  return (
    <>
      <div className='page-title'>
        <div>
          <Link to='/support' className='muted'>
            ← {t('supportTickets')}
          </Link>
          <h1>{ticket.subject}</h1>
        </div>
        <Button
          variant={ticket.closed ? 'outline' : 'destructive'}
          isLoading={busy}
          onClick={() => void toggleStatus()}
        >
          {t(ticket.closed ? 'supportReopen' : 'supportClose')}
        </Button>
      </div>
      <section className='card'>
        <p className='muted'>
          {t('supportOwner')}: {ticket.owner?.firstName}{' '}
          {ticket.owner?.lastName}
        </p>
        <h2>{t('supportConversation')}</h2>
        {!messages.length ? (
          <p className='empty'>{t('supportNoMessages')}</p>
        ) : (
          <div className='support-thread'>
            {messages.map((message) => (
              <article
                key={message.id}
                className={`support-message ${
                  message.author?.role === 'ADMIN'
                    ? 'support-message-admin'
                    : 'support-message-requester'
                }`}
              >
                <div className='support-message-meta'>
                  <strong>
                    {message.author?.firstName} {message.author?.lastName}
                  </strong>
                  <time>
                    {dayjs(message.createdAt).format('YYYY-MM-DD HH:mm')}
                  </time>
                </div>
                <p>{message.body}</p>
              </article>
            ))}
          </div>
        )}
        {notice && (
          <p role='alert' className='error'>
            {t(notice)}
          </p>
        )}
        {!ticket.closed && (
          <form
            className='support-reply'
            onSubmit={(event) => void reply(event)}
          >
            <label className='support-reply-label' htmlFor='support-reply'>
              {t('supportReply')}
            </label>
            <textarea
              ref={replyInput}
              id='support-reply'
              value={body}
              onChange={(event) => setBody(event.target.value)}
              onInput={(event) => {
                event.currentTarget.style.height = 'auto';
                event.currentTarget.style.height = `${Math.min(
                  event.currentTarget.scrollHeight,
                  120,
                )}px`;
              }}
              placeholder={t('supportReplyPlaceholder')}
              rows={1}
              maxLength={5000}
            />
            <button
              type='submit'
              className='support-send-button'
              aria-label={t('supportSend')}
              disabled={busy || !body.trim()}
            >
              {busy ? (
                <span className='spinner' aria-hidden='true' />
              ) : (
                <svg
                  width='24'
                  height='24'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  aria-hidden='true'
                  className={locale === 'ar' ? 'support-send-icon-rtl' : ''}
                >
                  <path d='M3.714 3.048a.498.498 0 0 0-.683.627l2.843 7.627a2 2 0 0 1 0 1.396l-2.842 7.627a.498.498 0 0 0 .682.627l18-8.5a.5.5 0 0 0 0-.904z' />
                  <path d='M6 12h16' />
                </svg>
              )}
            </button>
          </form>
        )}
      </section>
    </>
  );
}
