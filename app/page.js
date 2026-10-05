'use client'

import { useEffect, useMemo, useState } from 'react'
import { getSupabase } from '../lib/supabase'

const AREAS = [
  ['🌱','Pflanzenwelt'],['💧','MyEverleaf'],['🐠','Aquarium'],['🐾','Tiere'],
  ['💰','Finanzen'],['💼','Arbeit & Beruf'],['🎯','Zukunft & Ziele'],['🍲','Ernährung & Küche'],
  ['🏠','Haushalt & Wohnen'],['🌸','Nova Bloom'],['📁','Projekte'],['🧠','Wissen'],
  ['📄','Dokumente'],['💡','Ideen'],['👤','Ich & mein Leben']
]

const label = { task:'Aufgabe', note:'Notiz', log:'Verlauf', object:'Objekt', project:'Projekt', finance:'Finanzen', work:'Arbeit' }

function dateKey(d=new Date()){
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function week(){
  const d=new Date(), n=d.getDay()||7, a=new Date(d), b=new Date(d)
  a.setDate(d.getDate()-n+1); b.setDate(a.getDate()+6)
  return [dateKey(a),dateKey(b)]
}

export default function App(){
  const supabase=useMemo(()=>getSupabase(),[])
  const [session,setSession]=useState(null), [loading,setLoading]=useState(true)
  const [items,setItems]=useState([]), [tab,setTab]=useState('home'), [area,setArea]=useState(null)
  const [add,setAdd]=useState(false), [dockOpen,setDockOpen]=useState(false), [error,setError]=useState('')

  useEffect(()=>{
    supabase.auth.getSession().then(({data})=>{setSession(data.session);setLoading(false)})
    const {data}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s))
    return ()=>data.subscription.unsubscribe()
  },[supabase])

  async function load(){
    if(!session){setItems([]);return}
    const {data,error}=await supabase.from('items').select('*').eq('archived',false).order('created_at',{ascending:false})
    if(error)setError(error.message); else setItems(data||[])
  }
  useEffect(()=>{load()},[session])

  async function done(i){
    const status=i.status==='done'?'active':'done'
    const {error}=await supabase.from('items').update({status}).eq('id',i.id)
    if(!error)setItems(x=>x.map(v=>v.id===i.id?{...v,status}:v))
  }

  if(loading)return <main className="center">Sankasumy World wird geladen …</main>
  if(!session)return <Login supabase={supabase}/>

  const today=dateKey(), [mon,sun]=week()
  const open=items.filter(i=>i.type==='task'&&i.status!=='done')
  const todayItems=open.filter(i=>i.due_date&&i.due_date<=today)
  const weekItems=open.filter(i=>i.due_date&&i.due_date>=mon&&i.due_date<=sun)
  const logs=items.filter(i=>i.type==='log')
  const projects=items.filter(i=>i.type==='project'||i.area==='Projekte'||i.area==='Nova Bloom')

  return <main className="app">
    <header className={tab==='home'?'hubHeader':'detailHeader'}>
      {tab!=='home'&&<button className="headBack" onClick={()=>{
        if(tab==='areas'&&area){setArea(null)}
        else{setArea(null);setDockOpen(false);setTab('home')}
      }}>‹</button>}
      <div><small>SANKASUMY WORLD</small><h1>{
        tab==='home'?'CONTROL HUB':
        tab==='today'?'Heute':
        tab==='week'?'Diese Woche':
        tab==='tasks'?'Aufgaben':
        tab==='timeline'?'Verlauf':
        tab==='projects'?'Projekte':
        area||'Welten'
      }</h1></div>
      <button className="round" onClick={()=>supabase.auth.signOut()}>●</button>
    </header>

    {error&&<p className="alert" onClick={()=>setError('')}>{error}</p>}

    {tab==='home'&&<Home items={items} today={todayItems} week={weekItems} openArea={a=>{setArea(a);setTab('areas')}} go={setTab}/>}
    {tab==='today'&&<List title="Heute & überfällig" items={todayItems} done={done}/>}
    {tab==='week'&&<List title="Diese Kalenderwoche" items={weekItems} done={done}/>}
    {tab==='areas'&&<Areas items={items} area={area} setArea={setArea} done={done}/>}

    {tab!=='home'&&<ReturnDock open={dockOpen} onTap={()=>{
      if(dockOpen){setArea(null);setDockOpen(false);setTab('home')}
      else setDockOpen(true)
    }}/>}

    {add&&<Add supabase={supabase} area={area} close={()=>setAdd(false)} saved={()=>{setAdd(false);load()}}/>}
  </main>
}

