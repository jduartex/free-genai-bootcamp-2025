import { Html, Head, Main, NextScript } from "next/document";

/**
 * Custom Document component for Next.js.
 *
 * Renders the HTML structure required for a Next.js application, including the <Html>, <Head>,
 * <body> with the <Main> application content, and the <NextScript> for script injection.
 * The <Html> element is assigned the "en" language attribute.
 */
export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
