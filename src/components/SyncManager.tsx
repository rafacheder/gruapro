 import { useEffect } from "react";
 import { useOnlineStatus } from "@/hooks/use-online-status";
 import { syncPendingLeituras } from "@/services/sync-service";
 import { db } from "@/lib/db";
 
 export default function SyncManager() {
   const isOnline = useOnlineStatus();
 
   useEffect(() => {
     const runSync = async () => {
       if (isOnline) {
         const pending = await db.pendingLeituras.count();
         if (pending > 0) {
           console.log("Online status detected. Running auto-sync...");
           await syncPendingLeituras();
         }
       }
     };
 
     runSync();
   }, [isOnline]);
 
   return null;
 }