function Login({supabase}){
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [signup,setSignup]=useState(false)
  const [msg,setMsg]=useState('')
  const [busy,setBusy]=useState(false)

  function readableError(message=''){
    const text=message.toLowerCase()
    if(text.includes('invalid login credentials')) return 'E-Mail oder Passwort stimmt nicht – oder es existiert noch kein Konto.'
    if(text.includes('email address')&&text.includes('invalid')) return 'Diese E-Mail-Adresse wird nicht akzeptiert. Bitte verwende deine echte E-Mail-Adresse.'
    if(text.includes('user already registered')) return 'Für diese E-Mail existiert bereits ein Konto. Wechsle zu Anmelden.'
    if(text.includes('password')) return 'Das Passwort muss mindestens 6 Zeichen lang sein.'
    return message
  }

  async function submit(e){
    e.preventDefault()
    setMsg('')
    setBusy(true)

    const result=signup
      ? await supabase.auth.signUp({
          email,
          password,
          options:{emailRedirectTo:window.location.origin}
        })
      : await supabase.auth.signInWithPassword({email,password})

    setBusy(false)

    if(result.error){
      setMsg(readableError(result.error.message))
      return
    }

    if(signup&&!result.data.session){
      setMsg('Konto erstellt. Öffne jetzt die Bestätigungsmail und tippe dort auf den Link. Danach kannst du dich hier anmelden.')
    }
  }

  return <main className="login"><section>
    <div className="logo">S</div>
    <small>SANKASUMY WORLD</small>
    <h1>{signup?'Konto erstellen':'Willkommen zurück.'}</h1>
    <p>{signup?'Einmal registrieren, danach nur noch anmelden. Verwende eine echte E-Mail-Adresse.':'Melde dich mit deinem Sankasumy-World-Konto an.'}</p>

    <div className="loginMode">
      <button type="button" className={!signup?'active':''} onClick={()=>{setSignup(false);setMsg('')}}>Anmelden</button>
      <button type="button" className={signup?'active':''} onClick={()=>{setSignup(true);setMsg('')}}>Konto erstellen</button>
    </div>

    <form onSubmit={submit}>
      <input type="email" autoComplete="email" placeholder="Echte E-Mail-Adresse" value={email} onChange={e=>setEmail(e.target.value)} required/>
      <input type="password" minLength="6" autoComplete={signup?'new-password':'current-password'} placeholder="Passwort · mindestens 6 Zeichen" value={password} onChange={e=>setPassword(e.target.value)} required/>
      <button disabled={busy}>{busy?'Bitte kurz …':signup?'Konto erstellen':'Anmelden'}</button>
    </form>

    {msg&&<p className="alert">{msg}</p>}
  </section></main>
}

function Home({items,today,week,go,add}){
  const openTasks=items.filter(i=>i.type==='task'&&i.status!=='done').length
  const logs=items.filter(i=>i.type==='log').length
  const projects=items.filter(i=>i.type==='project'||i.area==='Projekte'||i.area==='Nova Bloom').length
  const nodes=[
    ['✦','Heute',today.length,'today'],
    ['▦','Woche',week.length,'week'],
    ['◎','Welten','', 'areas'],
    ['✓','Aufgaben',openTasks,'tasks'],
    ['↻','Verlauf',logs,'timeline'],
    ['◇','Projekte',projects,'projects']
  ]
  return <div className="controlHome">
    <div className="systemLine"><span/> SYSTEM BEREIT</div>
    <div className="radialInterface">
      <div className="orbitRing ringA"/><div className="orbitRing ringB"/>
      {nodes.map((n,i)=><button key={n[1]} className={'orbitButton orbitPos'+i} onClick={()=>go(n[3])}>
        <span>{n[0]}</span><b>{n[1]}</b>{n[2]!==''&&<em>{n[2]}</em>}
      </button>)}
      <button className="mainCore" onClick={add}>
        <small>SANKA</small><strong>＋</strong><b>ERFASSEN</b>
      </button>
    </div>
    <div className="interfaceStatus">
      <div><small>HEUTE</small><b>{today.length}</b></div>
      <i/><div><small>OFFEN</small><b>{openTasks}</b></div>
      <i/><div><small>STATUS</small><b className="online">ONLINE</b></div>
    </div>
  </div>
}

