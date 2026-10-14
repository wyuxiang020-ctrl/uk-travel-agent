import TravelIntakePage from "@/components/travel-intake";
export default async function PlanPage({searchParams}:{searchParams:Promise<{trip?:string;destination?:string}>}){const q=await searchParams;return <TravelIntakePage trip={typeof q.trip==="string"?q.trip:undefined} destination={typeof q.destination==="string"?q.destination:undefined}/>;}
