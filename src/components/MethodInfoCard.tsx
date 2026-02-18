import { CheckCircle2, XCircle, Building2, Shield, UserCircle } from 'lucide-react';

export interface MethodInfoData {
  whenUse: string[];
  whenAvoid: string[];
  idealCompany: string;
  riskLevel: string;
  investorProfile: string;
}

const methodInfoMap: Record<string, MethodInfoData> = {
  graham: {
    whenUse: ['Empresas sólidas e lucrativas', 'Empresas maduras', 'Bancos', 'Indústrias consolidadas'],
    whenAvoid: ['Empresas de crescimento acelerado', 'Startups', 'Empresas sem lucro'],
    idealCompany: 'Empresas maduras com lucro e patrimônio consistentes',
    riskLevel: 'Baixo a moderado',
    investorProfile: 'Conservador e fundamentalista',
  },
  barsi: {
    whenUse: ['Pagadoras de dividendos consistentes', 'Setor elétrico', 'Bancos e seguradoras', 'Utilities'],
    whenAvoid: ['Empresas que não pagam dividendos', 'Empresas de crescimento'],
    idealCompany: 'Empresas com histórico sólido de dividendos',
    riskLevel: 'Baixo',
    investorProfile: 'Focado em renda passiva',
  },
  dcf: {
    whenUse: ['Empresas de crescimento', 'Avaliações profundas', 'Fluxo previsível', 'Tecnologia e consumo'],
    whenAvoid: ['Empresas muito voláteis', 'Sem histórico financeiro confiável'],
    idealCompany: 'Empresas com fluxo de caixa previsível e em crescimento',
    riskLevel: 'Moderado',
    investorProfile: 'Avançado ou analista',
  },
  lynch: {
    whenUse: ['Crescimento consistente de lucros', 'Small caps', 'Empresas em expansão', 'Varejo e tecnologia'],
    whenAvoid: ['Empresas estagnadas', 'Altamente endividadas', 'Setores muito regulados'],
    idealCompany: 'Empresas em expansão com crescimento acima da média',
    riskLevel: 'Moderado a alto',
    investorProfile: 'Busca crescimento acima da média',
  },
};

export function MethodInfoCard({ method }: { method: string }) {
  const info = methodInfoMap[method];
  if (!info) return null;

  return (
    <div className="space-y-3 pt-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Quando usar este método
      </p>

      <div className="grid grid-cols-1 gap-2 text-xs">
        <div className="flex gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
          <div>
            <span className="font-medium text-foreground/80">Usar:</span>{' '}
            <span className="text-muted-foreground">{info.whenUse.join(', ')}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <XCircle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
          <div>
            <span className="font-medium text-foreground/80">Evitar:</span>{' '}
            <span className="text-muted-foreground">{info.whenAvoid.join(', ')}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Building2 className="h-3.5 w-3.5 text-accent mt-0.5 shrink-0" />
          <div>
            <span className="font-medium text-foreground/80">Ideal:</span>{' '}
            <span className="text-muted-foreground">{info.idealCompany}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Shield className="h-3.5 w-3.5 text-warning mt-0.5 shrink-0" />
          <div>
            <span className="font-medium text-foreground/80">Risco:</span>{' '}
            <span className="text-muted-foreground">{info.riskLevel}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <UserCircle className="h-3.5 w-3.5 text-chart-blue mt-0.5 shrink-0" />
          <div>
            <span className="font-medium text-foreground/80">Perfil:</span>{' '}
            <span className="text-muted-foreground">{info.investorProfile}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
