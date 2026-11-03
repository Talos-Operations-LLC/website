let pdfGeneration=0;
window.renderPdf=async function(container,file,title){
 const generation=String(++pdfGeneration);
 container.dataset.pdfGeneration=generation;
 container.innerHTML='<div class="pdf-loading">Opening original document…</div>';
 try{
  const pdfjs=await import('./vendor/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc='./vendor/pdf.worker.mjs';
  const pdf=await pdfjs.getDocument({url:file,isEvalSupported:false}).promise;
  if(generation!==container.dataset.pdfGeneration||!container.isConnected)return;
  let number=1,zoom=1,rendering=false;
  container.innerHTML=`<div class="pdf-tools"><div class="flex"><button class="icon-button" id="pdf-prev" aria-label="Previous page">‹</button><span id="pdf-page" class="mono"></span><button class="icon-button" id="pdf-next" aria-label="Next page">›</button></div><div class="flex"><button class="icon-button" id="pdf-minus" aria-label="Zoom out">−</button><span id="pdf-zoom" class="mono"></span><button class="icon-button" id="pdf-plus" aria-label="Zoom in">+</button><button class="button small" id="pdf-fit">Fit width</button></div></div><div class="pdf-pages"><canvas aria-label="${esc(title)}" role="img"></canvas></div>`;
  const canvas=container.querySelector('canvas'),pages=container.querySelector('.pdf-pages');
  async function draw(){
   if(rendering)return;rendering=true;
   container.querySelectorAll('button').forEach(b=>b.disabled=true);
   try{
    const page=await pdf.getPage(number),base=page.getViewport({scale:1});
    const scale=Math.max(.2,(container.clientWidth-42)/base.width)*zoom;
    const viewport=page.getViewport({scale}),ratio=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.floor(viewport.width*ratio);canvas.height=Math.floor(viewport.height*ratio);canvas.style.width=viewport.width+'px';canvas.style.height=viewport.height+'px';
    canvas.setAttribute('aria-label',title+', page '+number+' of '+pdf.numPages);
    await page.render({canvasContext:canvas.getContext('2d'),viewport,transform:ratio!==1?[ratio,0,0,ratio,0,0]:null}).promise;
    container.querySelector('#pdf-page').textContent=number+' / '+pdf.numPages;
    container.querySelector('#pdf-zoom').textContent=Math.round(zoom*100)+'%';
    pages.scrollTo(0,0);
   }finally{rendering=false;container.querySelectorAll('button').forEach(b=>b.disabled=false);container.querySelector('#pdf-prev').disabled=number===1;container.querySelector('#pdf-next').disabled=number===pdf.numPages}
  }
  container.querySelector('#pdf-prev').onclick=()=>{if(number>1){number--;draw()}};
  container.querySelector('#pdf-next').onclick=()=>{if(number<pdf.numPages){number++;draw()}};
  container.querySelector('#pdf-plus').onclick=()=>{zoom=Math.min(2.5,zoom+.25);draw()};
  container.querySelector('#pdf-minus').onclick=()=>{zoom=Math.max(.5,zoom-.25);draw()};
  container.querySelector('#pdf-fit').onclick=()=>{zoom=1;draw()};
  await draw();
 }catch(error){if(generation===container.dataset.pdfGeneration&&container.isConnected)container.innerHTML=`<div class="document-unavailable"><h2>Open the original PDF</h2><p>This browser could not render the document preview. The original saved file is available below.</p><a class="button" href="${esc(file)}" target="_blank" rel="noopener">Open saved PDF ↗</a></div>`}
};
