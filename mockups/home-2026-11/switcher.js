// Review-only: a small pill to flip between the five mockups. Not part of any design.
(function(){
  const pages=[['1-ask.html','Just ask'],['2-street.html','Storybook street'],['3-globe.html','Globe in daylight'],['4-story.html','One house, two records'],['5-chat.html','Just talk']];
  const here=location.pathname.split('/').pop()||'index.html';
  const nav=document.createElement('nav');
  nav.setAttribute('aria-label','Mockup switcher');
  nav.style.cssText='position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:9999;display:flex;gap:4px;padding:5px;border-radius:999px;background:rgba(20,22,28,.88);backdrop-filter:blur(8px);font:600 13px/1 system-ui,sans-serif;box-shadow:0 10px 30px -10px rgba(0,0,0,.5)';
  nav.innerHTML='<a href="index.html" title="All five" style="color:#fff;text-decoration:none;padding:9px 12px;border-radius:999px;opacity:.7">All</a>'+pages.map(([f,n],i)=>`<a href="${f}" title="${n}" style="color:${f===here?'#14161c':'#fff'};background:${f===here?'#fff':'transparent'};text-decoration:none;padding:9px 13px;border-radius:999px">${i+1}${f===here&&innerWidth>600?' '+n:''}</a>`).join('');
  document.body.appendChild(nav);
})();
