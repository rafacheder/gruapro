 import { 
   startOfMonth, 
   endOfMonth, 
   startOfQuarter, 
   endOfQuarter, 
   startOfYear, 
    endOfYear,
    startOfDay,
    endOfDay
  } from "date-fns";
 
 export type PeriodType = "mes" | "trimestre" | "ano" | "personalizado";
 
   export function getPeriodDates(period: PeriodType, customRange?: { from: Date; to: Date }): { start: Date; end: Date } {
   const now = new Date();
   
   switch (period) {
     case "mes":
       return {
         start: startOfMonth(now),
         end: endOfMonth(now),
       };
     case "trimestre":
       return {
         start: startOfQuarter(now),
         end: endOfQuarter(now),
       };
     case "ano":
       return {
         start: startOfYear(now),
         end: endOfYear(now),
       };
    case "personalizado": {
      if (customRange?.from) {
        return { 
          start: startOfDay(customRange.from), 
          end: endOfDay(customRange.to || customRange.from) 
        };
      }
      return { start: startOfMonth(now), end: endOfMonth(now) };
    }
     default:
       return {
         start: startOfMonth(now),
         end: endOfMonth(now),
       };
   }
 }