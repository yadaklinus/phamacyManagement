"use client"
import axios from "axios";
import { useEffect, useState } from "react";

const fetchWareHouseData = (url:any,response:any) => {
    const [loading,setLoading] = useState<any>(false)
    const [error,setError] = useState<any>(false)
    const [data,setData] = useState<any>(null)
    
    const fetchData = async () => {
        if(!url) return
        setLoading(true)
        try {   
            const rep = await axios.post(url,response)
            setData(rep.data)
            setError(false)
        } catch (error) {
            setError(true)    
        }finally{
            setLoading(false)
        }
    }
    
   useEffect(()=>{
    fetchData()
   },[url])
   
    const refetch = () => {
        fetchData()
    }
   
    return {data,loading,error,refetch}
}

export default fetchWareHouseData