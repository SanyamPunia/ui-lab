import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { categories, type LabEntry } from "@/lab/registry";
import { SIGNATURE, SIGNATURE_VIEWBOX } from "@/lib/signature";

// Share images for the index and every experiment, drawn as the site looks:
// a raised white card on a soft grey page, the red pen underlining the one
// word that matters, and the handwritten signature. (The renderer can't tile
// a background, so the site's dotted stage isn't here.)
// Rendered once at build, so reading the fonts from disk costs nothing at
// request time. Geist is SIL OFL licensed, see assets/fonts/OFL.txt.
export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

const fontDir = join(process.cwd(), "assets/fonts");
const fontsPromise = Promise.all([
  readFile(join(fontDir, "Geist-Regular.ttf")),
  readFile(join(fontDir, "Geist-Medium.ttf")),
]);

// The light theme's tokens, written out: the renderer has no CSS variables.
const color = {
  page: "#f7f7f7",
  card: "#ffffff",
  foreground: "#171717",
  muted: "#737373",
  border: "#e8e8e8",
  surface: "#f5f5f5",
  marker: "#d93d31",
};

type Slots = {
  top: React.ReactNode;
  middle: React.ReactNode;
  bottom: React.ReactNode;
};

async function render({ top, middle, bottom }: Slots) {
  const [regular, medium] = await fontsPromise;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          padding: 52,
          backgroundColor: color.page,
          color: color.foreground,
          fontFamily: "Geist",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "52px 64px 48px",
            backgroundColor: color.card,
            borderRadius: 36,
            border: `1px solid ${color.border}`,
            boxShadow:
              "0 1px 2px rgba(0,0,0,0.05), 0 30px 60px -20px rgba(0,0,0,0.18)",
          }}
        >
          {/* Explicit slots rather than a fragment: the renderer lays a
              fragment's children out as a row. */}
          <div style={{ display: "flex", flexDirection: "column" }}>{top}</div>
          <div style={{ display: "flex", flexDirection: "column" }}>{middle}</div>
          <div style={{ display: "flex", flexDirection: "column" }}>{bottom}</div>
        </div>
      </div>
    ),
    {
      ...ogSize,
      fonts: [
        { name: "Geist", data: regular, weight: 400, style: "normal" },
        { name: "Geist", data: medium, weight: 500, style: "normal" },
      ],
    },
  );
}

function Wordmark() {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
      <span style={{ fontSize: 30, fontWeight: 500, letterSpacing: "-0.03em" }}>
        ui lab
      </span>
      <span style={{ fontSize: 24, color: color.muted }}>by xevrion</span>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        height: 44,
        padding: "0 18px",
        borderRadius: 999,
        background: color.surface,
        border: `1px solid ${color.border}`,
        fontSize: 22,
        fontWeight: 500,
        color: color.muted,
      }}
    >
      {children}
    </div>
  );
}

// The site's red-pen underline: swept right, then a flick back under itself.
function Underlined({
  children,
  thickness,
}: {
  children: React.ReactNode;
  thickness: number;
}) {
  return (
    // Hugs the text, so the line is only as wide as the words.
    <div style={{ display: "flex", position: "relative", alignSelf: "flex-start" }}>
      {children}
      <svg
        viewBox="0 0 100 14"
        preserveAspectRatio="none"
        width="100%"
        height={thickness * 7}
        style={{
          position: "absolute",
          left: "-3%",
          width: "106%",
          bottom: -thickness * 3.2,
        }}
      >
        <path
          d="M2 9.5C22 6.5 48 5 97 5.5 74 7.8 50 9.6 30 12"
          fill="none"
          stroke={color.marker}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}

function Signature() {
  return (
    <svg viewBox={SIGNATURE_VIEWBOX} width={170} height={52}>
      <path
        d={SIGNATURE}
        fill="none"
        stroke={color.foreground}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Footer({ left }: { left: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
      }}
    >
      <span style={{ fontSize: 24, color: color.muted }}>{left}</span>
      <Signature />
    </div>
  );
}

// Geist has no ⌘ glyph, and a missing glyph makes the renderer fetch a
// fallback font over the network mid-build.
const safe = (text: string) => text.replaceAll("⌘", "Cmd+");

export function siteImage({ description }: { description: string }) {
  return render({
    top: (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Wordmark />
        <Pill>A lab, not a library</Pill>
      </div>
    ),
    middle: (
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 78,
            fontWeight: 500,
            letterSpacing: "-0.045em",
            lineHeight: 1.05,
          }}
        >
          <span>Things I made because</span>
          <div style={{ display: "flex", gap: 20 }}>
            <span>I liked how they</span>
            <Underlined thickness={4}>
              <span>felt</span>
            </Underlined>
          </div>
        </div>
        <div
          style={{
            marginTop: 34,
            maxWidth: 820,
            fontSize: 30,
            lineHeight: 1.4,
            color: color.muted,
          }}
        >
          {safe(description)}
        </div>
      </div>
    ),
    bottom: <Footer left="lab.xevrion.dev" />,
  });
}

export function componentImage({
  name,
  description,
  slug,
  category,
  isNew,
}: Pick<LabEntry, "name" | "description" | "slug" | "category" | "isNew">) {
  // Steps down for longer names so every name stays on one line.
  const nameSize = name.length > 18 ? 88 : name.length > 12 ? 104 : 124;
  const label = categories.find((c) => c.id === category)?.label;
  return render({
    top: (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Wordmark />
        <div style={{ display: "flex", gap: 12 }}>
          {isNew && (
            <Pill>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: color.marker,
                }}
              />
              New
            </Pill>
          )}
          {label && <Pill>{label}</Pill>}
        </div>
      </div>
    ),
    middle: (
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            fontSize: nameSize,
            fontWeight: 500,
            letterSpacing: "-0.045em",
            lineHeight: 1.05,
          }}
        >
          <Underlined thickness={4.5}>
            <span>{name}</span>
          </Underlined>
        </div>
        <div
          style={{
            marginTop: 40,
            maxWidth: 900,
            fontSize: 34,
            lineHeight: 1.38,
            color: color.muted,
          }}
        >
          {safe(description)}
        </div>
      </div>
    ),
    bottom: <Footer left={`lab.xevrion.dev/lab/${slug}`} />,
  });
}

// The favicon and home screen icon: a black rounded square holding a small
// 3x3 dot grid, the lab read as a tray of specimens. iOS rounds home screen
// icons itself, so the apple icon stays square.
export function labMark(size: number, { rounded = true } = {}) {
  const radius = rounded ? Math.round(size * 0.22) : 0;
  const dot = Math.max(2, Math.round(size * 0.1));
  const gap = Math.max(2, Math.round(size * 0.1));
  const cell = (
    <div
      style={{ width: dot, height: dot, borderRadius: dot, background: "#fff" }}
    />
  );
  const row = (
    <div style={{ display: "flex", gap }}>
      {cell}
      {cell}
      {cell}
    </div>
  );
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          borderRadius: radius,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap }}>
          {row}
          {row}
          {row}
        </div>
      </div>
    ),
    { width: size, height: size },
  );
}
