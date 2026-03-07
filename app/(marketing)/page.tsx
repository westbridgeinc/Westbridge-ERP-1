export const revalidate = 3600; // 1 hour — marketing pages change infrequently
import { SITE } from "@/lib/config/site";
import { HomeContent } from "./home-content";

export const metadata = {
  title: SITE.name,
  description:
    "The ERP built for Caribbean business. Invoicing, inventory, HR, payroll, CRM — with AI built in.",
  openGraph: {
    title: SITE.name,
    description:
      "The ERP built for Caribbean business. Invoicing, inventory, HR, payroll, CRM — with AI built in.",
    type: "website",
  },
};

export default function Home() {
  return <HomeContent />;
}
