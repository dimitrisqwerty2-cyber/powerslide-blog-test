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
