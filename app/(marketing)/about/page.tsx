export const revalidate = 3600; // 1 hour — marketing pages change infrequently
import AboutContent from "./about-content";

export const metadata = {
  title: "About | Westbridge",
  description: "Built for growing businesses. Enterprise tools without the complexity.",
  openGraph: {
    title: "About | Westbridge",
    description: "Built for growing businesses. Enterprise tools without the complexity.",
  },
};

export default function AboutPage() {
  return <AboutContent />;
}