function Areas({items,area,setArea,done}){
  if(!area)return <div className="content"><div className="areas">{AREAS.map(([e,n])=><button key={n} onClick={()=>setArea(n)}><span>{e}</span><b>{n}</b><span>›</span></button>)}</div></div>
  const rows=items.filter(i=>i.area===area)
  return <div className="content"><button className="back" onClick={()=>setArea(null)}>‹ Alle Bereiche</button><h2>{AREAS.find(x=>x[1]===area)?.[0]} {area}</h2><div className="rows">{rows.map(i=><Row key={i.id} i={i} done={done}/>)}{!rows.length&&<Empty/>}</div></div>
}
function List({title,items,done}){return <div className="content"><h2>{title} <em>{items.length}</em></h2><div className="rows">{items.map(i=><Row key={i.id} i={i} done={done}/>)}{!items.length&&<Empty/>}</div></div>}
function Row({i,done}){return <article className={i.status==='done'?'row done':'row'}>{i.type==='task'&&<button className="check" onClick={()=>done?.(i)}>{i.status==='done'?'✓':''}</button>}<div><b>{i.title}</b><small>{i.area||label[i.type]}{i.due_date?` · ${new Date(i.due_date+'T12:00:00').toLocaleDateString('de-CH')}`:''}</small></div><span className="pill">{label[i.type]||i.type}</span></article>}
function Empty(){return <div className="empty">○<p>Noch nichts gespeichert.</p></div>}
function Nav({a,t,l,f}){return <button className={a?'active':''} onClick={f}><span>{t}</span><small>{l}</small></button>}

function ReturnDock({open,onTap}){
  return <button className={open?'returnDock raised':'returnDock'} onClick={onTap}>
    <span>{open?'⌂':'⌃'}</span>
    <b>{open?'HAUPTOVERLAY':''}</b>
    <small>{open?'zurück zur Zentrale':''}</small>
  </button>
}

function Add({supabase,area,close,saved}){
  const [title,setTitle]=useState(''),[type,setType]=useState('task'),[a,setA]=useState(area||''),[due,setDue]=useState(''),[notes,setNotes]=useState(''),[err,setErr]=useState('')
  async function save(e){
    e.preventDefault()
    const {error}=await supabase.from('items').insert({title,type,area:a||null,due_date:type==='task'&&due?due:null,data:notes?{notes}:{}})
    if(error)setErr(error.message);else saved()
  }
  return <div className="overlay" onMouseDown={e=>e.target===e.currentTarget&&close()}><section className="sheet"><div className="handle"/><div className="sheetHead"><h2>Schnell hinzufügen</h2><button onClick={close}>×</button></div><form onSubmit={save}>
    <input autoFocus placeholder="Was willst du festhalten?" value={title} onChange={e=>setTitle(e.target.value)} required/>
    <div className="chips">{[['task','Aufgabe'],['note','Notiz'],['log','Verlauf'],['object','Objekt']].map(([v,l])=><button type="button" className={type===v?'sel':''} key={v} onClick={()=>setType(v)}>{l}</button>)}</div>
    <select value={a} onChange={e=>setA(e.target.value)}><option value="">Bereich optional</option>{AREAS.map(x=><option key={x[1]}>{x[1]}</option>)}</select>
    {type==='task'&&<input type="date" value={due} onChange={e=>setDue(e.target.value)}/>}<textarea rows="3" placeholder="Notiz optional" value={notes} onChange={e=>setNotes(e.target.value)}/>{err&&<p className="alert">{err}</p>}<button>Speichern</button>
  </form></section></div>
}
