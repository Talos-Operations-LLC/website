const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const txt = v => typeof v === 'object' ? v?.t || '' : String(v ?? '');
const links = v => typeof v === 'object' ? v?.l || [] : [];
const localPath = s => s?.replace(/^\.\.\//,'');
const dateFmt = s => String(s || '').replace(/(\d{4})-(\d{2})-(\d{2})/g,'$2/$3/$1');
const section = (r,name) => r.sections.find(s=>s.name===name);
const normBook = s => String(s).split(/[\/-]/).slice(0,2).map(n=>parseInt(n,10)).join('/');
const meta = {
 anchor:{owner:'Patricia Creech Cockrell',vest:'Surviving tenant by the entirety',county:'Johnston',summary:'The deed established survivorship. The estate record supports title passing to Patricia Creech Cockrell. The tax card still names both spouses. A 2000 Wake Electric right-of-way runs along the road frontage.',deed:'6571 / 407',date:'11/02/2023',checked:'10/30/2026',searchDate:'10/30/2026',acres:'1.58',type:'Single-family',stat:'$258,430',statLabel:'Assessed value',case:'26E001338-500',description:'Survivorship, an estate, a utility easement, and a stale tax card.',subtitle:'Kenly, NC 27542',icon:'home'},
 mortgages:{owner:'Kevin J. Moran & Sharon H. Moran',vest:'Spouses · deed recorded 06/05/2014',county:'Wake',summary:'The current deed and tax account agree. No later conveyance affects this parcel. Two prior loans are satisfied; one deed of trust remains open.',deed:'15681 / 991',date:'06/05/2014',checked:'10/30/2026',searchDate:'11/01/2026',type:'Townhome',description:'A clear owner, with a complete mortgage trail.',subtitle:'Raleigh, NC 27612',icon:'building'},
 trust:{owner:'Pamela Murray Somers, Trustee',vest:'The Pamela Somers Trust',county:'Wake',summary:'A recorded quitclaim deed transfers the property from Pamela M. Somers individually to herself as trustee. The county tax account reflects the trust.',deed:'20344 / 876',date:'09/24/2026',checked:'10/30/2026',searchDate:'11/01/2026',type:'Townhome',description:'A transfer into a trust changes the record owner.',subtitle:'Raleigh, NC 27612',icon:'building'},
 sold:{owner:'Reynold Moreno & Cristina Sayson Ordanes',vest:'Spouses · deed recorded 10/05/2026',county:'Wake',summary:'The deed and tax account identify the Ordaneses. The captured result is held for review. Inspect the recorded transfer before relying on the owner.',deed:'20353 / 898',date:'10/05/2026',checked:'10/30/2026',searchDate:'11/01/2026',type:'Townhome',description:'A recorded ownership change held for review.',subtitle:'Raleigh, NC 27612',icon:'building'},
 clean:{owner:'Audrey McQueen',vest:'Sole owner · unmarried',county:'Wake',summary:'The deed and tax account agree on Audrey McQueen. The owner search found her deed of trust and no later conveyance of the property.',deed:'19707 / 1726',date:'09/11/2024',checked:'10/30/2026',searchDate:'11/01/2026',type:'Townhome',description:'A straightforward, certified-current record.',subtitle:'Raleigh, NC 27612',icon:'building'}
};
const properties = ['anchor','mortgages','trust','sold','clean'].map(id=>{
 const run=RUNS.find(r=>r.slug===id),raw=RECORDS[id],m=meta[id];
 const p={...m,id,run,raw,address:run.label.split(',')[0],parcel:run.keys[1],pin:run.keys[2],verdict:run.verdict,flags:structuredClone(FINDINGS[id]||[]),tax:FEAT[id].tax[1],deedFile:FEAT[id].deed[1],documents:[]};
 const add=d=>{if(!p.documents.some(x=>x.id===d.id))p.documents.push(d)};
 if(id==='anchor'){
  const table=section(raw,'Register of Deeds').tables[1];
  const dispositions=section(raw,'Title update').tables[0].rows;
  for(const row of table.rows){let match=dispositions.find(d=>normBook(d[0])===normBook(row[1]));const file=links(row[6]).find(l=>l[0]==='PDF')?.[1];let reason=match?txt(match[4]):'Included in the captured record pack. Review the instrument and its parcel description.';
   if(normBook(row[1])==='6571/407')reason='Current deed-in: 1.581 acres, Plat 99/190; creates a tenancy by the entirety.';
   if(normBook(row[1])==='4964/61')reason='Permanent water-line easement on adjoining tract 11O03037B, not this parcel. Retained as a contextual finding.';
   if(normBook(row[1])==='814/800')reason='Original deed of the house lot, 04/15/1977: William L. and Leola C. Creech to Ransom Wayne and Patricia Lee C. Cockrell as a gift. 176 feet on the east side of SR 1934 by 250 feet deep. Not name-indexed (the index starts in 1989); found by book and page.';
   if(normBook(row[1])==='2974/972')reason='Prior chain: Leola C. Creech deeded Patricia Creech Cockrell a remainder interest in the five farm tracts, reserving a life estate that has since ended. Parcel 11O03037D, folded into this lot in 2023, came out of Tract Two.';
   if(normBook(row[1])==='3028/690')reason='Re-recording of Deed Book 2974 Page 972 to correct a clerical error. Same conveyance, same tracts.';
   if(normBook(row[1])==='1946/708')reason='Wake Electric right-of-way, 30 feet wide, for an overhead line following SR 1934 across this lot. Indexed under Wayne and Patricia only; returned by the search in Patricia\'s name.';
   add({id:row[1],type:row[0].replace(' easement analysis in development',''),date:row[2],party:row[3],grantee:row[4],disposition:match?'Set aside':'Retained',reason,file:localPath(file),rule:match?.[2]||'Record pack',source:'Johnston Register of Deeds'});
  }
 } else {
  add({id:m.deed,type:'DEED',date:m.date,party:id==='trust'?'Pamela M. Somers':m.owner,grantee:m.owner,disposition:'Retained',reason:id==='trust'?'The current recorded conveyance to the trustee. Parcel ID 0337413 matches.':'The deed-in identifies the grantees and the subject property.',file:p.deedFile,source:'Wake Register of Deeds'});
  if(id==='trust')add({id:'15575 / 2425',type:'PRIOR DEED',date:'02/06/2014',party:'Pamela M. Somers',disposition:'Retained',reason:'Prior deed-in used as the starting point for the captured name search.',file:'files/trust/deed_in.pdf',source:'Wake Register of Deeds'});
  for(const row of section(raw,'Searches')?.tables?.[1]?.rows||[]){const file=links(row[5]).find(l=>l[0]==='PDF')?.[1];if(file&&localPath(file)===p.deedFile)continue;add({id:row[0],type:row[1],date:'',disposition:row[2]==='kept'?'Retained':'Set aside',rule:row[3],reason:txt(row[5]).replace(/ PDF$/,''),file:localPath(file),source:'Wake Register of Deeds'});}
 }
 p.mortgages=(section(raw,'Mortgages')?.tables?.[0]?.rows||[]).map(r=>({id:r[0],date:r[1],lender:r[2],status:r[3],release:r[4],name:r[5]||'Ransom Wayne & Patricia Cockrell'}));
 p.sourceSteps=run.steps.filter(s=>!['Read the HOA sheet','Cross-check Zillow','Flagged'].includes(s.label)).map(s=>({...s,bad:false}));
 p.flags.forEach(f=>{f.ev=(f.ev||[]).map(([t,h])=>[t,localPath(h)]);});
 if(id==='trust')p.flags[1].ev=[['Mortgage classification','record:020333/00749']];
 p.files=FILE_MANIFEST.filter(f=>f.path.startsWith('files/'+id+'/'));
 return p;
});
const propertyById=id=>properties.find(p=>p.id===id);
const verdictName=p=>({CERTIFIED_CURRENT:'Certified current',TITLE_MOVED:'Title moved',NEEDS_REVIEW:'Needs review'}[p.verdict]);
const verdictTone=p=>p.verdict==='CERTIFIED_CURRENT'?'mint':p.verdict==='TITLE_MOVED'?'amber':'rose';
const mortgageDoc=(p,id)=>p.documents.find(d=>normBook(d.id)===normBook(id));
