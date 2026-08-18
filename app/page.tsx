import ReceivingApp from "@/components/receiving-app";
import { getChatGPTUser } from "./chatgpt-auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const signedInUser = await getChatGPTUser();
  return <ReceivingApp user={{ name: signedInUser?.displayName ?? "Gestor SESÉ", email: signedInUser?.email ?? "Acesso operacional" }} />;
}
