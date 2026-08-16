import { Link, useLocation } from "react-router-dom";
import { BarChart3, Calculator, History, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useI18n } from "@/i18n/i18n";
import type { Lang } from "@/i18n/translations";

interface AppHeaderProps {
  historyActive?: boolean;
  onHistoryClick?: () => void;
  onCalculateClick?: () => void;
}

export function AppHeader({ historyActive, onHistoryClick, onCalculateClick }: AppHeaderProps) {
  const { t, lang, setLang } = useI18n();
  const location = useLocation();
  const onScreener = location.pathname === "/";
  const onValuation = location.pathname.startsWith("/valuation") && !historyActive;

  const languageSelect = (
    <Select value={lang} onValueChange={(value) => setLang(value as Lang)}>
      <SelectTrigger className="h-8 text-xs">
        <SelectValue placeholder="Language" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="pt">Português</SelectItem>
        <SelectItem value="en">English</SelectItem>
        <SelectItem value="es">Español</SelectItem>
      </SelectContent>
    </Select>
  );

  const navButtons = (fullWidth = false) => (
    <>
      <Button
        asChild
        variant={onScreener ? "secondary" : "ghost"}
        size="sm"
        className={fullWidth ? "w-full justify-center gap-1.5 text-xs" : "gap-1.5 text-xs"}
      >
        <Link to="/">
          <BarChart3 className="h-3.5 w-3.5" />
          {t("common.screenerTab")}
        </Link>
      </Button>
      <Button
        asChild
        variant={onValuation ? "secondary" : "ghost"}
        size="sm"
        className={fullWidth ? "w-full justify-center gap-1.5 text-xs" : "gap-1.5 text-xs"}
      >
        <Link to="/valuation" onClick={onCalculateClick}>
          <Calculator className="h-3.5 w-3.5" />
          {t("common.calculateTab")}
        </Link>
      </Button>
      {onHistoryClick && (
        <Button
          variant={historyActive ? "secondary" : "ghost"}
          size="sm"
          onClick={onHistoryClick}
          className={fullWidth ? "w-full justify-center gap-1.5 text-xs" : "gap-1.5 text-xs"}
        >
          <History className="h-3.5 w-3.5" />
          {t("common.historyTab")}
        </Button>
      )}
    </>
  );

  return (
    <header className="border-b border-border/30 bg-card/30 backdrop-blur-xl sticky top-0 z-50">
      <div className="container max-w-7xl mx-auto px-4 py-4 flex flex-row gap-3 sm:items-center justify-between">
        <Link to="/" className="flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <BarChart3 className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="font-semibold text-base tracking-tight">ValorAção</h1>
            <p className="text-xs text-muted-foreground truncate">{t("common.subtitle")}</p>
          </div>
        </Link>
        <div className="hidden sm:flex flex-wrap gap-2 items-center w-full sm:w-auto justify-end">
          {navButtons()}
          <div className="w-full sm:w-36">{languageSelect}</div>
        </div>
        <div className="flex sm:hidden items-center justify-end">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="p-4 space-y-3">
                {navButtons(true)}
                <div className="w-full">{languageSelect}</div>
              </div>
              <SheetFooter />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
