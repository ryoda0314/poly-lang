import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "PolyLinga - Language learning reimagined";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #F9F8F4 0%, #E8E6E0 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 40,
          }}
        >
          <svg
            width="120"
            height="120"
            viewBox="0 0 100 100"
            style={{ marginRight: 24 }}
          >
            <circle cx="50" cy="50" r="45" fill="#2D5A3D" />
            <text
              x="50"
              y="62"
              textAnchor="middle"
              fill="white"
              fontSize="40"
              fontWeight="bold"
            >
              P
            </text>
          </svg>
          <span
            style={{
              fontSize: 80,
              fontWeight: 700,
              color: "#1a1a1a",
              letterSpacing: "-2px",
            }}
          >
            PolyLinga
          </span>
        </div>
        <div
          style={{
            fontSize: 36,
            color: "#666",
            marginTop: 16,
          }}
        >
          Language learning reimagined.
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
