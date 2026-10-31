import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/ui/States';
import { usePageTitle } from '@/app/usePageTitle';

export default function NotFoundPage() {
  const { t } = useTranslation();
  usePageTitle(t('notFound.title'));
  return (
    <div className="page">
      <section className="block" style={{ maxWidth: 680, marginInline: 'auto', width: '100%', paddingTop: 48 }}>
        <EmptyState
          icon="compass"
          title={t('notFound.title')}
          text={t('notFound.text')}
          action={<Link className="btn solid sm" to="/">{t('interim.home')}</Link>}
        />
      </section>
    </div>
  );
}
