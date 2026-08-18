import { HistoryPanel } from '@/components/HistoryPanel';
import { AppHeader } from '@/components/layout/AppHeader';
import { useI18n } from '@/i18n/i18n';

const History = () => {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-background gradient-mesh">
      <AppHeader />
      <main className="container max-w-6xl mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-lg font-semibold mb-4">{t('history.title')}</h2>
          <HistoryPanel />
        </div>
      </main>
    </div>
  );
};

export default History;
