
"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function LoginForm() {

  const {data,status} = useSession()
  const router = useRouter()

  
 
  
  useEffect(()=>{

    // if(status === "authenticated"){
    //   const role = data?.user?.role
    //   if(data && role == "supaAdmina"){
    //     router.push("/sup-admin/dashboard")
    //   }
    // }
    if (status === "authenticated") {
      const role = data?.user?.role

      if (role === "superAdmina") {
        router.push("/sup-admin/dashboard")
      }
    }
    
  },[status,data,router])

  const [userName,setUserName] = useState("")
  const [password,setPassword] = useState("")

  const [loading,setLoading] = useState(false)



  const handleFormSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    const req = await signIn("credentials", {
      email:userName,
      password:password,
      redirect: false,
      type:"admin"
    });
    
    if(req?.ok){
      toast.success("Welcome")
      router.replace("/sup-admin/dashboard")
    }else{
      toast.error("Wrong Credentials")
    }

    setLoading(false)
   
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
    <div className={"flex flex-col gap-6"}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFormSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="email">UserName</Label>
                <Input
                  id="email"
                  type="text"
                  placeholder="m@example.com"
                  value={userName}
                  onChange={(e)=>setUserName(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-3">
              <Label htmlFor="email">Password</Label>
                <Input id="password" type="password" value={password}
                  onChange={(e)=>setPassword(e.target.value)} required />
              </div>
              <div className="flex flex-col gap-3">
                <Button disabled={loading} type="submit" className="w-full">
                  Login
                </Button>
               
              </div>
            </div>
            
          </form>
        </CardContent>
      </Card>
    </div>
    </div>
    </div>
  )
}

