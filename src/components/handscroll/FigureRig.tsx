import type { ReactNode } from "react";
import { TEST_POSES, type Joint, type PoseName } from "./poses";

/** Each translated socket contains a joint rotating around its local (0, 0). */
export default function FigureRig({ pose = "mountain" }: { pose?: PoseName }) {
  const angles = TEST_POSES[pose];
  function joint(name: Joint, x: number, y: number, children: ReactNode) {
    return (
      <g transform={`translate(${x} ${y})`}>
        <g
          data-joint={name}
          transform={`rotate(${angles[name]})`}
          style={{ transformOrigin: "0px 0px" }}
        >
          {children}
        </g>
      </g>
    );
  }
  function arm(side: "L" | "R", x: number) {
    return joint(
      `upperArm${side}`,
      x,
      -66,
      <>
        <path d="M-7 0H7L5 39H-5Z" />
        {joint(
          `lowerArm${side}`,
          0,
          37,
          <path d="M-5 0H5L4 34L-3 38L-5 31Z" />,
        )}
      </>,
    );
  }
  function leg(side: "L" | "R", x: number) {
    return joint(
      `thigh${side}`,
      x,
      0,
      <>
        <path d="M-11-3H11L7 51H-7Z" />
        {joint(
          `shin${side}`,
          0,
          48,
          <path d={`M-7 0H7L5 46L${side === "L" ? "-15" : "15"} 51H-6Z`} />,
        )}
      </>,
    );
  }
  return (
    <svg
      className="hs-rig"
      data-rig={pose}
      viewBox="0 0 240 280"
      fill="currentColor"
      aria-hidden="true"
    >
      {joint(
        "hips",
        120,
        160,
        <>
          {leg("L", -11)}
          {leg("R", 11)}
          <path d="M-23-17H23L21 12H-21Z" />
          <g
            className="hs-rig-breath hs-breath-clock"
            style={{ transformOrigin: "0px 0px" }}
          >
            {joint(
              "torso",
              0,
              -8,
              <>
                <path d="M-22-70L18-70L24-46L17 0H-17L-24-46Z" />
                {arm("L", -22)}
                {arm("R", 22)}
                {joint(
                  "head",
                  0,
                  -77,
                  <>
                    <path d="M-6 9V-6H6V9Z" />
                    <path d="M-12-28L-3-34L9-30L14-18L10-4L0 1L-11-6L-14-18Z" />
                  </>,
                )}
              </>,
            )}
          </g>
        </>,
      )}
    </svg>
  );
}
