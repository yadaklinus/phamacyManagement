// "use client";
// import { useEffect, useRef } from "react";
// import QRCode from "qrcode";

// export default function QrCodeBox({ qrContent, settings }:{qrContent:any, settings:any}) {
//   const canvasRef = useRef(null);

//   useEffect(() => {
//     if (qrContent && canvasRef.current) {
//       QRCode.toCanvas(canvasRef.current, qrContent, {
//         width: 48, // 👈 specific width
//         margin: 0,
//         color: {
//           dark: settings.accentColor || "#000000",
//           light: "#f0f0f0"
//         }
//       });
//     }
//   }, [qrContent, settings]);

//   if (!qrContent) return null;

//   return (
//     <div style={{ textAlign: "center", margin: "16px 0" }}>
//       <div
//         style={{
//           display: "inline-block",
//           border: `2px solid ${settings.primaryColor}`,
//           padding: "8px"
//         }}
//       >
//         <canvas ref={canvasRef} />
//       </div>
//       <div
//         style={{
//           fontSize: "8px",
//           marginTop: "4px",
//           color: settings.accentColor
//         }}
//       >
//         {qrContent.length > 30
//           ? qrContent.substring(0, 30) + "..."
//           : qrContent}
//       </div>
//     </div>
//   );
// }

const a = 1
