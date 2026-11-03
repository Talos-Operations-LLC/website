let pdfGeneration=0;
window.renderPdf=async function(container,file,title,toolbar=null){
 container.pdfCleanup?.();
 const generation=String(++pdfGeneration);
 container.dataset.pdfGeneration=generation;
 container.innerHTML='<div class="pdf-loading">Opening original document…</div>';
 let pdf,loadingTask,renderTask,resizeObserver,resizeTimer,disposed=false;
 const dialog=container.closest('dialog');
 const onClose=()=>{if(!dialog.open)dispose()};
 const active=()=>!disposed&&generation===container.dataset.pdfGeneration&&container.isConnected;
 function dispose(){if(disposed)return;disposed=true;clearTimeout(resizeTimer);resizeObserver?.disconnect();renderTask?.cancel();dialog?.removeEventListener('close',onClose);if(loadingTask)loadingTask.destroy().catch(()=>{})}
 container.pdfCleanup=dispose;
 dialog?.addEventListener('close',onClose);
 try{
  const pdfjs=await import('../vendor/pdf.mjs');
  if(!active())return;
  pdfjs.GlobalWorkerOptions.workerSrc='./vendor/pdf.worker.mjs';
  loadingTask=pdfjs.getDocument({url:file,isEvalSupported:false});
  pdf=await loadingTask.promise;
  if(!active()){dispose();return}
  let zoom=1,rendering=false,redrawPending=false;
  const controlsMarkup=`<span class="pdf-page-count mono">${pdf.numPages} ${pdf.numPages===1?'page':'pages'}</span><div class="flex"><button class="icon-button" id="pdf-minus" aria-label="Zoom out" title="Zoom out">−</button><span id="pdf-zoom" class="mono">100%</span><button class="icon-button" id="pdf-plus" aria-label="Zoom in" title="Zoom in">+</button><button class="button small" id="pdf-fit">Fit width</button></div>`;
  container.innerHTML=`${toolbar?'':'<div class="pdf-tools">'+controlsMarkup+'</div>'}<div class="pdf-pages">${Array.from({length:pdf.numPages},(_,i)=>`<figure class="pdf-sheet"><figcaption>Page ${i+1} of ${pdf.numPages}</figcaption><canvas aria-label="${esc(title)}, page ${i+1} of ${pdf.numPages}" role="img"></canvas></figure>`).join('')}</div>`;
  if(toolbar)toolbar.innerHTML=controlsMarkup;
  const controls=toolbar||container.querySelector('.pdf-tools');
  const sheets=[...container.querySelectorAll('.pdf-sheet')];
  async function draw(){
   if(!active())return;
   if(rendering){redrawPending=true;return}
   rendering=true;
   const scrollFraction=container.scrollTop/Math.max(1,container.scrollHeight-container.clientHeight);
   controls.querySelectorAll('button').forEach(button=>button.disabled=true);
   try{
    const pages=await Promise.all(sheets.map((_,i)=>pdf.getPage(i+1)));
    if(!active())return;
    const fitWidth=Math.max(1,container.clientWidth-40);
    const layouts=pages.map((page,i)=>{
     const base=page.getViewport({scale:1}),viewport=page.getViewport({scale:fitWidth/base.width*zoom});
     const ratio=Math.min(devicePixelRatio||1,2,Math.sqrt(6000000/(viewport.width*viewport.height)));
     const canvas=sheets[i].querySelector('canvas');
     canvas.width=Math.floor(viewport.width*ratio);canvas.height=Math.floor(viewport.height*ratio);
     canvas.style.width=viewport.width+'px';canvas.style.height=viewport.height+'px';
     return {page,canvas,viewport,ratio};
    });
    container.scrollTop=scrollFraction*Math.max(0,container.scrollHeight-container.clientHeight);
    controls.querySelector('#pdf-zoom').textContent=Math.round(zoom*100)+'%';
    for(const {page,canvas,viewport,ratio} of layouts){
     if(!active())return;
     renderTask=page.render({canvasContext:canvas.getContext('2d'),viewport,transform:ratio!==1?[ratio,0,0,ratio,0,0]:null});
     await renderTask.promise;
     canvas.dataset.rendered='true';
    }
   }catch(error){if(active()&&error.name!=='RenderingCancelledException')showError()}
   finally{
    rendering=false;renderTask=null;
    if(active()){
     controls.querySelectorAll('button').forEach(button=>button.disabled=false);
     const minus=controls.querySelector('#pdf-minus'),plus=controls.querySelector('#pdf-plus');
     if(minus)minus.disabled=zoom<=.5;if(plus)plus.disabled=zoom>=2.5;
     if(redrawPending){redrawPending=false;draw()}
    }else dispose();
   }
  }
  controls.querySelector('#pdf-plus').onclick=()=>{zoom=Math.min(2.5,zoom+.25);draw()};
  controls.querySelector('#pdf-minus').onclick=()=>{zoom=Math.max(.5,zoom-.25);draw()};
  controls.querySelector('#pdf-fit').onclick=()=>{zoom=1;draw()};
  let width=container.clientWidth;
  resizeObserver=new ResizeObserver(()=>{if(container.clientWidth===width)return;width=container.clientWidth;clearTimeout(resizeTimer);resizeTimer=setTimeout(draw,120)});
  resizeObserver.observe(container);
  await draw();
 }catch(error){if(active())showError();else dispose()}
 function showError(){if(toolbar)toolbar.innerHTML='';container.innerHTML=`<div class="document-unavailable"><h2>Open the original PDF</h2><p>This browser could not render the document preview. The original saved file is available below.</p><a class="button" href="${esc(file)}" target="_blank" rel="noopener">Open saved PDF ↗</a></div>`;dispose()}
};
