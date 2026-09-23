import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// Share images for the index and every component page, drawn in the lab's
// own quiet style: white page, near-black type, one hairline rule. They are
// rendered once at build, so reading the fonts from disk costs nothing at
// request time. Geist is SIL OFL licensed, see assets/fonts/OFL.txt.
export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

const fontDir = join(process.cwd(), "assets/fonts");
const fontsPromise = Promise.all([
  readFile(join(fontDir, "Geist-Regular.ttf")),
  readFile(join(fontDir, "Geist-Medium.ttf")),
]);

const color = {
  background: "#ffffff",
  foreground: "#171717",
  muted: "#737373",
  border: "#e5e5e5",
};

// The renderer lays out a fragment's children as a row, so each image wraps
// its content and footer in this column instead.
const stack = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
} as const;

async function render(children: React.ReactNode) {
  const [regular, medium] = await fontsPromise;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          padding: "72px 88px",
          background: color.background,
          color: color.foreground,
          fontFamily: "Geist",
        }}
      >
        {children}
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

function Footer({ left, right }: { left: string; right: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: 28,
        borderTop: `1px solid ${color.border}`,
        fontSize: 26,
        color: color.muted,
      }}
    >
      <span>{left}</span>
      <span>{right}</span>
    </div>
  );
}

export function siteImage({ description }: { description: string }) {
  return render(
    <div style={stack}>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            fontSize: 144,
            fontWeight: 500,
            letterSpacing: "-0.045em",
            lineHeight: 1,
          }}
        >
          ui lab
        </div>
        <div
          style={{
            marginTop: 36,
            maxWidth: 900,
            fontSize: 38,
            lineHeight: 1.35,
            color: color.muted,
          }}
        >
          {description}
        </div>
      </div>
      <Footer
        left="Interaction experiments, made by hand"
        right="lab.xevrion.dev"
      />
    </div>,
  );
}

export function componentImage({
  name,
  description,
  slug,
}: {
  name: string;
  description: string;
  slug: string;
}) {
  // Steps down for longer names so every name fits on one line and leaves
  // room for a two-line description above the footer.
  const nameSize = name.length > 16 ? 92 : name.length > 11 ? 116 : 136;
  return render(
    <div style={stack}>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 28, fontWeight: 500, color: color.muted }}>
          ui lab
        </div>
        <div
          style={{
            marginTop: 40,
            fontSize: nameSize,
            fontWeight: 500,
            letterSpacing: "-0.045em",
            lineHeight: 1.02,
          }}
        >
          {name}
        </div>
        <div
          style={{
            marginTop: 32,
            maxWidth: 940,
            fontSize: 38,
            lineHeight: 1.35,
            color: color.muted,
          }}
        >
          {/* Geist has no ⌘ glyph, and a missing glyph makes the renderer
              fetch a fallback font over the network mid-build. */}
          {description.replaceAll("⌘", "Cmd+")}
        </div>
      </div>
      <Footer
        left={`lab.xevrion.dev/lab/${slug}`}
        right="React · Tailwind · Motion"
      />
    </div>,
  );
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
