export type SocialIconKind = "github" | "reddit" | "discord";

export const palette = {
  outline: "#211b18",
  steel: "#3d5059",
  ivory: "#e1e8d4",
  gold: "#dfb66a",
  glow: "#ffe69a",
  mint: "#a5dbc3",
  teal: "#4f9692",
  rust: "#a94935",
  orange: "#d78155",
};

function brush(ctx: CanvasRenderingContext2D) {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  return {
    shape(path: string, fill: string) {
      const shape = new Path2D(path);
      ctx.fillStyle = fill;
      ctx.fill(shape);
      ctx.strokeStyle = palette.outline;
      ctx.lineWidth = 3.2;
      ctx.stroke(shape);
    },
    line(path: string, color = palette.outline) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 3.2;
      ctx.stroke(new Path2D(path));
    },
  };
}

const sparkle = "M54 2 L56 7 L61 9 L56 11 L54 16 L52 11 L47 9 L52 7Z";

const painters: Record<SocialIconKind, (ctx: CanvasRenderingContext2D) => void> = {
  discord(ctx) {
    const b = brush(ctx);
    b.shape(
      "M13 15 L24 11 L26 16 Q32 14 38 16 L41 11 L51 15 Q59 29 59 44 L47 51 L43 44 Q32 48 21 44 L17 51 L5 44 Q5 28 13 15Z",
      palette.teal,
    );
    b.shape("M27 32 A5 6 0 1 0 17 32 A5 6 0 1 0 27 32Z", palette.ivory);
    b.shape("M47 32 A5 6 0 1 0 37 32 A5 6 0 1 0 47 32Z", palette.ivory);
    b.line("M16 42 Q31 50 48 42");
    b.line("M16 21 L22 19", palette.mint);
    b.shape(sparkle, palette.gold);
  },
  github(ctx) {
    const b = brush(ctx);
    b.shape(
      "M24 40 Q17 43 18 53 L13 55 Q24 58 28 51 L29 44 M36 43 L36 54 L43 56 L48 53 Q40 51 42 41",
      palette.teal,
    );
    b.line("M21 47 Q10 49 8 40 L4 38");
    b.shape(
      "M14 22 L13 9 L25 15 Q33 12 41 15 L51 8 L50 24 Q56 37 46 42 Q33 49 18 42 Q8 36 14 22Z",
      palette.steel,
    );
    b.shape("M20 25 Q32 20 45 25 L47 32 Q45 40 33 40 Q19 40 18 32Z", palette.ivory);
    b.line("M26 29 L26 33", palette.teal);
    b.line("M39 29 L39 33", palette.teal);
    b.line("M29 36 Q33 38 36 35");
    b.shape(sparkle, palette.gold);
  },
  reddit(ctx) {
    const b = brush(ctx);
    b.line("M32 24 L36 10 L48 13");
    b.shape("M54 12 A5 5 0 1 0 44 12 A5 5 0 1 0 54 12Z", palette.gold);
    b.shape("M14 31 A7 7 0 1 0 3 40 L13 44 M51 31 A7 7 0 1 1 61 41 L51 44", palette.teal);
    b.shape(
      "M13 29 Q31 19 49 28 Q59 34 56 43 Q49 54 33 54 Q15 55 8 43 Q4 35 13 29Z",
      palette.ivory,
    );
    b.shape("M26 36 A4 4 0 1 0 18 36 A4 4 0 1 0 26 36Z", palette.orange);
    b.shape("M46 36 A4 4 0 1 0 38 36 A4 4 0 1 0 46 36Z", palette.rust);
    b.line("M22 44 Q32 51 43 43");
    b.line("M17 29 L24 27", palette.mint);
  },
};

export function drawSocialIcon(canvas: HTMLCanvasElement, kind: SocialIconKind) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.scale(canvas.width / 64, canvas.height / 64);
  painters[kind](ctx);
  ctx.restore();
}
