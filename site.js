'use strict';
(() => {
  const count=150,canvas=document.getElementById('product'),ctx=canvas.getContext('2d',{alpha:false});
  const story=document.getElementById('story'),stage=document.getElementById('stage'),cue=document.getElementById('scrollCue');
  const viewport=document.getElementById('labelViewport'),plane=document.getElementById('labelPlane');
  const mobile=matchMedia('(max-width:600px)').matches,reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
  const maxCache=mobile?18:28,radius=mobile?5:8,cache=new Map(),pending=new Set();
  let queue=[],jobs=0,format='jpg',focus=0,position=0,target=0,drawn=-1,last=performance.now(),storyVisible=true,labelVisible=false;
  let fitWidth=1,fitHeight=1,scale=1,panX=0,panY=0,tiltX=0,tiltY=0,shine=.5,desiredX=0,desiredY=0;
  let lastTouch=-Infinity,lastMotion=-Infinity,motionBase=null,pinch=null,tap=null,lastTap=-Infinity;
  const pointers=new Map(),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  ctx.fillStyle='#000';ctx.fillRect(0,0,1080,1080);
  function pump(){
    while(jobs<4&&queue.length){
      const index=queue.shift();if(cache.has(index)||pending.has(index))continue;
      jobs++;pending.add(index);
      const image=new Image();image.decoding='async';
      image.src='frames/frame_'+String(index+1).padStart(4,'0')+'.'+format;
      image.decode().then(()=>{
        cache.set(index,image);
        if(cache.size>maxCache){
          const far=[...cache.keys()].sort((a,b)=>Math.abs(b-focus)-Math.abs(a-focus));
          for(const i of far.slice(0,cache.size-maxCache))cache.delete(i);
        }
      }).catch(()=>{}).finally(()=>{pending.delete(index);jobs--;pump();});
    }
  }
  function preload(index){
    const wanted=[index];for(let d=1;d<=radius;d++)wanted.push(index+d,index-d);
    for(const i of wanted)if(i>=0&&i<count&&!cache.has(i)&&!pending.has(i)&&!queue.includes(i))queue.push(i);
    queue.sort((a,b)=>Math.abs(a-focus)-Math.abs(b-focus));pump();
  }
  function updateTarget(){
    const range=Math.max(1,story.offsetHeight-stage.clientHeight);
    target=clamp((scrollY-story.offsetTop)/range,0,1);
  }
  function clampPan(){
    const maxX=Math.max(0,(fitWidth*scale-viewport.clientWidth+16)/2);
    const maxY=Math.max(0,(fitHeight*scale-viewport.clientHeight+16)/2);
    panX=clamp(panX,-maxX,maxX);panY=clamp(panY,-maxY,maxY);
  }
  function layoutLabel(){
    const pad=innerWidth<768?30:52;
    fitWidth=Math.min(viewport.clientWidth-pad,(viewport.clientHeight-pad)*4096/1807);
    fitWidth=Math.max(1,fitWidth);fitHeight=fitWidth*1807/4096;
    plane.style.width=fitWidth+'px';clampPan();paintLabel();
  }
  function paintLabel(){
    plane.style.setProperty('--zoom',scale.toFixed(4));
    plane.style.width=(fitWidth*scale).toFixed(2)+'px';
    plane.style.setProperty('--pan-x',panX.toFixed(2)+'px');plane.style.setProperty('--pan-y',panY.toFixed(2)+'px');
  }
  function localPoint(x,y){const r=viewport.getBoundingClientRect();return{x:x-r.left-r.width/2,y:y-r.top-r.height/2};}
  function setLight(x,y){
    const r=viewport.getBoundingClientRect();
    desiredX=clamp((x-r.left)/r.width*2-1,-1,1);desiredY=clamp((y-r.top)/r.height*2-1,-1,1);
    lastTouch=performance.now();
  }
  function zoomAt(value,point){
    const next=clamp(value,1,5),ratio=next/scale;
    panX=point.x-(point.x-panX)*ratio;panY=point.y-(point.y-panY)*ratio;scale=next;
    clampPan();paintLabel();
  }
  viewport.addEventListener('pointerdown',event=>{
    viewport.setPointerCapture(event.pointerId);viewport.classList.add('is-touching');
    const p={x:event.clientX,y:event.clientY};pointers.set(event.pointerId,p);setLight(p.x,p.y);
    if(pointers.size===1)tap={time:performance.now(),x:p.x,y:p.y,moved:false};
    if(pointers.size===2){
      const [a,b]=[...pointers.values()],mid=localPoint((a.x+b.x)/2,(a.y+b.y)/2);
      pinch={distance:Math.hypot(a.x-b.x,a.y-b.y),scale,anchorX:(mid.x-panX)/scale,anchorY:(mid.y-panY)/scale};
      tap=null;
    }
  });
  viewport.addEventListener('pointermove',event=>{
    setLight(event.clientX,event.clientY);
    if(!pointers.has(event.pointerId))return;
    const previous=pointers.get(event.pointerId);pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
    if(tap&&Math.hypot(event.clientX-tap.x,event.clientY-tap.y)>8)tap.moved=true;
    if(pointers.size>=2&&pinch){
      const [a,b]=[...pointers.values()],mid=localPoint((a.x+b.x)/2,(a.y+b.y)/2);
      scale=clamp(pinch.scale*Math.hypot(a.x-b.x,a.y-b.y)/Math.max(1,pinch.distance),1,5);
      panX=mid.x-pinch.anchorX*scale;panY=mid.y-pinch.anchorY*scale;
      clampPan();paintLabel();
    }else if(scale>1.01){
      panX+=event.clientX-previous.x;panY+=event.clientY-previous.y;clampPan();paintLabel();
    }
  });
  function release(event){
    const wasSingle=pointers.size===1;pointers.delete(event.pointerId);pinch=null;
    if(!pointers.size)viewport.classList.remove('is-touching');
    if(wasSingle&&tap&&!tap.moved&&performance.now()-tap.time<300&&event.type==='pointerup'){
      const now=performance.now();
      if(now-lastTap<320){
        const point=localPoint(event.clientX,event.clientY);
        if(scale>1.1){scale=1;panX=panY=0;paintLabel();}else zoomAt(2.8,point);
        lastTap=-Infinity;
      }else lastTap=now;
    }
    tap=null;
  }
  viewport.addEventListener('pointerup',release);viewport.addEventListener('pointercancel',release);
  viewport.addEventListener('wheel',event=>{
    if(!event.ctrlKey&&!event.metaKey)return;event.preventDefault();
    zoomAt(scale*Math.exp(-event.deltaY*.008),localPoint(event.clientX,event.clientY));
  },{passive:false});
  viewport.addEventListener('dblclick',event=>event.preventDefault());
  viewport.addEventListener('keydown',event=>{
    if(event.key==='Escape'||event.key==='0'){scale=1;panX=panY=0;paintLabel();event.preventDefault();}
    else if(event.key==='+'||event.key==='='){zoomAt(scale*1.3,{x:0,y:0});event.preventDefault();}
    else if(event.key==='-'){zoomAt(scale/1.3,{x:0,y:0});event.preventDefault();}
    else if(scale>1&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){
      panX+=event.key==='ArrowLeft'?30:event.key==='ArrowRight'?-30:0;
      panY+=event.key==='ArrowUp'?30:event.key==='ArrowDown'?-30:0;
      clampPan();paintLabel();event.preventDefault();
    }
  });
  // No permission prompt: sensors enhance the automatic light only when the browser already allows them.
  if(window.isSecureContext&&'DeviceOrientationEvent' in window){
    window.addEventListener('deviceorientation',event=>{
      if(!Number.isFinite(event.gamma)||!Number.isFinite(event.beta))return;
      if(motionBase===null)motionBase=event.beta;
      if(performance.now()-lastTouch<2200)return;
      desiredX=clamp(event.gamma/28,-1,1);desiredY=clamp((event.beta-motionBase)/28,-1,1);
      lastMotion=performance.now();
    },{passive:true});
  }
  new IntersectionObserver(entries=>{storyVisible=entries[0].isIntersecting;},{rootMargin:'100px'}).observe(story);
  new IntersectionObserver(entries=>{labelVisible=entries[0].isIntersecting;},{rootMargin:'180px'}).observe(viewport);
  new ResizeObserver(layoutLabel).observe(viewport);
  addEventListener('scroll',updateTarget,{passive:true});addEventListener('resize',()=>{updateTarget();layoutLabel();},{passive:true});
  function tick(now){
    const dt=Math.min(.05,(now-last)/1000);last=now;
    if(storyVisible){
      position+=(target-position)*(reduced?1:1-Math.exp(-dt/.12));if(Math.abs(target-position)<.00005)position=target;
      focus=Math.round(position*(count-1));preload(focus);
      let show=focus;if(!cache.has(show)){let nearest=Infinity;for(const i of cache.keys()){const d=Math.abs(i-focus);if(d<nearest){nearest=d;show=i;}}}
      if(cache.has(show)&&show!==drawn){ctx.drawImage(cache.get(show),0,0,1080,1080);drawn=show;}
      cue.style.opacity=String(Math.max(0,1-target*12));
    }
    if(labelVisible){
      const active=now-Math.max(lastTouch,lastMotion)<2600;
      const aim=active?(desiredX+1)/2:reduced?.5:.5+.48*Math.sin(now*.00043);
      shine+=(aim-shine)*Math.min(1,dt*7);
      tiltX+=((active&&!reduced?-desiredY*2.4:0)-tiltX)*Math.min(1,dt*7);
      tiltY+=((active&&!reduced?desiredX*2.4:0)-tiltY)*Math.min(1,dt*7);
      plane.style.setProperty('--shine',(shine*100).toFixed(2)+'%');
      plane.style.setProperty('--tilt-x',tiltX.toFixed(3)+'deg');plane.style.setProperty('--tilt-y',tiltY.toFixed(3)+'deg');
    }
    requestAnimationFrame(tick);
  }
  async function boot(){
    const probe=new Image();probe.decoding='async';probe.src='frames/frame_0001.avif';
    try{await probe.decode();format='avif';cache.set(0,probe);}catch(error){format='jpg';}
    updateTarget();layoutLabel();preload(0);requestAnimationFrame(tick);
  }
  boot();
})();
