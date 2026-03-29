import HomeEditor from "@/components/home-editor";
import { getContentNavigationPages } from "@/lib/content";

export default async function HomePage() {
  const headerPages = await getContentNavigationPages("header");
  const footerPages = await getContentNavigationPages("footer");

  return <HomeEditor headerPages={headerPages} footerPages={footerPages} />;
}
