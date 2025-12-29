import React, { forwardRef } from "react";

export const ScarabIcon = forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
  ({ className, ...props }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* ☀️ CELESTIAL ANCHORS */}
      <g id="orbs">
        <circle id="solar-orb" cx="50.27953" cy="31.936274" r="5.1834912" strokeWidth="0.46" />
        <circle id="lunar-orb" cx="50.326851" cy="60.944134" r="1.5373811" strokeWidth="0.36" />
      </g>

      {/* 🪽 THE WING PLUMAGE (Absolute Path Integrity) */}
      <g id="wings">
        <g id="left-wing">
           <path d="m 24.693253,40.196604 c 5.561069,6.670069 10.782115,6.362381 10.782115,6.362381 l 9.442758,0.09625" strokeWidth="0.35" />
           {/* ... all feather paths from your master XML ... */}
           <path d="m 2.4334432,39.878703 c 2.0213469,-0.0031 20.0804882,-0.02708 29.2488612,0.07906 3.543445,0.04102 7.82925,-0.104402 10.415901,1.806608" strokeWidth="0.35" />
           <path d="m 6.8455815,46.678622 c 4.6102645,3.762523 8.3449425,2.906603 8.3449425,2.906603" strokeWidth="0.35" />
           <path d="m 12.835743,50.392996 c 3.330795,1.857592 7.743316,1.372098 7.743316,1.372098" strokeWidth="0.35" />
        </g>
        <g id="right-wing" transform="matrix(-1,0,0,1,100.72,0)">
           <path d="m 24.693253,40.196604 c 5.561069,6.670069 10.782115,6.362381 10.782115,6.362381 l 9.442758,0.09625" strokeWidth="0.35" />
           {/* ... mirrored wing data ... */}
        </g>
      </g>

      {/* 🦵 THE SIX SACRED LIMBS (Securing the Orbs) */}
      <g id="limbs">
        {/* Left Foreleg (Securing Solar Orb) */}
        <path d="m 46.866981,42.465625 c -3.042708,0.03307 -3.68763,-0.727605 -3.819921,-1.852084 -0.132292,-1.124479 0.363802,-1.190625 0.363802,-1.190625 l 1.900518,-2.696447" strokeWidth="0.35" />
        {/* Right Foreleg (Securing Solar Orb) */}
        <path d="m 54.101045,42.465625 c 3.042708,0.03307 3.68763,-0.727605 3.819921,-1.852084 0.132292,-1.124479 -0.363802,-1.190625 -0.363802,-1.190625 l -1.900518,-2.696447" strokeWidth="0.35" />
        
        {/* Left Hindleg (Securing Lunar Orb) */}
        <path d="m 43.679285,54.381561 0.959287,-3.70216 m -0.963127,3.725545 c 0,0 -0.06615,0.429948 -0.03307,1.686719 2.182813,1.653646" strokeWidth="0.35" />
        {/* Right Hindleg (Securing Lunar Orb) */}
        <path d="m 57.288741,54.381561 -0.959287,-3.70216 m 0.963127,3.725545 c 0,0 0.06615,0.429948 0.03307,1.686719 -2.182813,1.653646" strokeWidth="0.35" />

        {/* Mid Legs (The Stability) */}
        <path d="m 45.3,46.32 c 0.05,-0.45 0.67,-0.93 2.25,-0.68" strokeWidth="0.35" />
        <path d="m 55.67,46.32 c -0.05,-0.45 -0.67,-0.93 -2.25,-0.68" strokeWidth="0.35" />
      </g>

      {/* 🫀 THE CORE BODY */}
      <g id="anatomy">
        <path id="head" d="m 50.484013,39.195076 c 2.174907,0.02339 2.414612,2.48477 2.414612,2.48477 m -2.414612,-2.48477 c -2.174907,0.02339 -2.414612,2.48477 -2.414612,2.48477" strokeWidth="0.35" />
        <path id="thorax" d="m 55.64,46.24 c 0.56,0.99 0.7,3.33 0.62,5.74 -0.04,1.06 -0.55,1.86 -0.55,1.86" strokeWidth="0.35" />
      </g>
    </svg>
  )
);

ScarabIcon.displayName = "ScarabIcon";
export default ScarabIcon;