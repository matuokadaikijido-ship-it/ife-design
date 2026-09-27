import { ROOMS } from "@/lib/rooms";
import RoomPageClient from "./RoomPageClient";

export function generateStaticParams() {
  return Object.keys(ROOMS).map((roomId) => ({ roomId }));
}

export default function RoomPage({ params }) {
  return <RoomPageClient roomId={params.roomId} />;
}
