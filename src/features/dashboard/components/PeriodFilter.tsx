import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { PeriodType } from "@/utils/date-ranges";
import { DateRange } from "react-day-picker";

interface PeriodFilterProps {
  periodType: PeriodType;
  setPeriodType: (v: PeriodType) => void;
  customRange: DateRange | undefined;
  setCustomRange: (v: DateRange | undefined) => void;
}

export function PeriodFilter({
  periodType,
  setPeriodType,
  customRange,
  setCustomRange
}: PeriodFilterProps) {
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <Tabs 
        value={periodType} 
        onValueChange={(v) => setPeriodType(v as PeriodType)} 
        className="w-full sm:w-auto"
      >
        <TabsList className="grid grid-cols-4 w-full sm:w-auto">
          <TabsTrigger value="mes" className="text-xs">Mês</TabsTrigger>
          <TabsTrigger value="trimestre" className="text-xs">Trimestre</TabsTrigger>
          <TabsTrigger value="ano" className="text-xs">Ano</TabsTrigger>
          <TabsTrigger value="personalizado" className="text-xs">Personalizado</TabsTrigger>
        </TabsList>
      </Tabs>

      {periodType === "personalizado" && (
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full sm:w-[260px] justify-start text-left font-normal",
                  !customRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {customRange?.from ? (
                  customRange.to ? (
                    <>
                      {format(customRange.from, "dd/MM/yy")} -{" "}
                      {format(customRange.to, "dd/MM/yy")}
                    </>
                  ) : (
                    format(customRange.from, "dd/MM/yy")
                  )
                ) : (
                  <span>Selecione um período</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={customRange?.from}
                selected={customRange}
                onSelect={setCustomRange}
                numberOfMonths={2}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
}
