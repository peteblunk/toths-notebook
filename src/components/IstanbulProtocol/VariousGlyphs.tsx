import React from 'react';

interface HeroGlyphsProps {
  ritualStage: number;
}

export const VariousGlyphs = ({ ritualStage, color = "#00FFFF" }: { ritualStage: number, color?: string }) => {
  const ink = color; // The Logic Flame variable
  const sw = 1.24
  const opacityValue = ritualStage >= 2 ? 1 : 0.4;
  return (
<g id="hero-glyphs-layer"
    className="animate-float-slow"
  fill="none" 
      stroke={ink} 
      style={{ 
        strokeWidth: `${sw}px`, 
        vectorEffect: 'non-scaling-stroke'
      }}>
    <g id="various-glyphs-master">
      {/* Register II: The High Frieze (Corrected Coordinates) */}

<g 
  id="pharaoh-and-subject-frieze" 
  stroke={ink}
  fill="none" 
  strokeWidth="0.23"
  
>
  {/* The figures now live at Y=42-54, right at the top! */}
  <path id="path161" d="m 18.256,43.722 1.256,-1.058 1.785,-0.33 -2.116,-5.49 2.711,2.513 1.058,1.918 -0.396,1.19 1.984,0.793 1.058,1.852 2.05,1.389 1.058,-0.264 0.463,-0.264" />
  <path id="path162" d="m 22.82,47.228 3.373,0.529 0.463,4.762 2.05,1.256 -3.042,-0.066 -0.198,-3.968 -1.984,-0.992" />
  <path id="path163" d="m 37.107,42.862 h -1.124 l -0.463,0.926 -0.066,0.793 0.727,0.264 0.264,0.727 -1.19,0.132 -1.521,0.926 v 1.058 l -0.264,0.066 -2.05,-2.315 0.066,-0.992 -1.058,-0.066 -0.264,1.389 1.124,1.256 1.984,2.116 2.116,-2.381 c 0,0 -0.198,0.396 -0.33,0.859 -0.132,0.463 0.926,1.785 0.793,2.381 -0.132,0.595 -4.034,-0.793 -4.034,-0.793 l 1.19,2.976 -0.727,0.793" />
  <path id="path164" d="m 32.146,51.461 -1.653,1.322" />
  <path id="path165" d="m 37.041,42.796 1.124,0.727 0.661,2.248" />
  <path id="path166" d="m 37.041,44.78 1.19,0.529 0.529,0.727 0.793,0.396 c 0,0 0.066,0.132 0,0.396 -0.066,0.264 -0.33,0.264 -0.727,0.595 -0.396,0.33 -1.19,0.727 -1.256,1.389 -0.066,0.661 0.264,3.77 0.264,3.77 l -0.793,0.33 0.066,0.595" />
  <path id="path167" d="m 37.306,52.387 -2.182,0.529 -0.595,0.132 -0.727,1.058" />
  <path id="path168" d="m 23.614,43.656 -0.132,0.694 -0.496,0.694 -0.198,0.826 0.628,0.595 h 0.926 l 0.396,-0.363 0.429,0.165" />
  <path id="path169" d="m 20.042,54.173 0.099,-3.175 2.711,0.066 -0.066,3.108" />
  <path id="path170" d="m 22.985,51.296 0.661,0.76 0.33,1.389 0.463,0.033 -0.066,-3.836" />
  <path id="path171" d="m 23.415,48.683 -2.943,-0.066 -0.727,-0.396 0.363,-0.926 -0.363,-1.951 -0.264,-1.256" />
  <path id="path172" d="m 18.123,43.689 -0.066,2.017 0.099,1.719 0.429,1.686" />
  <path id="path173" d="M 19.81,49.014 19.281,47.459 19.38,44.119" />
</g>
     
     {/* VARIOUS GLYPHS UPPER - The Celestial Terrace (X-Correction: -1.5) */}
<g id="various-glyphs-upper" transform="translate(-1.5, 0)">
  
  {/* Register Borders - Framing the Upper Titles */}
  <path id="encircling-border-left" d="m 33.668,74.695 -9.326,-0.033 v 18.967" stroke={ink} strokeWidth="0.2" fill="none" />
  <path id="encircling-border-right" d="m 33.701,93.629 0.081,-18.828" stroke={ink} strokeWidth="0.2" fill="none" />

  {/* The Royal Sled - Foundation for the Bull */}
  <path id="glyph-59-sled-under-bull" d="m 33.05,83.037 0.127,-2.046 -0.712,-0.018 0.127,1.68 c 0,0 -6.542,-0.077 -6.652,-0.132 -0.109,-0.054 -0.36,-0.155 -0.36,-0.155 0,0 -0.411,-0.15 -0.663,-0.014 -0.301,0.162 -0.587,0.302 -0.26,0.615 0.353,0.337 0.73,0.213 0.877,0.213 0.323,0 0.501,-0.362 0.683,-0.343 0.182,0.018 6.833,0.2 6.833,0.2" stroke={ink} fill="none" strokeWidth="0.2" />

  {/* The Celestial Arc & The Crook (Scepter of Power) */}
  <path id="arc" d="m 26.940,85.850 0.140,-0.678 c 0,0 0.252,-0.555 0.956,-0.959 0.427,-0.245 1.365,-0.241 1.990,-0.034 0.752,0.249 1.262,1.110 1.262,1.110" stroke={ink} fill="none" strokeWidth="0.2" />
  <path id="crook-top" d="m 27.244,86.364 -0.608,0.561" stroke={ink} strokeWidth="0.2" fill="none" />
  <path id="crook-shaft" d="m 26.870,86.715 0.046,1.239" stroke={ink} strokeWidth="0.2" fill="none" />

  {/* The Enthroned Figure */}
  <g id="enthroned-figure">
    <path id="head" d="m 27.384,88.387 c -0.016,-0.231 -0.694,-0.181 -1.008,-0.066 -0.314,0.115 -0.595,0.793 -0.330,0.992 0.264,0.198 0.430,0.300 0.677,0.066 0.314,-0.297 0.644,-0.876 0.644,-0.876" stroke={ink} strokeWidth="0.2" fill="none" />
    <path id="body" d="m 26.507,89.577 -0.231,3.175 -1.537,-1.885 0.066,1.587 0.446,0.744 -0.429,0.363" stroke={ink} strokeWidth="0.2" fill="none" />
    <path id="throne" d="m 27.500,89.114 -0.578,1.438 0.429,1.025 -0.127,1.870" stroke={ink} strokeWidth="0.2" fill="none" />
    <path id="throne-base" d="m 27.209,93.485 -1.987,0.046" stroke={ink} strokeWidth="0.2" fill="none" />
  </g>

  {/* THE OWL (Miniature Watcher) - Using your scale/translate logic */}
  <g id="glyph-owl-mini" stroke={ink} fill="none" strokeWidth="0.25" transform="translate(13.36, -35.5) scale(0.63, 0.72)">
    <path id="owl-body" d="m 23.78,169.24 h 1.66 c 0.72,0 0.36,1.48 0.93,1.42 0.32,-0.03 1.67,1.19 2.85,2.8 1.44,1.96 2.7,4.24 2.7,4.24 0,0 -0.08,0.37 -0.15,0.46 -0.07,0.09 -1.98,0.17 -2.38,-0.03 -0.39,-0.21 -1.1,-1.64 -1.3,-1.89 -0.19,-0.24 -0.59,-0.61 -0.82,-0.62 -0.23,-0.01 -0.15,0.1 -0.17,0.49 -0.01,0.39 -0.57,0.43 -0.71,0.37 -0.64,-0.26 -0.72,-0.15 -1.45,-0.71 l -0.18,-2.97 c 0,0 -1.02,-1.12 -1.21,-1.54 -0.18,-0.42 -0.18,-1.09 -0.09,-1.28 0.09,-0.18 0.35,-0.74 0.35,-0.74 z" />
    <path id="owl-crest" d="m 23.74,169.36 0.95,0.64 0.94,-0.58" />
    <ellipse id="owl-eye-l" cx="24.21" cy="170.57" rx="0.2" ry="0.16" />
    <ellipse id="owl-eye-r" cx="25.41" cy="170.52" rx="0.24" ry="0.18" />
    <path id="owl-beak" d="m 24.42,170.56 0.09,1.01 0.28,0.32 0.29,-0.35 0.06,-1" />
    <path id="owl-fore-leg" d="m 25.11,176 c 0.02,0.74 -0.23,1.66 -0.44,1.8 -0.21,0.14 -1.21,-0.14 -1.21,-0.14" />
  <path id="owl-hind-leg" d="m 26.24,176.46 c -0.01,0.3 -0.09,1.3 -0.28,1.44 -0.18,0.14 -1.22,0 -1.22,0" />
  <path id="owl-feather-1" d="M 31.15,178.23 30.41,177.28" />
  <path id="owl-feather-2" d="m 30.3,178.26 -0.63,-0.85" />
  </g>

  {/* Foundation Sled for the Tier */}
  <path id="glyph-foundation-sled" d="m 24.111,94.316 0.502,-0.292 8.804,0.409 v -0.327" stroke={ink} strokeWidth="0.19" fill="none" />
</g>

      {/* --- VARIOUS GLYPHS: MID (The Functional Tier) --- */}
    
<g id="various-glyphs-mid">
  
  {/* GLYPH-W: The Loom/Standard Cluster */}
  {/* Nudged left by ~0.8 to center the Spine on 27.5 */}
  <g id="glyph-w" transform="translate(-0.8, 0)">
    {/* Stool Spine: Now at 27.5 exactly */}
    <path id="path109" d="m 24.7,135.98 -0.006,8.3" fill="none" stroke={ink} strokeWidth="0.25" strokeLinecap="round" />
    <path id="path110" d="m 23.9,144.35 h 1.65" fill="none" stroke={ink} strokeWidth="0.25" />
    <path id="path111" d="m 24.02,143.63 v 0.64" fill="none" stroke={ink} strokeWidth="0.25" />
    <path id="path112" d="m 25.4,143.63 v 0.64" fill="none" stroke={ink} strokeWidth="0.25" />

    {/* Refined Curve (Mouth-like detail) - Balanced around the spine */}
    <path
      id="path46-4"
      d="m 33.19,144.22 c 0,0 -0.33,-0.06 -0.72,-0.22 -0.94,-0.37 -1.85,-1.05 -2.75,-1.05 -0.89,0 -2.09,0.39 -2.71,0.71 -0.58,0.3 -1.07,0.46 -1.07,0.46 -0.02,0 0.45,0.07 1.28,0.25 0.7,0.15 1.77,0.6 2.81,0.49 1.64,-0.16 3.16,-0.65 3.16,-0.65"
      fill="none" stroke={ink} strokeWidth="0.19" strokeLinecap="round"
    />

    {/* Structural Braces */}
    <path id="path113" d="m 31.72,135.69 c 0,0 2.11,2.94 2.29,3.12 0.18,0.18 0.1,0.59 0.1,0.59" fill="none" stroke={ink} strokeWidth="0.25" />
    <path id="path114" d="m 25.76,139.08 2.42,0.02" fill="none" stroke={ink} strokeWidth="0.25" />
    <path id="path115" d="m 29.94,139.08 2.14,0.02" fill="none" stroke={ink} strokeWidth="0.25" />
    <path id="path116" d="m 25.27,137.53 c 1.33,0.98 3.07,0.95 3.07,0.95" fill="none" stroke={ink} strokeWidth="0.25" />
    <path id="path117" d="m 29.66,138.46 c 2.22,0.01 3.72,-1.21 3.72,-1.21" fill="none" stroke={ink} strokeWidth="0.25" />
    <path id="path118" d="m 28.40,138.49 c -0.008,-0.34 -0.04,-0.77 0.07,-0.9 0.22,-0.25 0.69,-0.2 0.69,-0.2 l 0.58,-0.39" fill="none" stroke={ink} strokeWidth="0.25" />
    <path id="path119" d="m 33.09,141.91 -6.09,-0.02 c -0.35,0 -1.18,0.01 -1.19,-0.93 -0.006,-0.61 0.48,-0.65 1.23,-0.66 1.31,-0.02 2.99,0 4.05,-0.01 1.06,-0.009 1.99,-0.06 1.9,-0.6 -0.05,0.43 -1.29,0.27 -3.09,0.26 -1.71,-0.005 -3.47,-0.04 -3.47,-0.04" fill="none" stroke={ink} strokeWidth="0.25" />
    <path id="path120" d="M 25.73,139.12 V 139.38" fill="none" stroke={ink} strokeWidth="0.19" />
  </g>

  {/* THE WARDEN'S CLUSTER: Updated transform for absolute centering */}
  <g id="glyph-n-warden-cluster" stroke={ink} fill="none" strokeWidth="0.2" transform="translate(-0.35, 0)">
    <path id="warden-line-upper" d="m 23.5, 152.5 h 8" />
    <path id="warden-line-mid" d="m 23.5, 152.9 c 0.8,0.03 0.7,0.2 0.7,0.4 -0.01,0.3 -0.8,0.5 -0.8,0.5 h 8.5" />
    <path id="sma-tawy-upper" d="m 23.5, 155.2 0.4,-0.4 h 8.4 l 0.4,0.4" />
    {/* Anchor Stool-P: Already Perfect */}
    <path id="stool-p" d="m 26.0, 159.9 v -4.0 h 4.1 v 3.9 h -2.1 v -2.8" />
    <path id="mouth-glyph" d="m 32.7, 162.2 c 0,0 -0.4,-0.07 -0.9,-0.25 -1.1,-0.4 -2.3,-1.1 -3.4,-1.1 -1.1,0 -2.6,0.4 -3.4,0.8 -0.7,0.3 -1.3,0.5 -1.3,0.5 -0.03,-0.01 0.5,0.08 1.6,0.2 0.8,0.1 2.2,0.6 3.5,0.5 2.0,-0.1 3.9,-0.7 3.9,-0.7" />
    <path id="sma-tawy-lower" d="m 23.4, 164.2 0.4,-0.4 h 8.4 l 0.4,0.4" />
  </g>
  
  {/* THE SLED: Fine-tuned to -0.65 to mirror the Warden's Nudge */}
  <g id="glyph-5-sled" stroke={ink} fill="none" strokeWidth="0.19" transform="translate(-0.65, 0)">
    <path id="sled-path" d="m 23.31,179.45 -0.01,-0.37 8.68,0.2 -0.36,-0.76 1.09,-0.03 -0.09,1.12 z" />
  </g>
</g>

      {/* --- VARIOUS GLYPHS: LOWER (The Foundation Tier) --- */}
      <g id="g10" inkscape-label="various-glyphs-lower">
      {/* SMA-TAWY-BASE-LOWER: The Unification Foundation */}
      <path
        id="sma-tawy-base-lower"
       
        d="m 23.114767,194.01906 0.446485,-0.44648 h 8.433593 l 0.463021,0.46302"
        fill="none"
        stroke={ink}
        strokeWidth="0.192035"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* SCYTHE: The Ritual Harvest Tool */}
      <path
        id="scythe"
        d="m 23.117726,194.97463 c 0.51028,0.76224 0.922812,1.14766 1.55467,1.14776 1.007121,1.6e-4 2.095631,-0.95108 2.095631,-0.95108 l 5.672835,-0.0117 v 0.69884 h -2.155884 l -0.841899,-0.6665"
        fill="none"
        stroke={ink}
        strokeWidth="0.192035"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>

      {/* --- NON-HERO GLYPHS: THE CAPTIVE AND RITUAL OBJECTS --- */}
     <g id="non-hero-glyphs">
      {/* 1. the-captive */}
      <g id="the-captive">
        <path id="glyph-3-11" d="m 28.172613,210.65514 c -0.438486,-0.0731 -0.584647,1.68086 -0.986589,1.75394 -0.401944,0.0731 -1.030077,0.42897 -0.913509,0.89524 0.219241,0.87696 -0.913509,1.44334 -0.913509,1.44334" fill="none" stroke={ink} strokeWidth="0.258" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 1 }} />
        <path id="glyph-3-10" d="m 23.276205,214.89382 1.644317,0.84043 0.423538,-0.97367" fill="none" stroke={ink} strokeWidth="0.258" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 1 }} />
        <path id="glyph-3-9" d="m 27.336533,212.33613 c 0.930164,0.28421 1.11103,0.64594 1.085194,1.03351 -0.02585,0.38757 -0.542597,0.5426 -0.568437,0.77514 -0.02585,0.23254 -0.310054,0.87849 0.155028,0.85265 0.465084,-0.0259 0.671787,-0.49092 0.671787,-0.49092 l 1.007679,2.37709 -1.731142,-0.12919 -0.155027,-0.31005" fill="none" stroke={ink} strokeWidth="0.258" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 1 }} />
        <path id="glyph-3-8" d="m 27.788698,216.4702 c 0.310054,1.24022 -0.142121,1.80865 -0.142121,1.80865 l -0.671785,0.23254 0.490918,1.34358 -0.620109,0.0775 0.232542,-0.36173 c 0,0 0.258379,-0.3359 -0.155027,-0.49092 -0.413409,-0.15503 -1.240222,0.87849 -1.240222,0.87849 0,0 -1.808655,0.43924 -1.808655,-0.15503 0,-0.59427 0.671786,-0.87849 0.671786,-0.87849 l 0.180865,-0.31006 c 0,0 -0.62011,-0.80097 -0.930165,-1.18854 -0.310055,-0.38757 -0.07751,-0.956 0.258379,-0.64595 0.335893,0.31005 1.085193,0.49092 1.343573,0.46508 0.258379,-0.0258 0.800976,-0.7493 0.852651,-0.98184 0.05168,-0.23254 -0.07751,-1.13687 -0.232541,-1.05935 -0.155028,0.0775 -0.671786,0.12919 -0.697624,0.46508 -0.02584,0.33589 -0.542597,1.11103 -0.62011,0.98184 -0.07751,-0.12919 -1.653628,-1.65363 -1.653628,-1.65363" fill="none" stroke={ink} strokeWidth="0.258" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 1 }} />
        <path id="glyph-3-7" d="m 22.969922,211.38012 c 0.155027,-1.36941 1.522226,-1.67145 2.351252,-1.44692 1.24022,0.33589 1.291895,1.4986 1.291895,1.4986" fill="none" stroke={ink} strokeWidth="0.258" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 1 }} />
        <path id="glyph-3-6" d="m 23.61587,212.3878 -0.103352,1.96368" fill="none" stroke={ink} strokeWidth="0.258" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 1 }} />
        <path id="glyph-3-5" d="m 31.936269,209.96342 v 2.09544" fill="none" stroke={ink} strokeWidth="0.242" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 1 }} />
        <path id="glyph-3-4" d="m 31.93627,212.77448 v 2.22896" fill="none" stroke={ink} strokeWidth="0.258" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 1 }} />
        <path id="glyph-3-3" d="m 31.93627,215.6479 v 1.99972" fill="none" stroke={ink} strokeWidth="0.244" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 1 }} />
        <path id="glyph-3-1" d="m 31.97281,218.40007 v 1.56113" fill="none" stroke={ink} strokeWidth="0.216" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 1 }} />
        <path id="glyph-3-2" d="m 26.592243,211.43163 -3.57182,-0.064" fill="none" stroke={ink} strokeWidth="0.258" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 1 }} />
      </g>

      {/* 2. eye */}
      <g id="eye">
        <path id="outer-eye" d="m 32.30962,202.85637 c 0,0 -0.448649,-0.081 -0.981618,-0.27699 -1.281377,-0.47116 -2.534203,-1.35161 -3.740036,-1.31507 -1.205829,0.0365 -2.795088,0.60556 -3.617494,1.05967 -0.7714,0.42594 -1.429126,0.66843 -1.429126,0.66843 -0.0389,-0.008 0.60892,0.0906 1.73589,0.30119 0.952955,0.17805 2.409785,0.74586 3.797598,0.5647 2.205555,-0.2879 4.229817,-0.99102 4.229817,-0.99102" fill="none" stroke={ink} strokeWidth="0.258" strokeLinecap="round" strokeLinejoin="round" />
        <circle id="pupil" cx="28.053858" cy="202.84464" r="0.93017626" fill="none" stroke={ink} strokeWidth="0.279" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* 3. sled-and-loaf */}
      <g id="sled-and-loaf">
        <path id="sled" d="m 31.790108,241.60482 0.109622,2.74053 -0.730808,0.32886 -6.650344,-0.1827 -1.644316,0.0731 -0.548106,-0.58465 1.900099,-0.25578 0.548105,0.36541 h 6.284942 l 0.10962,-2.52129 z" fill="none" stroke={ink} strokeWidth="0.258" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 1 }} />
        <path id="loaf" d="m 25.408465,242.98708 c 0.03654,-1.57123 1.814098,-1.52842 1.814098,-1.52842 0,0 0.08456,-0.003 0.12919,0 1.556351,0.0937 1.680856,1.53469 1.680856,1.53469 z" fill="none" stroke={ink} strokeWidth="0.258" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 1 }} />
      </g>

      {/* 4. glyph-2-oar */}
      <g id="glyph-2-oar">
        <path id="oar-4" d="m 25.066683,226.80598 c -0.876969,-0.40195 -1.426123,-0.41332 -1.790478,-0.21925 -0.488952,0.26043 -1.042992,0.6809 -0.548105,1.31546 0.298211,0.38237 0.901351,0.48977 1.607776,0.3654 1.152141,-0.20285 0.804432,-0.41579 0.804432,-0.41579 l -0.697624,-0.38756" fill="none" stroke={ink} strokeWidth="0.258" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 1 }} />
        <path id="oar-3" d="m 24.210142,228.30397 -0.05168,6.04607 -0.852651,0.93017 h 1.4986 l -0.645949,-0.90433" fill="none" stroke={ink} strokeWidth="0.258" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 1 }} />
        <path id="oar-2" d="m 23.150787,233.9108 0.684705,0.58135" fill="none" stroke={ink} strokeWidth="0.258" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 1 }} />
        <path id="oar-1" d="m 25.11447,233.92372 -0.723462,0.6847" fill="none" stroke={ink} strokeWidth="0.258" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 1 }} />
      </g>

      {/* 5. sled-loaf-and-solar-disc */}
      <g id="sled-loaf-and-solar-disc">
        <path id="glyph-4-scythe" d="m 32.411294,200.53346 c 0,0 -7.582124,-0.12789 -8.148499,-0.0365 -0.716055,0.11549 -0.858236,0.50718 -1.461614,0.25578 -0.657727,-0.27405 -0.182702,-0.8587 0.328863,-0.93178 0.511565,-0.0731 0.621186,0.0914 1.132751,0.1279 0.511565,0.0365 7.308071,0 7.308071,0 v -2.33858 h 0.803886 z" fill="none" stroke={ink} strokeWidth="0.258" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 1 }} />
        <circle id="glyph-4-solar-disc" cx="29.396717" cy="197.95737" r="1.2878548" fill="none" stroke={ink} strokeWidth="0.243" strokeLinecap="round" strokeLinejoin="round" />
        <path id="glyph-4-loaf" d="m 26.893653,198.92983 c 0,0 -1.514411,0.0676 -2.408935,0.0441 -0.388654,0.01 -0.422036,-0.0528 -0.395792,-0.4265 0.0294,-0.41862 0.472241,-0.91458 0.96061,-0.99213 1.298672,-0.2062 1.682002,0.19249 1.79217,0.45817 0.106128,0.25594 0.05195,0.91636 0.05195,0.91636 z" fill="none" stroke={ink} strokeWidth="0.243" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 1 }} />
      </g>

      {/* 6. sled-and-loaf (duplicate name but different content) */}
      <g id="sled-and-loaf-y">
        <path id="glyph-y-loaf" d="m 29.309062,182.08287 c 0,0 -1.641907,0.0733 -2.611739,0.0478 -0.421374,0.0108 -0.457566,-0.0572 -0.429113,-0.46241 0.03188,-0.45386 0.511998,-0.99157 1.041482,-1.07565 1.408005,-0.22356 1.823607,0.20869 1.943049,0.49674 0.115063,0.27749 0.05632,0.99351 0.05632,0.99351 z" fill="none" stroke={ink} strokeWidth="0.264" strokeLinecap="round" strokeLinejoin="round" />
        <path id="glyph-y-scythe" d="m 32.695598,183.41374 c 0,0 -7.300611,-0.12314 -7.845958,-0.0351 -0.689469,0.1112 -0.826371,0.48835 -1.407346,0.24629 -0.633307,-0.26388 -0.175919,-0.82682 0.316653,-0.89719 0.492571,-0.0704 0.598122,0.088 1.090693,0.12315 0.492572,0.0351 7.036734,0 7.036734,0 v -2.25175 h 0.774039 z" fill="none" stroke={ink} strokeWidth="0.248" strokeLinecap="round" strokeLinejoin="round" />
      </g>

  {/* 7. GLYPH-SEREKH - The Palace Facade (Y=95-105) */}

