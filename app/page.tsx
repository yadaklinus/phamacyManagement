"use client"
import { Link } from "@heroui/link";
import { Snippet } from "@heroui/snippet";
import { Code } from "@heroui/code";
import { button as buttonStyles } from "@heroui/theme";

import { siteConfig } from "@/config/site";
import { title, subtitle } from "@/components/primitives";
import { GithubIcon } from "@/components/icons";

import { useEffect, useRef } from "react";
import fetchData from "@/hooks/fetch-data";
import { dataSyncService } from "@/lib/sync-service";
import axios from "axios";
import { useOnlineStatus } from "@/hooks/check-online";


export default function Home() {

  const { online } = useOnlineStatus();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function syncNow() {
      try {
        const res = await axios.post("/api/syncNew", { online });
       
        console.log("Sync result:", res.data);
      } catch (error) {
        console.error("Sync error:", error);
      }
    }

    // Start interval only if online
    // if (online) {
    //   syncNow(); // Run once immediately
    //   intervalRef.current = setInterval(syncNow, 1000 * 30); // every 5 minutes
    // }

    // Cleanup when offline or unmounted
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [online]);

 

 
  
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="flex gap-3">
        <Link
          isExternal
          className={buttonStyles({
            color: "primary",
            radius: "full",
            variant: "shadow",
          })}
          href={'/user/login'}
        >
          Login
        </Link>
       
      </div>

      
    </section>
  );
}
