import React from 'react';
import {AbsoluteFill, Composition, Img, Sequence, interpolate, registerRoot, staticFile, useCurrentFrame} from 'remotion';

// Every screen image is a screenshot of ratemydegrees.com taken while navigating
// the live form on 2026-10-09. Cursor and labels are editorial overlays.
const fps = 30;
const W = 1080;
const H = 1920;
const image = {left: 40, top: 155, width: 1000, height: 1558.9};
const seconds = [2, 1.6, 1, 1.2, .8, 1, 1.2, 1.6, 3.1, 1.2, 1.6, 2, 1.2, 2.3, 1.1, 2.5, 3.2];
const scenes = [
  ['01-home.jpg', 'Write a review', 'Start on RateMyDegrees', [491, 804]],
  ['02-degree-empty.jpg', 'Choose your school', 'Search the school list', [145, 514]],
  ['03-school-typing.jpg', 'Search school', 'Suggestions appear as you type', [215, 513]],
  ['04-school-options.jpg', 'Select the match', 'University of Florida', [165, 646]],
  ['05-school-selected.jpg', 'Find your degree', 'Next, use the degree search', [160, 625]],
  ['06-degree-typing.jpg', 'Search degree', 'Type the program name', [175, 625]],
  ['07-degree-options.jpg', 'Select your degree', 'Computer Science', [170, 880]],
  ['08-degree-selected.jpg', 'Confirm your details', 'Set status; study year is optional', [98, 999]],
  ['09-ratings-top.jpg', 'Rate what you know', 'Categories can be not applicable', [362, 609]],
  ['10-overall-empty.jpg', 'Overall satisfaction', 'Required to continue', [340, 372]],
  ['11-overall-selected.jpg', 'Choose a rating', 'Then move to your experience', [590, 480]],
  ['12-experience-empty.jpg', 'Describe your experience', 'Two written responses are required', [245, 613]],
  ['13-experience-typing-a.jpg', 'What was studying like?', 'Write in your own words', [170, 616]],
  ['14-experience-typed-a.jpg', 'Add the details', 'Coursework, teaching, workload, support', [178, 817]],
  ['15-experience-typing-b.jpg', 'Your biggest challenge', 'What was hardest for you?', [174, 829]],
  ['16-experience-typed-b.jpg', 'Review your answers', 'Check before continuing', [551, 978]],
  ['17-signin-final.jpg', 'Sign in to submit', 'Submission requires sign-in', [558, 938]],
].map(([file, title, detail, target], i) => ({file, title, detail, target, length: Math.round(seconds[i] * fps)}));
const total = scenes.reduce((n, scene) => n + scene.length, 0);
const overlap = 8;

function Cursor({x, y, ringOpacity, ringScale}) {
  const s = 38;
  return <div style={{position:'absolute', left:x, top:y, width:92, height:92, pointerEvents:'none'}}>
    <div style={{position:'absolute', left:-30, top:-30, width:94, height:94, border:'5px solid #cf704e', borderRadius:'50%', opacity:ringOpacity, transform:`scale(${ringScale})`}} />
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
  const moveFrames = Math.min(15, Math.max(8, Math.round(duration*.25)));
  const travel = 1-Math.pow(1-Math.min(1, f/moveFrames), 3);
  const cursorX = cx - 110 * (1-travel);
  const cursorY = cy - 70 * (1-travel);
  const clickScene = ![2, 5, 12, 13, 15, 16].includes(index);
  const ringTime = f-moveFrames;
  const ringOpacity = clickScene && ringTime >= 0 && ringTime < 12 ? .8*(1-ringTime/12) : 0;
  const ringScale = .5 + Math.max(0,Math.min(1,ringTime/12))*.85;
  return <AbsoluteFill style={{opacity:fadeIn*fadeOut}}>
    <div style={{position:'absolute', left:25, top:43, width:1030, height:83, display:'flex', alignItems:'center', justifyContent:'space-between', color:'#29251e'}}>
      <div style={{fontFamily:'Arial', fontSize:37, fontWeight:900, letterSpacing:-1}}>HOW TO LEAVE A REVIEW</div>
      <div style={{background:'#d8ec85', border:'2px solid #29251e', borderRadius:30, padding:'10px 19px', fontFamily:'Arial', fontSize:22, fontWeight:800}}>{index === 0 ? 'START' : `STEP ${index < 8 ? 1 : index < 11 ? 2 : 3} / 3`}</div>
    </div>
    <div style={{position:'absolute', left:image.left, top:image.top, width:image.width, height:image.height, overflow:'hidden', background:'#fff9e9', border:'3px solid #29251e', borderRadius:29, boxShadow:'10px 12px 0 #29251e'}}>
      <Img src={staticFile('walkthrough-v2/'+scene.file)} style={{width:'100%', height:'100%', objectFit:'fill', transform:`translateY(${drift}px) scale(${zoom})`, transformOrigin:'50% 50%'}} />
    </div>
    <Cursor x={cursorX} y={cursorY} ringOpacity={ringOpacity} ringScale={ringScale}/>
    <div style={{position:'absolute', left:40, top:1761, width:1000, fontFamily:'Arial', color:'#29251e'}}>
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
  </AbsoluteFill>;
}

registerRoot(() => <Composition id="LeaveReviewWalkthroughV2" component={Walkthrough} durationInFrames={total} fps={fps} width={W} height={H}/>);
