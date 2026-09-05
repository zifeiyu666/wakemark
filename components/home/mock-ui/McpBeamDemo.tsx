"use client";

import { AnimatedBeam } from "@/components/ui/animated-beam";
import { cn } from "@/lib/utils";
import {
  forwardRef,
  useRef,
  type ReactNode,
  type SVGProps,
} from "react";

/**
 * Mock UI Animation — "MCP Server" demo.
 *
 * Hub-and-spoke visual: the WakeMark MCP server sits in the center while
 * animated beams pulse out to every supported agent client (Claude Desktop,
 * Claude Code, Cursor, Codex, ChatGPT, VS Code). Beams are the shared
 * `AnimatedBeam` primitive; circles use design tokens so the demo adapts to
 * dark mode like the other mock-ui demos.
 *
 * Brand marks below are sourced from simple-icons (CC0), except the WakeMark
 * mark which mirrors `public/logo.svg` with `currentColor` for theming.
 */

const AnthropicIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
    <path d="M17.3041 3.541h-3.6718l6.696 16.918H24Zm-10.6082 0L0 20.459h3.7442l1.3693-3.5527h7.0052l1.3693 3.5528h3.7442L10.5363 3.5409Zm-.3712 10.2232 2.2914-5.9456 2.2914 5.9456Z" />
  </svg>
);

const CursorIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
    <path d="M11.503.131 1.891 5.678a.84.84 0 0 0-.42.726v11.188c0 .3.162.575.42.724l9.609 5.55a1 1 0 0 0 .998 0l9.61-5.55a.84.84 0 0 0 .42-.724V6.404a.84.84 0 0 0-.42-.726L12.497.131a1.01 1.01 0 0 0-.996 0M2.657 6.338h18.55c.263 0 .43.287.297.515L12.23 22.918c-.062.107-.229.064-.229-.06V12.335a.59.59 0 0 0-.295-.51l-9.11-5.257c-.109-.063-.064-.23.061-.23" />
  </svg>
);

const OpenAiIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
    <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
  </svg>
);

const VsCodeIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
    <path d="M23.15 2.587L18.21.21a1.494 1.494 0 0 0-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 0 0-1.276.057L.327 7.261A1 1 0 0 0 .326 8.74L3.899 12 .326 15.26a1 1 0 0 0 .001 1.479L1.65 17.94a.999.999 0 0 0 1.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 0 0 1.704.29l4.942-2.377A1.5 1.5 0 0 0 24 20.06V3.939a1.5 1.5 0 0 0-.85-1.352zm-5.146 14.861L10.826 12l7.178-5.448v10.896z" />
  </svg>
);

const WakeMarkIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 1024 1024" fill="currentColor" aria-hidden {...props}>
    <path d="M764.235294 135.529412c32.406588 0 58.970353 25.088 61.31953 56.922353l0.180705 4.577882v632.470588a61.500235 61.500235 0 0 1-56.922353 61.31953l-4.577882 0.150588H272.323765a61.500235 61.500235 0 0 1-61.31953-56.892235L210.823529 829.500235v-632.470588c0-32.436706 25.088-58.970353 56.922353-61.319529l4.577883-0.180706h491.911529z m-61.500235 52.705882h-263.529412v289.882353l0.180706 3.162353c2.409412 21.594353 29.545412 31.442824 45.236706 15.058824l86.347294-90.322824 86.377412 90.322824c16.414118 17.167059 45.387294 5.541647 45.387294-18.221177V188.235294z" />
  </svg>
);

/** A circular node the beams can anchor to; the ref marks the beam endpoint. */
const Node = forwardRef<
  HTMLDivElement,
  {
    label: string;
    /** Grid placement classes — applied to the wrapper (the grid child). */
    className?: string;
    /** Size/shadow overrides for the circle itself. */
    circleClassName?: string;
    children: ReactNode;
  }
>(({ label, className, circleClassName, children }, ref) => (
  <div className={cn("flex flex-col items-center gap-1.5", className)}>
    <div
      ref={ref}
      className={cn(
        "relative z-10 flex h-9 w-9 items-center justify-center rounded-full border bg-card shadow-sm sm:h-11 sm:w-11",
        circleClassName
      )}
    >
      {children}
    </div>
    <span className="text-[10px] whitespace-nowrap text-muted-foreground">
      {label}
    </span>
  </div>
));
Node.displayName = "Node";

