import type { CSSProperties } from "react";
import { DAYLIGHT, type LayerName } from "./model";

// All panorama paths touch both edges. Layer width includes its entire travel.
const CUTS = {
  far: "M0 520L180 410L390 480L640 315L960 470L1190 385L1460 460L1770 320L2050 470L2340 370L2620 440L2960 295L3280 455L3590 350L3820 450L4000 380V1000H0Z",
  mid: "M0 655L360 625L570 510L760 560L900 650L1370 625L1610 500L1830 615L2380 630L2660 505L2900 620L3400 635L3620 510L3850 620L4000 635V1000H0Z",
  near: "M0 650L410 650L600 628L890 642L1250 650L1510 630L1830 644L2240 650L2570 629L2820 641L3220 650L3550 627L3790 642L4000 650V1000H0Z",
  foreground:
    "M0 980H600L760 960L900 980H1600L1770 960L1900 980H2600L2750 960L2900 980H3600L3750 960L3900 980H4000V1000H0Z",
};

export function PaperCut({ layer }: { layer: Exclude<LayerName, "sky"> }) {
  return (
    <svg
      className={`hs-cut hs-cut-${layer}`}
      viewBox="0 0 4000 1000"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        className="hs-hard-shadow"
        d={CUTS[layer]}
        transform="translate(0 -5)"
      />
      <path d={CUTS[layer]} />
    </svg>
  );
}

export function Sky() {
  return (
    <>
      <div className="hs-sky-paints">
        {DAYLIGHT.map((key, i) => (
          <div
            key={key.p}
            data-sky-paint={i}
            style={{
              background: `linear-gradient(${key.skyTop}, ${key.skyBottom})`,
              opacity: i === 0 ? 1 : 0,
            }}
          />
        ))}
      </div>
      <div className="hs-sun">
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="49" />
        </svg>
      </div>
      <svg className="hs-cloud" viewBox="0 0 300 35" aria-hidden="true">
        <path d="M0 25H45L61 14H132L151 0H205L228 25H300V35H0Z" />
      </svg>
    </>
  );
}

export function Lighting() {
  return (
    <div className="hs-lighting" aria-hidden="true">
      {DAYLIGHT.map((key, i) => (
        <div
          key={key.p}
          data-light-paint={i}
          style={{
            opacity: i === 0 ? 1 : 0,
            background: `linear-gradient(${key.lightTint}22, transparent 55%, ${key.shadowTint}2b)`,
          }}
        />
      ))}
    </div>
  );
}

export function StaticBackdrop({ chapter }: { chapter: number }) {
  const key = DAYLIGHT[chapter];
  const style = {
    "--sky-top": key.skyTop,
    "--sky-bottom": key.skyBottom,
  } as CSSProperties;
  return (
    <div className="hs-static-art" style={style} aria-hidden="true">
      <div className="hs-sun" style={{ "--sun-y": key.sunY } as CSSProperties}>
        <svg viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="49" />
        </svg>
      </div>
      <svg
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
        className="hs-static-cuts"
      >
        <path
          fill="var(--hs-far)"
          d="M0 520L180 410L390 480L640 315L960 470L1000 450V1000H0Z"
        />
        <path
          fill="var(--hs-mid)"
          d="M0 655L360 625L570 510L760 560L1000 650V1000H0Z"
        />
        <path
          fill="var(--hs-paper)"
          d="M0 650H410L600 628L890 642L1000 650V1000H0Z"
        />
      </svg>
    </div>
  );
}
