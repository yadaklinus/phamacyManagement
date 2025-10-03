"use client"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { WarehouseAppSidebar } from "./side-bar";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SupAdminLayout({children}:{children:React.ReactNode}){
     const {data,status} = useSession()
        const router = useRouter()
        
        useEffect(()=>{
    
           async function main(){
            if(status == "authenticated"){
                if(data && data?.user?.role === "supaAdmina"){
                    await signOut()
                    router.replace("/login")
                    console.log('na me log out')
                    
                }
                if(data && data?.user?.role !== "purchase"){
                    await signOut()
                    router.replace("/user/login")
                    console.log('na me log out')
                }
            }
            if(status == "unauthenticated"){
               
                    router.replace("/login")
                    
                
            }
           }
           main()
    
        
        // if(data?.role != "supaAdmina" && status == "authenticated") router.replace("/login")
        // if(status == "unauthenticated") router.push("/login")
        },[status,data])
    return(
        <>
        <SidebarProvider>
            <WarehouseAppSidebar/>
            <SidebarInset>
                    {children}
            </SidebarInset>
        </SidebarProvider>
        </>
    )
}