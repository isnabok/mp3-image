import React from "react";

type SocialShareProps = {
  title: string;
  description: string;
};

export function SocialShare({ title, description }: SocialShareProps) {
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background:
          "radial-gradient(circle at top, rgba(45, 212, 191, 0.18), transparent 34%), #070a0c",
        color: "#f8fafc",
        padding: "72px",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "24px",
        }}
      >
        <div
          style={{
            width: "88px",
            height: "88px",
            borderRadius: "28px",
            background: "linear-gradient(180deg, #6d86ff, #4a6cf7)",
            color: "#042f2e",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "42px",
            fontWeight: 700,
          }}
        >
          ♪
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div
            style={{
              fontSize: "24px",
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: "#94a3b8",
            }}
          >
            MP3 Cover Editor
          </div>
          <div
            style={{
              fontSize: "40px",
              fontWeight: 700,
            }}
          >
            {title}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          maxWidth: "920px",
        }}
      >
        <div
          style={{
            fontSize: "68px",
            lineHeight: 1.04,
            fontWeight: 700,
          }}
        >
          Edit MP3 tags and cover art in one clean workflow.
        </div>
        <div
          style={{
            fontSize: "30px",
            lineHeight: 1.45,
            color: "#cbd5e1",
          }}
        >
          {description}
        </div>
      </div>
    </div>
  );
}
