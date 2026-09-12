export type FaqItem = {
  question: string;
  answer: string;
};

export const PAGE_PATH = "/tools/twitter-screenshot";

export const PAGE_TITLE =
  "Twitter Screenshot Generator: Free Tweet to Image Tool";

export const PAGE_DESCRIPTION =
  "Turn any tweet into a beautiful screenshot. Paste a tweet URL, customize the background, layout, and theme, then download a PNG. Free Twitter screenshot tool — no account required.";

export const FEATURE_HIGHLIGHTS = [
  {
    title: "Paste a tweet URL",
    text: "Load any public X or Twitter post by URL. No login, no browser extension required.",
  },
  {
    title: "Customize the canvas",
    text: "Pick solid colors or gradient backgrounds, adjust padding, and switch light or dark tweet themes.",
  },
  {
    title: "Download tweet screenshots",
    text: "Export a high-quality PNG or copy the image to your clipboard in one click.",
  },
] as const;

export const STEPS = [
  {
    step: "01",
    title: "Paste the tweet URL",
    description:
      "Copy the link from X (Twitter) and paste it into the editor. We load the tweet text, author, media, and metrics.",
  },
  {
    step: "02",
    title: "Customize the look",
    description:
      "Choose a canvas size for Instagram or YouTube, set the background, padding, theme, and whether to show engagement metrics.",
  },
  {
    step: "03",
    title: "Download the image",
    description:
      "Download your tweet screenshot as PNG or copy it to the clipboard. Ready for slides, newsletters, or social posts.",
  },
] as const;

export const CUSTOMIZATION_GROUPS = [
  {
    title: "Background & canvas",
    items: [
      "Solid color or gradient presets",
      "Instagram 1:1 and YouTube 16:9 aspect ratios",
      "Adjustable padding around the tweet",
      "Light or dark tweet theme",
    ],
  },
  {
    title: "Tweet appearance",
    items: [
      "Scale the tweet card up or down",
      "Rounded corners and drop shadow",
      "Show or hide likes, replies, and reposts",
      "Hide tweet media for text-only shots",
    ],
  },
  {
    title: "Export",
    items: [
      "Download as PNG",
      "Copy image to clipboard",
      "Rendered in your browser — nothing stored on our servers",
    ],
  },
] as const;

export const USE_CASES = [
  {
    title: "Content creators",
    text: "Share tweet screenshots on Instagram, LinkedIn, or TikTok with a branded background instead of a messy phone capture.",
  },
  {
    title: "Marketers & founders",
    text: "Turn customer praise, launch posts, and milestones into clean social proof for ads, decks, and landing pages.",
  },
  {
    title: "Bloggers & educators",
    text: "Embed tweet screenshots in articles and newsletters when live embeds are blocked or you need a static archive.",
  },
  {
    title: "Researchers & journalists",
    text: "Save a tweet screenshot before a post is deleted. Pair with WakeMark if you want a searchable private archive.",
  },
] as const;

export const FAQS: FaqItem[] = [
  {
    question: "How do I take a Twitter screenshot?",
    answer:
      "Paste the tweet URL into this tool, click Load tweet, customize the background and layout, then download or copy the image. It is faster than cropping a manual screenshot and gives you full control over the final look.",
  },
  {
    question: "How do I download a tweet screenshot?",
    answer:
      "After loading a tweet, use the Download PNG button to save the image to your device, or Copy image to paste it directly into Slack, Figma, or a document.",
  },
  {
    question: "Does Twitter or X notify users when someone takes a screenshot?",
    answer:
      "No. X does not send notifications when someone screenshots a tweet, saves it as an image, or uses a tool like this. That applies to public posts viewed in a browser.",
  },
  {
    question: "Can I screenshot a deleted tweet?",
    answer:
      "Only if you saved it before it was deleted, or if another service archived it. This tool loads live public tweets from X. Once a post is gone, the URL usually stops working everywhere.",
  },
  {
    question: "Is this Twitter screenshot tool free?",
    answer:
      "Yes. You can create unlimited tweet screenshots without a WakeMark account or credit card.",
  },
  {
    question: "Do I need to install anything?",
    answer:
      "No. The editor runs in your browser. Paste a URL, customize, and export. WakeMark's Chrome extension is optional if you want to archive bookmarks separately.",
  },
  {
    question: "What tweet URLs are supported?",
    answer:
      "Any public post on x.com or twitter.com in the form x.com/username/status/123456789. Protected accounts and private posts cannot be loaded.",
  },
  {
    question: "Can I customize the background?",
    answer:
      "Yes. Pick from solid colors and gradient presets, adjust padding, and choose light or dark mode for the tweet card itself.",
  },
  {
    question: "What image format can I export?",
    answer:
      "PNG for lossless quality. Copy to clipboard is also PNG. JPEG and WebP may be added later; PNG works everywhere today.",
  },
  {
    question: "Are my screenshots saved on your servers?",
    answer:
      "No. The tweet is fetched to render the preview. The final image is generated in your browser and downloaded locally.",
  },
  {
    question: "Can I use tweet screenshots commercially?",
    answer:
      "You are responsible for how you use third-party content. Many teams use tweet screenshots for marketing and education; respect copyright, privacy, and X's terms for your use case.",
  },
  {
    question: "How is this different from a phone screenshot?",
    answer:
      "Manual screenshots include your status bar, UI chrome, and awkward crops. This tool renders a clean tweet card on a canvas you control — better for presentations and social posts.",
  },
];
