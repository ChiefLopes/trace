import type { Route } from "next";
import { redirect } from "next/navigation";

import { getOptionalCurrentUser } from "@/features/auth/session";

export default async function CharactersPage() {
  const user = await getOptionalCurrentUser();
  if (user) {
    redirect("/dashboard" as Route);
  }
  redirect("/login" as Route);
}
