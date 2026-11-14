/* Powerslide Blog: background glow + glitch titles, ported from the WRC Points template renderer. */
(function(){
  function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;var t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

  /* ---- warm glow behind the panel (template THEMES.warm, drawn at 1440x1080 and stretched to cover) ---- */
  var WARM={base:['#0c4a45','#1f8f6a','#11786f','#0b4a52'],
    blobs:[[700,560,450,2.2,'#36cf8c',.8],[780,500,240,2.6,'#e2fff2',.6],[990,700,270,1.6,'#00b0a2',.6],
           [560,690,200,2.4,'#f2b04a',.32],[140,500,380,1.2,'#0a3e48',.85],[1360,420,360,1.2,'#0b5a58',.8],[900,630,170,3.2,'#05302b',.45]],
    streak:['rgba(225,255,242,','rgba(0,30,25,']};
  /* night version: same blobs and streaks, embers instead of sunset */
  var NIGHT={base:['#06191a','#0d3a31','#0a2f2d','#071d26'],
    blobs:[[700,560,450,2.2,'#19ae65',.36],[780,500,240,2.6,'#c6f3e2',.1],[990,700,270,1.6,'#009696',.32],
           [560,690,200,2.4,'#c98a32',.13],[140,500,380,1.2,'#062a30',.8],[1360,420,360,1.2,'#0a3a3a',.7],[900,630,170,3.2,'#021412',.5]],
    streak:['rgba(200,255,235,','rgba(0,0,0,']};
  function dark(){return document.documentElement.getAttribute('data-theme')==='dark';}
  function blob(ctx,x,y,r,sx,color,alpha){
    ctx.save();ctx.translate(x,y);ctx.scale(sx,1);
    var g=ctx.createRadialGradient(0,0,0,0,0,r);g.addColorStop(0,color);g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.globalAlpha=alpha;ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  function glow(){
    var c=document.getElementById('glow');if(!c)return;
    var W=1440,H=1080;c.width=W;c.height=H;var ctx=c.getContext('2d'),T=dark()?NIGHT:WARM;
    var g=ctx.createLinearGradient(0,0,W,0);[0,.45,.7,1].forEach(function(o,i){g.addColorStop(o,T.base[i]);});
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    ctx.save();ctx.translate(0,-80);ctx.scale(1,1.15);   // centre the glow band on the viewport
    T.blobs.forEach(function(b){blob(ctx,b[0],b[1],b[2],b[3],b[4],b[5]);});
    ctx.restore();
    var r=rng(7);
    for(var i=0;i<260;i++){
      var y=r()*H,x=r()*W,w=120+r()*600,a=.02+r()*.05;
      ctx.fillStyle=(r()<.5?T.streak[0]:T.streak[1])+a+')';ctx.fillRect(x,y,w,1+r()*3);
    }
    c.style.objectFit='cover';
  }

  /* ---- glitch title: speckle the glyphs, then shear thin horizontal slices ---- */
  function glitchOne(el){
    var txt=el.getAttribute('data-text')||el.textContent.trim();if(!txt)return;
    var cs=getComputedStyle(el),size=parseFloat(cs.fontSize),dpr=Math.min(window.devicePixelRatio||1,2);
    var key=size+'|'+dpr+'|'+el.clientWidth+'|'+cs.color;if(el._gk===key)return;el._gk=key;
    var font='700 '+size+'px "PS WRC Clean"';
    var m=document.createElement('canvas').getContext('2d');m.font=font;
    var tw=Math.ceil(m.measureText(txt).width)+Math.ceil(size*.2);
    var s=size*dpr,ow=Math.ceil(tw*dpr)+20,oh=Math.ceil(s*1.42);
    var o=document.createElement('canvas');o.width=ow;o.height=oh;
    var ox=o.getContext('2d');ox.font='700 '+s+'px "PS WRC Clean"';ox.textBaseline='alphabetic';
    ox.fillStyle=cs.color||'#303033';ox.fillText(txt,10,s*1.1);
    var id=ox.getImageData(0,0,ow,oh),d=id.data,r=rng(11);
    var sp=dark()?70:200;
    for(var i=0;i<d.length;i+=4){if(d[i+3]>0&&r()<.07){d[i]=d[i+1]=d[i+2]=sp;}}
    ox.putImageData(id,0,0);
    var c=el.querySelector('canvas');if(!c){c=document.createElement('canvas');c.setAttribute('aria-hidden','true');el.appendChild(c);}
    c.width=ow;c.height=oh;c.style.width=(ow/dpr)+'px';
    var ctx=c.getContext('2d'),step=Math.max(2,Math.round(3*dpr));
    for(var sy=0;sy<oh;sy+=step){
      var off=r()<.22?(r()*2-1)*s*.06:0;
      ctx.drawImage(o,0,sy,ow,step,off,sy,ow,step);
    }
    el.classList.add('ready');
  }
  function glitchAll(){document.querySelectorAll('.glitch').forEach(glitchOne);}

  /* ---- light / dark switch: saved choice, else the system setting (set early by the inline head script) ---- */
  function label(){
    var d=dark();document.querySelectorAll('[data-theme-toggle]').forEach(function(b){
      b.setAttribute('aria-label',d?'Switch to light mode':'Switch to dark mode');
      var l=b.querySelector('.lbl');if(l)l.textContent=d?'Light':'Dark';});
  }
  function setTheme(t,save){
    document.documentElement.setAttribute('data-theme',t);
    if(save){try{localStorage.setItem('psTheme',t);}catch(e){}}
    glow();glitchAll();label();
    if(typeof window.applyTheme==='function'){try{window.applyTheme(t);}catch(e){}}   // the Stats Database's own switch
    if(window.Chart&&Chart.instances){Object.values(Chart.instances).forEach(function(c){try{c.update('none');}catch(e){}});}
  }
  window.psSetTheme=setTheme;
  document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-theme-toggle]');if(b)setTheme(dark()?'light':'dark',true);});
  try{matchMedia('(prefers-color-scheme: dark)').addEventListener('change',function(m){var s=null;try{s=localStorage.getItem('psTheme');}catch(e){}if(!s)setTheme(m.matches?'dark':'light',false);});}catch(e){}
  label();
  glow();
  var go=function(){glitchAll();var t;window.addEventListener('resize',function(){clearTimeout(t);t=setTimeout(glitchAll,120);});};
  if(document.fonts&&document.fonts.load){Promise.all([document.fonts.load('700 40px "PS WRC Clean"'),document.fonts.ready]).then(go,go);}else go();

  /* ---- search page ---- */
  var box=document.getElementById('q'),out=document.getElementById('results');
  if(box&&out){
    var root=document.body.getAttribute('data-root')||'';
    var fold=function(s){return (s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();};
    var esc=function(s){return s.replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});};
    var idx=window.SEARCH_INDEX||[];
    var run=function(){
      var q=fold(box.value.trim()),terms=q.split(/\s+/).filter(Boolean);
      var hits=!terms.length?idx:idx.filter(function(p){var h=fold(p.t+' '+p.e+' '+p.s);return terms.every(function(t){return h.indexOf(t)>=0;});});
      document.getElementById('count').textContent=terms.length?(hits.length+' result'+(hits.length===1?'':'s')+' for “'+box.value.trim()+'”'):('All '+idx.length+' articles');
      out.innerHTML=hits.map(function(p){
        return '<a class="card" href="'+root+p.u+'"><div class="tile">'+(p.i?'<img loading="lazy" src="'+(p.i.indexOf('http')===0?p.i:root+p.i)+'" alt="">':'')+'</div><div class="body cell"><span><span class="tag">'+esc(p.s)+'</span></span><h3>'+esc(p.t)+'</h3><p>'+esc(p.e)+'</p></div></a>';
      }).join('');
    };
    var qs=new URLSearchParams(location.search).get('q');if(qs)box.value=qs;
    box.addEventListener('input',run);run();
  }
})();

