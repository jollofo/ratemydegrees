import React from 'react';
import {AbsoluteFill, Composition, Img, Sequence, interpolate, registerRoot, staticFile, useCurrentFrame} from 'remotion';

// Every screen image is a screenshot of ratemydegrees.com taken while navigating
// the live form on 2026-10-09. Cursor and labels are editorial overlays.
const fps = 30;
const W = 1080;
const H = 1920;
const image = {left: 40, top: 155, width: 1000, height: 1558.9};
const seconds = [3.5, 3, 1.5, 1.5, 1.2, 1.4, 1.7, 1.7, 5.5, 1.5, 2.3, 3.1, 1.1, 1.6, 1.1, 2.2, 4.1];
const scenes = [
  ['01-home.jpg', 'Open Write a review', 'Start from the live home page', [491, 804]],
  ['03-degree-empty.jpg', 'Find your school', 'Choose your own school and degree', [145, 514]],
  ['04-school-typing.jpg', 'Type a school name', 'Sample search shown for the demo', [215, 513]],
  ['05-school-options.jpg', 'Choose a school', 'Tap the matching school', [165, 646]],
  ['06-school-selected.jpg', 'School selected', 'University of Florida is a sample choice', [160, 625]],
  ['07-degree-typing.jpg', 'Type your degree', 'Search the degree list', [175, 625]],
  ['08-degree-options.jpg', 'Choose a degree', 'Computer Science is a sample choice', [170, 880]],
  ['09-degree-selected.jpg', 'Confirm your details', 'Set student status; study year is optional', [98, 999]],
  ['10-ratings-top.jpg', 'Rate what you know', 'Unfamiliar categories can stay not applicable', [362, 609]],
  ['11-rating-empty.jpg', 'Overall satisfaction', 'This rating is required', [340, 372]],
  ['13-rating-selected.jpg', 'Demo rating selected', 'A sample choice, not a real opinion', [590, 480]],
  ['14-experience-empty.jpg', 'Describe your experience', 'Two written answers are required', [245, 613]],
  ['15-experience-typing-a.jpg', 'Start with your own words', 'Demo text is a prompt, not a review', [170, 616]],
  ['16-experience-typed-a.jpg', 'Add firsthand details', 'Use your own coursework and support examples', [178, 817]],
  ['17-experience-typing-b.jpg', 'Name your biggest challenge', 'Keep the details personal and specific', [174, 829]],
  ['18-experience-typed-b.jpg', 'Review the written fields', 'The text here is demonstration only', [551, 978]],
  ['21-signin-final.jpg', 'Stop before submission', 'Sign in is required to submit', [558, 982]],
].map(([file, title, detail, target], i) => ({file, title, detail, target, length: Math.round(seconds[i] * fps)}));
const total = scenes.reduce((n, scene) => n + scene.length, 0);
const overlap = 8;

function Cursor({x, y, pulse}) {
  const s = 38;
  return <div style={{position:'absolute', left:x, top:y, width:92, height:92, pointerEvents:'none'}}>
    <div style={{position:'absolute', left:-30, top:-30, width:94, height:94, border:'5px solid #cf704e', borderRadius:'50%', opacity:(1-pulse)*.65, transform:`scale(${.45 + pulse*.65})`}} />
    <svg width={s} height={s} viewBox="0 0 38 38" style={{position:'absolute', left:0, top:0, filter:'drop-shadow(2px 3px 2px #0008)'}}>
      <path d="M3 2 L3 32 L12 25 L19 36 L25 33 L18 22 L31 22 Z" fill="#fff" stroke="#29251e" strokeWidth="3" strokeLinejoin="round" />
    </svg>
  </div>;
}

function Scene({scene, index}) {
  const f = useCurrentFrame();
  const duration = scene.length;
  const fadeIn = index === 0 ? 1 : interpolate(f, [0, overlap], [0, 1], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});
  const fadeOut = index === scenes.length - 1 ? 1 : interpolate(f, [duration, duration + overlap], [1, 0], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});
  const t = Math.min(1, f / duration);
  const zoom = 1.005 + t*.012;
  const drift = -t*10;
  const cx = image.left + scene.target[0] * image.width / 705;
  const cy = image.top + scene.target[1] * image.height / 1099;
  const cursorX = cx - 125 * (1 - Math.min(t/.58, 1));
  const cursorY = cy - 95 * (1 - Math.min(t/.58, 1));
  const pulse = index === scenes.length - 1 ? 1 : Math.min(1, Math.max(0, (t-.58)/.34));
  return <AbsoluteFill style={{opacity:fadeIn*fadeOut}}>
    <div style={{position:'absolute', left:25, top:43, width:1030, height:83, display:'flex', alignItems:'center', justifyContent:'space-between', color:'#29251e'}}>
      <div style={{fontFamily:'Arial', fontSize:37, fontWeight:900, letterSpacing:-1}}>HOW TO LEAVE A REVIEW</div>
      <div style={{background:'#d8ec85', border:'2px solid #29251e', borderRadius:30, padding:'10px 19px', fontFamily:'Arial', fontSize:22, fontWeight:800}}>{index === 0 ? 'START' : `STEP ${index < 8 ? 1 : index < 11 ? 2 : 3} / 3`}</div>
    </div>
    <div style={{position:'absolute', left:image.left, top:image.top, width:image.width, height:image.height, overflow:'hidden', background:'#fff9e9', border:'3px solid #29251e', borderRadius:29, boxShadow:'10px 12px 0 #29251e'}}>
      <Img src={staticFile('walkthrough/'+scene.file)} style={{width:'100%', height:'100%', objectFit:'fill', transform:`translateY(${drift}px) scale(${zoom})`, transformOrigin:'50% 50%'}} />
    </div>
    <Cursor x={cursorX} y={cursorY} pulse={pulse}/>
    <div style={{position:'absolute', left:40, top:1792, width:1000, fontFamily:'Arial', color:'#29251e'}}>
      <div style={{fontSize:40, fontWeight:900, letterSpacing:-.5, lineHeight:1.08}}>{scene.title}</div>
      <div style={{fontSize:23, marginTop:7, lineHeight:1.2}}>{scene.detail}</div>
    </div>
  </AbsoluteFill>;
}

function Walkthrough() {
  let at = 0;
  const timeline = scenes.map((scene, index) => {
    const node = <Sequence key={scene.file} from={at} durationInFrames={scene.length + (index === scenes.length-1 ? 0 : overlap)}><Scene scene={scene} index={index}/></Sequence>;
    at += scene.length;
    return node;
  });
  return <AbsoluteFill style={{background:'#fff5de'}}>
    {timeline}
    <div style={{position:'absolute', left:36, top:1891, right:36, height:8, background:'#d4c8b3', borderRadius:9}}>
      <div style={{height:'100%', width:`${(useCurrentFrame()+1)/total*100}%`, background:'#c46d50', borderRadius:9}} />
    </div>
    <div style={{position:'absolute', left:40, top:1739, background:'#f5d6c2', border:'2px solid #782e2e', borderRadius:20, padding:'7px 16px', fontFamily:'Arial', fontSize:23, fontWeight:900, color:'#782e2e', letterSpacing:1}}>DEMO ONLY · NOT SUBMITTED</div>
  </AbsoluteFill>;
}

registerRoot(() => <Composition id="LeaveReviewWalkthrough" component={Walkthrough} durationInFrames={total} fps={fps} width={W} height={H}/>);
