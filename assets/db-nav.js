/* Stats Database on the site: make it behave like the rest of the site.
   - Back / Forward step through the database: modes (Season, Compare, Duel...) and profiles (driver, rally, event,
     manufacturer, car). The database already writes its view into the address (#m=season&s=2026, #driver/Name),
     but nothing listened when the address changed, so Back changed the URL and left the page as it was.
   - The profile's own "Back" button and the browser's Back now do the same thing.
   - A link to a view opens that view (#event/2026/key links were not handled).
   - A share bar for the view on screen (the link carries the view).
   Loaded after the database by build.py (build_stats*). */
(function(){
  var db=document.getElementById('pwdb');if(!db)return;
  var PROF=/^(driver|rally|manufacturer|car|event)\//;
  var OPEN={driver:'pwOpenDriver',rally:'pwOpenRally',manufacturer:'pwOpenManufacturer',car:'pwOpenCar'};
  var fromApp=false,routing=false,depth=0,lastMode=null;
  function h(){return (location.hash||'').replace(/^#/,'');}
  function modeOf(s){if(s==='')return 'season';var m=('&'+s).match(/&m=([^&]*)/);return m?m[1]:null;}   /* no hash = the Season view it opens on */

  function setup(){
    /* the profile openers: remember that the database itself made the next address change */
    Object.keys(OPEN).map(function(k){return OPEN[k];}).concat(['pwOpenEdition']).forEach(function(n){
      var f=window[n];if(typeof f!=='function'||f._ps)return;
      var w=function(){if(!routing)fromApp=true;var before=h(),r=f.apply(this,arguments);if(h()===before)fromApp=false;return r;};
      w._ps=true;window[n]=w;
    });
    /* a change of mode becomes a new history step (it used to overwrite the current one) */
    if(typeof window.updateHash==='function'&&!window.updateHash._ps){
      var uh=window.updateHash;
      window.updateHash=function(){
        var before=location.hash,r=uh.apply(this,arguments),after=location.hash;
        var mb=modeOf(before.replace(/^#/,'')),ma=modeOf(after.replace(/^#/,''));
        if(!routing&&after!==before&&mb&&ma&&mb!==ma){try{history.replaceState(null,'',before||(location.pathname+location.search));history.pushState(null,'',after);}catch(e){}}
        if(ma)lastMode=after.replace(/^#/,'');
        return r;
      };
      window.updateHash._ps=true;
    }
    if(!PROF.test(h()))lastMode=h();

    var ov=document.getElementById('pwProfile');
    function isOpen(){return !!(ov&&ov.classList.contains('open'));}

    function route(s){
      routing=true;
      try{
        var m=s.match(PROF);
        if(m){
          var v=s.slice(m[0].length);
          if(m[1]==='event'){var i=v.indexOf('/');if(i>0&&window.pwOpenEdition)window.pwOpenEdition(v.slice(0,i),decodeURIComponent(v.slice(i+1)));}
          else if(window[OPEN[m[1]]])window[OPEN[m[1]]](decodeURIComponent(v));
        }else{
          if(isOpen()){ov.classList.remove('open');document.body.style.overflow='';}
          if(s!==lastMode){
            if(s&&typeof window.restoreFromHash==='function')window.restoreFromHash();
            else if(!s&&typeof window.setMode==='function')window.setMode('season',true);
            lastMode=s;
          }
        }
      }catch(e){}
      routing=false;
    }

    addEventListener('hashchange',function(){
      if(fromApp){fromApp=false;depth++;return;}   /* the database opened a profile: it is already on screen */
      var s=h();
      if(PROF.test(s))depth=Math.max(0,depth-1);else depth=0;
      route(s);
    });

    /* the profile's "Back" button: same as the browser's Back while there is a step to go back to */
    var bb=document.getElementById('pwBackBtn');
    if(bb)bb.addEventListener('click',function(e){
      if(depth>0){e.preventDefault();e.stopImmediatePropagation();history.back();}
    },true);

    /* the profile closed some other way (Esc, a season or compare link): the address follows the page */
    if(ov&&window.MutationObserver)new MutationObserver(function(){
      if(routing||isOpen()||!PROF.test(h()))return;
      depth=0;
      if(typeof window.updateHash==='function'){try{window.updateHash();}catch(e){}}
      else{try{history.replaceState(null,'',location.pathname+location.search);}catch(e){}}
    }).observe(ov,{attributes:true,attributeFilter:['class']});

    /* links the database's own start-up does not open */
    if(/^event\//.test(h()))route(h());

    /* share bar for the view on screen (behaviour lives in site.js, the link is read when a button is used) */
    if(!db.querySelector('.share')){
      var tpl=document.getElementById('psShareTpl');
      if(tpl){var bar=tpl.content.firstElementChild.cloneNode(true);bar.classList.add('share-db');bar.setAttribute('data-live','');db.insertBefore(bar,db.firstChild);}
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(setup,0);});
  else setTimeout(setup,0);
})();
