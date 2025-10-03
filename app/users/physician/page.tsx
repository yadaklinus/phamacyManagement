"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function PhysicianPage(){
    const router = useRouter()
    
    useEffect(() => {
        router.replace("/users/physician/dashboard")
    }, [router])
    
    return null
}