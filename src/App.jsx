import { useState, useEffect, useCallback, useRef, useMemo } from "react";

// ─── PHASES ───────────────────────────────────────────────────────────────────
const PHASES = [
  { id:"prospecting", label:"Prospección",    color:"#64748b", icon:"◎" },
  { id:"sales",       label:"Venta",          color:"#38bdf8", icon:"⬡" },
  { id:"admin",       label:"Administrativo", color:"#f59e0b", icon:"⟁" },
  { id:"billing",     label:"Facturación",    color:"#a78bfa", icon:"⊟" },
  { id:"delivery",    label:"Entrega",        color:"#34d399", icon:"★" },
];

// ─── FUNNEL ───────────────────────────────────────────────────────────────────
const FUNNEL = [
  { id:"new",          phase:"prospecting", label:"Nuevo Lead",              icon:"◎", color:"#64748b",
    tasks:["Registrar datos completos del cliente","Identificar modelo de interés","Registrar fuente del lead"],
    docs:[] },
  { id:"contacted",    phase:"prospecting", label:"Contactado",              icon:"✆", color:"#38bdf8",
    tasks:["Primer contacto realizado","Confirmar necesidades y presupuesto","Agendar siguiente paso"],
    docs:[] },
  { id:"quoted",       phase:"sales",       label:"Cotización",              icon:"⊟", color:"#818cf8",
    tasks:["Preparar cotización detallada","Presentar cotización al cliente","Resolver objeciones de precio"],
    docs:[{id:"quote_doc",label:"Cotización firmada / enviada"}] },
  { id:"test_drive",   phase:"sales",       label:"Prueba de Manejo",        icon:"⬡", color:"#fb923c",
    tasks:["Agendar fecha y hora","Realizar prueba de manejo","Registrar retroalimentación del cliente"],
    docs:[{id:"test_doc",label:"Comprobante / firma de prueba de manejo"}] },
  { id:"separation",   phase:"sales",       label:"Separación / Enganche",   icon:"₿", color:"#f59e0b",
    tasks:["Acordar monto de separación","Recibir pago de enganche","Emitir recibo de separación"],
    docs:[{id:"sep_receipt",label:"Recibo de separación / enganche"}] },
  { id:"pay_confirm",  phase:"admin",       label:"Confirmación de Pago",    icon:"✉", color:"#f59e0b",
    tasks:["Enviar confirmación a confirmaciones@grupomxa.com.mx","Esperar acuse de confirmación","Imprimir comprobante de pago","Imprimir confirmación recibida","Juntar ambos documentos"],
    docs:[{id:"payment_proof",label:"Comprobante de pago impreso"},{id:"confirm_email",label:"Confirmación de correo recibida"}] },
  { id:"billing_sign", phase:"admin",       label:"Firma en Facturación",    icon:"✎", color:"#fb923c",
    tasks:["Llevar documentos al área de facturación","Obtener firma del encargado de facturación"],
    docs:[{id:"billing_signed",label:"Documentos firmados por encargado"}] },
  { id:"cashier",      phase:"admin",       label:"Aplicar en Cajas",        icon:"⊞", color:"#fbbf24",
    tasks:["Llevar documentos firmados a cajas","Aplicar pago a la factura","Obtener sello / confirmación de cajas"],
    docs:[{id:"cashier_stamp",label:"Sello o confirmación de cajas"}] },
  { id:"billing_docs", phase:"billing",     label:"Documentos de Facturación",icon:"📋",color:"#a78bfa",
    tasks:["Solicitar documentos al cliente","Validar vigencia de INE","Verificar RFC en SAT","Completar solicitud de facturación"],
    docs:[
      {id:"ine",        label:"INE vigente"},
      {id:"comprobante",label:"Comprobante de domicilio"},
      {id:"sol_fact",   label:"Solicitud de facturación"},
      {id:"contrato",   label:"Contrato de adhesión"},
      {id:"csf",        label:"Constancia de situación fiscal"},
      {id:"val_ine",    label:"Validación de INE"},
      {id:"curp",       label:"CURP"},
      {id:"rfc",        label:"RFC"},
    ] },
  { id:"invoice_bank", phase:"billing",     label:"Factura al Banco",        icon:"⟁", color:"#c084fc",
    tasks:["Generar PDF de factura","Enviar PDF de factura al banco","Confirmar recepción por parte del banco"],
    docs:[{id:"invoice_pdf",label:"PDF de factura enviado al banco"}] },
  { id:"bank_payment", phase:"billing",     label:"Pago del Banco a Agencia",icon:"✦", color:"#e879f9",
    tasks:["Esperar pago del banco a la agencia","Confirmar depósito recibido","Notificar a administración"],
    docs:[{id:"bank_confirm",label:"Comprobante de pago del banco"}] },
  { id:"second_pay",   phase:"admin",       label:"Segundo Proceso de Pagos",icon:"↺", color:"#f59e0b",
    tasks:["Emitir comprobante del segundo pago","Confirmar por correo a confirmaciones@grupomxa.com.mx","Imprimir comprobante + confirmación","Llevar a facturación para firma","Llevar a cajas para aplicar"],
    docs:[
      {id:"pay2_proof",  label:"Comprobante segundo pago"},
      {id:"pay2_confirm",label:"Confirmación de correo (segundo pago)"},
      {id:"pay2_sign",   label:"Firma de facturación (segundo pago)"},
      {id:"pay2_cashier",label:"Sello de cajas (segundo pago)"},
    ] },
  { id:"exit_tramit",  phase:"delivery",    label:"Trámite de Salida",       icon:"⬗", color:"#34d399",
    tasks:["Solicitar Balanza con cuenta liquidada","Verificar saldo en cero","Solicitar formato de salida a facturación","Obtener firma de Gerente","Obtener firma de Jefe de Facturación","Obtener firma del Vendedor","Obtener firma del Cliente"],
    docs:[
      {id:"balanza",      label:"Balanza con saldo en cero"},
      {id:"exit_format",  label:"Formato de salida (facturación)"},
      {id:"mgr_sign",     label:"Firma de Gerente"},
      {id:"chief_sign",   label:"Firma de Jefe de Facturación"},
      {id:"seller_sign",  label:"Firma del Vendedor"},
      {id:"client_sign",  label:"Firma del Cliente"},
    ] },
  { id:"checklist",    phase:"delivery",    label:"Checklist de Entrega",    icon:"★", color:"#4ade80",
    tasks:["Verificar póliza de garantía debidamente llenada","Entregar copia de llave","Entregar regalo JAC","Entregar birlos de seguridad","Tomar foto de entrega con cliente","Felicitar al cliente — ¡venta completada!"],
    docs:[
      {id:"warranty",      label:"Póliza de garantía llenada"},
      {id:"key_copy",      label:"Copia de llave"},
      {id:"jac_gift",      label:"Regalo JAC (foto o comprobante)"},
      {id:"wheel_locks",   label:"Birlos de seguridad"},
      {id:"delivery_photo",label:"Foto de entrega con cliente"},
    ] },
  { id:"lost", phase:"prospecting", label:"Perdido", icon:"✕", color:"#f87171", tasks:[], docs:[] },
];

const ACTIVE_STEPS = FUNNEL.filter(s=>s.id!=="lost");

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function calcScore(lead) {
  const hrs = lead.lastContactAt ? (Date.now()-lead.lastContactAt)/3600000 : 9999;
  const idx = FUNNEL.findIndex(s=>s.id===lead.step);
  let s = 0;
  if(hrs>72)s+=50; else if(hrs>48)s+=35; else if(hrs>24)s+=20; else if(hrs>8)s+=10;
  s += Math.min(idx*4,40);
  if(lead.priority==="alta")s+=30; if(lead.priority==="media")s+=10;
  s += (lead.tasks||[]).filter(t=>!t.done).length*2;
  if(lead.deadlineAt && lead.deadlineAt < Date.now()+86400000) s+=20;
  return s;
}

