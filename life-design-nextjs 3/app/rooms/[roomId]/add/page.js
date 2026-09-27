import { ROOMS } from "@/lib/rooms";
import RoomAddClient from "./RoomAddClient";

export function generateStaticParams() {
  return Object.keys(ROOMS).map((roomId) => ({ roomId }));
}

export default function RoomItemAddPage({ params }) {
  return <RoomAddClient roomId={params.roomId} />;
}