/* ---- comments: giscus, themed like the site and switched with it ---- */
(function(){
  var box=document.querySelector('.giscus-box');if(!box)return;
  var root=document.body.getAttribute('data-root')||'';
  function themeUrl(){return new URL(root+'assets/giscus-'+(document.documentElement.getAttribute('data-theme')==='dark'?'dark':'light')+'.css',location.href).href;}
  var s=document.createElement('script');s.src='https://giscus.app/client.js';s.async=true;s.crossOrigin='anonymous';
  var a={'data-repo':box.dataset.repo,'data-repo-id':box.dataset.repoId,'data-category':box.dataset.category,'data-category-id':box.dataset.categoryId,
    'data-mapping':'specific','data-term':box.dataset.term,'data-strict':'1','data-reactions-enabled':'1','data-emit-metadata':'0',
    'data-input-position':'top','data-lang':'en','data-loading':'lazy','data-theme':themeUrl()};
  Object.keys(a).forEach(function(k){s.setAttribute(k,a[k]);});
  box.appendChild(s);
  new MutationObserver(function(){
    var f=document.querySelector('iframe.giscus-frame');
    if(f)f.contentWindow.postMessage({giscus:{setConfig:{theme:themeUrl()}}},'https://giscus.app');
  }).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
})();

/* ---- views count (GoatCounter), bottom right of a post ---- */
(function(){
  var box=document.querySelector('.views[data-gc]');if(!box)return;
  if(/^(localhost|127\.|\[::1\])/.test(location.hostname))return;
  fetch(box.getAttribute('data-gc')+'/counter/'+encodeURIComponent(box.getAttribute('data-path'))+'.json')
    .then(function(r){return r.ok?r.json():null;})
    .then(function(d){
      if(!d||!d.count)return;
      var n=String(d.count).replace(/\s/g,'');
      box.innerHTML='<span><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 4.5C7 4.5 2.7 7.6 1 12c1.7 4.4 6 7.5 11 7.5s9.3-3.1 11-7.5c-1.7-4.4-6-7.5-11-7.5zm0 12.5a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/></svg>'+n+(n==='1'?' view':' views')+'</span>';
      box.hidden=false;
    }).catch(function(){});
})();

