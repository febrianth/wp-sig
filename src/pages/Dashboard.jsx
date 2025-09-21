import Sigcontainer from "../components/Sigcontainer";
import IndonesiaMap from "../components/dashboard/IndonesiaMap";

export default function Dashboard() {
  return (
   <Sigcontainer>
      <div>
        <h1 className="text-3xl font-bold mb-6">Visualisasi Data Member</h1>
        <IndonesiaMap />
      </div>
   </Sigcontainer>
  )
}