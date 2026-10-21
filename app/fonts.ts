import { JetBrains_Mono, Fira_Code, Roboto_Mono, Source_Code_Pro, IBM_Plex_Mono, Space_Mono } from "next/font/google";

// Only the default font is preloaded; the others download when picked in settings
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin", "latin-ext"], variable: "--font-jetbrains" });
const firaCode = Fira_Code({ subsets: ["latin", "latin-ext"], variable: "--font-fira-code", preload: false });
const robotoMono = Roboto_Mono({ subsets: ["latin", "latin-ext"], variable: "--font-roboto-mono", preload: false });
const sourceCodePro = Source_Code_Pro({ subsets: ["latin", "latin-ext"], variable: "--font-source-code-pro", preload: false });
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-mono",
  preload: false,
});
const spaceMono = Space_Mono({ subsets: ["latin", "latin-ext"], weight: ["400", "700"], variable: "--font-space-mono", preload: false });

/** Class names that define every font's CSS variable; put on <body>. */
export const fontVariables = [jetbrainsMono, firaCode, robotoMono, sourceCodePro, ibmPlexMono, spaceMono]
  .map((font) => font.variable)
  .join(" ");
