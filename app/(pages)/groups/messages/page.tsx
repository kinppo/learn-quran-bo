import { FormEvent, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { Link, useParams } from 'react-router-dom';
import Loading from '@/components/Loaders/Loading';
import { useRequest } from '@/hooks/useRequest';
import { POST } from '@/lib/crud';
import { useLanguage, useTranslations } from '@/i18n';
import { errorKey } from '@/utils/errors';
import type { RecordData } from '@/types';

function roleKey(role?: string) {
  switch (role) {
    case 'STUDENT':
      return 'student' as const;
    case 'TEACHER':
      return 'teacher' as const;
    case 'AUDITOR':
      return 'auditor' as const;
    default:
      return null;
  }
}

export default function GroupMessagesPage() {
  const t = useTranslations();
  const { locale } = useLanguage();
  const { id = '' } = useParams();
  const input = useRef<HTMLTextAreaElement>(null);
  const [revision, setRevision] = useState(0);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const request = useRequest<RecordData[]>(
    `/groups/${id}/messages?limit=100&page=1`,
    revision,
  );
  const messages = [...(request.response?.data || [])].reverse();

  async function send(event: FormEvent) {
    event.preventDefault();
    if (!body.trim() || busy) return;
    setBusy(true);
    setNotice('');
    try {
      await POST(`/groups/${id}/messages`, { body: body.trim() });
      setBody('');
      if (input.current) input.current.style.height = '';
      setRevision((value) => value + 1);
    } catch (error) {
      setNotice(errorKey(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className='page-title'>
        <div>
          <Link to='/groups' className='muted'>
            ← {t('groups')}
          </Link>
          <h1>{t('groupConversation')}</h1>
        </div>
      </div>
      <section className='card'>
        {request.loading ? (
          <Loading />
        ) : request.error ? (
          <p role='alert' className='error'>
            {t('error')}
          </p>
        ) : !messages.length ? (
          <p className='empty'>{t('noGroupMessages')}</p>
        ) : (
          <div className='support-thread'>
            {messages.map((message) => {
              const key = roleKey(message.author?.role);
              return (
                <article
                  key={message.id}
                  className='support-message support-message-requester'
                >
                  <div className='support-message-meta'>
                    <strong>
                      {message.author?.firstName} {message.author?.lastName}
                      {key ? ` · ${t(key)}` : ''}
                    </strong>
                    <time>
                      {dayjs(message.createdAt).format('YYYY-MM-DD HH:mm')}
                    </time>
                  </div>
                  <p>{message.body}</p>
                </article>
              );
            })}
          </div>
        )}
        {notice && (
          <p role='alert' className='error'>
            {t(notice)}
          </p>
        )}
        <form className='support-reply' onSubmit={(event) => void send(event)}>
          <label className='support-reply-label' htmlFor='group-message-reply'>
            {t('supportReply')}
          </label>
          <textarea
            ref={input}
            id='group-message-reply'
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder={t('supportReplyPlaceholder')}
            rows={1}
            maxLength={4000}
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
                aria-hidden='true'
                className={locale === 'ar' ? 'support-send-icon-rtl' : ''}
              >
                <path d='M3.714 3.048a.498.498 0 0 0-.683.627l2.843 7.627a2 2 0 0 1 0 1.396l-2.842 7.627a.498.498 0 0 0 .682.627l18-8.5a.5.5 0 0 0 0-.904z' />
                <path d='M6 12h16' />
              </svg>
            )}
          </button>
        </form>
      </section>
    </>
  );
}
