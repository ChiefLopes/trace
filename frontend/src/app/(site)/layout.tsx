import { Suspense } from "react";

import { SiteHeader } from "@/components/layout/site-header";
import { getOptionalCurrentUser } from "@/features/auth/session";

async function SiteHeaderWithUser() {
  const user = await getOptionalCurrentUser();
  return <SiteHeader user={user} />;
}

/** Marketing and game pages: full site header with main navigation. */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Suspense fallback={<SiteHeader />}>
        <SiteHeaderWithUser />
      </Suspense>
      {children}
    </>
  );
}