<g id="glyph-serekh" transform="translate(-1.2, 0)">
  {/* Outer Frame */}
  <path id="path3" d="m 23.956,105.657 0.129,-9.844" stroke={ink} strokeWidth="0.3" fill="none" strokeLinecap="round" />
  <path id="path3-8" d="m 33.541,105.754 0.129,-9.844" stroke={ink} strokeWidth="0.3" fill="none" strokeLinecap="round" />
  <path id="path4" d="m 24.105,95.255 0.002,-0.393 9.585,0.081 0.004,0.408" stroke={ink} strokeWidth="0.3" fill="none" />

  {/* Horizontal Rungs (Top Details) */}
  <path id="path5" d="m 24.719,95.845 1.717,0.018" stroke={ink} strokeWidth="0.3" />
  <path id="path6" d="m 24.719,96.905 1.717,0.018" stroke={ink} strokeWidth="0.3" />
  <path id="path7" d="m 24.719,98.037 1.717,0.018" stroke={ink} strokeWidth="0.3" />
 <path id="path8" d="m 26.895,95.845348 1.717396,0.01827" stroke={ink} strokeWidth="0.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
<path id="path9" d="m 26.895,96.905018 1.717396,0.01827" stroke={ink} strokeWidth="0.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
<path id="path10" d="m 26.895,98.037769 1.717396,0.01827" stroke={ink} strokeWidth="0.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
<path id="path11" d="m 29.233256,95.845348 1.717396,0.01827" stroke={ink} strokeWidth="0.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
<path id="path12" d="m 29.233256,96.905018 1.717396,0.01827" stroke={ink} strokeWidth="0.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
<path id="path13" d="m 29.233256,98.037769 1.717396,0.01827" stroke={ink} strokeWidth="0.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
<path id="path14" d="m 31.334327,95.845348 1.717396,0.01827" stroke={ink} strokeWidth="0.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
<path id="path15" d="m 31.334327,96.905018 1.717396,0.01827" stroke={ink} strokeWidth="0.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
<path id="path16" d="m 31.334327,98.037769 1.717396,0.01827" stroke={ink} strokeWidth="0.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />

  {/* Vertical Pillars (The 'Panels') */}
  <path id="path17" d="m 24.856,98.675 v 6.973" stroke={ink} strokeWidth="0.3" />
  <path id="path18" d="m 25.978,98.675 v 6.973" stroke={ink} strokeWidth="0.3" />
  <path id="path21" d="m 27.100,98.675 v 6.973" stroke={ink} strokeWidth="0.3" />
  <path id="path54" d="m 28.223,98.675 v 6.973" stroke={ink} strokeWidth="0.3" />
  <path id="path61" d="m 29.345,98.675 v 6.973" stroke={ink} strokeWidth="0.3" />
  <path id="path62" d="m 30.467,98.675 v 6.973" stroke={ink} strokeWidth="0.3" />
  <path id="path63" d="m 31.590,98.675 v 6.973" stroke={ink} strokeWidth="0.3" />
  <path id="path64" d="m 32.712,98.675 v 6.973" stroke={ink} strokeWidth="0.3" />
