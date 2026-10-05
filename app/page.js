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
  const [add,setAdd]=useState(false), [error,setError]=useState('')

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

  return <main className="app">
    <header>
      <div><small>SANKASUMY WORLD</small><h1>{tab==='home'?'🏠 Home':tab==='today'?'🔥 Heute':tab==='week'?'📅 Diese Woche':'🗂 Bereiche'}</h1></div>
      <button className="round" onClick={()=>supabase.auth.signOut()}>↗</button>
    </header>

    {error&&<p className="alert" onClick={()=>setError('')}>{error}</p>}

    {tab==='home'&&<Home items={items} today={todayItems} week={weekItems} openArea={a=>{setArea(a);setTab('areas')}} go={setTab}/>}
    {tab==='today'&&<List title="Heute & überfällig" items={todayItems} done={done}/>}
    {tab==='week'&&<List title="Diese Kalenderwoche" items={weekItems} done={done}/>}
    {tab==='areas'&&<Areas items={items} area={area} setArea={setArea} done={done}/>}

    <button className="fab" onClick={()=>setAdd(true)}>＋</button>
    <nav>
      <Nav a={tab==='home'} t="⌂" l="Home" f={()=>{setArea(null);setTab('home')}}/>
      <Nav a={tab==='today'} t="🔥" l="Heute" f={()=>setTab('today')}/>
      <Nav a={tab==='week'} t="▦" l="Woche" f={()=>setTab('week')}/>
      <Nav a={tab==='areas'} t="◫" l="Bereiche" f={()=>setTab('areas')}/>
    </nav>

    {add&&<Add supabase={supabase} area={area} close={()=>setAdd(false)} saved={()=>{setAdd(false);load()}}/>}
  </main>
}

function Login({supabase}){
  const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[signup,setSignup]=useState(false),[msg,setMsg]=useState('')
  async function submit(e){
    e.preventDefault(); setMsg('')
    const r=signup?await supabase.auth.signUp({email,password}):await supabase.auth.signInWithPassword({email,password})
    if(r.error)setMsg(r.error.message)
    else if(signup&&!r.data.session)setMsg('Konto erstellt. Bitte E-Mail bestätigen.')
  }
  return <main className="login"><section>
    <div className="logo">S</div><small>SANKASUMY WORLD</small><h1>Deine persönliche Zentrale.</h1>
    <p>Einfach erfassen. Der Rest bleibt im Hintergrund.</p>
    <form onSubmit={submit}><input type="email" placeholder="E-Mail" value={email} onChange={e=>setEmail(e.target.value)} required/><input type="password" minLength="6" placeholder="Passwort" value={password} onChange={e=>setPassword(e.target.value)} required/><button>Anmelden</button></form>
    {msg&&<p className="alert">{msg}</p>}<button className="link" onClick={()=>setSignup(!signup)}>{signup?'Schon ein Konto? Anmelden':'Noch kein Konto? Erstellen'}</button>
  </section></main>
}

function Home({items,today,week,openArea,go}){
  return <div className="content">
    <section className="hero"><small>DEIN ÜBERBLICK</small><h2>{today.length?`${today.length} Aufgabe${today.length===1?'':'n'} brauchen heute deine Aufmerksamkeit.`:'Heute ist nichts dringend.'}</h2><div><button onClick={()=>go('today')}>Heute <b>{today.length}</b></button><button onClick={()=>go('week')}>Woche <b>{week.length}</b></button></div></section>
    <h2>Bereiche</h2><div className="grid">{AREAS.slice(0,8).map(([e,n])=><button key={n} onClick={()=>openArea(n)}><span>{e}</span><b>{n}</b><small>{items.filter(i=>i.area===n).length} Einträge</small></button>)}</div>
    <h2>Zuletzt</h2><div className="rows">{items.slice(0,5).map(i=><Row key={i.id} i={i}/>)}{!items.length&&<Empty/>}</div>
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
