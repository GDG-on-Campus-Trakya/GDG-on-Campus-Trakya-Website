import { getAllTests } from "@/lib/personality-test";
import PersonalityTestClient from "./PersonalityTestClient";

export const metadata = {
  title: "Kişilik Testleri",
  description:
    "Hangi karakter, hangi dizi kahramanı, hangi teknoloji? Eğlenceli kişilik testleriyle kendini keşfet! GDG on Campus Trakya Üniversitesi kişilik testleri.",
  keywords: [
    "kişilik testi",
    "kişilik testleri",
    "hangi karaktersin",
    "karakter testi",
    "eğlenceli test",
    "hangi medcezir karakterisin",
    "dizi karakter testi",
    "kişilik testi çöz",
  ],
  openGraph: {
    title: "Kişilik Testleri | GDG on Campus Trakya",
    description:
      "Hangi karakter, hangi dizi kahramanı, hangi teknoloji? Eğlenceli kişilik testleriyle kendini keşfet!",
    type: "website",
    url: "/personality-test",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kişilik Testleri | GDG on Campus Trakya",
    description:
      "Eğlenceli kişilik testleriyle kendini keşfet! Hangi karaktersin?",
  },
  alternates: {
    canonical: "/personality-test",
  },
};

export default async function PersonalityTestPage() {
  const tests = await getAllTests();
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://gdgoncampustu.com";

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Kişilik Testleri",
      description:
        "Eğlenceli kişilik testleriyle kendini keşfet! Hangi karakter, hangi dizi kahramanı, hangi teknoloji?",
      url: `${baseUrl}/personality-test`,
      provider: {
        "@type": "Organization",
        name: "GDG on Campus Trakya Üniversitesi",
      },
      hasPart: tests.map((test) => ({
        "@type": "Quiz",
        name: test.title,
        description: test.description,
        url: `${baseUrl}/personality-test/${test.slug}`,
        numberOfQuestions: test.questionCount,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Ana Sayfa",
          item: baseUrl,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Kişilik Testleri",
          item: `${baseUrl}/personality-test`,
        },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PersonalityTestClient initialTests={tests} />
    </>
  );
}
