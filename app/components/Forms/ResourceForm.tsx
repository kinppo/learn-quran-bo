import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  resources,
  formValues,
  payload,
  type ResourceKey,
} from '@/constants/resources';
import { useLanguage, useTranslations } from '@/i18n';
import { allRecords, GET, POST, PATCH, POST_FILE } from '@/lib/crud';
import type { RecordData, Option } from '@/types';
import { localized, recordId } from '@/utils';
import { errorKey } from '@/utils/errors';
import Input from '@/components/Inputs/Input';
import Button from '@/components/Buttons/Button';
import Loading from '@/components/Loaders/Loading';
export default function ResourceForm({ resource }: { resource: ResourceKey }) {
  const { id } = useParams();
  const editing = !!id;
  const config = resources[resource];
  const t = useTranslations();
  const { locale } = useLanguage();
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [lookups, setLookups] = useState<Record<string, RecordData[]>>({});
  const [photo, setPhoto] = useState<File>();
  const [photoUrl, setPhotoUrl] = useState('');
  const { control, handleSubmit, reset, formState } = useForm<RecordData>({
    resolver: zodResolver(config.schema(editing)),
    defaultValues: config.defaults,
  });
  const slots = useFieldArray({
    control,
    name: 'planning',
    keyName: 'formKey',
  });
  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError('');
    const sources = [
      ...new Set(config.fields.flatMap((f) => (f.source ? [f.source] : []))),
    ];
    Promise.all([
      Promise.all(
        sources.map(
          async (source) => [source, await allRecords('/' + source)] as const,
        ),
      ),
      id
        ? GET<RecordData>(config.route + '/' + id)
        : Promise.resolve(undefined),
    ])
      .then(async ([lists, result]) => {
        if (!active) return;
        setLookups(Object.fromEntries(lists));
        if (result) {
          reset(formValues(resource, result.data));
          if (result.data.user?.avatarId) {
            try {
              const image = await GET(
                '/media/' + result.data.user.avatarId + '/download',
              );
              const blob = await (await fetch(image.data.url)).blob();
              if (active) setPhotoUrl(URL.createObjectURL(blob));
            } catch {
              /* A missing image does not block editing. */
            }
          }
        } else reset(config.defaults);
      })
      .catch((e) => {
        if (active) setLoadError(errorKey(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [config, id, resource, reset, revision]);
  useEffect(
    () => () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    },
    [photoUrl],
  );
  useEffect(() => {
    const guard = (e: BeforeUnloadEvent) => {
      if (formState.isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, [formState.isDirty]);
  function options(field: (typeof config.fields)[number]): Option[] {
    return field.values
      ? field.values.map((value) => ({
          value,
          label: ['1', '2', '4', '8'].includes(value) ? `1/${value}` : t(value),
        }))
      : (lookups[field.source!] || []).map((row) => ({
          value: recordId(row),
          label: row.user
            ? row.user.firstName + ' ' + row.user.lastName
            : localized(row, locale),
        }));
  }
  async function submit(values: RecordData) {
    setError('');
    let savedId = id;
    try {
      const body = payload(resource, values, editing);
      const response = editing
        ? await PATCH(`${config.writeRoute || config.route}/${id}`, body)
        : await POST(config.route, body);
      savedId = id || response.data.id;
      if (photo) {
        const form = new FormData();
        form.append('file', photo);
        const uploaded = await POST_FILE(
          '/media?ownerId=' + (id || response.data.id),
          form,
        );
        await PATCH(`${config.route}/${id || response.data.id}`, {
          avatarId: uploaded.data.id,
        });
      }
      nav(resource === 'students' && id ? `/students/${id}` : '/' + resource);
    } catch (e) {
      if (!id && savedId)
        nav(`/edit-${config.singular}/${savedId}`, { replace: true });
      setError(errorKey(e));
    }
  }
  if (loading) return <Loading />;
  if (loadError)
    return (
      <div role='alert'>
        <p className='error'>{t(loadError)}</p>
        <Button onClick={() => setRevision((n) => n + 1)}>{t('retry')}</Button>
      </div>
    );
  return (
    <>
      <div className='page-title'>
        <h1>
          {t(editing ? 'edit' : 'add')} {t(config.singular)}
        </h1>
        <Link
          to={
            resource === 'students' && id ? `/students/${id}` : '/' + resource
          }
        >
          {t('back')}
        </Link>
      </div>
      <div>
        <form className='card' onSubmit={handleSubmit(submit)} noValidate>
          {resource === 'teachers' && (
            <div className='file-field'>
              {photoUrl && (
                <img
                  className='profile-photo'
                  src={photoUrl}
                  alt={t('avatar')}
                />
              )}
              <label htmlFor='avatar'>{t('avatar')}</label>
              <input
                id='avatar'
                type='file'
                accept='image/png,image/jpeg,image/webp'
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (
                    f &&
                    (!['image/png', 'image/jpeg', 'image/webp'].includes(
                      f.type,
                    ) ||
                      f.size > 50 * 1024 * 1024)
                  ) {
                    setError('validationError');
                    return;
                  }
                  setPhoto(f);
                  if (f) setPhotoUrl(URL.createObjectURL(f));
                }}
              />
              <small className='muted'>{t('photoHelp')}</small>
            </div>
          )}
          <div className='form-grid'>
            {config.fields
              .filter(
                (f) =>
                  !(editing && f.createOnly) &&
                  !(f.name === 'status' && !editing),
              )
              .map((f) => (
                <Input
                  key={f.name}
                  control={control}
                  {...f}
                  options={f.source || f.values ? options(f) : undefined}
                />
              ))}
          </div>
          {resource === 'groups' && (
            <section className='schedule'>
              <h2>{t('planning')}</h2>
              {slots.fields.map((slot, index) => (
                <div key={slot.formKey} className='schedule-row'>
                  <Input
                    control={control}
                    name={`planning.${index}.day`}
                    label={t('day')}
                    options={[
                      'monday',
                      'tuesday',
                      'wednesday',
                      'thursday',
                      'friday',
                      'saturday',
                      'sunday',
                    ].map((day, i) => ({
                      value: String(i + 1),
                      label: t(day),
                    }))}
                  />
                  <Input
                    control={control}
                    name={`planning.${index}.kind`}
                    label={t('kind')}
                    options={['HIFD', 'TAJWID'].map((v) => ({
                      value: v,
                      label: t(v),
                    }))}
                  />
                  <Input
                    control={control}
                    name={`planning.${index}.startTime`}
                    label={t('startTime')}
                    type='time'
                  />
                  <Input
                    control={control}
                    name={`planning.${index}.endTime`}
                    label={t('endTime')}
                    type='time'
                  />
                  <Button
                    variant='outline'
                    disabled={slots.fields.length === 1}
                    onClick={() => slots.remove(index)}
                  >
                    {t('remove')}
                  </Button>
                </div>
              ))}
              {formState.errors.planning && (
                <p role='alert' className='error'>
                  {t('invalid')}
                </p>
              )}
              <Button
                variant='outline'
                disabled={slots.fields.length >= 28}
                onClick={() =>
                  slots.append({
                    day: 1,
                    startTime: '08:00',
                    endTime: '09:00',
                    kind: 'HIFD',
                    absenceTracking: true,
                  })
                }
              >
                {t('addSlot')}
              </Button>
            </section>
          )}
          {error && (
            <p role='alert' className='error'>
              {t(error)}
            </p>
          )}
          {Object.keys(formState.errors).length > 0 && (
            <p role='alert' className='error'>
              {t('invalid')}
            </p>
          )}
          <div className='form-actions'>
            <Button
              variant='outline'
              disabled={formState.isSubmitting}
              onClick={() => {
                if (!formState.isDirty || window.confirm(t('unsaved')))
                  nav(
                    resource === 'students' && id
                      ? `/students/${id}`
                      : '/' + resource,
                  );
              }}
            >
              {t('cancel')}
            </Button>
            <Button type='submit' isLoading={formState.isSubmitting}>
              {t('save')}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
