import FigureRig from "./FigureRig";
import HandscrollController from "./HandscrollController";
import { Lighting, PaperCut, Sky, StaticBackdrop } from "./PlaceholderArt";
import { CHAPTERS, LAYERS } from "./model";
import { PANEL_POSES } from "./poses";
import { GRAIN_TILE } from "./grain";
import "./handscroll.css";

function Progress({
  chapter,
  live = false,
}: {
  chapter: number;
  live?: boolean;
}) {
  return (
    <div
      className="hs-progress"
      {...(live
        ? {
            role: "progressbar",
            "aria-label": "A day of practice",
            "aria-valuemin": 0,
            "aria-valuemax": 100,
            "aria-valuenow": 0,
            "aria-valuetext": "Chapter 1 of 4: Awaken",
          }
        : { "aria-hidden": true as const })}
    >
      {CHAPTERS.map((item, i) => (
        <span className="hs-progress-segment" key={item.word}>
          <span
            data-segment={live ? i : undefined}
            style={{ transform: `scaleX(${live ? 0 : i <= chapter ? 1 : 0})` }}
          />
        </span>
      ))}
    </div>
  );
}

function ChapterCopy({
  index,
  live = false,
}: {
  index: number;
  live?: boolean;
}) {
  const chapter = CHAPTERS[index];
  return (
    <div
      className="hs-chapter-copy"
      data-chapter={live ? index : undefined}
      aria-hidden={live && index !== 0 ? true : undefined}
      style={live ? { opacity: index === 0 ? 1 : 0 } : undefined}
    >
      <div className="hs-word-window">
        <div className="hs-word-reveal">
          <h2 className="hs-word">{chapter.word}</h2>
        </div>
      </div>
      <p className="hs-line">{chapter.line}</p>
    </div>
  );
}

export default function Handscroll() {
  return (
    <section
      id="home"
      className="handscroll"
      aria-labelledby="hero-heading"
      data-ambient="paused"
    >
      <h1 id="hero-heading" className="sr-only">
        Vagartha Yoga. A practice that makes room for you.
      </h1>
      <div className="hs-stage">
        {LAYERS.filter(({ name }) => name !== "near").map(({ name, speed }) => (
          <div
            key={name}
            className={`hs-layer hs-layer-${name}`}
            data-layer={name}
            data-speed={speed}
            style={{ width: `calc(${100 + 300 * speed}vw + 2px)` }}
            aria-hidden="true"
          >
            {name === "sky" ? (
              <Sky />
            ) : (
              <PaperCut layer={name as "far" | "mid" | "foreground"} />
            )}
          </div>
        ))}
        <div className="hs-track hs-layer" data-layer="near" data-speed="1">
          <PaperCut layer="near" />
          {CHAPTERS.map((chapter, index) => (
            <article
              className="hs-panel"
              key={chapter.word}
              aria-label={`${chapter.time} · ${chapter.phase}`}
            >
              <StaticBackdrop chapter={index} />
              <div className="hs-figure-anchor">
                <FigureRig pose={PANEL_POSES[index]} />
              </div>
              <div className="hs-static-ui">
                <p className="hs-time-chip">
                  {chapter.time} · {chapter.phase}
                </p>
                <div className="hs-copy-area">
                  <ChapterCopy index={index} />
                  <Progress chapter={index} />
                </div>
              </div>
            </article>
          ))}
        </div>
        <Lighting />
        <div
          className="hs-grain"
          style={{ backgroundImage: `url(${GRAIN_TILE})` }}
          aria-hidden="true"
        />
        <div className="hs-overlay">
          <p className="hs-time-chip">
            <time data-clock dateTime="05:50">
              05:50
            </time>
            <span aria-hidden="true"> · </span>
            <span data-phase>Dawn</span>
          </p>
          <p className="hs-edition" aria-hidden="true">
            A day in practice <span>01 — 04</span>
          </p>
          <div className="hs-copy-area">
            <div className="hs-chapter-stack">
              {CHAPTERS.map((chapter, index) => (
                <ChapterCopy key={chapter.word} index={index} live />
              ))}
            </div>
            <Progress chapter={0} live />
          </div>
          <div className="hs-breath" aria-hidden="true">
            <span className="hs-ring-contract">
              <span className="hs-ring hs-breath-clock" />
            </span>
            <span className="hs-breath-label">Breathe</span>
          </div>
          <a className="hs-skip" href="#sessions">
            Explore the practice <span aria-hidden="true">↘</span>
          </a>
        </div>
      </div>
      <HandscrollController />
    </section>
  );
}
