import { useState, useEffect } from "react";

export function useConnectionCheck(url = "https://example.com", interval = 10000) {
//   const [isOnline, setIsOnline] = useState(true);

//   useEffect(() => {
//     const checkConnection = async () => {
//       try {
//         const response = await fetch(url, { method: "HEAD", cache: "no-store" });
//         setIsOnline(response.ok);
//       } catch (err) {
//         setIsOnline(false);
//       }
//     };

//     checkConnection(); // check immediately
//     const id = setInterval(checkConnection, interval);

//     return () => clearInterval(id);
//   }, [url, interval]);

//   return isOnline;
const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
