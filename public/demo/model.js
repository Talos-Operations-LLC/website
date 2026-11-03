const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const txt = v => typeof v === 'object' ? v?.t || '' : String(v ?? '');
const links = v => typeof v === 'object' ? v?.l || [] : [];
const localPath = s => s?.replace(/^\.\.\//,'');
const dateFmt = s => String(s || '').replace(/(\d{4})-(\d{2})-(\d{2})/g,'$2/$3/$1');
const section = (r,name) => r.sections.find(s=>s.name===name);
const normBook = s => String(s).split(/[\/-]/).slice(0,2).map(n=>parseInt(n,10)).join('/');
const meta = {
 anchor:{owner:'Patricia Creech Cockrell',vest:'Surviving tenant by the entirety',county:'Johnston',summary:'The deed established survivorship. The estate record supports title passing to Patricia Creech Cockrell. The tax card still names both spouses. A 2000 Wake Electric right-of-way runs along the road frontage.',deed:'6571 / 407',date:'11/02/2023',checked:'10/30/2026',searchDate:'11/02/2026',acres:'1.58',type:'Single-family',stat:'$258,430',statLabel:'Assessed value',case:'26E001338-500',description:'Survivorship, an estate, a utility easement, and a stale tax card.',subtitle:'Kenly, NC 27542',icon:'home'},
 mortgages:{owner:'Kevin J. Moran & Sharon H. Moran',vest:'Spouses · deed recorded 06/05/2014',county:'Wake',summary:'The current deed and tax account agree. No later conveyance affects this parcel. Two prior loans are satisfied; one deed of trust remains open.',deed:'15681 / 991',date:'06/05/2014',checked:'11/02/2026',searchDate:'11/02/2026',type:'Townhome',description:'A clear owner, a full mortgage trail, and a waterline easement found two ways.',subtitle:'Raleigh, NC 27612',icon:'building'},
 trust:{owner:'Pamela Murray Somers, Trustee',vest:'The Pamela Somers Trust',county:'Wake',summary:'A recorded quitclaim deed transfers the property from Pamela M. Somers individually to herself as trustee. The county tax account reflects the trust.',deed:'20344 / 876',date:'09/24/2026',checked:'11/02/2026',searchDate:'11/02/2026',type:'Townhome',description:'A transfer into a trust that the statewide record has not caught up with.',subtitle:'Raleigh, NC 27612',icon:'building'},
 sold:{owner:'Reynold Moreno & Cristina Sayson Ordanes',vest:'Spouses · deed recorded 10/05/2026',county:'Wake',summary:'Sold 10/05/2026 for $650,000. The county account names the Ordaneses; the statewide record still names the seller, and the seller\'s December 2025 deed of trust has no release of record yet.',deed:'20353 / 898',date:'10/05/2026',checked:'11/02/2026',searchDate:'11/02/2026',type:'Townhome',description:'A fresh sale, a company in the chain, and the seller\'s loan still on the record.',subtitle:'Raleigh, NC 27612',icon:'building'},
 clean:{owner:'Audrey McQueen',vest:'Sole owner · unmarried',county:'Wake',summary:'The deed and tax account agree on Audrey McQueen. The owner search found her deed of trust and no later conveyance of the property.',deed:'19707 / 1726',date:'09/11/2024',checked:'11/02/2026',searchDate:'11/02/2026',type:'Townhome',description:'A clean record, with the court file that explains the vesting.',subtitle:'Raleigh, NC 27612',icon:'building'}
};
const verdictLabels={CERTIFIED_CURRENT:'Certified current',TITLE_MOVED:'Title moved',NEEDS_REVIEW:'Needs review'};
function supportingRecordLabel(group,label,path){
 const file=path.split('/').pop();
 if(group==='County GIS')return 'County parcel boundaries & details';
 if(group==='Statewide parcel record (NC OneMap)')return 'NC OneMap parcel record';
 if(group==='County tax card'){
  if(file.startsWith('prc_'))return 'Property record card';
  if(file.startsWith('owner_search_'))return 'Tax owner search results';
  if(file.startsWith('tax_bill_history_'))return 'Tax payment history';
  if(file.startsWith('tax_bill_'))return file.endsWith('.json')?'Tax bill details':file.endsWith('.html')?'Tax billing account':'Property tax bill';
  return file.endsWith('.html')?'Tax account details':'County tax account';
 }
 if(group==='Court record (eCourts)'){
  if(file==='case_page.png')return 'Estate of Ransom Wayne Cockrell · 26E001338-500';
  if(file==='case_page_08E000620.png')return 'Estate of Leola C. Creech · 08E000620-500';
  const caseNumber=file.match(/^case_(.+)\.png$/)?.[1];
  if(caseNumber)return 'Court case · '+caseNumber;
  const searches={smart_search_full:'Ransom Wayne Cockrell',smart_search_patricia_johnston:'Patricia Creech Cockrell',smart_search_moran_kevin:'Kevin J. Moran',smart_search_moran_sharon:'Sharon H. Moran',smart_search_somers_pamela:'Pamela M. Somers',smart_search_ordanes_reynold:'Reynold Moreno Ordanes',smart_search_ordanes_cristina:'Cristina Sayson Ordanes',smart_search_moghadass_masoud:'Masoud Moghadass',smart_search_mcqueen_audrey:'Audrey McQueen'};
  const person=searches[file.replace(/\.[^.]+$/,'')];
  if(person)return (file.endsWith('.json')?'Court search details · ':'Court search results · ')+person;
 }
 if(group==='Plats'){
  const bookPage=file.match(/^(?:BM)?(\d+)-(\d+)/);
  if(bookPage){const ref=`Book ${Number(bookPage[1])} / Page ${Number(bookPage[2])}`;const date=label.match(/\d{2}\/\d{2}\/\d{4}/)?.[0];return (file.endsWith('.html')?'Plat index · ':file.endsWith('.png')&&file.startsWith('BM')?'Plat preview · ':'Recorded plat · ')+ref+(date?' · '+date:'');}
 }
 return label;
}
const properties = ['anchor','mortgages','trust','sold','clean'].map(id=>{
 const run=RUNS.find(r=>r.slug===id),raw=RECORDS[id],m=meta[id];
 const p={...m,id,run,raw,address:run.label.split(',')[0],parcel:run.keys[1],pin:run.keys[2],verdict:run.verdict,flags:structuredClone(FINDINGS[id]||[]),tax:FEAT[id].tax[1],deedFile:FEAT[id].deed[1],documents:[]};
 const add=d=>{if(!p.documents.some(x=>x.id===d.id))p.documents.push(d)};
 if(section(raw,'Register of Deeds')){
  const table=section(raw,'Register of Deeds').tables[1];
  const dispositions=section(raw,'Title update').tables[0].rows;
  for(const row of table.rows){let match=dispositions.find(d=>normBook(d[0])===normBook(row[1]));const file=links(row[6]).find(l=>l[0]==='PDF')?.[1];let reason=match?txt(match[4]):'Included in the captured record pack. Review the instrument and its parcel description.';
   const predecessor=raw.titleChain?.find(e=>['810/205','2810/880'].includes(e.book)&&e.book===normBook(row[1]));if(predecessor)reason=predecessor.text;
   if(normBook(row[1])==='6571/407')reason='Current deed-in: 1.581 acres, Plat 99/190; creates a tenancy by the entirety.';
   if(normBook(row[1])==='4964/61')reason='Permanent water-line easement on the adjoining tract 11O03037B, not this parcel. Set aside.';
   if(normBook(row[1])==='814/800')reason='Original deed of the house lot, 04/15/1977: William L. and Leola C. Creech to Ransom Wayne and Patricia Lee C. Cockrell as a gift. 176 feet on the east side of SR 1934 by 250 feet deep. Not name-indexed (the index starts in 1989); found by book and page.';
   if(normBook(row[1])==='2974/972')reason='Prior chain: Leola C. Creech deeded Patricia Creech Cockrell a remainder interest in the five farm tracts, reserving a life estate that has since ended. Parcel 11O03037D, folded into this lot in 2023, came out of Tract Four.';
   if(normBook(row[1])==='3028/690')reason='Re-recording of Deed Book 2974 Page 972 to correct a clerical error. Same conveyance, same tracts.';
   if(/DEED OF TRUST/.test(row[0])&&!match)reason='Deed of trust by an owner of this lot; its release status is on the Mortgages layer.';
   if(/SATISFACTION/.test(row[0])&&!match)reason='Satisfaction citing a deed of trust on this lot.';
   if(normBook(row[1])==='17283/2295')reason='City of Raleigh waterline easement across this lot (parcel 0337336), granted by the Morans on '+dateFmt(row[2])+'. Retained: it burdens the title.';
   if(normBook(row[1])==='15681/991')reason='Current deed-in: Lot 6, Copper Ridge Townhomes, to Kevin J. and Sharon H. Moran, $339,000.';
   if(normBook(row[1])==='15575/2425')reason='Prior deed-in: Lot 83 to Pamela M. Somers individually, 02/06/2014.';
   if(normBook(row[1])==='20344/876')reason='Current deed-in: quitclaim from Pamela M. Somers to herself as trustee of the Pamela Somers Trust. Parcel ID 0337413 matches.';
   if(normBook(row[1])==='19093/1626')reason='Chain: Lot 29 bought by Moghadass, Inc. from Konstantinos David and Janet Hemmerly, 07/20/2022, $625,000.';
   if(normBook(row[1])==='20041/1845')reason='Chain: non-warranty deed from Moghadass, Inc. to Masoud Moghadass, 10/16/2025, no excise.';
   if(normBook(row[1])==='20353/898')reason='Current deed-in: Lot 29 to Reynold Moreno and Cristina Sayson Ordanes, 10/05/2026, $650,000.';
   if(normBook(row[1])==='20087/2742')reason='Seller\'s deed of trust to Carter Bank & Trust, 12/05/2025: no satisfaction of record through 11/02/2026.';
   if(normBook(row[1])==='19707/1726')reason='Current deed-in: Lot 82 to Audrey McQueen, unmarried, 09/11/2024, $610,000.';
  if(/MODIFICATION/.test(row[0])&&!match)reason='Modification of a deed of trust on this lot; its release is on the Mortgages layer.';
  if(/POWER OF ATTORNEY/.test(row[0])&&!match)reason='Power of attorney under which a deed in this chain was signed.';
  if(/DECLARATION/.test(row[0]))reason='Declaration of covenants for Copper Ridge, 08/25/2005: assessment lien, architectural control, use and leasing limits. Retained: every lot is subject to it.';
  if(normBook(row[1])==='12239/195')reason='Chain: Lot 6 from Pulte Home Corporation, the developer, to William C. and Mary Cecelia Feick, 10/30/2006, $381,500.';
  if(normBook(row[1])==='12570/1950')reason='Chain: Lot 83 from Pulte Home Corporation to Deniz Solakoglu and Elizabeth E. Dorsett as joint tenants, 05/29/2007, $347,500.';
  if(normBook(row[1])==='14163/891')reason='Chain: the Solakoglus, now married, deed Lot 83 to themselves as tenants by the entirety, 11/19/2010, no excise.';
  if(['12570/1953','12570/1972'].includes(normBook(row[1])))reason='Purchase-money deed of trust for 4605 Manassa Pope Lane that describes Lot 33, The Townes at Crabtree, in error; satisfied. See Findings.';
  if(normBook(row[1])==='12736/1642')reason='Chain: Lot 82 from Pulte Home Corporation to Mi Ok and James Choe, 09/04/2007, $330,000.';
  if(normBook(row[1])==='16613/2140')reason='Chain: Lot 82 from the Choes to Donald C. and Deborah S. McDuffie, 11/23/2016, $320,000.';
  if(normBook(row[1])==='12328/1399')reason='Chain: Lot 29 from Pulte Home Corporation to David and Valerie Hemmerly, 12/22/2006, $383,500.';
  if(normBook(row[1])==='15305/530')reason='Chain: nonwarranty deed vesting Konstantinos David Hemmerly alone under divorce judgment 10CVD020441, 06/05/2013.';
  if(normBook(row[1])==='17283/2280')reason='City of Raleigh waterline easement across this lot (parcel 0337359), granted by Hemmerly on '+dateFmt(row[2])+'. Retained: it burdens the title.';
   if(normBook(row[1])==='1946/708')reason='Wake Electric right-of-way, 30 feet wide, for an overhead line following SR 1934 across this lot. Indexed under Wayne and Patricia only; returned by the search in Patricia\'s name.';
   add({id:row[1],type:row[0].replace(' easement analysis in development',''),date:row[2],party:row[3],grantee:row[4],disposition:match&&normBook(row[1])!=='17283/2295'?'Set aside':'Retained',reason,file:localPath(file),rule:match?.[2]||'Record pack',source:m.county+' County Register of Deeds'});
  }
 } else {
  add({id:m.deed,type:'DEED',date:m.date,party:id==='trust'?'Pamela M. Somers':m.owner,grantee:m.owner,disposition:'Retained',reason:id==='trust'?'The current recorded conveyance to the trustee. Parcel ID 0337413 matches.':'The deed-in identifies the grantees and the subject property.',file:p.deedFile,source:'Wake Register of Deeds'});
  if(id==='trust')add({id:'15575 / 2425',type:'PRIOR DEED',date:'02/06/2014',party:'Pamela M. Somers',disposition:'Retained',reason:'Prior deed-in used as the starting point for the captured name search.',file:'files/trust/deed_in.pdf',source:'Wake Register of Deeds'});
  for(const row of section(raw,'Searches')?.tables?.[1]?.rows||[]){const file=links(row[5]).find(l=>l[0]==='PDF')?.[1];if(file&&localPath(file)===p.deedFile)continue;add({id:row[0],type:row[1],date:row[6]||'',disposition:row[2]==='kept'?'Retained':'Set aside',rule:row[3],reason:txt(row[5]).replace(/ PDF$/,''),file:localPath(file),source:'Wake Register of Deeds'});}
 }
 p.mortgages=(section(raw,'Mortgages')?.tables?.[0]?.rows||[]).map(r=>({id:r[0],date:r[1],lender:r[2],status:r[3],release:r[4].split(' on ')[0],releaseDate:r[6]||'',name:r[5]||'Ransom Wayne & Patricia Cockrell'}));
 p.sourceSteps=run.steps.map(s=>({...s,bad:false}));
 p.flags.forEach(f=>{f.ev=(f.ev||[]).map(([t,h])=>[t,localPath(h)]);});

 const taxFacts=section(raw,'County tax card')?.kv||[];
 p.acres=txt(taxFacts.find(([key])=>key==='Acres')?.[1])||p.acres;
 p.supportingRecords=['County tax card','Court record (eCourts)','Corporate seller (NC Secretary of State)','Plats','County GIS','Statewide parcel record (NC OneMap)'].map(name=>{
  const record=section(raw,name),items=[];
  const addSource=(label,path)=>{path=localPath(path);if(path?.startsWith('files/')&&!items.some(item=>item.path===path))items.push({label:supportingRecordLabel(name,label,path),path})};
  for(const [label,value] of record?.kv||[])for(const [format,path] of links(value))addSource(label+' · '+format,path);
  for(const [i,path] of (record?.imgs||[]).entries())addSource(record.figs?.[i]||'Plat image '+(i+1),path);
  return {name,items};
 }).filter(group=>group.items.length);
 p.flags.forEach(f=>{f.ev=f.ev.map(([label,path])=>{if(!path.startsWith('record:'))return [label,path];const instrument=p.documents.find(d=>normBook(d.id)===normBook(path.slice(7)));return instrument?.file?[instrument.type+' · '+instrument.id,instrument.file]:[label,path]})});
 const statewide=section(raw,'Statewide parcel record (NC OneMap)')?.tables?.[0]?.rows||[];
 p.sourceSteps=p.sourceSteps.map(step=>step.label==='Cross-check statewide'&&statewide.length?{...step,result:statewide.filter(row=>row[3]==='agree').length+' of '+statewide.length+' fields agree with the county'}:step.label==='Decide the title'?{...step,result:verdictLabels[p.verdict]+'. '+p.summary}:step);
 p.files=FILE_MANIFEST.filter(f=>f.path.startsWith('files/'+id+'/'));
 return p;
});
const propertyById=id=>properties.find(p=>p.id===id);
const verdictName=p=>({CERTIFIED_CURRENT:'Certified current',TITLE_MOVED:'Title moved',NEEDS_REVIEW:'Needs review'}[p.verdict]);
const verdictTone=p=>p.verdict==='CERTIFIED_CURRENT'?'mint':p.verdict==='TITLE_MOVED'?'amber':'rose';
const mortgageDoc=(p,id)=>p.documents.find(d=>normBook(d.id)===normBook(id));