/* ---- embedded segments (Stats Database charts/tables) report their height: size the frame to fit ---- */
window.addEventListener('message',function(e){
  var h=e.data&&e.data.pwEmbedHeight;if(!h||h<50||h>8000)return;
  var frames=document.querySelectorAll('.embed iframe,.media iframe');
  for(var i=0;i<frames.length;i++){if(frames[i].contentWindow===e.source){var box=frames[i].parentNode;box.style.paddingTop='0';box.style.height=Math.ceil(h)+'px';break;}}
});

/* ---- scrolling story: the card crossing the middle of the screen tells the pinned chart which drivers to highlight;
   the last one passed stays highlighted until the next card arrives, and leaving the section clears it ---- */
(function(){
  var secs=document.querySelectorAll('.scrolly');if(!secs.length)return;
  [].forEach.call(secs,function(sec){
    var fr=sec.querySelector('.scrolly-graphic iframe'),steps=[].slice.call(sec.querySelectorAll('.scrolly-step')),cur;
    function send(list){try{fr.contentWindow.postMessage({pwHighlight:list},'*');}catch(e){}}
    function check(){
      var mid=innerHeight*(innerWidth<=900?0.8:0.55),act=null,sr=sec.getBoundingClientRect();
      if(sr.top<mid&&sr.bottom>innerHeight*0.4){
        for(var i=steps.length-1;i>=0;i--){if(steps[i].querySelector('.scrolly-card').getBoundingClientRect().top<mid){act=steps[i];break;}}
      }
      if(act===cur)return;cur=act;
      steps.forEach(function(s){s.classList.toggle('on',s===act);});
      var list=[];try{list=act?JSON.parse(act.getAttribute('data-hl')||'[]'):[];}catch(e){}
      send(list);
    }
    addEventListener('scroll',check,{passive:true});addEventListener('resize',check);
    fr.addEventListener('load',function(){cur=undefined;check();});check();
    setInterval(check,400);   /* also catches scroll restoration and jumps that fire no scroll event */
  });
})();

/* ---- "Latest from X": load X's timeline only when the box is near the screen; keep the follow card unless it renders ---- */
(function(){
  var box=document.querySelector('.xfeed-box');if(!box)return;
  function load(){
    var live=document.createElement('div');live.className='xfeed-live';
    var a=document.createElement('a');a.className='twitter-timeline';a.href='https://twitter.com/'+box.getAttribute('data-handle');
    a.setAttribute('data-height','540');a.setAttribute('data-dnt','true');a.setAttribute('data-chrome','noheader nofooter noborders transparent');
    a.setAttribute('data-theme',document.documentElement.getAttribute('data-theme')==='dark'?'dark':'light');a.textContent='';
    live.appendChild(a);box.appendChild(live);
    var s=document.createElement('script');s.async=true;s.src='https://platform.twitter.com/widgets.js';document.body.appendChild(s);
    var tries=0,t=setInterval(function(){var f=live.querySelector('iframe');tries++;
      if(f&&f.getBoundingClientRect().height>80){box.classList.add('has-live');clearInterval(t);}
      else if(tries>40){clearInterval(t);live.remove();}},300);
  }
  if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){if(es[0].isIntersecting){io.disconnect();load();}},{rootMargin:'400px'});io.observe(box);}
  else load();
})();