</g>

      {/* Register III.5: Two Loaves - Sustenance (Y=114 to Y=115) */}
{/* 7: THE TWO LOAVES - Bread of the Gods (Y=115) */}

<g id="glyph-two-loaves" stroke={ink} fill="none" strokeWidth="0.21" transform="translate(-1.1, 0)">
  {/* Left Loaf */}
  <path 
    id="loaf-left" 
    d="m 24.179,115.255 h 3.11 l 0.004,-0.003 c 0,-1.199 -1.379,-1.212 -1.379,-1.212 -1.649,-0.073 -1.735,1.214 -1.735,1.214 z" 
  />
  {/* Right Loaf */}
  <path 
    id="loaf-right" 
    d="m 30.117,115.255 h 3.11 l 0.004,-0.003 c 0,-1.199 -1.379,-1.212 -1.379,-1.212 -1.649,-0.073 -1.735,1.214 -1.735,1.214 z" 
  />
</g>

      {/* 9. glyph-cartouche */}
     {/* VARIOUS GLYPHS - THE CARTOUCHE (X-Correction: -0.85) */}
<g id="glyph-cartouche" transform="translate(-0.85, 0)">
  <rect id="rect80" x="24.944807" y="121.77338" width="7.3458333" height="1.7648401" fill="none" stroke={ink} strokeWidth="0.235" strokeLinecap="round" strokeLinejoin="round" />
  
  {/* The Tally/Hatching Marks */}
  <path id="path81" d="m 29.216612,120.82068 v 0.74908" fill="none" stroke={ink} strokeWidth="0.243" strokeLinecap="round" strokeLinejoin="round" />
  <path id="path82" d="m 32.13984,120.85722 v 0.74908" fill="none" stroke={ink} strokeWidth="0.243" strokeLinecap="round" strokeLinejoin="round" />
  <path id="path83" d="m 31.628275,120.82068 v 0.74908" fill="none" stroke={ink} strokeWidth="0.243" strokeLinecap="round" strokeLinejoin="round" />
  <path id="path84" d="m 31.226331,120.82068 v 0.74908" fill="none" stroke={ink} strokeWidth="0.243" strokeLinecap="round" strokeLinejoin="round" />
  <path id="path85" d="m 30.714766,120.82068 v 0.74908" fill="none" stroke={ink} strokeWidth="0.243" strokeLinecap="round" strokeLinejoin="round" />
  <path id="path86" d="m 25.06393,120.84652 v 0.74908" fill="none" stroke={ink} strokeWidth="0.243" strokeLinecap="round" strokeLinejoin="round" />
  <path id="path87" d="m 25.599116,120.82068 v 0.74908" fill="none" stroke={ink} strokeWidth="0.243" strokeLinecap="round" strokeLinejoin="round" />
  <path id="path88" d="m 26.147222,120.82068 v 0.74908" fill="none" stroke={ink} strokeWidth="0.243" strokeLinecap="round" strokeLinejoin="round" />
  <path id="path89" d="m 26.658787,120.82068 v 0.74908" fill="none" stroke={ink} strokeWidth="0.243" strokeLinecap="round" strokeLinejoin="round" />
  <path id="path90" d="m 27.206892,120.82068 v 0.74908" fill="none" stroke={ink} strokeWidth="0.243" strokeLinecap="round" strokeLinejoin="round" />
  <path id="path91" d="m 27.645376,120.82068 v 0.74908" fill="none" stroke={ink} strokeWidth="0.243" strokeLinecap="round" strokeLinejoin="round" />
  <path id="path92" d="m 28.120401,120.82068 v 0.74908" fill="none" stroke={ink} strokeWidth="0.243" strokeLinecap="round" strokeLinejoin="round" />
  <path id="path93" d="m 28.595426,120.82068 v 0.74908" fill="none" stroke={ink} strokeWidth="0.243" strokeLinecap="round" strokeLinejoin="round" />
  <path id="path94" d="m 29.764717,120.82068 v 0.74908" fill="none" stroke={ink} strokeWidth="0.243" strokeLinecap="round" strokeLinejoin="round" />
  <path id="path95" d="m 30.276282,120.82068 v 0.74908" fill="none" stroke={ink} strokeWidth="0.243" strokeLinecap="round" strokeLinejoin="round" />

  {/* Solar Disc and Eye of Ra Nested Below Tally */}
  <circle id="path96" cx="26.583109" cy="126.92293" r="1.7319639" fill="none" stroke={ink} strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round" />
  <g id="cartouche-eye-of-ra" transform="matrix(0.77124523,0,0,0.77124523,7.4551353,-42.104292)">
    <path id="outer-eye-2" d="m 22.692795,225.18348 c 1.313027,-0.21949 1.694557,-1.26102 2.274482,-1.63128 1.066306,-0.68079 3.736269,-0.17478 4.439776,0.36946 0.956748,0.74015 1.554153,0.69247 2.198869,0.63996 0.500526,-0.0408 -2.42939,0.84312 -3.536652,1.03052 -2.194551,0.37141 -5.376475,-0.40866 -5.376475,-0.40866 z" fill="none" stroke={ink} strokeWidth="0.236" strokeLinecap="round" strokeLinejoin="round" />
    <ellipse id="path32-45" cx="26.781017" cy="224.27324" rx="1.1139151" ry="1.0301611" fill="none" stroke={ink} strokeWidth="0.278" strokeLinecap="round" strokeLinejoin="round" />
    <path id="path97" d="m 22.835212,227.47635 0.345278,-0.59804 h 8.419724" fill="none" stroke={ink} strokeWidth="0.315" strokeLinecap="round" strokeLinejoin="round" />
  </g>

  {/* The Oval Border */}
  <path id="cartouche-border" d="m 33.207498,125.64216 c 0,2.38024 0.01685,5.77281 -0.707008,7.41964 -0.840959,1.91322 -2.795996,2.0429 -4.158876,2.0429 -1.562288,0 -3.380847,-0.30757 -4.210292,-2.72621 -0.516958,-1.50743 -0.359651,-3.5737 -0.348122,-6.73428 0.01312,-3.59624 -0.126182,-6.12581 1.00328,-7.89426 0.928081,-1.45314 2.391361,-1.67469 3.640219,-1.67469 1.138636,0 3.162354,0.50591 3.964777,1.89832 0.984749,1.7088 0.816022,4.83336 0.816022,7.66858 z" fill="none" stroke={ink} strokeWidth="0.268" strokeLinecap="round" strokeLinejoin="round" />
  
  {/* The Top Ring */}
  <circle id="path80-upper" cx="28.635214" cy="118.68042" r="1.7878751" fill="none" stroke={ink} strokeWidth="0.259" strokeLinecap="round" strokeLinejoin="round" />
