import { getAllTests, getTestBySlug } from "@/lib/personality-test";
import PersonalityTestClient from "./PersonalityTestClient";

export async function generateStaticParams() {
  const tests = await getAllTests();
  return tests.map((test) => ({
    slug: test.slug,
  }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const test = await getTestBySlug(slug);

  if (!test) {
    return {
      title: "Test Bulunamadı",
      description: "Aradığınız kişilik testi bulunamadı.",
    };
  }

  const title = test.title;
  const description =
    test.description ||
    `${test.title} - Eğlenceli kişilik testi. Hemen çöz ve sonucunu arkadaşlarınla paylaş!`;

  return {
    title,
    description,
    keywords: [
      test.title,
      "kişilik testi",
      "karakter testi",
      "hangi karaktersin",
      "eğlenceli test",
      "kişilik testi çöz",
    ],
    openGraph: {
      title: `${title} | GDG on Campus Trakya`,
      description,
      type: "website",
      url: `/personality-test/${slug}`,
      ...(test.imageUrl && {
        images: [
          {
            url: test.imageUrl,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | GDG on Campus Trakya`,
      description,
      ...(test.imageUrl && { images: [test.imageUrl] }),
    },
    alternates: {
      canonical: `/personality-test/${slug}`,
    },
  };
}

export default async function PersonalityTestPage({ params }) {
  const { slug } = await params;
  const test = await getTestBySlug(slug);

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://gdgoncampustu.com";

  const jsonLd = test
    ? [
        {
          "@context": "https://schema.org",
          "@type": "Quiz",
          name: test.title,
          description:
            test.description ||
            `${test.title} - Eğlenceli kişilik testi`,
          url: `${baseUrl}/personality-test/${slug}`,
          numberOfQuestions: test.questions?.length || 0,
          about: {
            "@type": "Thing",
            name: "Kişilik Testi",
          },
          provider: {
            "@type": "Organization",
            name: "GDG on Campus Trakya Üniversitesi",
            url: baseUrl,
          },
          ...(test.imageUrl && {
            image: test.imageUrl,
          }),
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
            {
              "@type": "ListItem",
              position: 3,
              name: test.title,
              item: `${baseUrl}/personality-test/${slug}`,
            },
          ],
        },
      ]
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <PersonalityTestClient
        slug={slug}
        initialTestData={test ? JSON.parse(JSON.stringify(test)) : null}
      />
    </>
  );
}
