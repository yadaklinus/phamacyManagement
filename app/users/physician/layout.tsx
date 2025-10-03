"use client"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { PhysicianAppSidebar } from "./side-bar";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PhysicianLayout({children}:{children:React.ReactNode}){
     const {data,status} = useSession()
        const router = useRouter()
        
        useEffect(()=>{
    
           async function main(){
            if(status == "authenticated"){
                if(data && data?.user?.role !== "physician"){
                    await signOut()
                    router.replace("/user/login")
                    console.log('Unauthorized access - not a physician')
                }
            }
            if(status == "unauthenticated"){
                    router.replace("/user/login")
            }
           }
           main()
        },[status,data])
    return(
        <>
        <SidebarProvider>
            <PhysicianAppSidebar/>
            <SidebarInset>
                    {children}
            </SidebarInset>
        </SidebarProvider>
        </>
    )
}