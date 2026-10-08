import React from 'react';
import {AbsoluteFill, Audio, Composition, Sequence, interpolate, registerRoot, spring, staticFile, useCurrentFrame} from 'remotion';
import props from './cs-pilot-props.json';

const C = {ink:'#29251e',cream:'#fff5de',orange:'#ed815d',lime:'#d8ec85',sage:'#8b9467',soft:'#d9cdb6'};
const starts = [0,90,180,285,390,510];
const lengths = [90,90,105,105,120,120];
const frameCount = 630;

function rise(frame, delay=0) {
  return spring({frame:Math.max(0,frame-delay),fps:30,config:{damping:18,stiffness:125}});
}

function Word({children,delay=0,accent=false}) {
  const frame = useCurrentFrame();
  const progress = rise(frame,delay);
  return <div style={{color:accent?C.orange:'inherit',opacity:interpolate(frame,[delay,delay+9],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'}),transform:`translateY(${(1-progress)*60}px)`,whiteSpace:'nowrap'}}>{children}</div>;
}

function Canvas({children,kicker,dark=false,background}) {
  const frame = useCurrentFrame();
  const color = dark?C.cream:C.ink;
  return <AbsoluteFill style={{background:background??(dark?C.ink:C.cream),color,padding:'300px 92px 340px',fontFamily:'Arial',overflow:'hidden'}}>
    <div style={{position:'absolute',width:740,height:740,right:-440,top:250,border:`3px solid ${color}`,borderRadius:'50%',opacity:.14,transform:`translateY(${Math.sin(frame/22)*24}px)`}} />
    <div style={{fontSize:27,fontWeight:800,letterSpacing:4,marginBottom:65}}>{kicker}</div>
    {children}
  </AbsoluteFill>;
}

function MainText({lines,size=105,accentIndex=2}) {
  return <div style={{fontFamily:'Arial',fontSize:size,fontWeight:900,lineHeight:.99,letterSpacing:-5}}>{lines.map((line,index)=><Word key={line} delay={index*7} accent={index===accentIndex}>{line}</Word>)}</div>;
}

function SceneOne({scene}) {
  const frame = useCurrentFrame();
  return <Canvas dark kicker={scene.kicker}>
    <div style={{marginTop:95}}><MainText lines={scene.lines} size={119}/></div>
    <div style={{width:190,height:11,background:C.lime,marginTop:55,transform:`scaleX(${rise(frame,13)})`,transformOrigin:'left'}} />
    <p style={{fontSize:37,lineHeight:1.32,maxWidth:730,marginTop:45}}>{scene.support}</p>
    <div style={{position:'absolute',top:1120,right:115,fontSize:245,fontWeight:900,color:C.lime,opacity:.95,transform:`rotate(${-8+Math.sin(frame/12)*3}deg) scale(${.8+.2*rise(frame,16)})`}}>?</div>
  </Canvas>;
}

function SceneTwo({scene}) {
  const frame = useCurrentFrame();
  return <Canvas kicker={scene.kicker}>
    <MainText lines={scene.lines} size={106} accentIndex={2}/>
    <p style={{fontSize:34,marginTop:40}}>{scene.support}</p>
    <div style={{marginTop:92,display:'grid',gap:19}}>{['THEORY?','PROJECTS?','PROBLEM SOLVING?'].map((item,index)=><div key={item} style={{border:`3px solid ${C.ink}`,background:index===1?C.lime:C.cream,padding:'21px 28px',fontSize:37,fontWeight:900,transform:`translateX(${(1-rise(frame,15+index*7))*800}px) rotate(${index===1?-2:1}deg)`}}>{item}</div>)}</div>
  </Canvas>;
}

function SceneThree({scene}) {
  const frame = useCurrentFrame();
  return <Canvas kicker={scene.kicker} background={C.orange}>
    <MainText lines={scene.lines} size={111} accentIndex={-1}/>
    <p style={{fontSize:34,marginTop:48}}>{scene.support}</p>
    <div style={{display:'flex',gap:25,marginTop:115,alignItems:'center'}}>
      <div style={{background:C.cream,border:`4px solid ${C.ink}`,borderRadius:24,padding:'30px 25px',fontSize:38,fontWeight:900,transform:`translateY(${(1-rise(frame,17))*130}px)`}}>IN CLASS</div>
      <div style={{fontSize:52,fontWeight:900}}>+</div>
      <div style={{background:C.ink,color:C.lime,borderRadius:24,padding:'30px 25px',fontSize:38,fontWeight:900,transform:`translateY(${(1-rise(frame,24))*130}px)`}}>ON MY OWN</div>
    </div>
  </Canvas>;
}

function SceneFour({scene}) {
  const frame = useCurrentFrame();
  return <Canvas kicker={scene.kicker} background={C.sage}>
    <MainText lines={scene.lines} size={110} accentIndex={-1}/>
    <p style={{fontSize:34,marginTop:43}}>{scene.support}</p>
    <div style={{position:'relative',height:500,marginTop:70}}>{['WORKLOAD?','PROJECTS?','RECRUITING?'].map((item,index)=><div key={item} style={{position:'absolute',top:index*130,left:index%2?185:15,background:index===1?C.orange:C.cream,border:`3px solid ${C.ink}`,borderRadius:90,padding:'26px 42px',fontSize:35,fontWeight:900,transform:`scale(${.85+.15*rise(frame,15+index*9)}) rotate(${[-6,4,-3][index]}deg)`,opacity:interpolate(frame,[13+index*9,21+index*9],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})}}>{item}</div>)}</div>
  </Canvas>;
}

function SceneFive({scene}) {
  const frame = useCurrentFrame();
  return <Canvas kicker={scene.kicker}>
    <MainText lines={scene.lines} size={110} accentIndex={1}/>
    <p style={{fontSize:37,lineHeight:1.35,maxWidth:770,marginTop:65}}>{scene.support}</p>
    <div style={{background:C.lime,border:`4px solid ${C.ink}`,width:670,padding:'35px 42px',marginTop:92,fontSize:37,fontWeight:900,boxShadow:`12px 12px 0 ${C.orange}`,transform:`rotate(-3deg) translateY(${(1-rise(frame,18))*110}px)`}}>FIRSTHAND EXPERIENCE &gt; HOT TAKES</div>
  </Canvas>;
}

function SceneSix({scene,degreeUrl}) {
  const frame = useCurrentFrame();
  return <Canvas dark kicker={scene.kicker}>
    <MainText lines={scene.lines} size={113} accentIndex={0}/>
    <p style={{fontSize:35,marginTop:70}}>{scene.support}</p>
    <div style={{background:C.lime,color:C.ink,borderRadius:22,padding:'31px 34px',marginTop:90,fontSize:39,fontWeight:900,lineHeight:1.2,wordBreak:'break-word',transform:`translateY(${(1-rise(frame,15))*130}px)`}}>{degreeUrl.replace('https://','')}</div>
    <div style={{fontSize:27,marginTop:30,color:C.soft}}>Your school. Your experience. Your words.</div>
  </Canvas>;
}

const scenes = [SceneOne,SceneTwo,SceneThree,SceneFour,SceneFive,SceneSix];

function CSPilot({scenes:copy,degreeUrl}) {
  const frame = useCurrentFrame();
  const dark = frame<90 || frame>=510;
  return <AbsoluteFill style={{background:C.cream}}>
    <Audio src={staticFile('dms-pulse.wav')} volume={f=>.42*interpolate(f,[0,18,595,629],[0,1,1,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})} />
    {scenes.map((Scene,index)=><Sequence key={index} from={starts[index]} durationInFrames={lengths[index]}><Scene scene={copy[index]} degreeUrl={degreeUrl}/></Sequence>)}
    <div style={{position:'absolute',top:160,left:92,right:92,color:dark?C.cream:C.ink,fontFamily:'Arial',display:'flex',justifyContent:'space-between',alignItems:'center'}}><span style={{fontSize:32,fontWeight:900}}>RateMyDegrees<span style={{color:dark?C.lime:C.orange}}>.</span></span><span style={{fontSize:21,fontWeight:800,letterSpacing:2}}>CS / PILOT</span></div>
    <div style={{position:'absolute',bottom:244,left:92,right:92,display:'flex',gap:8}}>{starts.map((start,index)=><div key={start} style={{height:7,flex:1,background:dark?'#777166':'#29251e40'}}><div style={{height:'100%',background:dark?C.lime:C.ink,width:`${interpolate(frame,[start,start+lengths[index]],[0,100],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})}%`}} /></div>)}</div>
  </AbsoluteFill>;
}

registerRoot(()=><Composition id="CSPilot" component={CSPilot} durationInFrames={frameCount} fps={30} width={1080} height={1920} defaultProps={props}/>);