</g>

      {/* 10. owl-upper */}
      <g id="owl-upper">
        <path id="path139" d="m 23.783647,169.24508 h 1.660412 c 0.724968,0 0.363413,1.48239 0.934382,1.42234 0.321374,-0.0338 1.677506,1.19663 2.858068,2.80438 1.440883,1.96228 2.700856,4.24873 2.700856,4.24873 0,0 -0.08552,0.37619 -0.155682,0.46973 -0.07016,0.0935 -1.987817,0.1754 -2.38538,-0.0351 -0.397563,-0.21047 -1.102426,-1.64503 -1.300863,-1.89307 -0.198438,-0.24805 -0.595313,-0.61185 -0.826823,-0.62839 -0.231511,-0.0165 -0.156509,0.10136 -0.173046,0.49824 -0.01654,0.39687 -0.576167,0.43418 -0.714937,0.37751 -0.640437,-0.26154 -0.725044,-0.15765 -1.451072,-0.71628 l -0.187088,-2.97003 c 0,0 -1.028988,-1.12254 -1.216077,-1.54349 -0.187088,-0.42094 -0.187088,-1.09914 -0.09354,-1.28623 0.09354,-0.18709 0.350791,-0.74836 0.350791,-0.74836 z" fill="none" stroke={ink} strokeWidth="0.192" strokeLinecap="round" strokeLinejoin="round" />
        <path id="path140" d="m 23.746354,169.3664 0.959114,0.64493 0.942579,-0.58704" fill="none" stroke={ink} strokeWidth="0.192" strokeLinecap="round" strokeLinejoin="round" />
        <ellipse id="path141" cx="24.217644" cy="170.57356" rx="0.20670572" ry="0.16536458" fill="none" stroke={ink} strokeWidth="0.192" strokeLinecap="round" strokeLinejoin="round" />
        <ellipse id="path142" cx="25.416536" cy="170.52396" rx="0.24804688" ry="0.18190104" fill="none" stroke={ink} strokeWidth="0.192" strokeLinecap="round" strokeLinejoin="round" />
        <path id="path143" d="m 24.42518,170.56955 0.09839,1.01274 0.28112,0.32246 0.297657,-0.35554 0.06531,-1.00204" fill="none" stroke={ink} strokeWidth="0.192" strokeLinecap="round" strokeLinejoin="round" />
        <path id="path144" d="m 25.116653,176.00366 c 0.02339,0.74836 -0.23386,1.66042 -0.444335,1.80073 -0.210475,0.14032 -1.216077,-0.14031 -1.216077,-0.14031" fill="none" stroke={ink} strokeWidth="0.192" strokeLinecap="round" strokeLinejoin="round" />
        <path id="path145" d="m 26.243359,176.46054 c -0.01654,0.30593 -0.09922,1.30638 -0.28112,1.44694 -0.181901,0.14056 -1.223698,0.008 -1.223698,0.008" fill="none" stroke={ink} strokeWidth="0.192" strokeLinecap="round" strokeLinejoin="round" />
        <path id="path146" d="M 31.150263,178.23704 30.413601,177.2899" fill="none" stroke={ink} strokeWidth="0.192" strokeLinecap="round" strokeLinejoin="round" />
        <path id="path147" d="m 30.308362,178.26042 -0.631423,-0.85359" fill="none" stroke={ink} strokeWidth="0.192" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </g>
    </g></g>
  );
};