/* ---- sticky sidebar taller than the screen: let it scroll until its bottom shows, then stick ---- */
(function(){
  var s=document.querySelector('.side');if(!s)return;
  function fit(){s.style.top=Math.min(18,innerHeight-s.offsetHeight-18)+'px';}
  fit();addEventListener('resize',fit);if(window.ResizeObserver)new ResizeObserver(fit).observe(s);
})();

/* ---- article extras: reading bar, back to top, things sliding in, counting numbers, photo stories, chapter menu,
   full-screen photos. Markup comes from build.py (native_graphic, long-read layout); styles are at the end of site.css. ---- */
(function(){
  var prose=document.querySelector('article .prose');
  var calm=false;try{calm=matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){}
  var hasIO='IntersectionObserver' in window;

  /* reading bar + back to top (posts only), and the long-read cover drifting slower than the page */
  if(prose){
    var art=prose.closest('article');
    var bar=document.createElement('div');bar.className='readbar';bar.setAttribute('aria-hidden','true');bar.innerHTML='<i></i>';document.body.appendChild(bar);
    var up=document.createElement('button');up.className='totop';up.type='button';up.setAttribute('aria-label','Back to top');up.textContent='↑';document.body.appendChild(up);
    up.onclick=function(){scrollTo({top:0,behavior:calm?'auto':'smooth'});};
    var hero=document.querySelector('.lr-hero>img'),queued=false;
    var paint=function(){
      queued=false;
      var r=art.getBoundingClientRect(),span=r.height-innerHeight;
      bar.style.setProperty('--p',span>0?Math.min(1,Math.max(0,-r.top/span)).toFixed(4):0);
      up.classList.toggle('on',(window.pageYOffset||0)>innerHeight*1.2);
      if(hero&&!calm){var h=hero.parentNode.getBoundingClientRect();if(h.bottom>0&&h.top<innerHeight)hero.style.transform='translateY('+Math.max(-40,Math.min(40,-h.top*0.12)).toFixed(1)+'px)';}
    };
    var ask=function(){if(!queued){queued=true;requestAnimationFrame(paint);}};
    addEventListener('scroll',ask,{passive:true});addEventListener('resize',ask);paint();
  }

  /* slide in: only things still below the screen when the page opens, so nothing visible ever blinks */
  if(!calm&&hasIO){
    var sel='.shead,.prose figure,.prose .pquote,.prose .ptable-wrap,.pstat,.prank .rrow,.pcallout,.pc-row,.ptimeline li,.pgallery a,.psplit,.chapter-cap,.grid .card,.bigfour .card,.cols3 .frame,.srow';
    var io=new IntersectionObserver(function(es){es.forEach(function(e){
      if(!e.isIntersecting)return;io.unobserve(e.target);var el=e.target;el.classList.add('in');
      setTimeout(function(){el.classList.remove('rv','in');el.style.removeProperty('--rd');},1700);
    });},{rootMargin:'0px 0px -7% 0px'});
    var seen=new Map();
    [].forEach.call(document.querySelectorAll(sel),function(el){
      if(el.closest('.scrolly,.story,#pwdb'))return;
      var r=el.getBoundingClientRect();if(r.top<innerHeight*0.95)return;
      var key=el.parentNode.nodeName+Math.round((r.top+(window.pageYOffset||0))/40),n=seen.get(key)||0;seen.set(key,n+1);   // neighbours on one line come in one after another
      if(n)el.style.setProperty('--rd',Math.min(n,5)*80+'ms');
      el.classList.add('rv');io.observe(el);
    });
  }

  /* big numbers count up once ("1,234 km", "62.5%"); the text around the number stays */
  if(!calm&&hasIO){
    var cio=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){cio.unobserve(e.target);e.target._run();}});},{threshold:.6});
    [].forEach.call(document.querySelectorAll('[data-count]'),function(el){
      var txt=el.textContent;if(txt.indexOf(':')>=0)return;
      var m=txt.match(/\d[\d.,  ]*\d|\d/);if(!m)return;
      var raw=m[0],grp=/^\d{1,3}([.,  ]\d{3})+$/.test(raw),sep=grp?raw.match(/[.,  ]/)[0]:'';
      var dm=!grp&&raw.match(/^(\d+)([.,])(\d+)$/),val=grp?+raw.replace(/\D/g,''):dm?parseFloat(dm[1]+'.'+dm[3]):parseFloat(raw);
      if(!isFinite(val)||!val)return;
      var fmt=function(v){var s;if(dm)s=v.toFixed(dm[3].length).replace('.',dm[2]);else{s=String(Math.round(v));if(grp)s=s.replace(/\B(?=(\d{3})+$)/g,sep);}return txt.replace(raw,s);};
      el.textContent=fmt(0);
      el._run=function(){var t0=performance.now(),dur=1200;(function step(t){var k=Math.min(1,Math.max(0,(t-t0)/dur)),e=1-Math.pow(1-k,3);el.textContent=k<1?fmt(val*e):txt;if(k<1)requestAnimationFrame(step);})(t0);};
      cio.observe(el);
    });
  }

  /* photo story: the text block nearest the middle of the screen picks the pinned photo */
  [].forEach.call(document.querySelectorAll('.story'),function(sec){
    var imgs=sec.querySelectorAll('.story-media img'),steps=[].slice.call(sec.querySelectorAll('.story-step')),cur=-1;
    if(!steps.length)return;
    var check=function(){
      var mid=innerHeight*0.62,act=0;
      for(var i=steps.length-1;i>=0;i--){if(steps[i].getBoundingClientRect().top<mid){act=i;break;}}
      if(act===cur)return;cur=act;
      steps.forEach(function(s,i){s.classList.toggle('on',i===act);});
      var m=+steps[act].getAttribute('data-m')||0;[].forEach.call(imgs,function(im,i){im.classList.toggle('on',i===m);});
    };
    addEventListener('scroll',check,{passive:true});addEventListener('resize',check);check();
  });

  /* long read: the chapter menu marks the chapter being read */
  var nav=document.querySelector('.lr-nav');
  if(nav){
    var links=[].slice.call(nav.querySelectorAll('a')),box=nav.querySelector('.lr-nav-in');
    var secs=links.map(function(a){return document.getElementById(a.getAttribute('href').slice(1));});
    var mark=function(){
      var act=-1;secs.forEach(function(s,i){if(s&&s.getBoundingClientRect().top<innerHeight*0.45)act=i;});
      links.forEach(function(a,i){
        if(i===act&&!a.classList.contains('on')){a.classList.add('on');box.scrollLeft=Math.max(0,a.offsetLeft-60);}
        else if(i!==act)a.classList.remove('on');
      });
    };
    addEventListener('scroll',mark,{passive:true});mark();
  }

  /* photos open full screen: every photo of the post is one set (arrow keys, Esc) */
  var shots=[].slice.call(document.querySelectorAll('article .prose figure img,.pgallery a')).filter(function(el){
    return el.tagName==='A'||(!el.closest('a')&&!el.closest('.story,.scrolly'));});
  if(shots.length){
    var lb=null,at=0;
    var info=function(el){
      if(el.tagName==='A')return{src:el.href,cap:el.getAttribute('data-cap')||''};
      var f=el.closest('figure'),c=f&&f.querySelector('figcaption');return{src:el.currentSrc||el.src,cap:c?c.textContent:''};
    };
    var show=function(i){at=(i+shots.length)%shots.length;var x=info(shots[at]);lb.querySelector('img').src=x.src;lb.querySelector('p').textContent=x.cap;};
    var key=function(e){if(e.key==='Escape')close();else if(e.key==='ArrowRight')show(at+1);else if(e.key==='ArrowLeft')show(at-1);};
    var close=function(){if(!lb)return;var old=lb;lb=null;old.classList.remove('on');document.removeEventListener('keydown',key);setTimeout(function(){old.remove();},220);};
    var open=function(i){
      lb=document.createElement('div');lb.className='lbox';lb.setAttribute('role','dialog');lb.setAttribute('aria-label','Photo');
      lb.innerHTML='<img alt=""><p></p><button class="x" type="button" aria-label="Close">✕</button>'+(shots.length>1?'<button class="pv" type="button" aria-label="Previous photo">‹</button><button class="nx" type="button" aria-label="Next photo">›</button>':'');
      lb.addEventListener('click',function(e){
        if(e.target.classList.contains('pv'))show(at-1);else if(e.target.classList.contains('nx'))show(at+1);
        else if(e.target.tagName!=='IMG')close();
      });
      document.body.appendChild(lb);show(i);document.addEventListener('keydown',key);
      requestAnimationFrame(function(){if(lb)lb.classList.add('on');});
    };
    shots.forEach(function(el,i){
      if(el.tagName==='IMG')el.classList.add('zoom');
      el.addEventListener('click',function(e){e.preventDefault();open(i);});
    });
  }
})();

