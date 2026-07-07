'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const ADMIN_PASSWORD = 'furever2024admin'

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [pwInput, setPwInput] = useState('')
  const [pwError, setPwError] = useState('')
  const [activeTab, setActiveTab] = useState('pending-ngos')
  const [stats, setStats] = useState({ users:0, lostCats:0, foundCats:0, adoptionCats:0, messages:0, totalNGOs:0, pendingNGOs:0, verifiedNGOs:0 })
  const [pendingNGOs, setPendingNGOs] = useState([])
  const [verifiedNGOs, setVerifiedNGOs] = useState([])
  const [lostCats, setLostCats] = useState([])
  const [foundCats, setFoundCats] = useState([])
  const [adoptionCats, setAdoptionCats] = useState([])
  const [loading, setLoading] = useState(false)
  const [actionMsg, setActionMsg] = useState('')

  useEffect(() => { if (sessionStorage.getItem('admin_authed') === 'true') setAuthed(true) }, [])
  useEffect(() => { if (authed) fetchAllData() }, [authed])

  const handlePasswordSubmit = (e) => {
    e.preventDefault()
    if (pwInput === ADMIN_PASSWORD) { sessionStorage.setItem('admin_authed','true'); setAuthed(true); setPwError('') }
    else setPwError('Incorrect password.')
  }

  const showMsg = (msg) => { setActionMsg(msg); setTimeout(() => setActionMsg(''), 4000) }
  const formatDate = (d) => !d ? '--' : new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})

  const fetchAllData = async () => {
    setLoading(true)
    try {
      const [legPendRes, legVerRes] = await Promise.all([
        supabase.from('ngo_profiles').select('*').or('verified.eq.false,verified.is.null').order('created_at',{ascending:false}),
        supabase.from('ngo_profiles').select('*').eq('verified',true).order('created_at',{ascending:false}),
      ])
      const pendingFromProfiles = (legPendRes.data||[]).map(n=>({...n,_source:'ngo_profiles',phone:n.contact_phone||n.phone||null,status:'pending'}))
      const verifiedFromProfiles = (legVerRes.data||[]).map(n=>({...n,_source:'ngo_profiles',phone:n.contact_phone||n.phone||null,status:'approved',verified_at:n.updated_at||n.created_at}))

      let pendingFromReq = [], verifiedFromReq = []
      const {data:rp,error:re} = await supabase.from('ngo_verification_requests').select('*').eq('status','pending').order('created_at',{ascending:false})
      if (!re) {
        pendingFromReq = (rp||[]).map(n=>({...n,_source:'ngo_verification_requests'}))
        const {data:rv} = await supabase.from('ngo_verification_requests').select('*').eq('status','approved').order('verified_at',{ascending:false})
        verifiedFromReq = (rv||[]).map(n=>({...n,_source:'ngo_verification_requests'}))
      }

      const seen = new Set()
      const dedup = arr => arr.filter(i => { if(!i.user_id||seen.has(i.user_id)) return false; seen.add(i.user_id); return true })
      const allPending = dedup([...pendingFromReq,...pendingFromProfiles])
      seen.clear()
      const allVerified = dedup([...verifiedFromReq,...verifiedFromProfiles])
      setPendingNGOs(allPending); setVerifiedNGOs(allVerified)

      const [lostRes,foundRes,adoptRes] = await Promise.all([
        supabase.from('lost_cats').select('*').order('created_at',{ascending:false}).limit(30),
        supabase.from('found_cats').select('*').order('created_at',{ascending:false}).limit(30),
        supabase.from('adoption_cats').select('*').order('created_at',{ascending:false}).limit(50),
      ])
      setLostCats(lostRes.data||[]); setFoundCats(foundRes.data||[]); setAdoptionCats(adoptRes.data||[])

      const [{count:uc},{count:lc},{count:fc},{count:ac},{count:mc}] = await Promise.all([
        supabase.from('profiles').select('*',{count:'exact',head:true}),
        supabase.from('lost_cats').select('*',{count:'exact',head:true}),
        supabase.from('found_cats').select('*',{count:'exact',head:true}),
        supabase.from('adoption_cats').select('*',{count:'exact',head:true}).eq('status','available'),
        supabase.from('messages').select('*',{count:'exact',head:true}),
      ])
      setStats({users:uc||0,lostCats:lc||0,foundCats:fc||0,adoptionCats:ac||0,messages:mc||0,totalNGOs:allPending.length+allVerified.length,pendingNGOs:allPending.length,verifiedNGOs:allVerified.length})
    } catch(err){console.error(err)}
    setLoading(false)
  }

  const handleApproveNGO = async (ngo) => {
    try {
      const res = await fetch('/api/admin/approve-ngo',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({adminPassword:ADMIN_PASSWORD,action:'approve',ngoRequest:ngo})})
      const result = await res.json()
      if (!res.ok) { showMsg('Failed to approve: '+(result.error||'Unknown error')); return }
      setPendingNGOs(p=>p.filter(n=>n.id!==ngo.id))
      setVerifiedNGOs(p=>[{...ngo,status:'approved',verified_at:new Date().toISOString()},...p])
      setStats(p=>({...p,pendingNGOs:Math.max(0,p.pendingNGOs-1),verifiedNGOs:p.verifiedNGOs+1}))
      showMsg(`${ngo.org_name} approved!`)
    } catch(err){console.error(err);showMsg('Something went wrong.')}
  }

  const handleRejectNGO = async (ngo) => {
    if (!confirm(`Reject ${ngo.org_name}?`)) return
    try {
      const res = await fetch('/api/admin/approve-ngo',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({adminPassword:ADMIN_PASSWORD,action:'reject',ngoRequest:ngo})})
      if (!res.ok) { showMsg('Failed to reject.'); return }
      setPendingNGOs(p=>p.filter(n=>n.id!==ngo.id))
      setStats(p=>({...p,pendingNGOs:Math.max(0,p.pendingNGOs-1)}))
      showMsg(`${ngo.org_name} rejected.`)
    } catch(err){console.error(err);showMsg('Something went wrong.')}
  }

  const handleMarkReunited = async (catId) => {
    await supabase.from('lost_cats').update({status:'reunited'}).eq('id',catId)
    showMsg('Marked as reunited!'); setLostCats(p=>p.map(c=>c.id===catId?{...c,status:'reunited'}:c))
  }
  const handleDeleteLostCat = async (catId) => {
    if (!confirm('Delete this report?')) return
    await supabase.from('lost_cats').delete().eq('id',catId)
    showMsg('Deleted.'); setLostCats(p=>p.filter(c=>c.id!==catId))
  }
  const handleDeleteFoundCat = async (catId) => {
    if (!confirm('Delete this report?')) return
    await supabase.from('found_cats').delete().eq('id',catId)
    showMsg('Deleted.'); setFoundCats(p=>p.filter(c=>c.id!==catId))
  }
  const handleDeleteAdoptionCat = async (catId) => {
    if (!confirm('Delete this adoption listing?')) return
    await supabase.from('adoption_cats').update({status:'deleted'}).eq('id',catId)
    showMsg('Listing removed.'); setAdoptionCats(p=>p.filter(c=>c.id!==catId))
  }
  const handleMarkAdopted = async (catId) => {
    await supabase.from('adoption_cats').update({status:'adopted',adopted_at:new Date().toISOString()}).eq('id',catId)
    showMsg('Marked as adopted!'); setAdoptionCats(p=>p.map(c=>c.id===catId?{...c,status:'adopted'}:c))
  }

  // Password gate
  if (!authed) return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{background:'var(--background)'}}>
      <div className="rounded-3xl border shadow-sm p-8 w-full max-w-sm" style={{background:'white',borderColor:'var(--cream-dark)'}}>
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-2xl font-bold mb-3" style={{background:'var(--buff)',color:'var(--foreground)'}}>A</div>
          <h1 className="text-xl font-bold" style={{color:'var(--foreground)'}}>Admin Portal</h1>
          <p className="text-sm mt-1" style={{color:'var(--foreground)',opacity:0.6}}>Fur Ever Found</p>
        </div>
        {pwError && <div className="border text-sm px-4 py-2.5 rounded-xl mb-4" style={{background:'#fef2f2',borderColor:'#fecaca',color:'#dc2626'}}>{pwError}</div>}
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <input type="password" value={pwInput} onChange={e=>setPwInput(e.target.value)} placeholder="Admin password" className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition" style={{borderColor:'var(--cream-dark)',background:'var(--sage-50)',color:'var(--foreground)'}} />
          <button type="submit" className="w-full font-bold py-3 rounded-xl transition hover:opacity-90 text-sm" style={{background:'var(--police-blue)',color:'var(--buff)'}}>Enter Admin Panel</button>
        </form>
      </div>
    </div>
  )

  // Main dashboard
  return (
    <div className="min-h-screen" style={{background:'var(--background)'}}>
      <div className="border-b px-4 sm:px-6 py-4" style={{background:'white',borderColor:'var(--cream-dark)'}}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-base font-bold" style={{background:'var(--buff)',color:'var(--foreground)'}}>A</div>
            <div><h1 className="text-lg font-bold" style={{color:'var(--foreground)'}}>Admin Portal</h1><p className="text-xs" style={{color:'var(--foreground)',opacity:0.5}}>Platform Management</p></div>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchAllData} className="text-xs font-medium px-3 py-2 rounded-xl border transition hover:opacity-80" style={{borderColor:'var(--cream-dark)',color:'var(--foreground)'}}>Refresh</button>
            <button onClick={()=>{sessionStorage.removeItem('admin_authed');setAuthed(false)}} className="text-xs font-medium px-3 py-2 rounded-xl border transition hover:opacity-80" style={{borderColor:'#fecaca',color:'#dc2626'}}>Logout</button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {actionMsg && <div className="rounded-xl px-4 py-3 text-sm font-medium mb-6 border" style={{background:'#f0fdf4',borderColor:'#bbf7d0',color:'#166534'}}>{actionMsg}</div>}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
          {[{l:'Users',v:stats.users,i:'\u{1F464}'},{l:'Lost',v:stats.lostCats,i:'\u{1F63F}'},{l:'Found',v:stats.foundCats,i:'\u{1F60A}'},{l:'Adoption',v:stats.adoptionCats,i:'\u{1F3E0}'},{l:'Messages',v:stats.messages,i:'\u{1F4AC}'},{l:'NGOs',v:stats.totalNGOs,i:'\u{1F3E2}'},{l:'Pending',v:stats.pendingNGOs,i:'\u{231B}'},{l:'Verified',v:stats.verifiedNGOs,i:'\u{2705}'}].map(s=>(
            <div key={s.l} className="rounded-2xl border p-3 text-center" style={{background:'white',borderColor:'var(--cream-dark)'}}>
              <div className="text-lg mb-0.5" style={{color:'var(--gold)'}}>{s.i}</div>
              <div className="text-xl font-extrabold" style={{color:'var(--foreground)'}}>{s.v}</div>
              <div className="text-[10px] mt-0.5" style={{color:'var(--foreground)',opacity:0.5}}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[{id:'pending-ngos',label:`Pending NGOs (${pendingNGOs.length})`},{id:'verified-ngos',label:`Verified NGOs (${verifiedNGOs.length})`},{id:'lost',label:`Lost Cats (${lostCats.length})`},{id:'found',label:`Found Cats (${foundCats.length})`},{id:'adoption',label:`Adoption Feed (${adoptionCats.length})`}].map(tab=>(
            <button key={tab.id} onClick={()=>setActiveTab(tab.id)} className="px-4 py-2.5 rounded-xl text-sm font-semibold transition" style={{background:activeTab===tab.id?'var(--police-blue)':'white',color:activeTab===tab.id?'var(--buff)':'var(--foreground)',border:activeTab===tab.id?'none':'1px solid var(--cream-dark)'}}>{tab.label}</button>
          ))}
        </div>

        {loading ? <div className="flex items-center justify-center py-20"><div className="w-10 h-10 border-4 rounded-full animate-spin" style={{borderColor:'var(--buff)',borderTopColor:'var(--police-blue)'}} /></div> : (<>

          {/* Pending NGOs */}
          {activeTab==='pending-ngos' && (<div className="space-y-4">
            {pendingNGOs.length===0 ? <Empty title="No pending applications" sub="All requests processed." /> : pendingNGOs.map(ngo=>(
              <div key={ngo.id} className="rounded-2xl border p-5" style={{background:'white',borderColor:'var(--cream-dark)'}}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2"><h3 className="font-bold text-lg" style={{color:'var(--foreground)'}}>{ngo.org_name}</h3><span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{background:'var(--buff)',color:'var(--citrine-brown)'}}>Pending</span></div>
                    <div className="space-y-1 text-sm" style={{color:'var(--foreground)',opacity:0.7}}>
                      <p>Location: {ngo.city||'--'}</p><p>Phone: {ngo.phone||ngo.contact_phone||'--'}</p>
                      {ngo.website && <p style={{color:'var(--gold)'}}>Web: {ngo.website}</p>}
                    </div>
                    {ngo.org_description && <p className="text-sm mt-3 leading-relaxed" style={{color:'var(--foreground)',opacity:0.8}}>{ngo.org_description}</p>}
                    <p className="text-xs mt-2" style={{color:'var(--foreground)',opacity:0.4}}>Applied {formatDate(ngo.created_at)}</p>
                  </div>
                  <div className="flex sm:flex-col gap-2 shrink-0 w-full sm:w-auto">
                    <button onClick={()=>handleApproveNGO(ngo)} className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-semibold text-sm transition hover:opacity-90 text-white" style={{background:'#16a34a'}}>Approve</button>
                    <button onClick={()=>handleRejectNGO(ngo)} className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-semibold text-sm transition hover:opacity-90 border" style={{borderColor:'#fecaca',color:'#dc2626'}}>Reject</button>
                  </div>
                </div>
              </div>
            ))}
          </div>)}

          {/* Verified NGOs */}
          {activeTab==='verified-ngos' && (<div className="space-y-3">
            {verifiedNGOs.length===0 ? <Empty title="No verified NGOs" sub="Approved organisations appear here." /> : verifiedNGOs.map(ngo=>(
              <div key={ngo.id} className="rounded-2xl border p-4 flex items-center gap-4" style={{background:'white',borderColor:'var(--cream-dark)'}}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0" style={{background:'var(--buff)',color:'var(--foreground)'}}>NGO</div>
                <div><p className="font-semibold text-sm" style={{color:'var(--foreground)'}}>{ngo.org_name}</p><p className="text-xs mt-0.5" style={{color:'var(--foreground)',opacity:0.5}}>{ngo.city||'--'} | Approved {formatDate(ngo.verified_at)}</p></div>
              </div>
            ))}
          </div>)}

          {/* Lost Cats */}
          {activeTab==='lost' && (<div className="space-y-3">
            {lostCats.length===0 ? <Empty title="No lost cat reports" sub="Reports appear here." /> : lostCats.map(cat=>(
              <div key={cat.id} className="rounded-2xl border p-4 flex gap-4 items-start" style={{background:'white',borderColor:'var(--cream-dark)'}}>
                {cat.image_url ? <img src={cat.image_url} alt={cat.name} className="w-14 h-14 rounded-xl object-cover shrink-0" /> : <div className="w-14 h-14 rounded-xl flex items-center justify-center text-xs font-bold shrink-0" style={{background:'var(--buff)',color:'var(--foreground)'}}>CAT</div>}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5"><p className="font-semibold text-sm" style={{color:'var(--foreground)'}}>{cat.name}</p><span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{background:cat.status==='reunited'?'#dcfce7':'#fef2f2',color:cat.status==='reunited'?'#166534':'#dc2626'}}>{cat.status}</span></div>
                  <p className="text-xs" style={{color:'var(--foreground)',opacity:0.6}}>{cat.location}</p>
                  <p className="text-xs mt-0.5 line-clamp-1" style={{color:'var(--foreground)',opacity:0.5}}>{cat.description}</p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  {cat.status!=='reunited' && <button onClick={()=>handleMarkReunited(cat.id)} className="text-xs font-medium px-3 py-1.5 rounded-lg transition hover:opacity-80" style={{background:'#dcfce7',color:'#166534'}}>Reunited</button>}
                  <button onClick={()=>handleDeleteLostCat(cat.id)} className="text-xs font-medium px-3 py-1.5 rounded-lg transition hover:opacity-80" style={{background:'#fef2f2',color:'#dc2626'}}>Delete</button>
                </div>
              </div>
            ))}
          </div>)}

          {/* Found Cats */}
          {activeTab==='found' && (<div className="space-y-3">
            {foundCats.length===0 ? <Empty title="No found cat reports" sub="Reports appear here." /> : foundCats.map(cat=>(
              <div key={cat.id} className="rounded-2xl border p-4 flex gap-4 items-start" style={{background:'white',borderColor:'var(--cream-dark)'}}>
                {cat.image_url ? <img src={cat.image_url} alt="Found cat" className="w-14 h-14 rounded-xl object-cover shrink-0" /> : <div className="w-14 h-14 rounded-xl flex items-center justify-center text-xs font-bold shrink-0" style={{background:'var(--buff)',color:'var(--foreground)'}}>CAT</div>}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm" style={{color:'var(--foreground)'}}>Found Cat</p>
                  <p className="text-xs" style={{color:'var(--foreground)',opacity:0.6}}>{cat.location}</p>
                  <p className="text-xs mt-0.5 line-clamp-1" style={{color:'var(--foreground)',opacity:0.5}}>{cat.description}</p>
                </div>
                <button onClick={()=>handleDeleteFoundCat(cat.id)} className="text-xs font-medium px-3 py-1.5 rounded-lg transition hover:opacity-80 shrink-0" style={{background:'#fef2f2',color:'#dc2626'}}>Delete</button>
              </div>
            ))}
          </div>)}

          {/* Adoption Feed */}
          {activeTab==='adoption' && (<div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold" style={{color:'var(--foreground)'}}>All adoption listings</p>
              <Link href="/ngo-dashboard/add-cat" className="text-xs font-semibold px-4 py-2 rounded-xl transition hover:opacity-90" style={{background:'var(--police-blue)',color:'var(--buff)'}}>+ Add Cat</Link>
            </div>
            {adoptionCats.length===0 ? <Empty title="No adoption listings" sub="Cats listed for adoption appear here." /> : adoptionCats.map(cat=>(
              <div key={cat.id} className="rounded-2xl border p-4 flex gap-4 items-start" style={{background:'white',borderColor:'var(--cream-dark)'}}>
                {cat.image_url ? <img src={cat.image_url} alt={cat.name} className="w-14 h-14 rounded-xl object-cover shrink-0" /> : <div className="w-14 h-14 rounded-xl flex items-center justify-center text-xs font-bold shrink-0" style={{background:'var(--buff)',color:'var(--foreground)'}}>CAT</div>}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-sm" style={{color:'var(--foreground)'}}>{cat.name}</p>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize" style={{background:cat.status==='available'?'#dbeafe':cat.status==='adopted'?'#dcfce7':'#f3f4f6',color:cat.status==='available'?'#1e40af':cat.status==='adopted'?'#166534':'#6b7280'}}>{cat.status}</span>
                  </div>
                  <p className="text-xs" style={{color:'var(--foreground)',opacity:0.6}}>{cat.city}{cat.breed?` | ${cat.breed}`:''}{cat.age?` | ${cat.age}`:''}</p>
                  <p className="text-xs mt-0.5 line-clamp-1" style={{color:'var(--foreground)',opacity:0.5}}>{cat.description}</p>
                  <p className="text-[11px] mt-0.5" style={{color:'var(--foreground)',opacity:0.35}}>{formatDate(cat.created_at)}</p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  {cat.status==='available' && <button onClick={()=>handleMarkAdopted(cat.id)} className="text-xs font-medium px-3 py-1.5 rounded-lg transition hover:opacity-80" style={{background:'#dcfce7',color:'#166534'}}>Mark Adopted</button>}
                  {cat.status!=='deleted' && <button onClick={()=>handleDeleteAdoptionCat(cat.id)} className="text-xs font-medium px-3 py-1.5 rounded-lg transition hover:opacity-80" style={{background:'#fef2f2',color:'#dc2626'}}>Delete</button>}
                </div>
              </div>
            ))}
          </div>)}

        </>)}
      </div>
    </div>
  )
}

function Empty({title,sub}) {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-xl font-bold mb-4" style={{background:'var(--buff)',color:'var(--foreground)'}}>--</div>
      <p className="font-semibold" style={{color:'var(--foreground)'}}>{title}</p>
      <p className="text-sm mt-1" style={{color:'var(--foreground)',opacity:0.5}}>{sub}</p>
    </div>
  )
}
