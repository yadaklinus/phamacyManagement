"use client"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SupAdminAppSidebar } from "./side-bar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";


export default function SupAdminLayout({children}:{children:React.ReactNode}){
    const {data,status} = useSession()
    const router = useRouter()
    
    useEffect(()=>{

        if(status == "authenticated"){
            if(data && data?.user?.role !== "supaAdmina"){
                router.replace("/login")  
            }
        }
        if(status == "unauthenticated"){
           
                router.replace("/login")
                
            
        }

    
    // if(data?.role != "supaAdmina" && status == "authenticated") router.replace("/login")
    // if(status == "unauthenticated") router.push("/login")
    },[status,data])
       
    // if(data?.role != "supaAdmina") return router.replace("/login")
    
    return(
        <>
        <SidebarProvider>
            <SupAdminAppSidebar/>
            <SidebarInset>
                    {children}
            </SidebarInset>
        </SidebarProvider>
        </>
    )
}