export default function McpBeamDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mcpRef = useRef<HTMLDivElement>(null);
  const claudeDesktopRef = useRef<HTMLDivElement>(null);
  const claudeCodeRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const codexRef = useRef<HTMLDivElement>(null);
  const chatgptRef = useRef<HTMLDivElement>(null);
  const vscodeRef = useRef<HTMLDivElement>(null);

  /* Gradient travels along X. Left spokes need reverse so the pulse leaves
     the hub instead of arriving from the edge. All six fire together. */
  const beams = [
    { id: "claude-desktop", toRef: claudeDesktopRef, reverse: true },
    { id: "claude-code", toRef: claudeCodeRef, reverse: true },
    { id: "cursor", toRef: cursorRef, reverse: true },
    { id: "codex", toRef: codexRef, reverse: false },
    { id: "chatgpt", toRef: chatgptRef, reverse: false },
    { id: "vscode", toRef: vscodeRef, reverse: false },
  ];

  return (
    <div className="w-full overflow-hidden bg-card">
      {/* Header: mirrors the other mock-ui demos */}
      <div className="flex items-center justify-between border-b bg-muted/40 px-3 py-2.5 sm:px-4">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-foreground/50 motion-reduce:animate-none" />
          <span className="text-xs font-semibold tracking-[0.18em] text-muted-foreground">
            WAKEMARK MCP
          </span>
        </div>
        <span className="text-xs text-muted-foreground">Streamable HTTP</span>
      </div>

      <div ref={containerRef} className="relative px-3 py-5 sm:px-5 sm:py-6">
        {beams.map(({ id, toRef, reverse }) => (
          <AnimatedBeam
            key={id}
            containerRef={containerRef}
            fromRef={mcpRef}
            toRef={toRef}
            reverse={reverse}
            duration={3.5}
            delay={0}
            gradientStartColor="#4b7be5"
            gradientStopColor="#a05cf7"
          />
        ))}

        <div className="grid h-[220px] grid-cols-3 grid-rows-3 place-items-center sm:h-[260px]">
          {/* Left column: Claude family + Cursor */}
          <Node
            ref={claudeDesktopRef}
            label="Claude Desktop"
            className="col-start-1 row-start-1"
          >
            <AnthropicIcon className="h-4 w-4 text-foreground sm:h-5 sm:w-5" />
          </Node>
          <Node
            ref={claudeCodeRef}
            label="Claude Code"
            className="col-start-1 row-start-2"
          >
            <AnthropicIcon className="h-4 w-4 text-foreground sm:h-5 sm:w-5" />
          </Node>
          <Node
            ref={cursorRef}
            label="Cursor"
            className="col-start-1 row-start-3"
          >
            <CursorIcon className="h-4 w-4 text-foreground sm:h-5 sm:w-5" />
          </Node>

          {/* Hub: the WakeMark MCP server */}
          <Node
            ref={mcpRef}
            label="WakeMark MCP"
            className="col-start-2 row-start-2"
            circleClassName="h-11 w-11 shadow-md sm:h-14 sm:w-14"
          >
            <WakeMarkIcon className="h-5 w-5 text-foreground sm:h-6 sm:w-6" />
          </Node>

          {/* Right column: OpenAI family + VS Code */}
          <Node
            ref={codexRef}
            label="Codex"
            className="col-start-3 row-start-1"
          >
            <OpenAiIcon className="h-4 w-4 text-foreground sm:h-5 sm:w-5" />
          </Node>
          <Node
            ref={chatgptRef}
            label="ChatGPT"
            className="col-start-3 row-start-2"
          >
            <OpenAiIcon
              className="h-4 w-4 sm:h-5 sm:w-5"
              style={{ color: "#74AA9C" }}
            />
          </Node>
          <Node
            ref={vscodeRef}
            label="VS Code"
            className="col-start-3 row-start-3"
          >
            <VsCodeIcon
              className="h-4 w-4 sm:h-5 sm:w-5"
              style={{ color: "#007ACC" }}
            />
          </Node>
        </div>
      </div>
    </div>
  );
}
