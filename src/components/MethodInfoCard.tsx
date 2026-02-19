import { CheckCircle2, XCircle, Building2, Shield, UserCircle } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';

export interface MethodInfoData {
  whenUse: string[];
  whenAvoid: string[];
  idealCompany: string;
  riskLevel: string;
  investorProfile: string;
}

function getInfo(method: string, t: (k: string) => string): MethodInfoData | null {
  const key = `methodinfo.${method}`;
  const whenUse = t(`${key}.whenUse`).split('|');
  const whenAvoid = t(`${key}.whenAvoid`).split('|');
  const idealCompany = t(`${key}.idealCompany`);
  const riskLevel = t(`${key}.riskLevel`);
  const investorProfile = t(`${key}.investorProfile`);
  if (!idealCompany || !riskLevel || !investorProfile) return null;
  return { whenUse, whenAvoid, idealCompany, riskLevel, investorProfile };
}

export function MethodInfoCard({ method }: { method: string }) {
  const { t } = useI18n();
  const info = getInfo(method, t);
  if (!info) return null;

  return (
    <div className="space-y-3 pt-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {t('methodinfo.title')}
      </p>

      <div className="grid grid-cols-1 gap-2 text-xs">
        <div className="flex gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
          <div>
            <span className="font-medium text-foreground/80">{t('methodinfo.label.use')}</span>{' '}
            <span className="text-muted-foreground">{info.whenUse.join(', ')}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <XCircle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
          <div>
            <span className="font-medium text-foreground/80">{t('methodinfo.label.avoid')}</span>{' '}
            <span className="text-muted-foreground">{info.whenAvoid.join(', ')}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Building2 className="h-3.5 w-3.5 text-accent mt-0.5 shrink-0" />
          <div>
            <span className="font-medium text-foreground/80">{t('methodinfo.label.ideal')}</span>{' '}
            <span className="text-muted-foreground">{info.idealCompany}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Shield className="h-3.5 w-3.5 text-warning mt-0.5 shrink-0" />
          <div>
            <span className="font-medium text-foreground/80">{t('methodinfo.label.risk')}</span>{' '}
            <span className="text-muted-foreground">{info.riskLevel}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <UserCircle className="h-3.5 w-3.5 text-chart-blue mt-0.5 shrink-0" />
          <div>
            <span className="font-medium text-foreground/80">{t('methodinfo.label.profile')}</span>{' '}
            <span className="text-muted-foreground">{info.investorProfile}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