function urgency(lead) {
  const hrs = lead.lastContactAt ? (Date.now()-lead.lastContactAt)/3600000 : 9999;
  if(hrs>72) return {label:`${Math.floor(hrs/24)}d sin contacto`,color:"#f87171"};
  if(hrs>24) return {label:`${Math.floor(hrs)}h sin contacto`,color:"#fb923c"};
  if(hrs>8)  return {label:`${Math.floor(hrs)}h sin contacto`,color:"#f59e0b"};
  return {label:"Al día",color:"#34d399"};
}

function isStuck(lead) {
  const hrs = lead.lastContactAt ? (Date.now()-lead.lastContactAt)/3600000 : 9999;
  return hrs > 48 && lead.step !== "lost";
}

function isDeadlineNear(lead) {
  return lead.deadlineAt && lead.deadlineAt < Date.now()+86400000*2 && lead.deadlineAt > Date.now();
}

function isDeadlinePast(lead) {
  return lead.deadlineAt && lead.deadlineAt < Date.now();
}

function needsActionToday(lead) {
  const hrs = lead.lastContactAt ? (Date.now()-lead.lastContactAt)/3600000 : 9999;
  return hrs > 24 || isDeadlineNear(lead) || isDeadlinePast(lead);
}

function fmtDate(ts) {
  if(!ts) return "—";
  return new Date(ts).toLocaleDateString("es-MX",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"});
}
function fmtDateShort(ts) {
  if(!ts) return "";
  return new Date(ts).toLocaleDateString("es-MX",{day:"2-digit",month:"short"});
}
function fmtMXN(n) {
  if(!n) return "—";
  return new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN",minimumFractionDigits:0}).format(n);
}
function fmtSize(b) {
  if(!b) return "";
  if(b<1048576) return `${(b/1024).toFixed(0)} KB`;
  return `${(b/1048576).toFixed(1)} MB`;
}
function hoursAgo(ts) { return ts?(Date.now()-ts)/3600000:9999; }
function daysInStep(lead) {
  const ref = lead.stepEnteredAt||lead.createdAt||Date.now();
  return Math.floor((Date.now()-ref)/86400000);
}

// ─── STORAGE ──────────────────────────────────────────────────────────────────
const KEY = "autocrm_v4";
function loadLeads() { try{ return JSON.parse(localStorage.getItem(KEY))||[]; }catch{ return []; } }
function saveLeads(l) { localStorage.setItem(KEY,JSON.stringify(l)); }
function fKey(lid,did) { return `acrm4_${lid}_${did}`; }
function saveFile(lid,did,data) { try{ localStorage.setItem(fKey(lid,did),data); return true; }catch{ return false; } }
function loadFile(lid,did) { return localStorage.getItem(fKey(lid,did)); }
function delFile(lid,did)  { localStorage.removeItem(fKey(lid,did)); }

function makeTasks(sid){ return (FUNNEL.find(s=>s.id===sid)?.tasks||[]).map((l,i)=>({id:i,label:l,done:false})); }
function makeDocs(sid) { return (FUNNEL.find(s=>s.id===sid)?.docs||[]).map(d=>({...d,uploaded:false,fileName:null,fileSize:null,uploadedAt:null})); }

const SEED = [
  {id:1,name:"Carlos Mendoza", phone:"555-1234",model:"JAC T8 Pro 2024",  step:"quoted",      priority:"alta", lastContactAt:Date.now()-80*3600000,notes:"Esperando respuesta del banco",  interactions:[],createdAt:Date.now()-5*86400000, salePrice:489000,downPayment:50000,deadlineAt:Date.now()+86400000,stepEnteredAt:Date.now()-2*86400000},
  {id:2,name:"Laura Ríos",     phone:"555-5678",model:"JAC JS4 2024",     step:"test_drive",  priority:"media",lastContactAt:Date.now()-30*3600000,notes:"Viene el sábado",               interactions:[],createdAt:Date.now()-3*86400000, salePrice:420000,downPayment:40000,deadlineAt:null,stepEnteredAt:Date.now()-86400000},
  {id:3,name:"Jorge Fuentes",  phone:"555-9012",model:"JAC J7 2025",      step:"pay_confirm", priority:"alta", lastContactAt:Date.now()-26*3600000,notes:"Enganche recibido, confirmar",  interactions:[],createdAt:Date.now()-7*86400000, salePrice:510000,downPayment:60000,deadlineAt:Date.now()-3600000,stepEnteredAt:Date.now()-3*86400000},
  {id:4,name:"Sofía Vargas",   phone:"555-3456",model:"JAC JS3 2024",     step:"new",         priority:"baja", lastContactAt:null,                 notes:"Llegó por Instagram",          interactions:[],createdAt:Date.now()-86400000,   salePrice:null,  downPayment:null, deadlineAt:null,stepEnteredAt:Date.now()-86400000},
  {id:5,name:"Andrés Castro",  phone:"555-7890",model:"JAC T6 2024",      step:"billing_docs",priority:"alta", lastContactAt:Date.now()-20*3600000,notes:"Documentos en proceso",        interactions:[],createdAt:Date.now()-10*86400000,salePrice:398000,downPayment:45000,deadlineAt:Date.now()+3*86400000,stepEnteredAt:Date.now()-4*86400000},
  {id:6,name:"Martina López",  phone:"555-2222",model:"JAC T8 2024",      step:"checklist",   priority:"alta", lastContactAt:Date.now()-2*3600000, notes:"Entrega hoy",                  interactions:[],createdAt:Date.now()-20*86400000,salePrice:475000,downPayment:55000,deadlineAt:null,stepEnteredAt:Date.now()-86400000},
];

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function AutoCRM() {
  const [leads,setLeads]         = useState(()=>{ const s=loadLeads(); return s.length?s:SEED.map(l=>({...l,tasks:makeTasks(l.step),docs:makeDocs(l.step)})); });
  const [view,setView]           = useState("today"); // today|focus|list|metrics|add|detail
  const [detailId,setDetailId]   = useState(null);
  const [editMode,setEditMode]   = useState(false);
  const [form,setForm]           = useState({name:"",phone:"",model:"",step:"new",priority:"media",notes:"",salePrice:"",downPayment:"",deadlineAt:""});
  const [note,setNote]           = useState("");
  const [search,setSearch]       = useState("");
  const [filterPhase,setFilterPhase] = useState("all");
  const [showQueue,setShowQueue] = useState(false);
  const [showSearch,setShowSearch] = useState(false);
  const fileRef = useRef(null);
  const [pendingUp,setPendingUp] = useState(null);

  useEffect(()=>{ saveLeads(leads); },[leads]);

  const active  = useMemo(()=>leads.filter(l=>l.step!=="lost").sort((a,b)=>calcScore(b)-calcScore(a)),[leads]);
  const focus   = active[0]||null;
  const queue   = active.slice(1);
  const detail  = leads.find(l=>l.id===detailId)||null;
  const current = view==="detail"?detail:focus;

  // TODAY leads
  const todayLeads = useMemo(()=>active.filter(l=>needsActionToday(l)).sort((a,b)=>calcScore(b)-calcScore(a)),[active]);
  const stuckLeads = useMemo(()=>active.filter(l=>isStuck(l)),[active]);

  // SEARCH
  const searchResults = useMemo(()=>{
    if(!search.trim()) return [];
    const q=search.toLowerCase();
    return leads.filter(l=>l.name?.toLowerCase().includes(q)||l.phone?.includes(q)||l.model?.toLowerCase().includes(q));
  },[leads,search]);

  // METRICS
  const metrics = useMemo(()=>{
    const total = leads.length;
    const won = leads.filter(l=>l.step==="checklist"&&(l.tasks||[]).every(t=>t.done)).length;
    const lost = leads.filter(l=>l.step==="lost").length;
    const convRate = total>0?Math.round((won/total)*100):0;
    const pipeline = active.reduce((sum,l)=>sum+(l.salePrice||0),0);
    const avgCycle = won>0? Math.round(leads.filter(l=>l.step==="checklist").reduce((s,l)=>{
      return s+((Date.now()-(l.createdAt||Date.now()))/86400000);
    },0)/won) : 0;
    const byStep = ACTIVE_STEPS.map(s=>({...s,count:active.filter(l=>l.step===s.id).length})).filter(s=>s.count>0);
    const byModel = Object.entries(leads.reduce((acc,l)=>{ if(l.model){ acc[l.model]=(acc[l.model]||0)+1; } return acc; },{})).sort((a,b)=>b[1]-a[1]).slice(0,5);
    const avgTimeInStep = ACTIVE_STEPS.map(s=>{
      const inStep = leads.filter(l=>l.step===s.id&&l.stepEnteredAt);
      if(!inStep.length) return null;
      const avg = inStep.reduce((sum,l)=>(Date.now()-(l.stepEnteredAt||Date.now()))/3600000+sum,0)/inStep.length;
      return {label:s.label,color:s.color,hours:Math.round(avg)};
    }).filter(Boolean);
    return {total,won,lost,convRate,pipeline,avgCycle,byStep,byModel,avgTimeInStep};
  },[leads,active]);

  const update = useCallback((id,patch)=>setLeads(p=>p.map(l=>l.id===id?{...l,...patch}:l)),[]);

  const toggleTask = (lid,tid)=>setLeads(p=>p.map(l=>l.id!==lid?l:{...l,tasks:l.tasks.map(t=>t.id===tid?{...t,done:!t.done}:t)}));

  const addNote = (lid,txt)=>{
    if(!txt.trim()) return;
    setLeads(p=>p.map(l=>l.id!==lid?l:{...l,interactions:[{id:Date.now(),note:txt.trim(),at:Date.now()},...(l.interactions||[])],lastContactAt:Date.now()}));
    setNote("");
  };

  const advance = (lead)=>{
    const idx = FUNNEL.findIndex(s=>s.id===lead.step);
    const nxt = FUNNEL[idx+1];
    if(!nxt||nxt.id==="lost") return;
    update(lead.id,{step:nxt.id,tasks:makeTasks(nxt.id),docs:makeDocs(nxt.id),lastContactAt:Date.now(),stepEnteredAt:Date.now()});
  };

  const canAdvance = (lead)=>(lead.tasks||[]).every(t=>t.done)&&(lead.docs||[]).every(d=>d.uploaded);
  const blockReason = (lead)=>{
    const pt=(lead.tasks||[]).filter(t=>!t.done).length;
    const pd=(lead.docs||[]).filter(d=>!d.uploaded).length;
    if(pt&&pd) return `${pt} tarea${pt>1?"s":""} y ${pd} documento${pd>1?"s":""} pendientes`;
    if(pt) return `${pt} tarea${pt>1?"s":""} pendiente${pt>1?"s":""}`;
    if(pd) return `${pd} documento${pd>1?"s":""} requerido${pd>1?"s":""}`;
    return null;
  };

  const handleFile=(e,lid,did)=>{
    const file=e.target.files[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=ev=>{ const ok=saveFile(lid,did,ev.target.result); setLeads(p=>p.map(l=>l.id!==lid?l:{...l,docs:l.docs.map(d=>d.id!==did?d:{...d,uploaded:ok,fileName:file.name,fileSize:file.size,uploadedAt:Date.now()})})); if(!ok) alert("Archivo muy grande."); };
    reader.readAsDataURL(file); e.target.value="";
  };
  const removeDoc=(lid,did)=>{ delFile(lid,did); setLeads(p=>p.map(l=>l.id!==lid?l:{...l,docs:l.docs.map(d=>d.id!==did?d:{...d,uploaded:false,fileName:null,fileSize:null,uploadedAt:null})})); };
  const viewDoc=(lid,did)=>{ const d=loadFile(lid,did); if(d){const a=document.createElement("a");a.href=d;a.target="_blank";a.click();} };

  const getStep=id=>FUNNEL.find(s=>s.id===id);
  const getNext=id=>{ const i=FUNNEL.findIndex(s=>s.id===id); return FUNNEL[i+1]; };
  const getPhase=id=>PHASES.find(p=>p.id===id);

  // ─── CARD ─────────────────────────────────────────────────────────────────
  const renderCard=(lead,compact=false)=>{
    if(!lead) return <div className="empty"><div className="ei">✓</div><div>Sin leads activos</div></div>;
    const s=getStep(lead.step), nxt=getNext(lead.step), ph=getPhase(s?.phase);
    const u=urgency(lead), blk=blockReason(lead), ok=canAdvance(lead);
    const dt=(lead.tasks||[]).filter(t=>t.done).length, tt=(lead.tasks||[]).length;
    const dd=(lead.docs||[]).filter(d=>d.uploaded).length, td=(lead.docs||[]).length;
    const si=FUNNEL.findIndex(f=>f.id===lead.step);
    const pct=Math.round((si/(ACTIVE_STEPS.length-1))*100);
    const priC=lead.priority==="alta"?"#f87171":lead.priority==="media"?"#f59e0b":"#64748b";
    const deadPast=isDeadlinePast(lead), deadNear=isDeadlineNear(lead);
    const stuck=isStuck(lead);
    const days=daysInStep(lead);

    return (
      <div className="card" style={{"--sc":s?.color}}>
        {/* Top bar */}
        <div className="card-top">
          <div className="phase-row">
            <span className="phase-badge" style={{background:`color-mix(in srgb,${ph?.color} 18%,transparent)`,color:ph?.color}}>{ph?.icon} {ph?.label}</span>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              {stuck && <span className="warn-tag">⚠ Estancado {days}d</span>}
              <span className="step-frac">{si+1}/{ACTIVE_STEPS.length}</span>
            </div>
          </div>
          <div className="ftrack"><div className="ffill" style={{width:`${pct}%`,background:s?.color}}/></div>
        </div>

        {/* Hero */}
        <div className="hero">
          <div className="step-pill" style={{"--sc":s?.color}}>{s?.icon} {s?.label}</div>
          {(deadPast||deadNear) && (
            <div className="deadline-banner" style={{background:deadPast?"color-mix(in srgb,#f87171 12%,transparent)":"color-mix(in srgb,#f59e0b 12%,transparent)",borderColor:deadPast?"color-mix(in srgb,#f87171 30%,transparent)":"color-mix(in srgb,#f59e0b 30%,transparent)",color:deadPast?"#f87171":"#f59e0b"}}>
              {deadPast?"⚠ Fecha compromiso vencida":"⏰ Fecha compromiso próxima"} — {fmtDateShort(lead.deadlineAt)}
            </div>
          )}
          <div className="lead-name">{lead.name}</div>
          <div className="lead-model">{lead.model}</div>
          <div className="chips-row">
            <span className="chip">📞 {lead.phone}</span>
            <span className="chip urg" style={{"--uc":u.color}}>{u.label}</span>
            <span className="chip" style={{color:priC,borderColor:`color-mix(in srgb,${priC} 30%,transparent)`}}>● {lead.priority}</span>
          </div>
          {/* Price row */}
          {(lead.salePrice||lead.downPayment) && (
            <div className="price-row">
              {lead.salePrice && <div className="price-cell"><div className="price-lbl">Precio venta</div><div className="price-val">{fmtMXN(lead.salePrice)}</div></div>}
              {lead.downPayment && <div className="price-cell"><div className="price-lbl">Enganche</div><div className="price-val" style={{color:"#34d399"}}>{fmtMXN(lead.downPayment)}</div></div>}
              {lead.deadlineAt && <div className="price-cell"><div className="price-lbl">Compromiso</div><div className="price-val" style={{color:deadPast?"#f87171":deadNear?"#f59e0b":"var(--muted)",fontSize:11}}>{fmtDateShort(lead.deadlineAt)}</div></div>}
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="prog-grid">
          <div className="prog-cell">
            <div className="prog-lbl">Tareas <b style={{color:dt===tt?"#34d399":"var(--accent)"}}>{dt}/{tt}</b></div>
            <div className="pbar"><div className="pfill" style={{width:tt?`${dt/tt*100}%`:"0%",background:dt===tt?"#34d399":"var(--accent)"}}/></div>
          </div>
          <div className="prog-cell b2">
            <div className="prog-lbl">Documentos <b style={{color:dd===td?"#34d399":"#a78bfa"}}>{dd}/{td}</b></div>
            <div className="pbar"><div className="pfill" style={{width:td?`${dd/td*100}%`:"0%",background:dd===td?"#34d399":"#a78bfa"}}/></div>
          </div>
        </div>

        {/* Tasks */}
        {tt>0 && (
          <div className="section">
            <div className="sec-hdr">Pasos de esta etapa</div>
            {lead.tasks.map(t=>(
              <div key={t.id} className="task-row" onClick={()=>toggleTask(lead.id,t.id)}>
                <div className={`chk ${t.done?"ok":""}`}/><span className={`tlbl ${t.done?"done":""}`}>{t.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Docs */}
        {td>0 && (
          <div className="section">
            <div className="sec-hdr"><span>Documentos requeridos</span><span style={{color:dd===td?"#34d399":"#f87171",fontSize:10}}>{dd}/{td} ✓</span></div>
            {lead.docs.map(doc=>(
              <div key={doc.id} className="doc-row">
                <div className="doc-top">
                  <div className={`doc-icon ${doc.uploaded?"up":""}`}>{doc.uploaded?"✓":"📄"}</div>
                  <div className="doc-info">
                    <div className="doc-name">{doc.uploaded?doc.fileName:doc.label}</div>
                    <div className="doc-meta">{doc.uploaded?`${fmtSize(doc.fileSize)} · ${fmtDate(doc.uploadedAt)}`:doc.label}</div>
                  </div>
                  {doc.uploaded?<span className="badge ok">✓ OK</span>:<span className="badge req">PENDIENTE</span>}
                </div>
                <div className="doc-btns">
                  {doc.uploaded?(<>
                    <button className="dbtn" onClick={()=>viewDoc(lead.id,doc.id)}>⬇ Ver</button>
                    <button className="dbtn" onClick={()=>{setPendingUp({lid:lead.id,did:doc.id});setTimeout(()=>fileRef.current?.click(),50);}}>↺ Cambiar</button>
                    <button className="dbtn danger" onClick={()=>removeDoc(lead.id,doc.id)}>✕</button>
                  </>):(
                    <button className="dbtn upload" onClick={()=>{setPendingUp({lid:lead.id,did:doc.id});setTimeout(()=>fileRef.current?.click(),50);}}>↑ Adjuntar archivo</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Notes */}
        {lead.notes && <div className="section"><div className="sec-hdr">Nota</div><div className="note-text">{lead.notes}</div></div>}

        {/* Interactions */}
        <div className="section">
          <div className="sec-hdr">Historial de interacciones</div>
          <div className="ia-row-input">
            <input className="ia-input" placeholder="Registrar llamada, visita, acuerdo..."
              value={note} onChange={e=>setNote(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter") addNote(lead.id,note); }}/>
            <button className="ia-send" onClick={()=>addNote(lead.id,note)}>→</button>
          </div>
          {!(lead.interactions||[]).length && <div className="empty-ia">Sin interacciones registradas</div>}
          {(lead.interactions||[]).map(ia=>(
            <div key={ia.id} className="ia-item">
              <div className="ia-note">{ia.note}</div>
              <div className="ia-date">{fmtDate(ia.at)}</div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="actions">
          {nxt&&nxt.id!=="lost"&&(<>
            <button className={`btn-main ${ok?"go":"blocked"}`} onClick={()=>{ if(ok) advance(lead); }} disabled={!ok}>
              {ok?`Avanzar → ${nxt.label}`:`Avanzar → ${nxt.label}`}
            </button>
            {blk && <div className="block-msg">⚠ Pendiente: {blk}</div>}
          </>)}
          {nxt?.id==="lost" && <div style={{fontSize:11,color:"#34d399",textAlign:"center",padding:"4px 0"}}>🎉 ¡Proceso completado!</div>}
          <div className="btn-row">
            <button className="btn-g" onClick={()=>addNote(lead.id,"Contactado ✓")}>✆ Contactado</button>
            <button className="btn-g" onClick={()=>{ setForm({...lead,salePrice:lead.salePrice||"",downPayment:lead.downPayment||"",deadlineAt:lead.deadlineAt?new Date(lead.deadlineAt).toISOString().split("T")[0]:""}); setEditMode(true); setView("add"); }}>✎ Editar</button>
            {view==="focus"&&queue.length>0&&<button className="btn-g" onClick={()=>{ setDetailId(queue[0].id); setView("detail"); }}>→ Sig.</button>}
          </div>
          <button className="danger-btn" onClick={()=>{ update(lead.id,{step:"lost"}); setView("focus"); setDetailId(null); }}>Marcar como perdido</button>
        </div>
      </div>
    );
  };

  // ─── JSX ──────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@300;400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        :root{--bg:#07090f;--surf:#0d1118;--bdr:#182030;--text:#dde4f0;--muted:#3d5470;--dim:#111c2a;--accent:#f59e0b;--accent2:#38bdf8;}
        body{background:var(--bg);}
        .app{font-family:'IBM Plex Mono',monospace;background:var(--bg);color:var(--text);min-height:100vh;max-width:480px;margin:0 auto;padding-bottom:80px;}

        .hdr{display:flex;align-items:center;justify-content:space-between;padding:16px 16px 10px;border-bottom:1px solid var(--bdr);position:sticky;top:0;background:var(--bg);z-index:20;gap:8px;}
        .logo{font-family:'Barlow Condensed',sans-serif;font-size:22px;font-weight:800;letter-spacing:2px;flex-shrink:0;}
        .logo em{color:var(--accent);font-style:normal;}
        .logo small{font-size:9px;font-weight:400;color:var(--muted);letter-spacing:1px;display:block;margin-top:-2px;}
        .search-bar{flex:1;padding:7px 10px;background:var(--surf);border:1px solid var(--bdr);border-radius:7px;color:var(--text);font-family:'IBM Plex Mono',monospace;font-size:10px;outline:none;transition:border-color .15s;}
        .search-bar:focus{border-color:var(--accent);}
        .search-toggle{background:var(--surf);border:1px solid var(--bdr);border-radius:7px;padding:7px 10px;cursor:pointer;color:var(--muted);font-size:12px;flex-shrink:0;transition:all .15s;}
        .search-toggle.on{border-color:var(--accent);color:var(--accent);}

        .nav{display:grid;grid-template-columns:repeat(6,1fr);gap:2px;padding:7px 16px;border-bottom:1px solid var(--bdr);position:sticky;top:55px;background:var(--bg);z-index:19;}
        .nb{padding:6px 1px;border:none;border-radius:5px;font-family:'IBM Plex Mono',monospace;font-size:8px;cursor:pointer;transition:all .15s;letter-spacing:.2px;}
        .nb.on{background:var(--accent);color:#000;font-weight:500;}
        .nb.off{background:var(--surf);color:var(--muted);}
        .nb .badge-dot{display:inline-block;width:5px;height:5px;border-radius:50%;background:#f87171;vertical-align:middle;margin-left:2px;}

        .pad{padding:14px 16px;}

        /* ALERTS */
        .alert-strip{background:color-mix(in srgb,#f87171 10%,transparent);border:1px solid color-mix(in srgb,#f87171 25%,transparent);border-radius:9px;padding:10px 14px;margin-bottom:12px;}
        .alert-strip-title{font-size:9px;letter-spacing:1px;text-transform:uppercase;color:#f87171;margin-bottom:6px;}
        .alert-lead-row{display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid color-mix(in srgb,#f87171 15%,transparent);cursor:pointer;}
        .alert-lead-row:last-child{border-bottom:none;}
        .al-name{font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:700;flex:1;}
        .al-info{font-size:9px;color:#f87171;}

        /* TODAY */
        .today-section{margin-bottom:16px;}
        .today-title{font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);margin-bottom:8px;display:flex;align-items:center;gap:6px;}
        .today-count{background:var(--accent);color:#000;font-size:8px;padding:1px 6px;border-radius:10px;}
        .today-card{padding:11px 13px;margin-bottom:6px;background:var(--surf);border:1px solid var(--bdr);border-left:3px solid var(--sc);border-radius:10px;cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:10px;}
        .today-card:hover{background:var(--dim);}
        .tc-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
        .tc-info{flex:1;min-width:0;}
        .tc-name{font-family:'Barlow Condensed',sans-serif;font-size:16px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .tc-sub{font-size:9px;color:var(--muted);margin-top:1px;}
        .tc-right{text-align:right;flex-shrink:0;}
        .tc-urg{font-size:9px;padding:2px 6px;border-radius:4px;margin-bottom:3px;}
        .tc-price{font-size:9px;color:var(--muted);}

        /* CARD */
        .card{background:var(--surf);border:1px solid var(--bdr);border-radius:14px;overflow:hidden;}
        .card-top{padding:10px 16px 0;border-top:3px solid var(--sc,var(--accent));}
        .phase-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:7px;}
        .phase-badge{font-size:9px;letter-spacing:.5px;padding:3px 9px;border-radius:20px;}
        .step-frac{font-size:9px;color:var(--muted);}
        .warn-tag{font-size:8px;padding:2px 6px;border-radius:4px;background:color-mix(in srgb,#f87171 12%,transparent);color:#f87171;border:1px solid color-mix(in srgb,#f87171 25%,transparent);}
        .ftrack{height:3px;background:var(--dim);border-radius:2px;margin-bottom:12px;}
        .ffill{height:100%;border-radius:2px;transition:width .4s;}

        .hero{padding:0 16px 14px;}
        .step-pill{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;margin-bottom:8px;font-size:10px;background:color-mix(in srgb,var(--sc) 14%,transparent);color:var(--sc);}
        .deadline-banner{border-radius:7px;padding:6px 10px;font-size:10px;margin-bottom:8px;border:1px solid;}
        .lead-name{font-family:'Barlow Condensed',sans-serif;font-size:28px;font-weight:800;letter-spacing:.5px;line-height:1;margin-bottom:3px;}
        .lead-model{font-size:11px;color:var(--muted);margin-bottom:9px;}
        .chips-row{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:10px;}
        .chip{font-size:10px;padding:3px 8px;border-radius:4px;border:1px solid var(--bdr);color:var(--muted);}
        .chip.urg{background:color-mix(in srgb,var(--uc) 12%,transparent);color:var(--uc);border-color:color-mix(in srgb,var(--uc) 25%,transparent);}
        .price-row{display:flex;gap:0;border:1px solid var(--bdr);border-radius:8px;overflow:hidden;}
        .price-cell{flex:1;padding:7px 10px;border-right:1px solid var(--bdr);}
        .price-cell:last-child{border-right:none;}
        .price-lbl{font-size:8px;letter-spacing:.5px;text-transform:uppercase;color:var(--muted);margin-bottom:3px;}
        .price-val{font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:700;color:var(--text);}

        .prog-grid{display:grid;grid-template-columns:1fr 1fr;border-top:1px solid var(--bdr);}
        .prog-cell{padding:9px 14px;} .prog-cell.b2{border-left:1px solid var(--bdr);}
        .prog-lbl{font-size:9px;color:var(--muted);margin-bottom:5px;} .prog-lbl b{font-weight:500;}
        .pbar{height:3px;background:var(--dim);border-radius:2px;} .pfill{height:100%;border-radius:2px;transition:width .3s;}

        .section{border-top:1px solid var(--bdr);padding:12px 16px;}
        .sec-hdr{font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);margin-bottom:9px;display:flex;justify-content:space-between;align-items:center;}

        .task-row{display:flex;align-items:center;gap:9px;padding:7px 0;border-bottom:1px solid var(--dim);cursor:pointer;}
        .task-row:last-child{border-bottom:none;}
        .chk{width:17px;height:17px;border-radius:4px;border:1.5px solid #1e3048;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all .15s;}
        .chk.ok{background:#34d399;border-color:#34d399;} .chk.ok::after{content:'✓';font-size:9px;color:#000;font-weight:bold;}
        .tlbl{font-size:11px;color:#b0c4d8;line-height:1.4;} .tlbl.done{color:#1e3048;text-decoration:line-through;}

        .doc-row{padding:10px 0;border-bottom:1px solid var(--dim);} .doc-row:last-child{border-bottom:none;}
        .doc-top{display:flex;align-items:center;gap:8px;margin-bottom:7px;}
        .doc-icon{width:30px;height:30px;border-radius:7px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:13px;background:var(--dim);}
        .doc-icon.up{background:color-mix(in srgb,#34d399 15%,transparent);}
        .doc-info{flex:1;min-width:0;} .doc-name{font-size:11px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;} .doc-meta{font-size:9px;color:var(--muted);margin-top:2px;}
        .badge{font-size:9px;padding:2px 7px;border-radius:3px;flex-shrink:0;}
        .badge.ok{background:color-mix(in srgb,#34d399 12%,transparent);color:#34d399;border:1px solid color-mix(in srgb,#34d399 25%,transparent);}
        .badge.req{background:color-mix(in srgb,#f87171 12%,transparent);color:#f87171;border:1px solid color-mix(in srgb,#f87171 25%,transparent);}
        .doc-btns{display:flex;gap:5px;}
        .dbtn{flex:1;padding:6px 0;border-radius:6px;border:1px solid var(--bdr);font-family:'IBM Plex Mono',monospace;font-size:9px;cursor:pointer;background:var(--bg);color:var(--muted);transition:all .15s;}
        .dbtn:hover{border-color:#334155;color:var(--text);}
        .dbtn.upload{background:color-mix(in srgb,var(--accent) 10%,transparent);color:var(--accent);border-color:color-mix(in srgb,var(--accent) 30%,transparent);}
        .dbtn.danger:hover{border-color:#f87171;color:#f87171;}

        .note-text{font-size:11px;color:#7a96b0;line-height:1.6;padding:8px 10px;background:var(--dim);border-radius:7px;border-left:2px solid var(--bdr);}
        .ia-row-input{display:flex;gap:6px;margin-bottom:10px;}
        .ia-input{flex:1;padding:8px 10px;background:var(--bg);border:1px solid var(--bdr);border-radius:7px;color:var(--text);font-family:'IBM Plex Mono',monospace;font-size:10px;outline:none;transition:border-color .15s;}
        .ia-input:focus{border-color:var(--accent);}
        .ia-send{padding:8px 12px;background:var(--accent);color:#000;border:none;border-radius:7px;font-size:12px;cursor:pointer;}
        .ia-item{padding:7px 0;border-bottom:1px solid var(--dim);} .ia-item:last-child{border-bottom:none;}
        .ia-note{font-size:11px;color:#b0c4d8;line-height:1.5;margin-bottom:2px;} .ia-date{font-size:9px;color:var(--muted);}
        .empty-ia{font-size:10px;color:var(--muted);text-align:center;padding:8px 0;}

        .actions{border-top:1px solid var(--bdr);padding:14px 16px;display:flex;flex-direction:column;gap:7px;}
        .btn-main{width:100%;padding:13px;border:none;border-radius:10px;cursor:pointer;font-family:'Barlow Condensed',sans-serif;font-size:16px;font-weight:700;letter-spacing:.5px;transition:all .15s;}
        .btn-main.go{background:var(--accent);color:#000;} .btn-main.go:hover{background:#fbbf24;}
        .btn-main.blocked{background:var(--dim);color:#1e3048;cursor:not-allowed;}
        .block-msg{font-size:10px;color:#f87171;text-align:center;}
        .btn-row{display:flex;gap:6px;}
        .btn-g{flex:1;padding:9px 0;border-radius:8px;background:var(--surf);border:1px solid var(--bdr);font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--muted);cursor:pointer;transition:all .15s;}
        .btn-g:hover{border-color:#334155;color:var(--text);}
        .danger-btn{width:100%;padding:9px;border-radius:8px;background:var(--surf);border:1px solid var(--bdr);font-family:'IBM Plex Mono',monospace;font-size:9px;color:#f87171;cursor:pointer;transition:all .15s;}
        .danger-btn:hover{border-color:#f87171;background:color-mix(in srgb,#f87171 8%,transparent);}

        .rank-bar{display:flex;align-items:center;gap:8px;margin-bottom:12px;}
        .rank-n{font-size:9px;letter-spacing:1px;text-transform:uppercase;color:var(--muted);}
        .rank-v{font-family:'Barlow Condensed',sans-serif;font-size:22px;font-weight:800;color:var(--accent);}
        .vsep{width:1px;height:14px;background:var(--bdr);}

        .queue{margin-top:16px;}
        .q-lbl{font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:#1e3048;margin-bottom:7px;}
        .q-item{display:flex;align-items:center;gap:9px;padding:10px 12px;margin-bottom:5px;background:var(--surf);border:1px solid var(--bdr);border-radius:10px;cursor:pointer;transition:all .15s;}
        .q-item:hover{border-color:#334155;}
        .q-n{font-size:9px;color:#1e3048;width:14px;} .q-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;}
        .q-info{flex:1;min-width:0;}
        .q-name{font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .q-sub{font-size:9px;color:var(--muted);margin-top:1px;}
        .q-u{font-size:9px;padding:2px 6px;border-radius:4px;flex-shrink:0;}

        /* METRICS */
        .metric-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;}
        .m-card{background:var(--surf);border:1px solid var(--bdr);border-radius:10px;padding:12px;}
        .m-label{font-size:9px;letter-spacing:1px;text-transform:uppercase;color:var(--muted);margin-bottom:5px;}
        .m-value{font-family:'Barlow Condensed',sans-serif;font-size:28px;font-weight:800;color:var(--text);}
        .m-sub{font-size:9px;color:var(--muted);margin-top:2px;}
        .m-card.accent{border-color:color-mix(in srgb,var(--accent) 30%,transparent);}
        .m-card.accent .m-value{color:var(--accent);}
        .m-card.green{border-color:color-mix(in srgb,#34d399 30%,transparent);}
        .m-card.green .m-value{color:#34d399;}

        .funnel-viz{background:var(--surf);border:1px solid var(--bdr);border-radius:10px;padding:12px;margin-bottom:12px;}
        .fv-title{font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);margin-bottom:10px;}
        .fv-row{display:flex;align-items:center;gap:8px;margin-bottom:6px;}
        .fv-label{font-size:10px;color:var(--text);width:130px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .fv-bar-wrap{flex:1;height:8px;background:var(--dim);border-radius:4px;overflow:hidden;}
        .fv-bar{height:100%;border-radius:4px;transition:width .4s;}
        .fv-count{font-size:10px;color:var(--muted);width:20px;text-align:right;}

        .time-viz{background:var(--surf);border:1px solid var(--bdr);border-radius:10px;padding:12px;margin-bottom:12px;}
        .tv-row{display:flex;align-items:center;gap:8px;margin-bottom:5px;}
        .tv-label{font-size:9px;color:var(--muted);width:110px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .tv-hours{font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:600;color:var(--text);width:50px;text-align:right;}
        .tv-bar-wrap{flex:1;height:5px;background:var(--dim);border-radius:3px;}
        .tv-bar{height:100%;border-radius:3px;}

        .model-list{background:var(--surf);border:1px solid var(--bdr);border-radius:10px;padding:12px;margin-bottom:12px;}
        .ml-row{display:flex;align-items:center;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--dim);}
        .ml-row:last-child{border-bottom:none;}
        .ml-name{font-size:11px;color:var(--text);}
        .ml-cnt{font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:700;color:var(--accent);}

        /* LIST */
        .filter-row{display:flex;gap:5px;overflow-x:auto;padding:10px 16px 6px;scrollbar-width:none;}
        .filter-row::-webkit-scrollbar{display:none;}
        .fc{white-space:nowrap;padding:5px 11px;border-radius:20px;font-size:9px;cursor:pointer;transition:all .15s;flex-shrink:0;border:1px solid var(--bdr);}
        .fc.on{background:var(--accent);color:#000;border-color:var(--accent);}
        .fc.off{color:var(--muted);background:var(--surf);}
        .li{padding:12px;margin-bottom:7px;background:var(--surf);border:1px solid var(--bdr);border-left:3px solid var(--sc);border-radius:11px;cursor:pointer;transition:all .15s;}
        .li:hover{background:var(--dim);}
        .li-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:3px;}
        .li-name{font-family:'Barlow Condensed',sans-serif;font-size:17px;font-weight:700;}
        .li-score{font-size:9px;color:#1e3048;}
        .li-model{font-size:10px;color:var(--muted);margin-bottom:6px;}
        .li-chips{display:flex;gap:5px;flex-wrap:wrap;align-items:center;}

        /* ADD FORM */
        .form-pad{padding:16px;}
        .form-title{font-family:'Barlow Condensed',sans-serif;font-size:26px;font-weight:800;margin-bottom:14px;}
        .field{margin-bottom:11px;}
        .field label{display:block;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);margin-bottom:5px;}
        .field input,.field select,.field textarea{width:100%;padding:9px 11px;background:var(--surf);border:1px solid var(--bdr);border-radius:7px;color:var(--text);font-family:'IBM Plex Mono',monospace;font-size:11px;outline:none;transition:border-color .15s;}
        .field input:focus,.field select:focus,.field textarea:focus{border-color:var(--accent);}
        .field select option{background:var(--surf);}
        .field textarea{resize:vertical;min-height:55px;}
        .field-row{display:grid;grid-template-columns:1fr 1fr;gap:8px;}

        .empty{text-align:center;padding:50px 20px;color:#1e3048;}
        .ei{font-size:36px;margin-bottom:10px;}

        .exp-hdr{display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid var(--bdr);}
        .back{background:var(--surf);border:1px solid var(--bdr);border-radius:6px;padding:6px 10px;cursor:pointer;color:var(--muted);font-size:14px;transition:all .15s;}
        .back:hover{color:var(--text);border-color:#334155;}
        .exp-title{font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:700;color:var(--muted);letter-spacing:1px;}

        input[type=file]{display:none;}
      `}</style>

      <div className="app">
        {/* HEADER */}
        <div className="hdr">
          <div className="logo">AUTO<em>CRM</em><small>GRUPO MXA · JAC</small></div>
          {showSearch
            ? <input className="search-bar" autoFocus placeholder="Buscar nombre, teléfono, modelo..." value={search} onChange={e=>setSearch(e.target.value)}/>
            : null}
          <button className={`search-toggle ${showSearch?"on":""}`} onClick={()=>{ setShowSearch(!showSearch); setSearch(""); }}>🔍</button>
        </div>

        {/* SEARCH RESULTS */}
        {showSearch && search && (
          <div className="pad" style={{paddingTop:10,paddingBottom:0}}>
            {searchResults.length===0
              ? <div style={{fontSize:11,color:"var(--muted)",textAlign:"center",padding:"12px 0"}}>Sin resultados para "{search}"</div>
              : searchResults.map(l=>{ const s=getStep(l.step); return (
                <div key={l.id} className="li" style={{"--sc":s?.color}} onClick={()=>{ setDetailId(l.id); setView("detail"); setShowSearch(false); setSearch(""); }}>
                  <div className="li-top"><div className="li-name">{l.name}</div><div className="li-score">{s?.label}</div></div>
                  <div className="li-model">{l.model} · {l.phone}</div>
                </div>
              );})}
          </div>
        )}

        {/* NAV */}
        <div className="nav">
          {[
            ["today","🌅 Hoy", todayLeads.length>0],
            ["focus","⬡ Foco", false],
            ["list","≡ Lista", false],
            ["metrics","◉ Stats", false],
            ["add","＋ Lead", false],
            ["detail","📋 Exp.", false],
          ].map(([v,l,dot])=>(
            <button key={v} className={`nb ${view===v?"on":"off"}`}
              style={v==="detail"&&!detailId?{opacity:.3,cursor:"default"}:{}}
              onClick={()=>{ if(v==="detail"&&!detailId) return; setView(v); }}>
              {l}{dot&&view!==v&&<span className="badge-dot"/>}
            </button>
          ))}
        </div>

        <input type="file" ref={fileRef} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
          onChange={e=>{ if(pendingUp){ handleFile(e,pendingUp.lid,pendingUp.did); setPendingUp(null); } }}/>

        {/* ══ TODAY ══ */}
        {view==="today" && (
          <div className="pad">
            {/* Stuck alerts */}
            {stuckLeads.length>0 && (
              <div className="alert-strip" style={{marginBottom:16}}>
                <div className="alert-strip-title">⚠ {stuckLeads.length} lead{stuckLeads.length>1?"s":""} estancado{stuckLeads.length>1?"s":""} +48h</div>
                {stuckLeads.map(l=>{ const u=urgency(l); return (
                  <div key={l.id} className="alert-lead-row" onClick={()=>{ setDetailId(l.id); setView("detail"); }}>
                    <div className="al-name">{l.name}</div>
                    <div className="al-info">{u.label}</div>
                  </div>
                );})}
              </div>
            )}

            {/* Today action list */}
            <div className="today-section">
              <div className="today-title">
                Requieren acción hoy
                <span className="today-count">{todayLeads.length}</span>
              </div>
              {todayLeads.length===0 && <div className="empty" style={{padding:"30px 0"}}><div className="ei">✓</div><div style={{fontSize:12}}>¡Todo al día!</div></div>}
              {todayLeads.map(l=>{ const s=getStep(l.step); const u=urgency(l); const dp=isDeadlinePast(l); const dn=isDeadlineNear(l); return (
                <div key={l.id} className="today-card" style={{"--sc":s?.color}} onClick={()=>{ setDetailId(l.id); setView("detail"); }}>
                  <div className="tc-dot" style={{background:s?.color}}/>
                  <div className="tc-info">
                    <div className="tc-name">{l.name}</div>
                    <div className="tc-sub">{l.model} · {s?.label}</div>
                  </div>
                  <div className="tc-right">
                    <div className="tc-urg" style={{color:u.color,background:`color-mix(in srgb,${u.color} 10%,transparent)`}}>{u.label}</div>
                    {l.salePrice && <div className="tc-price">{fmtMXN(l.salePrice)}</div>}
                    {(dp||dn) && <div style={{fontSize:8,color:dp?"#f87171":"#f59e0b"}}>{dp?"⚠ VENCIDO":"⏰ "+fmtDateShort(l.deadlineAt)}</div>}
                  </div>
                </div>
              );})}
            </div>

            {/* Daily summary */}
            <div style={{background:"var(--surf)",border:"1px solid var(--bdr)",borderRadius:10,padding:12}}>
              <div className="fv-title">Resumen del pipeline</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                {[
                  {label:"Activos",val:active.length,color:"var(--accent2)"},
                  {label:"En riesgo",val:stuckLeads.length,color:"#f87171"},
                  {label:"Pipeline",val:fmtMXN(active.reduce((s,l)=>s+(l.salePrice||0),0)),color:"#34d399"},
                ].map(m=>(
                  <div key={m.label} style={{textAlign:"center"}}>
                    <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,fontWeight:800,color:m.color}}>{m.val}</div>
                    <div style={{fontSize:8,color:"var(--muted)",letterSpacing:"0.5px"}}>{m.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ FOCUS ══ */}
        {view==="focus" && (
          <div className="pad">
            {focus && (
              <div className="rank-bar">
                <div className="rank-n">Prioridad</div>
                <div className="rank-v">{calcScore(focus)}</div>
                <div className="vsep"/>
                <div style={{fontSize:9,color:"var(--muted)"}}>#{1} de {active.length}</div>
              </div>
            )}
            {renderCard(focus)}
            {focus && queue.length>0 && (
              <div className="queue">
                <div className="q-lbl">Cola de prioridades</div>
                {(showQueue?queue:queue.slice(0,3)).map((ql,i)=>{
                  const qs=getStep(ql.step); const qu=urgency(ql);
                  const pd=(ql.docs||[]).filter(d=>!d.uploaded).length;
                  return (
                    <div key={ql.id} className="q-item" onClick={()=>{ setDetailId(ql.id); setView("detail"); }}>
                      <div className="q-n">#{i+2}</div>
                      <div className="q-dot" style={{background:qs?.color}}/>
                      <div className="q-info">
                        <div className="q-name">{ql.name}</div>
                        <div className="q-sub">{ql.model} · {qs?.label}{pd>0?` · ${pd} docs`:""}{isStuck(ql)?" · ⚠ estancado":""}</div>
                      </div>
                      <div className="q-u" style={{color:qu.color,background:`color-mix(in srgb,${qu.color} 10%,transparent)`}}>{qu.label}</div>
                    </div>
                  );
                })}
                {queue.length>3 && (
                  <button className="btn-g" style={{width:"100%",marginTop:4}} onClick={()=>setShowQueue(!showQueue)}>
                    {showQueue?`Ver menos`:`Ver ${queue.length-3} más`}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══ DETAIL ══ */}
        {view==="detail" && (
          <>
            <div className="exp-hdr">
              <button className="back" onClick={()=>{ setView("focus"); setDetailId(null); }}>←</button>
              <div className="exp-title">EXPEDIENTE</div>
            </div>
            <div className="pad">{renderCard(detail)}</div>
          </>
        )}

        {/* ══ LIST ══ */}
        {view==="list" && (()=>{
          const filtered = leads.filter(l=>l.step!=="lost")
            .filter(l=>filterPhase==="all"||getStep(l.step)?.phase===filterPhase)
            .sort((a,b)=>calcScore(b)-calcScore(a));
          return (<>
            <div className="filter-row">
              <div className={`fc ${filterPhase==="all"?"on":"off"}`} onClick={()=>setFilterPhase("all")}>Todos ({active.length})</div>
              {PHASES.map(ph=>{ const cnt=active.filter(l=>getStep(l.step)?.phase===ph.id).length; return cnt>0?(
                <div key={ph.id} className={`fc ${filterPhase===ph.id?"on":"off"}`}
                  style={filterPhase!==ph.id?{borderColor:ph.color+"44"}:{}}
                  onClick={()=>setFilterPhase(ph.id)}>{ph.icon} {ph.label} ({cnt})</div>
              ):null;})}
            </div>
            <div className="pad" style={{paddingTop:8}}>
              {filtered.length===0
                ? <div className="empty"><div className="ei">◎</div><div>Sin leads aquí</div></div>
                : filtered.map(l=>{ const s=getStep(l.step); const u=urgency(l); const pd=(l.docs||[]).filter(d=>!d.uploaded).length; return (
                <div key={l.id} className="li" style={{"--sc":s?.color}} onClick={()=>{ setDetailId(l.id); setView("detail"); }}>
                  <div className="li-top">
                    <div className="li-name">{l.name}{isStuck(l)&&<span style={{fontSize:8,color:"#f87171",marginLeft:6}}>⚠</span>}</div>
                    <div className="li-score">{l.salePrice?fmtMXN(l.salePrice):calcScore(l)+" pts"}</div>
                  </div>
                  <div className="li-model">{l.model}</div>
                  <div className="li-chips">
                    <span style={{fontSize:9,color:s?.color}}>{s?.icon} {s?.label}</span>
                    <span style={{fontSize:9,color:u.color}}>· {u.label}</span>
                    {pd>0&&<span style={{fontSize:9,color:"#a78bfa"}}>· {pd} doc{pd>1?"s":""}</span>}
                    {l.deadlineAt&&<span style={{fontSize:9,color:isDeadlinePast(l)?"#f87171":"#f59e0b"}}>· {isDeadlinePast(l)?"⚠":"⏰"} {fmtDateShort(l.deadlineAt)}</span>}
                  </div>
                </div>
              );})}
            </div>
          </>);
        })()}

        {/* ══ METRICS ══ */}
        {view==="metrics" && (
          <div className="pad">
            <div className="metric-grid">
              <div className="m-card accent">
                <div className="m-label">Pipeline total</div>
                <div className="m-value" style={{fontSize:20}}>{fmtMXN(metrics.pipeline)}</div>
                <div className="m-sub">{active.length} leads activos</div>
              </div>
              <div className="m-card green">
                <div className="m-label">Tasa de cierre</div>
                <div className="m-value">{metrics.convRate}%</div>
                <div className="m-sub">{metrics.won} entregas / {metrics.total} leads</div>
              </div>
              <div className="m-card">
                <div className="m-label">Ciclo promedio</div>
                <div className="m-value">{metrics.avgCycle||"—"}</div>
                <div className="m-sub">días hasta entrega</div>
              </div>
              <div className="m-card">
                <div className="m-label">Leads perdidos</div>
                <div className="m-value" style={{color:"#f87171"}}>{metrics.lost}</div>
                <div className="m-sub">En riesgo: {stuckLeads.length}</div>
              </div>
            </div>

            {/* Funnel visualization */}
            <div className="funnel-viz">
              <div className="fv-title">Distribución por etapa</div>
              {metrics.byStep.length===0 && <div style={{fontSize:10,color:"var(--muted)",textAlign:"center"}}>Sin datos</div>}
              {metrics.byStep.map(s=>{ const max=Math.max(...metrics.byStep.map(x=>x.count),1); return (
                <div key={s.id} className="fv-row">
                  <div className="fv-label" style={{color:s.color}}>{s.icon} {s.label}</div>
                  <div className="fv-bar-wrap"><div className="fv-bar" style={{width:`${(s.count/max)*100}%`,background:s.color}}/></div>
                  <div className="fv-count" style={{color:s.color}}>{s.count}</div>
                </div>
              );})}
            </div>

            {/* Time in step */}
            {metrics.avgTimeInStep.length>0 && (
              <div className="time-viz">
                <div className="fv-title">Tiempo promedio por etapa (horas)</div>
                {metrics.avgTimeInStep.map(s=>{ const max=Math.max(...metrics.avgTimeInStep.map(x=>x.hours),1); return (
                  <div key={s.label} className="tv-row">
                    <div className="tv-label" style={{color:s.color}}>{s.label}</div>
                    <div className="tv-bar-wrap"><div className="tv-bar" style={{width:`${(s.hours/max)*100}%`,background:s.color}}/></div>
                    <div className="tv-hours">{s.hours}h</div>
                  </div>
                );})}
              </div>
            )}

            {/* Top models */}
            {metrics.byModel.length>0 && (
              <div className="model-list">
                <div className="fv-title">Modelos más solicitados</div>
                {metrics.byModel.map(([model,cnt])=>(
                  <div key={model} className="ml-row">
                    <div className="ml-name">{model}</div>
                    <div className="ml-cnt">{cnt}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ ADD / EDIT ══ */}
        {view==="add" && (
          <div className="form-pad">
            <div className="form-title">{editMode?"Editar Lead":"Nuevo Lead"}</div>
            <div className="field"><label>Nombre completo</label><input type="text" placeholder="Juan Pérez" value={form.name||""} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/></div>
            <div className="field"><label>Teléfono</label><input type="text" placeholder="555-0000" value={form.phone||""} onChange={e=>setForm(p=>({...p,phone:e.target.value}))}/></div>
            <div className="field"><label>Modelo / unidad</label><input type="text" placeholder="JAC T8 Pro 2024" value={form.model||""} onChange={e=>setForm(p=>({...p,model:e.target.value}))}/></div>
            <div className="field-row">
              <div className="field"><label>Precio de venta</label><input type="number" placeholder="450000" value={form.salePrice||""} onChange={e=>setForm(p=>({...p,salePrice:e.target.value?Number(e.target.value):null}))}/></div>
              <div className="field"><label>Enganche</label><input type="number" placeholder="50000" value={form.downPayment||""} onChange={e=>setForm(p=>({...p,downPayment:e.target.value?Number(e.target.value):null}))}/></div>
            </div>
            <div className="field"><label>Fecha compromiso</label><input type="date" value={form.deadlineAt||""} onChange={e=>setForm(p=>({...p,deadlineAt:e.target.value?new Date(e.target.value).getTime():null}))}/></div>
            <div className="field"><label>Etapa del funnel</label>
              <select value={form.step||"new"} onChange={e=>setForm(p=>({...p,step:e.target.value}))}>
                {FUNNEL.filter(s=>s.id!=="lost").map(s=><option key={s.id} value={s.id}>[{PHASES.find(p=>p.id===s.phase)?.label}] {s.label}</option>)}
              </select>
            </div>
            <div className="field"><label>Prioridad</label>
              <select value={form.priority||"media"} onChange={e=>setForm(p=>({...p,priority:e.target.value}))}>
                <option value="alta">Alta</option><option value="media">Media</option><option value="baja">Baja</option>
              </select>
            </div>
            <div className="field"><label>Notas</label><textarea placeholder="Observaciones del lead..." value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/></div>
            <div style={{display:"flex",gap:7,marginTop:10}}>
              <button className="btn-g" style={{flex:1}} onClick={()=>{ setEditMode(false); setForm({name:"",phone:"",model:"",step:"new",priority:"media",notes:"",salePrice:"",downPayment:"",deadlineAt:""}); setView("focus"); }}>Cancelar</button>
              <button className="btn-main go" style={{flex:2,fontSize:14}} disabled={!form.name||!form.phone}
                onClick={()=>{
                  if(editMode){ update(form.id,{...form}); setEditMode(false); }
                  else { const nl={...form,id:Date.now(),tasks:makeTasks(form.step),docs:makeDocs(form.step),interactions:[],lastContactAt:null,createdAt:Date.now(),stepEnteredAt:Date.now()}; setLeads(p=>[...p,nl]); }
                  setForm({name:"",phone:"",model:"",step:"new",priority:"media",notes:"",salePrice:"",downPayment:"",deadlineAt:""});
                  setView("focus");
                }}>
                {editMode?"Guardar cambios":"Agregar lead"}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
