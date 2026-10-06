/* Powerslide Blog: background glow + glitch titles, ported from the WRC Points template renderer. */
(function(){
  function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;var t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

  /* ---- warm glow behind the panel (template THEMES.warm, drawn at 1440x1080 and stretched to cover) ---- */
  var WARM={base:['#5a3c63','#b97a6b','#9c5f62','#5c4473'],
    blobs:[[700,560,450,2.2,'#ff9b3d',.95],[780,500,240,2.6,'#fbe6d9',.85],[990,700,270,1.6,'#e0561d',.6],
           [560,690,200,2.4,'#f2b04a',.55],[140,500,380,1.2,'#5b3d74',.85],[1360,420,360,1.2,'#674b86',.8],[900,630,170,3.2,'#4a1f2b',.45]],
    streak:['rgba(255,240,230,','rgba(40,10,30,']};
  /* night version: same blobs and streaks, embers instead of sunset */
  var NIGHT={base:['#1b1222','#3a2230','#2c1a26','#1c1530'],
    blobs:[[700,560,450,2.2,'#d9772e',.42],[780,500,240,2.6,'#f3c9ad',.16],[990,700,270,1.6,'#b8441a',.34],
           [560,690,200,2.4,'#d08f36',.22],[140,500,380,1.2,'#3e2852',.8],[1360,420,360,1.2,'#46345e',.7],[900,630,170,3.2,'#2a0f18',.5]],
    streak:['rgba(255,220,200,','rgba(0,0,0,']};
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
