import type { ReactNode } from "react";
import { palette } from "../lib/social-art";

/* Overlays drawn on the 1024px grid of each illustration; CSS shows them on the sticker's turn. */
function Fx({ children }: { children: ReactNode }) {
  return (
    <svg className="sticker-fx" viewBox="0 0 1024 1024" aria-hidden="true">
      {children}
    </svg>
  );
}

export function MonitorFx() {
  return (
    <Fx>
      <g className="fx">
        <path d="M288 303 L737 288 L719 368 L305 400Z" fill={palette.mint} />
        <path d="M305 401 L718 369 L718 606 L305 621Z" fill={palette.teal} />
        <path
          className="fx-line"
          d="M368 447 L449 511 L368 577"
          stroke={palette.ivory}
          strokeWidth="40"
        />
        <path
          className="fx-line"
          d="M150 250 L105 215 M118 420 L62 410 M330 150 L318 95"
          stroke={palette.gold}
          strokeWidth="22"
        />
      </g>
      <path
        className="fx fx-line fx-type"
        d="M512 462 L660 452"
        pathLength={1}
        stroke={palette.ivory}
        strokeWidth="26"
      />
      <path
        className="fx fx-line fx-blink"
        d="M512 560 L623 560"
        stroke={palette.glow}
        strokeWidth="39"
      />
    </Fx>
  );
}
export function BotFx() {
  return (
    <Fx>
      <g className="fx bot-visor">
        <path d="M303 400 L690 368 L718 432 L704 606 L313 637 L275 572Z" fill={palette.teal} />
        <path d="M303 400 L690 368 L672 432 L320 463Z" fill={palette.mint} />
      </g>
      <circle className="fx bot-eye" cx="384" cy="528" r="48" fill={palette.ivory} />
      <circle className="fx bot-eye" cx="608" cy="512" r="48" fill={palette.ivory} />
      <path
        className="fx fx-line bot-eyes-happy"
        d="M336 552 Q384 472 432 552 M560 536 Q608 456 656 536"
        stroke={palette.ivory}
        strokeWidth="34"
      />
      <ellipse className="fx bot-cheek" cx="318" cy="712" rx="38" ry="23" fill={palette.orange} />
      <ellipse className="fx bot-cheek" cx="702" cy="688" rx="38" ry="23" fill={palette.orange} />
      <g className="fx bot-mouth">
        <path
          d="M396 692 L626 674 Q612 746 510 748 Q412 746 396 692Z"
          fill={palette.outline}
          stroke={palette.outline}
          strokeWidth="26"
          strokeLinejoin="round"
        />
        <path d="M412 700 L610 684 L602 708 L422 722Z" fill={palette.ivory} />
        <path
          d="M462 742 Q508 716 556 738 Q540 750 508 750 Q474 750 462 742Z"
          fill={palette.orange}
        />
      </g>
      <circle className="fx fx-blink" cx="512" cy="143" r="40" fill={palette.glow} />
    </Fx>
  );
}
export function GameFx() {
  return (
    <Fx>
      <rect className="fx fx-blink" x="221" y="509" width="80" height="54" fill={palette.mint} />
      <rect
        className="fx fx-blink-alt"
        x="355"
        y="509"
        width="80"
        height="54"
        fill={palette.mint}
      />
      <circle className="fx fx-blink-alt" cx="688" cy="448" r="33" fill={palette.glow} />
      <circle className="fx fx-blink" cx="784" cy="544" r="33" fill={palette.glow} />
    </Fx>
  );
}
