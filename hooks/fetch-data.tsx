"use client"
import axios from "axios";
import { useEffect, useState } from "react";

const fetchData = (url:any) => {
    const [loading,setLoading] = useState<any>(false)
    const [error,setError] = useState<any>(false)
    const [data,setData] = useState<any>(null)
    
   useEffect(()=>{
    if(!url) return

    async function fetch() {
        setLoading(true)
        try {   
            const rep = await axios.get(url)
            setData(rep.data)
        } catch (error) {
            setError(true)    
        }finally{
            setLoading(false)
        }
    }

    fetch()

   },[url])
   
    return {data,loading,error}
}

export default fetchData