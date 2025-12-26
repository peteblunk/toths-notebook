"use client";

import { motion, SVGMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import React from "react";

// Animation variant for the drawing effect
const etchPath = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: (i: number) => ({
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { delay: i * 0.03, type: "spring", duration: 2, bounce: 0 },
      opacity: { delay: i * 0.03, duration: 0.01 }
    }
  })
};

// This component is a direct translation of the user's provided SVG,
// with each labeled group and path converted to a Framer Motion component
// for individual animation control.
export const KhepriIconMotion = React.forwardRef<SVGSVGElement, SVGMotionProps<SVGSVGElement>>(
  ({ className, ...props }, ref) => {
    // Each path and circle gets a custom animation index for staggered drawing
    let i = 0;
    const strokeWidth = "0.35px";

    return (
      <motion.svg
        ref={ref}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("w-full h-full", className)}
        initial="hidden"
        animate="visible"
        {...props}
      >
        <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          
          <motion.g id="celestial-bodies">
            <motion.circle id="solar-orb" style={{ strokeWidth }} cx="50.28" cy="31.94" r="5.18" custom={i++} variants={etchPath} />
            <motion.circle id="lunar-orb" style={{ strokeWidth }} cx="50.33" cy="60.94" r="1.54" custom={i++} variants={etchPath} />
          </motion.g>

          <motion.g id="body-and-legs">
            <motion.path id="thorax-lower" style={{ strokeWidth }} d="m 55.64,46.24 c 0.56,0.99 0.7,3.33 0.62,5.74 -0.04,1.06 -0.55,1.86 -0.55,1.86 m 0,0 c -1.37,2.81 -5.23,2.75 -5.23,2.75 0,0 -3.84,0.05 -5.21,-2.75 m 0.07,-7.6 c -0.56,0.99 -0.7,3.33 -0.62,5.74 0.04,1.06 0.55,1.86 0.55,1.86" custom={i++} variants={etchPath} />
            <motion.g id="thorax-upper">
                <motion.path style={{ strokeWidth }} d="m 45.3,46.32 c 0.05,-0.45 0.67,-0.93 2.25,-0.68 1.74,0.28 2.99,1.35 2.99,1.35" custom={i++} variants={etchPath} />
                <motion.path id="thorax-upper-main" style={{ strokeWidth }} d="m 55.69,46.33 c -0.28,-5.01 -5.18,-5.21 -5.18,-5.21 0,0 -4.96,0.2 -5.24,5.21" custom={i++} variants={etchPath} />
                <motion.path style={{ strokeWidth }} d="m 55.67,46.32 c -0.05,-0.45 -0.67,-0.93 -2.25,-0.68 -1.74,0.28 -2.9,1.35 -2.9,1.35" custom={i++} variants={etchPath} />
            </motion.g>
            <motion.path id="head" style={{ strokeWidth }} d="m 50.48,39.2 c 2.17,0.02 2.41,2.48 2.41,2.48 m -2.41,-2.48 c -2.17,0.02 -2.41,2.48 -2.41,2.48" custom={i++} variants={etchPath} />
            <motion.g id="antennae">
                <motion.path id="left-antenna" style={{ strokeWidth }} d="m 48.45,39.03 0.58,0.54 m -0.53,-1.83 -0.09,1.15 -0.4,0.37" custom={i++} variants={etchPath} />
                <motion.path id="right-antenna" style={{ strokeWidth }} d="m 52.52,39.03 -0.58,0.54 m 0.53,-1.83 0.09,1.15 0.4,0.37" custom={i++} variants={etchPath} />
            </motion.g>
             <motion.g id="legs">
                <motion.path id="left-leg-fore" style={{ strokeWidth }} d="m 46.87,42.47 c -3.04,0.03 -3.69,-0.73 -3.82,-1.85 -0.13,-1.12 0.36,-1.19 0.36,-1.19 0,0 -0.07,-0.6 -0.03,-1.03 0.03,-0.43 0.02,-0.28 0.02,-0.28 l 1.9,-2.7 c 0,0 0.5,-1.65 -0.07,-1.69 -0.56,-0.03 0,-0.13 -0.13,-1.16 -0.13,-1.03 -2.55,-0.89 -1.52,-0.73 1.03,0.17 0.33,3.6 0.33,3.6 l -1.03,2.12 -0.63,0.66 c 0,0 -0.3,2.3 -0.1,2.41 0.64,0.36 0.4,1.36 0.4,1.36 l 2.84,3.42" custom={i++} variants={etchPath} />
                <motion.path id="left-leg-hind" style={{ strokeWidth }} d="m 43.68,54.38 0.96,-3.7 m -0.96,3.73 c 0,0 -0.07,0.43 -0.03,1.69 0.03,1.26 -0.2,-0.13 2.18,1.65 2.38,1.79 2.05,3.88 2.45,3.54 1,-0.86 0.78,-1.02 0.73,-2.02 -0.03,-0.62 -2.19,-1.9 -3.24,-2.51 -0.42,-0.24 -1.03,-0.66 -1.03,-1.59 0,-0.93 0.53,-1.32 0.53,-1.32" custom={i++} variants={etchPath} />
                <motion.path id="right-leg-fore" style={{ strokeWidth }} d="m 54.1,42.47 c 3.04,0.03 3.69,-0.73 3.82,-1.85 0.13,-1.12 -0.36,-1.19 -0.36,-1.19 0,0 0.07,-0.6 0.03,-1.03 -0.03,-0.43 -0.02,-0.28 -0.02,-0.28 l -1.9,-2.7 c 0,0 -0.5,-1.65 0.07,-1.69 0.56,-0.03 0,-0.13 0.13,-1.16 0.13,-1.03 2.55,-0.89 1.52,-0.73 -1.03,0.17 -0.33,3.6 -0.33,3.6 l 1.03,2.12 0.63,0.66 c 0,0 0.3,2.3 0.1,2.41 -0.64,0.36 -0.4,1.36 -0.4,1.36 l -2.84,3.42" custom={i++} variants={etchPath} />
                <motion.path id="right-leg-hind" style={{ strokeWidth }} transform="matrix(-1,0,0,1,100.71732,0)" d="m 43.43,54.38 0.96,-3.7 m -0.96,3.73 c 0,0 -0.07,0.43 -0.03,1.69 0.03,1.26 -0.2,-0.13 2.18,1.65 2.38,1.79 2.05,3.88 2.45,3.54 1,-0.86 0.78,-1.02 0.73,-2.02 -0.03,-0.62 -2.19,-1.9 -3.24,-2.51 -0.42,-0.24 -1.03,-0.66 -1.03,-1.59 0,-0.93 0.53,-1.32 0.53,-1.32" custom={i++} variants={etchPath} />
            </motion.g>
          </motion.g>

          <motion.g id="left-wing">
            <motion.g id="left-wing-structure">
              <motion.path id="left-wing-structure-lower" style={{ strokeWidth }} d="m 24.69,40.2 c 5.56,6.67 10.78,6.36 10.78,6.36 l 9.44,0.1" custom={i++} variants={etchPath} />
              <motion.path id="left-wing-structure-curl" style={{ strokeWidth }} d="m 44.7,44.59 c -0.69,-0.92 -9.68,-0.56 -9.68,-0.56 0,0 -1.75,0.21 -2.29,-0.18 -0.47,-0.34 -0.49,-1 -0.45,-1.17 0.16,-0.68 0.7,-0.91 1.16,-0.84 0.19,0.03 0.64,0.13 0.69,0.93 0.05,0.79 -0.74,0.6 -0.74,0.6" custom={i++} variants={etchPath} />
              <motion.path id="left-wing-structure-mid" style={{ strokeWidth }} d="m 32.67,41.97 c 0,0 -3.23,-0.21 -3.84,-0.26 -1.22,-0.1 -1.69,-0.93 -1.69,-0.93 H 26.41 L 25.82,40.12" custom={i++} variants={etchPath} />
            </motion.g>
            <motion.g id="left-feathers">
                {/* Corrected path data for feather 1 by extracting the main line */}
                <motion.path id="left-feather-1-1" style={{ strokeWidth }} d="m 2.4334432,39.878703 c 0.06986,0.110665 0.1398117,0.219025 0.2103231,0.325561 2.0213469,-0.0031 20.0804882,-0.02708 29.2488612,0.07906 3.543445,0.04102 7.82925,-0.104402 10.415901,1.806608" custom={i++} variants={etchPath} />
                <motion.path id="left-feather-1-2" style={{ strokeWidth }} d="m 2.2556763,39.817725 c 1.8580092,2.943289 3.9751527,4.460974 5.6291137,5.23844 1.653961,0.777467 2.8613239,0.818555 2.8613239,0.818555" custom={i++} variants={etchPath} />
                <motion.path id="left-feather-2-1" style={{ strokeWidth }} d="m 6.85,46.68 c 4.61,3.76 8.34,2.91 8.34,2.91" custom={i++} variants={etchPath} />
                <motion.path id="left-feather-2-2" style={{ strokeWidth }} d="M 6.88,46.67 27.56,43.15" custom={i++} variants={etchPath} />
                <motion.path id="left-feather-3-1" style={{ strokeWidth }} d="m 12.84,50.39 c 3.33,1.86 7.74,1.37 7.74,1.37" custom={i++} variants={etchPath} />
                <motion.path id="left-feather-3-2" style={{ strokeWidth }} d="M 12.84,50.39 29.67,44.67" custom={i++} variants={etchPath} />
                <motion.path id="left-feather-4-1" style={{ strokeWidth }} d="m 19.24,52.48 c 3.41,0.88 6.78,-0.14 6.78,-0.14" custom={i++} variants={etchPath} />
                <motion.path id="left-feather-4-2" style={{ strokeWidth }} d="M 19.26,52.47 31.94,45.85" custom={i++} variants={etchPath} />
                <motion.path id="left-feather-5-1" style={{ strokeWidth }} d="m 25.18,52.95 c 2.48,0.19 5.05,-0.49 5.05,-0.49" custom={i++} variants={etchPath} />
                <motion.path id="left-feather-5-2" style={{ strokeWidth }} d="m 25.21,52.93 9.06,-6.46" custom={i++} variants={etchPath} />
                <motion.path id="left-feather-6-1" style={{ strokeWidth }} d="m 29.58,53.09 c 2.53,0.09 4.01,-0.83 4.01,-0.83" custom={i++} variants={etchPath} />
                <motion.path id="left-feather-6-2" style={{ strokeWidth }} d="M 29.59,53.07 36.41,46.6" custom={i++} variants={etchPath} />
                <motion.path id="left-feather-7-1" style={{ strokeWidth }} d="m 32.94,53.04 c 2.57,-0.09 3.27,-0.77 3.27,-0.77" custom={i++} variants={etchPath} />
                <motion.path id="left-feather-7-2" style={{ strokeWidth }} d="m 32.96,53.03 5.4,-6.4" custom={i++} variants={etchPath} />
                <motion.path id="left-feather-8-1" style={{ strokeWidth }} d="m 35.8,53.04 c 1.96,-0.05 2.77,-0.94 2.77,-0.94" custom={i++} variants={etchPath} />
                <motion.path id="left-feather-8-2" style={{ strokeWidth }} d="m 35.75,53.03 3.95,-6.38" custom={i++} variants={etchPath} />
                <motion.path id="left-feather-9-1" style={{ strokeWidth }} d="m 38.23,52.96 c 1.5,-0.09 1.96,-0.82 1.96,-0.82" custom={i++} variants={etchPath} />
                <motion.path id="left-feather-9-2" style={{ strokeWidth }} d="m 38.24,52.93 2.59,-6.28" custom={i++} variants={etchPath} />
                <motion.path id="left-feather-10-1" style={{ strokeWidth }} d="m 39.94,52.95 c 1.82,0.2 2.27,-0.88 2.27,-0.88" custom={i++} variants={etchPath} />
                <motion.path id="left-feather-10-2" style={{ strokeWidth }} d="M 39.95,52.92 41.85,46.67" custom={i++} variants={etchPath} />
                <motion.path id="left-feather-11-1" style={{ strokeWidth }} d="m 41.98,53.22 c 0.63,-0.12 0.72,0.03 0.92,0.16 0.47,0.28 0.78,1.03 0.78,1.03" custom={i++} variants={etchPath} />
                <motion.path id="left-feather-11-2" style={{ strokeWidth }} d="m 41.97,53.21 1.36,-6.53" custom={i++} variants={etchPath} />
            </motion.g>
          </motion.g>

          <motion.g id="right-wing" transform="matrix(-1,0,0,1,100.71732,0)">
            <motion.g id="right-wing-structure">
                <motion.path id="right-wing-structure-lower" style={{ strokeWidth }} d="m 24.44,40.2 c 5.56,6.67 10.78,6.36 10.78,6.36 l 9.44,0.1" custom={i++} variants={etchPath} />
                <motion.path id="right-wing-structure-curl" style={{ strokeWidth }} d="m 44.45,44.59 c -0.69,-0.92 -9.68,-0.56 -9.68,-0.56 0,0 -1.75,0.21 -2.29,-0.18 -0.47,-0.34 -0.49,-1 -0.45,-1.17 0.16,-0.68 0.7,-0.91 1.16,-0.84 0.19,0.03 0.64,0.13 0.69,0.93 0.05,0.79 -0.74,0.6 -0.74,0.6" custom={i++} variants={etchPath} />
                <motion.path id="right-wing-structure-mid" style={{ strokeWidth }} d="m 32.42,41.97 c 0,0 -3.23,-0.21 -3.84,-0.26 -1.22,-0.1 -1.69,-0.93 -1.69,-0.93 h -0.73 l -0.6,-0.66" custom={i++} variants={etchPath} />
            </motion.g>
            <motion.g id="right-feathers">
                {/* Note: The paths for the right feathers are the same as the left, they are just transformed by the parent g */}
                <motion.path id="right-feather-1-1" style={{ strokeWidth }} d="m 2.4334432,39.878703 c 0.06986,0.110665 0.1398117,0.219025 0.2103231,0.325561 2.0213469,-0.0031 20.0804882,-0.02708 29.2488612,0.07906 3.543445,0.04102 7.82925,-0.104402 10.415901,1.806608" custom={i++} variants={etchPath} />
                <motion.path id="right-feather-1-2" style={{ strokeWidth }} d="m 2.2556763,39.817725 c 1.8580092,2.943289 3.9751527,4.460974 5.6291137,5.23844 1.653961,0.777467 2.8613239,0.818555 2.8613239,0.818555" custom={i++} variants={etchPath} />
                <motion.path id="right-feather-2-1" style={{ strokeWidth }} d="m 6.85,46.68 c 4.61,3.76 8.34,2.91 8.34,2.91" custom={i++} variants={etchPath} />
                <motion.path id="right-feather-2-2" style={{ strokeWidth }} d="M 6.88,46.67 27.56,43.15" custom={i++} variants={etchPath} />
                <motion.path id="right-feather-3-1" style={{ strokeWidth }} d="m 12.84,50.39 c 3.33,1.86 7.74,1.37 7.74,1.37" custom={i++} variants={etchPath} />
                <motion.path id="right-feather-3-2" style={{ strokeWidth }} d="M 12.84,50.39 29.67,44.67" custom={i++} variants={etchPath} />
                <motion.path id="right-feather-4-1" style={{ strokeWidth }} d="m 19.24,52.48 c 3.41,0.88 6.78,-0.14 6.78,-0.14" custom={i++} variants={etchPath} />
                <motion.path id="right-feather-4-2" style={{ strokeWidth }} d="M 19.26,52.47 31.94,45.85" custom={i++} variants={etchPath} />
                <motion.path id="right-feather-5-1" style={{ strokeWidth }} d="m 25.18,52.95 c 2.48,0.19 5.05,-0.49 5.05,-0.49" custom={i++} variants={etchPath} />
                <motion.path id="right-feather-5-2" style={{ strokeWidth }} d="m 25.21,52.93 9.06,-6.46" custom={i++} variants={etchPath} />
                <motion.path id="right-feather-6-1" style={{ strokeWidth }} d="m 29.58,53.09 c 2.53,0.09 4.01,-0.83 4.01,-0.83" custom={i++} variants={etchPath} />
                <motion.path id="right-feather-6-2" style={{ strokeWidth }} d="M 29.59,53.07 36.41,46.6" custom={i++} variants={etchPath} />
                <motion.path id="right-feather-7-1" style={{ strokeWidth }} d="m 32.94,53.04 c 2.57,-0.09 3.27,-0.77 3.27,-0.77" custom={i++} variants={etchPath} />
                <motion.path id="right-feather-7-2" style={{ strokeWidth }} d="m 32.96,53.03 5.4,-6.4" custom={i++} variants={etchPath} />
                <motion.path id="right-feather-8-1" style={{ strokeWidth }} d="m 35.8,53.04 c 1.96,-0.05 2.77,-0.94 2.77,-0.94" custom={i++} variants={etchPath} />
                <motion.path id="right-feather-8-2" style={{ strokeWidth }} d="m 35.75,53.03 3.95,-6.38" custom={i++} variants={etchPath} />
                <motion.path id="right-feather-9-1" style={{ strokeWidth }} d="m 38.23,52.96 c 1.5,-0.09 1.96,-0.82 1.96,-0.82" custom={i++} variants={etchPath} />
                <motion.path id="right-feather-9-2" style={{ strokeWidth }} d="m 38.24,52.93 2.59,-6.28" custom={i++} variants={etchPath} />
                <motion.path id="right-feather-10-1" style={{ strokeWidth }} d="m 39.94,52.95 c 1.82,0.2 2.27,-0.88 2.27,-0.88" custom={i++} variants={etchPath} />
                <motion.path id="right-feather-10-2" style={{ strokeWidth }} d="M 39.95,52.92 41.85,46.67" custom={i++} variants={etchPath} />
                <motion.path id="right-feather-11-1" style={{ strokeWidth }} d="m 41.98,53.22 c 0.63,-0.12 0.72,0.03 0.92,0.16 0.47,0.28 0.78,1.03 0.78,1.03" custom={i++} variants={etchPath} />
                <motion.path id="right-feather-11-2" style={{ strokeWidth }} d="m 41.97,53.21 1.36,-6.53" custom={i++} variants={etchPath} />
            </motion.g>
          </motion.g>

        </g>
      </motion.svg>
    );
  }
);

KhepriIconMotion.displayName = "KhepriIconMotion";