/* ---- motion pack: rotating hero, photo tilt, card photo flying into the article. Styles at the end of site.css. ---- */
(function(){
  var calm=false;try{calm=matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){}

  /* hero: the lead story turns over every 7 s through the top five; the matching row on the right fills a gold bar.
     Stops while the mouse or keyboard focus is on it and while the tab is hidden; never runs for reduced motion. */
  var box=document.querySelector('.leads[data-rotate]');
  if(box){
    var hero=box.closest('.hero'),slides=[].slice.call(box.querySelectorAll('.lead')),dots=[].slice.call(box.querySelectorAll('.hdots button'));
    var rows=hero?[].slice.call(hero.querySelectorAll('.srow[data-slide]')):[];
    var at=0,timer=null,DUR=7000,left=DUR,started=0,held=false;
    var load=function(el){var im=el.querySelector('img[data-src]');if(im){im.src=im.getAttribute('data-src');im.removeAttribute('data-src');}};
    var show=function(i){
      at=(i+slides.length)%slides.length;load(slides[at]);load(slides[(at+1)%slides.length]);
      slides.forEach(function(s,k){var on=k===at;s.classList.toggle('on',on);
        if(on){s.removeAttribute('aria-hidden');s.removeAttribute('tabindex');}else{s.setAttribute('aria-hidden','true');s.setAttribute('tabindex','-1');}
        if(on){var a=s.querySelectorAll('.tile img,.cap');[].forEach.call(a,function(x){x.style.animation='none';x.offsetWidth;x.style.animation='';});}});
      dots.forEach(function(d,k){d.classList.toggle('on',k===at);d.classList.toggle('done',k<at);var f=d.querySelector('i');f.style.animation='none';f.offsetWidth;f.style.animation='';});
      rows.forEach(function(r){var on=+r.getAttribute('data-slide')===at;r.classList.toggle('on',on);var g=r.querySelector('.prog');if(g){g.style.animation='none';g.offsetWidth;g.style.animation='';}});
      left=DUR;
    };
    var tick=function(){clearTimeout(timer);started=Date.now();timer=setTimeout(function(){show(at+1);tick();},left);};
    var hold=function(on){
      if(on===held)return;held=on;box.classList.toggle('hold',on);if(hero)hero.classList.toggle('hold',on);
      if(on){clearTimeout(timer);left=Math.max(400,left-(Date.now()-started));}else tick();
    };
    dots.forEach(function(d,k){d.addEventListener('click',function(e){e.preventDefault();show(k);if(!held)tick();});});
    if(!calm&&slides.length>1){
      box.style.setProperty('--slide',DUR+'ms');if(hero)hero.style.setProperty('--slide',DUR+'ms');
      box.classList.add('play');if(hero)hero.classList.add('play');
      show(0);tick();
      [box].concat(rows).forEach(function(el){
        el.addEventListener('mouseenter',function(){hold(true);});el.addEventListener('mouseleave',function(){hold(false);});});
      box.addEventListener('focusin',function(){hold(true);});box.addEventListener('focusout',function(){hold(false);});
      rows.forEach(function(r){r.addEventListener('focus',function(){show(+r.getAttribute('data-slide'));hold(true);});r.addEventListener('blur',function(){hold(false);});});
      document.addEventListener('visibilitychange',function(){hold(document.hidden);});
      /* hovering a row on the right brings its story up in the big slot; mousemove, not mouseenter, so a cursor
         already resting there when the page appears doesn't switch the story by itself */
      rows.forEach(function(r){r.addEventListener('mousemove',function(){var k=+r.getAttribute('data-slide');if(k!==at)show(k);});});
    }else{dots.forEach(function(d){d.hidden=true;});}
  }

  /* photo tilt + glare on cards (mouse only) */
  var fine=false;try{fine=matchMedia('(hover: hover) and (pointer: fine)').matches;}catch(e){}
  if(!calm&&fine){
    [].forEach.call(document.querySelectorAll('.card,.leads .lead'),function(c){
      if(c.closest('#pwdb'))return;var t=c.querySelector('.tile');if(!t)return;c.classList.add('tilt');var q=false,ev=null;
      var paint=function(){q=false;var r=t.getBoundingClientRect(),x=(ev.clientX-r.left)/r.width,y=(ev.clientY-r.top)/r.height;
        if(x<0||x>1||y<0||y>1)return;var big=r.width>600?2.2:4.5;
        c.style.setProperty('--ry',((x-.5)*big).toFixed(2)+'deg');c.style.setProperty('--rx',((.5-y)*big).toFixed(2)+'deg');
        c.style.setProperty('--gx',(x*100).toFixed(1)+'%');c.style.setProperty('--gy',(y*100).toFixed(1)+'%');};
      c.addEventListener('pointermove',function(e){ev=e;c.classList.add('tilting');if(!q){q=true;requestAnimationFrame(paint);}});
      c.addEventListener('pointerleave',function(){c.classList.remove('tilting');c.style.setProperty('--rx','0deg');c.style.setProperty('--ry','0deg');});
    });
  }

})();

