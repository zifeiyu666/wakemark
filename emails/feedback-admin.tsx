import { siteConfig } from "@/config/site";

interface FeedbackAdminEmailProps {
  category: string;
  title: string;
  message: string;
  fromEmail: string;
  fromName?: string | null;
  inboxUrl: string;
}

const FeedbackAdminEmail = ({
  category,
  title,
  message,
  fromEmail,
  fromName,
  inboxUrl,
}: FeedbackAdminEmailProps) => (
  <div style={main}>
    <div style={card}>
      <h1 style={heading}>New feedback ({category})</h1>
      <p style={paragraph}>
        <strong>From:</strong> {fromName ? `${fromName} (${fromEmail})` : fromEmail}
      </p>
      <p style={paragraph}>
        <strong>Title:</strong> {title}
      </p>
      <hr style={hr} />
      <p style={messageBody}>{message}</p>
      <div style={ctaContainer}>
        <a href={inboxUrl} style={ctaButton}>
          Open feedback inbox
        </a>
      </div>
    </div>
    <div style={footer}>
      <p style={footerText}>
        © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
      </p>
    </div>
  </div>
);

export { FeedbackAdminEmail };

const main = {
  fontFamily:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  maxWidth: "600px",
  margin: "0 auto",
  backgroundColor: "#f8fafc",
  padding: "40px 20px",
};

const card = {
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  padding: "40px",
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
};

const heading = {
  color: "#111827",
  fontSize: "22px",
  fontWeight: "bold",
  margin: "0 0 24px 0",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "1.6",
  color: "#4b5563",
  margin: "0 0 12px 0",
};

const messageBody = {
  fontSize: "16px",
  lineHeight: "1.6",
  color: "#1f2937",
  whiteSpace: "pre-wrap" as const,
  margin: "0 0 24px 0",
};

const hr = {
  border: "none",
  borderTop: "1px solid #e5e7eb",
  margin: "24px 0",
};

const ctaContainer = {
  textAlign: "center" as const,
  margin: "8px 0 0 0",
};

const ctaButton = {
  display: "inline-block",
  padding: "12px 24px",
  backgroundColor: "#111827",
  color: "#ffffff",
  textDecoration: "none",
  borderRadius: "6px",
  fontWeight: "500",
  fontSize: "16px",
};

const footer = {
  marginTop: "32px",
  textAlign: "center" as const,
};

const footerText = {
  fontSize: "12px",
  color: "#9ca3af",
  margin: "0",
};
