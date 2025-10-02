import { usePathname } from "next/navigation"

export function getWareHouseId(){
    const path = usePathname()
    const wareHousId = path.split("/")[2]
    return wareHousId
}