/* ---- share buttons: social links built from the live address (so the Stats Database shares the view on screen),
   copy link, and the phone's own share sheet where the browser has one ---- */
(function(){
  var T={x:'https://x.com/intent/post?url={u}&text={t}&via=PowerslideMedia',facebook:'https://www.facebook.com/sharer/sharer.php?u={u}',
         whatsapp:'https://wa.me/?text={t}%20{u}',reddit:'https://www.reddit.com/submit?url={u}&title={t}'};
  function info(bar){
    var url=bar.hasAttribute('data-live')?location.href:bar.getAttribute('data-url');
    return {url:url,title:bar.hasAttribute('data-live')?document.title:bar.getAttribute('data-title')};
  }
  var canShare=!!navigator.share;var coarse=false;try{coarse=matchMedia('(pointer: coarse)').matches;}catch(e){}
  function prep(root){[].forEach.call((root||document).querySelectorAll('.share .sh.native'),function(b){b.hidden=!(canShare&&coarse);});}
  prep();
  document.addEventListener('click',function(e){
    var el=e.target.closest&&e.target.closest('.share .sh');if(!el)return;
    var bar=el.closest('.share'),x=info(bar),net=el.getAttribute('data-net');
    if(net&&T[net]){el.href=T[net].replace('{u}',encodeURIComponent(x.url)).replace('{t}',encodeURIComponent(x.title));return;}
    if(el.classList.contains('native')){e.preventDefault();navigator.share({title:x.title,url:x.url}).catch(function(){});return;}
    if(el.hasAttribute('data-copy')){
      e.preventDefault();
      var done=function(){var sp=el.querySelector('span'),old=sp?sp.textContent:'';el.classList.add('ok');if(sp)sp.textContent='Copied!';
        el.setAttribute('aria-label','Link copied');setTimeout(function(){el.classList.remove('ok');if(sp)sp.textContent=old;el.setAttribute('aria-label','Copy link');},1800);};
      if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(x.url).then(done,function(){window.prompt('Copy this link:',x.url);});
      else{var ta=document.createElement('textarea');ta.value=x.url;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();
        try{document.execCommand('copy');done();}catch(err){window.prompt('Copy this link:',x.url);}ta.remove();}
    }
  });
  /* the Stats Database adds its bar after start-up */
  if(document.getElementById('pwdb')&&window.MutationObserver){var mo=new MutationObserver(function(){var b=document.querySelector('.share-db');if(b){prep(b.parentNode);mo.disconnect();}});mo.observe(document.getElementById('pwdb'),{childList:true});}
})();
