import React, { useState, useCallback, useMemo } from 'react'
import { applyDalSeed } from '../dal_seed.js'

/* ─── CONSTANTS ─────────────────────────────────────────────────────────── */
const ABOGADOS = ['','JC','Luis Carlos','Eduardo','Edgar','Jessica','Guadalupe',
  'Alejandra','Anay','Laura','Luisa','Christian','Aníbal','Absalón','Jorge','Zeferino']
const ANOS = ['','2022','2023','2024','2025','2026']

/* ─── UTILITIES ─────────────────────────────────────────────────────────── */
const genId = () => Math.random().toString(36).slice(2,9) + Date.now().toString(36).slice(-4)
const fmtDate = d => { if (!d) return '—'; const [y,m,day] = d.split('-'); return `${day}/${m}/${y}` }
const addDays = (ds, n) => {
  if (!ds || !n) return ''
  const d = new Date(ds + 'T00:00:00')
  d.setDate(d.getDate() + Number(n))
  return d.toISOString().slice(0,10)
}
const daysUntil = ds => {
  if (!ds) return null
  const t = new Date(); t.setHours(0,0,0,0)
  return Math.round((new Date(ds + 'T00:00:00') - t) / 86400000)
}

/* ─── HOOKS ─────────────────────────────────────────────────────────────── */
function useLS(key, init) {
  const [val, setVal] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : init } catch { return init }
  })
  const set = useCallback(v => {
    setVal(prev => {
      const next = typeof v === 'function' ? v(prev) : v
      try { localStorage.setItem(key, JSON.stringify(next)) } catch {}
      return next
    })
  }, [key])
  return [val, set]
}

function useStore() {
  const [actores,      setActores]      = useLS('dal_actores', [])
  const [emplaz,       setEmplaz]       = useLS('dal_emplaz', [])
  const [noemplaz,     setNoemplaz]     = useLS('dal_noemplaz', [])
  const [sentencias,   setSentencias]   = useLS('dal_sentencias', [])
  const [requerims,    setRequerims]    = useLS('dal_requerims', [])
  const [cumplims,     setCumplims]     = useLS('dal_cumplims', [])
  const [incidentes,   setIncidentes]   = useLS('dal_incidentes', [])
  const [amparos,      setAmparos]      = useLS('dal_amparos', [])
  const [conciliacion, setConciliacion] = useLS('dal_conciliacion', [])
  const [oic,          setOic]          = useLS('dal_oic', [])
  const [reencauz,     setReencauz]     = useLS('dal_reencauz', [])
  return {
    actores,setActores, emplaz,setEmplaz, noemplaz,setNoemplaz,
    sentencias,setSentencias, requerims,setRequerims, cumplims,setCumplims,
    incidentes,setIncidentes, amparos,setAmparos, conciliacion,setConciliacion,
    oic,setOic, reencauz,setReencauz,
  }
}

/* ─── SHARED UI ─────────────────────────────────────────────────────────── */
function VBadge({ ds }) {
  if (!ds) return <span style={{ color: '#A090B0', fontSize: 12 }}>—</span>
  const d = daysUntil(ds)
  const style = d < 0
    ? { background: '#FEE2E2', color: '#B91C1C', border: '1px solid #FECACA' }
    : d <= 3
    ? { background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }
    : d <= 10
    ? { background: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A' }
    : { background: '#D1FAE5', color: '#065F46', border: '1px solid #A7F3D0' }
  return (
    <span style={{ ...style, display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {fmtDate(ds)}
      <span style={{ opacity: 0.7 }}>{d < 0 ? `+${Math.abs(d)}d` : `${d}d`}</span>
    </span>
  )
}

function FieldInput({ schema, value, onChange }) {
  const { label, type, options, required, rows } = schema
  const labelEl = (
    <label style={{ fontSize: 12, fontWeight: 700, color: '#575453', display: 'block', marginBottom: 5 }}>
      {label}{required && <span style={{ color: '#B91C1C', marginLeft: 2 }}>*</span>}
    </label>
  )
  if (type === 'checkbox') return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', paddingTop: 22 }}>
      <input type="checkbox" checked={!!value} onChange={e => onChange(e.target.checked)}
        style={{ width: 16, height: 16, accentColor: '#582E73' }} />
      <span style={{ fontSize: 13 }}>{label}</span>
    </label>
  )
  if (type === 'select') return (
    <div>
      {labelEl}
      <select className="ine-input" value={value ?? ''} onChange={e => onChange(e.target.value)}>
        {(options||[]).map(o => <option key={o} value={o}>{o || '— Seleccionar —'}</option>)}
      </select>
    </div>
  )
  if (type === 'textarea') return (
    <div>
      {labelEl}
      <textarea className="ine-input" rows={rows||3} value={value||''} onChange={e => onChange(e.target.value)} />
    </div>
  )
  return (
    <div>
      {labelEl}
      <input type={type||'text'} className="ine-input" value={value??''} onChange={e => onChange(e.target.value)} />
    </div>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:'fixed',inset:0,zIndex:200,display:'flex',alignItems:'flex-start',
      justifyContent:'center',paddingTop:48,paddingLeft:16,paddingRight:16,
      background:'rgba(42,18,57,.55)' }}>
      <div className="ine-card" style={{ width:'100%',maxWidth:680,maxHeight:'88vh',
        display:'flex',flexDirection:'column',boxShadow:'0 20px 60px rgba(88,46,115,.28)',
        animation:'fadeIn .18s ease-out' }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',
          padding:'16px 24px',borderBottom:'1px solid #E2D9EE',flexShrink:0 }}>
          <h2 style={{ fontWeight:700,fontSize:15,color:'#582E73',margin:0 }}>{title}</h2>
          <button onClick={onClose} style={{ background:'none',border:'none',fontSize:22,
            cursor:'pointer',color:'#A090B0',lineHeight:1,padding:'0 6px' }}>×</button>
        </div>
        <div style={{ overflow:'auto',flex:1,padding:'20px 24px' }}>{children}</div>
      </div>
    </div>
  )
}

function ConfirmDelete({ onConfirm, onCancel }) {
  return (
    <div style={{ position:'fixed',inset:0,zIndex:210,display:'flex',alignItems:'center',
      justifyContent:'center',padding:16,background:'rgba(42,18,57,.55)' }}>
      <div className="ine-card" style={{ padding:28,maxWidth:340,width:'100%',textAlign:'center',
        animation:'fadeIn .18s ease-out' }}>
        <div style={{ fontSize:36,marginBottom:12 }}>⚠️</div>
        <p style={{ fontWeight:700,marginBottom:6 }}>¿Eliminar registro?</p>
        <p style={{ color:'#6B5F78',fontSize:13,marginBottom:20 }}>Esta acción no se puede deshacer.</p>
        <div style={{ display:'flex',gap:12,justifyContent:'center' }}>
          <button className="btn-outline" onClick={onCancel}>Cancelar</button>
          <button className="btn-ine" style={{ background:'#DC2626',boxShadow:'none' }} onClick={onConfirm}>Eliminar</button>
        </div>
      </div>
    </div>
  )
}

function RecordForm({ title, schemas, initial, onSave, onClose }) {
  const [form, setForm] = useState(() => {
    const d = {}
    schemas.forEach(s => { d[s.key] = initial?.[s.key] ?? (s.type === 'checkbox' ? false : '') })
    return d
  })
  const set = (key, val) => setForm(f => {
    const n = { ...f, [key]: val }
    if ((key === 'plazo' || key === 'fechaNotificacion') && n.plazo && n.fechaNotificacion)
      n.fechaVencimiento = addDays(n.fechaNotificacion, n.plazo)
    return n
  })
  const handleSave = () => {
    const miss = schemas.filter(s => s.required && !form[s.key])
    if (miss.length) { alert('Campos requeridos: ' + miss.map(s => s.label).join(', ')); return }
    onSave(form)
  }
  return (
    <Modal title={title} onClose={onClose}>
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16 }}>
        {schemas.filter(s => !s.tableOnly).map(s => (
          <div key={s.key} style={s.wide ? { gridColumn:'1 / -1' } : {}}>
            <FieldInput schema={s} value={form[s.key]} onChange={v => set(s.key, v)} />
          </div>
        ))}
      </div>
      <div style={{ display:'flex',gap:12,justifyContent:'flex-end',
        marginTop:24,paddingTop:20,borderTop:'1px solid #E2D9EE' }}>
        <button className="btn-outline" onClick={onClose}>Cancelar</button>
        <button className="btn-ine" onClick={handleSave}>
          {initial ? 'Guardar cambios' : 'Agregar registro'}
        </button>
      </div>
    </Modal>
  )
}

function DataTable({ schemas, rows, onEdit, onDelete, canEdit, canDelete }) {
  const cols = schemas.filter(s => !s.formOnly)
  return (
    <div style={{ overflowX:'auto' }}>
      <table style={{ width:'100%',fontSize:13,borderCollapse:'separate',borderSpacing:0 }}>
        <thead>
          <tr>
            {cols.map(c => (
              <th key={c.key} style={{ padding:'10px 12px',textAlign:'left',fontSize:11,fontWeight:700,
                color:'#6B5F78',background:'#F8F5FB',borderBottom:'1.5px solid #E2D9EE',
                whiteSpace:'nowrap',position:'sticky',top:0,zIndex:1 }}>
                {c.label}
              </th>
            ))}
            <th style={{ padding:'10px 12px',background:'#F8F5FB',borderBottom:'1.5px solid #E2D9EE',width:80 }} />
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={cols.length+1} style={{ padding:'40px 12px',textAlign:'center',color:'#A090B0' }}>
              Sin registros. Usa «Nuevo registro» para agregar.
            </td></tr>
          )}
          {rows.map((row, i) => (
            <tr key={row.id||i} style={{ borderBottom:'1px solid #EDE8F4' }}
              onMouseEnter={e => e.currentTarget.style.background='#F8F5FB'}
              onMouseLeave={e => e.currentTarget.style.background=''}>
              {cols.map(c => (
                <td key={c.key} style={{ padding:'10px 12px',whiteSpace:'nowrap',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis' }}>
                  {c.isVenc
                    ? <VBadge ds={row[c.key]} />
                    : c.type === 'checkbox'
                    ? row[c.key] ? <span style={{ color:'#059669',fontWeight:700 }}>✓</span> : <span style={{ color:'#A090B0' }}>—</span>
                    : c.type === 'date' ? fmtDate(row[c.key])
                    : <span style={c.key === 'expediente' ? { fontWeight:600,color:'#582E73' } : {}}>
                        {row[c.key] || '—'}
                      </span>}
                </td>
              ))}
              <td style={{ padding:'10px 12px' }}>
                <div style={{ display:'flex',gap:4 }}>
                  {canEdit && (
                    <button onClick={() => onEdit(row)} title="Editar"
                      style={{ background:'none',border:'none',cursor:'pointer',padding:'4px 8px',
                        borderRadius:5,fontSize:13,color:'#6B5F78' }}
                      onMouseEnter={e=>e.currentTarget.style.background='#F3EDF9'}
                      onMouseLeave={e=>e.currentTarget.style.background=''}>✏️</button>
                  )}
                  {canDelete && (
                    <button onClick={() => onDelete(row)} title="Eliminar"
                      style={{ background:'none',border:'none',cursor:'pointer',padding:'4px 8px',
                        borderRadius:5,fontSize:13,color:'#EF4444' }}
                      onMouseEnter={e=>e.currentTarget.style.background='#FEE2E2'}
                      onMouseLeave={e=>e.currentTarget.style.background=''}>🗑</button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SectionView({ title, schemas, records, setRecords, user }) {
  const [showForm, setShowForm] = useState(false)
  const [editing,  setEditing]  = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [search,   setSearch]   = useState('')

  const canEdit   = user?.role === 'admin' || user?.role === 'ejecutiva' || user?.direccion === 'asuntos_laborales'
  const canDelete = user?.role === 'admin'

  const filtered = useMemo(() => {
    if (!search.trim()) return records
    const q = search.toLowerCase()
    return records.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(q)))
  }, [records, search])

  const handleSave = form => {
    if (editing) setRecords(rs => rs.map(r => r.id === editing.id ? { ...form, id: r.id } : r))
    else         setRecords(rs => [...rs, { ...form, id: genId() }])
    setShowForm(false); setEditing(null)
  }
  const handleDelete = () => { setRecords(rs => rs.filter(r => r.id !== deleting.id)); setDeleting(null) }

  return (
    <div className="fade-in">
      <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:20 }}>
        <div>
          <h2 style={{ fontSize:18,fontWeight:700,color:'#582E73',margin:0 }}>{title}</h2>
          <p style={{ color:'#6B5F78',fontSize:13,marginTop:3 }}>
            {records.length} registro{records.length !== 1 ? 's' : ''}
          </p>
        </div>
        {canEdit && (
          <button className="btn-ine" onClick={() => { setEditing(null); setShowForm(true) }}>
            + Nuevo registro
          </button>
        )}
      </div>

      <div className="ine-card">
        <div style={{ padding:'12px 16px',borderBottom:'1px solid #E2D9EE' }}>
          <input className="ine-input" style={{ maxWidth:300 }}
            placeholder="Buscar en todos los campos…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <DataTable schemas={schemas} rows={filtered}
          onEdit={r => { setEditing(r); setShowForm(true) }}
          onDelete={r => setDeleting(r)}
          canEdit={canEdit} canDelete={canDelete} />
      </div>

      {showForm && (
        <RecordForm
          title={editing ? `Editar — ${title}` : `Nuevo — ${title}`}
          schemas={schemas} initial={editing}
          onSave={handleSave} onClose={() => { setShowForm(false); setEditing(null) }} />
      )}
      {deleting && <ConfirmDelete onConfirm={handleDelete} onCancel={() => setDeleting(null)} />}
    </div>
  )
}

/* ─── SECTION SCHEMAS ───────────────────────────────────────────────────── */
const S_ACTORES = [
  { key:'expediente',    label:'Expediente',    required:true },
  { key:'actor',         label:'Actor',         required:true },
  { key:'ano',           label:'Año',           type:'select', options:ANOS },
  { key:'observaciones', label:'Observaciones', type:'textarea', wide:true },
]
const S_EMPLAZ = [
  { key:'expediente',      label:'Expediente',      required:true },
  { key:'fechaEmplaz',     label:'Fecha Emplazamiento', type:'date' },
  { key:'abogado',         label:'Abogado',         type:'select', options:ABOGADOS },
  { key:'entregaFicha',    label:'Entrega Ficha',   type:'checkbox' },
  { key:'revision',        label:'Revisión',        type:'checkbox' },
  { key:'vencimiento',     label:'Vencimiento',     type:'date', isVenc:true },
  { key:'entregaTribunal', label:'Entrega Tribunal', type:'date' },
  { key:'medioEntrega',    label:'Medio Entrega',   type:'select',
    options:['','Física','Paquetería DHL','Auxilio Jurisdiccional'] },
  { key:'actoImpugnado',   label:'Acto Impugnado',  wide:true },
]
const S_NOEMPLAZ = [
  { key:'expediente',    label:'Expediente',  required:true },
  { key:'sentido',       label:'Sentido' },
  { key:'actor',         label:'Actor' },
  { key:'estatus',       label:'Estatus',     type:'select',
    options:['','EMPLAZADO','EMPLAZAMIENTO PENDIENTE','SE DESECHA'] },
  { key:'observaciones', label:'OBS / Notas', type:'textarea', wide:true },
]
const S_SENTENCIAS = [
  { key:'expediente',        label:'Expediente',       required:true },
  { key:'fechaNotificacion', label:'Fecha Notificación', type:'date' },
  { key:'plazo',             label:'Plazo (días)',      type:'number' },
  { key:'fechaVencimiento',  label:'Fecha Vencimiento', type:'date', isVenc:true },
  { key:'abogado',           label:'Abogado',          type:'select', options:ABOGADOS },
  { key:'fechaEntregaTEPJF', label:'Entrega TEPJF',    type:'date' },
]
const S_REQUERIMS = [
  { key:'expediente',        label:'Expediente',        required:true },
  { key:'fechaNotificacion', label:'Fecha Notificación', type:'date' },
  { key:'plazo',             label:'Plazo (días)',       type:'number' },
  { key:'fechaVencimiento',  label:'Fecha Vencimiento',  type:'date', isVenc:true },
  { key:'abogado',           label:'Abogado',           type:'select', options:ABOGADOS },
  { key:'fechaEntregaTEPJF', label:'Entrega TEPJF',     type:'date' },
  { key:'observaciones',     label:'Observaciones',     type:'textarea', wide:true },
]
const S_CUMPLIMS = [
  { key:'expediente',             label:'Expediente',            required:true },
  { key:'actor',                  label:'Actor' },
  { key:'sentencia',              label:'Fecha Sentencia',       type:'date' },
  { key:'condena',                label:'Condena' },
  { key:'prestacionesPagadas',    label:'Prestaciones Pagadas',  type:'textarea', wide:true },
  { key:'prestacionesPorCumplir', label:'Prestaciones por Cumplir', type:'textarea', wide:true },
  { key:'abogado',                label:'Abogado',               type:'select', options:ABOGADOS },
  { key:'returno',                label:'Returno' },
  { key:'notificaciones',         label:'Notificaciones',        type:'textarea', wide:true },
  { key:'fechaEntrega',           label:'Fecha de Entrega',      type:'date' },
  { key:'estatus',                label:'Estatus',               type:'select',
    options:['','PRESENTADA','FORMALMENTE CONCLUIDO'] },
]
const S_INCIDENTES = [
  { key:'expediente',        label:'Expediente',        required:true },
  { key:'fechaNotificacion', label:'Fecha Notificación', type:'date' },
  { key:'plazo',             label:'Plazo (días)',       type:'number' },
  { key:'fechaVencimiento',  label:'Fecha Vencimiento',  type:'date', isVenc:true },
  { key:'abogado',           label:'Abogado',           type:'select', options:ABOGADOS },
]
const S_AMPAROS = [
  { key:'expediente',        label:'Expediente',        required:true },
  { key:'fechaNotificacion', label:'Fecha Notificación', type:'date' },
  { key:'actor',             label:'Actor' },
  { key:'plazo',             label:'Plazo (días)',       type:'number' },
  { key:'fechaVencimiento',  label:'Fecha Vencimiento',  type:'date', isVenc:true },
  { key:'abogado',           label:'Abogado',           type:'select', options:ABOGADOS },
  { key:'tribunal',          label:'Tribunal' },
  { key:'fechaCumplimiento', label:'Fecha Cumplimiento', type:'date' },
]
const S_CONCILIACION = [
  { key:'expediente',        label:'Expediente',        required:true },
  { key:'actor',             label:'Actor' },
  { key:'fechaNotificacion', label:'Fecha Notificación', type:'date' },
  { key:'fechaAudiencia',    label:'Fecha Audiencia',   type:'date', isVenc:true },
  { key:'ubicacion',         label:'Ubicación Audiencia' },
  { key:'abogado',           label:'Abogado',           type:'select', options:ABOGADOS },
]
const S_OIC = [
  { key:'expediente',        label:'Expediente',        required:true },
  { key:'fechaNotificacion', label:'Fecha Notificación', type:'date' },
  { key:'numeroOficio',      label:'Número de Oficio' },
  { key:'responsable',       label:'Responsable' },
]
const S_REENCAUZ = [
  { key:'expediente',        label:'Expediente',        required:true },
  { key:'fechaNotificacion', label:'Fecha Notificación', type:'date' },
  { key:'actor',             label:'Actor' },
  { key:'abogado',           label:'Abogado',           type:'select', options:ABOGADOS },
  { key:'notas',             label:'Notas',             type:'textarea', wide:true },
]

/* ─── DASHBOARD ─────────────────────────────────────────────────────────── */
function KpiCard({ label, value, sub, color }) {
  return (
    <div className="ine-card" style={{ padding:20 }}>
      <p style={{ fontSize:11,fontWeight:700,color:'#6B5F78',textTransform:'uppercase',
        letterSpacing:'0.06em',marginBottom:6 }}>{label}</p>
      <p style={{ fontSize:30,fontWeight:900,color,marginBottom:2 }}>{value}</p>
      {sub && <p style={{ fontSize:12,color:'#A090B0' }}>{sub}</p>}
    </div>
  )
}

function Dashboard({ store }) {
  const { actores,emplaz,sentencias,requerims,cumplims,incidentes,amparos,conciliacion,oic,reencauz,noemplaz } = store
  const today = new Date(); today.setHours(0,0,0,0)
  const isUrgent = ds => { if (!ds) return false; const d = daysUntil(ds); return d >= 0 && d <= 7 }
  const isVencido = ds => { if (!ds) return false; return new Date(ds + 'T00:00:00') < today }

  const vencidos = [
    ...sentencias.filter(r  => isVencido(r.fechaVencimiento) && !r.fechaEntregaTEPJF),
    ...requerims.filter(r   => isVencido(r.fechaVencimiento) && !r.fechaEntregaTEPJF),
    ...incidentes.filter(r  => isVencido(r.fechaVencimiento)),
    ...amparos.filter(r     => isVencido(r.fechaVencimiento) && !r.fechaCumplimiento),
  ]
  const urgentes = [
    ...sentencias.filter(r  => isUrgent(r.fechaVencimiento) && !r.fechaEntregaTEPJF),
    ...requerims.filter(r   => isUrgent(r.fechaVencimiento) && !r.fechaEntregaTEPJF),
    ...incidentes.filter(r  => isUrgent(r.fechaVencimiento)),
    ...amparos.filter(r     => isUrgent(r.fechaVencimiento) && !r.fechaCumplimiento),
  ]

  const byAbogado = {}
  ;[...sentencias,...requerims,...incidentes,...amparos,...emplaz,...conciliacion].forEach(r => {
    if (r.abogado) byAbogado[r.abogado] = (byAbogado[r.abogado]||0) + 1
  })
  const abRows = Object.entries(byAbogado).sort((a,b) => b[1]-a[1]).slice(0,8)
  const maxAb = abRows.length ? Math.max(...abRows.map(r => r[1])) : 1

  return (
    <div className="fade-in" style={{ display:'flex',flexDirection:'column',gap:24 }}>
      <div>
        <h2 style={{ fontSize:18,fontWeight:700,color:'#582E73',margin:0 }}>Dashboard — Asuntos Laborales</h2>
        <p style={{ color:'#6B5F78',fontSize:13,marginTop:4 }}>Dirección de Asuntos Laborales · INE DEAJ</p>
      </div>

      {vencidos.length > 0 && (
        <div className="ine-card" style={{ padding:'14px 18px',borderLeft:'4px solid #EF4444',background:'#FEF2F2' }}>
          <p style={{ fontWeight:700,color:'#B91C1C',fontSize:13 }}>
            ⚠ {vencidos.length} plazo{vencidos.length!==1?'s':''} vencido{vencidos.length!==1?'s':''} sin entrega registrada
          </p>
          <p style={{ color:'#DC2626',fontSize:12,marginTop:2 }}>Revisar sentencias, requerimientos, incidentes y amparos.</p>
        </div>
      )}
      {urgentes.length > 0 && (
        <div className="ine-card" style={{ padding:'14px 18px',borderLeft:'4px solid #F59E0B',background:'#FFFBEB' }}>
          <p style={{ fontWeight:700,color:'#92400E',fontSize:13 }}>
            🔔 {urgentes.length} vencimiento{urgentes.length!==1?'s':''} en los próximos 7 días
          </p>
        </div>
      )}

      <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16 }}>
        <KpiCard label="Actores / Expedientes" value={actores.length}   color="#582E73" />
        <KpiCard label="Emplazamientos"         value={emplaz.length}   color="#3B82F6" />
        <KpiCard label="Sentencias"             value={sentencias.length} color="#10B981" />
        <KpiCard label="Requerimientos"         value={requerims.length} color="#F59E0B" />
        <KpiCard label="Cumplimientos" value={cumplims.length}
          sub={`${cumplims.filter(r=>r.estatus==='FORMALMENTE CONCLUIDO').length} concluidos`} color="#8B5CF6" />
        <KpiCard label="Incidentes"    value={incidentes.length}   color="#EF4444" />
        <KpiCard label="Amparos"       value={amparos.length}      color="#14B8A6" />
        <KpiCard label="Conciliación"  value={conciliacion.length} color="#E4007B" />
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:20 }}>
        {/* Carga por abogado */}
        <div className="ine-card" style={{ padding:20 }}>
          <p style={{ fontWeight:700,color:'#582E73',fontSize:13,marginBottom:16 }}>Carga por Abogado</p>
          {abRows.length === 0 && <p style={{ color:'#A090B0',fontSize:13 }}>Sin datos</p>}
          <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
            {abRows.map(([ab, n]) => (
              <div key={ab} style={{ display:'flex',alignItems:'center',gap:12 }}>
                <span style={{ fontSize:12,color:'#6B5F78',width:90,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{ab}</span>
                <div style={{ flex:1,background:'#EDE8F4',borderRadius:4,height:8,overflow:'hidden' }}>
                  <div style={{ width:`${(n/maxAb)*100}%`,height:8,background:'#582E73',borderRadius:4 }} />
                </div>
                <span style={{ fontSize:12,fontWeight:700,color:'#582E73',width:20,textAlign:'right' }}>{n}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cumplimientos */}
        <div className="ine-card" style={{ padding:20 }}>
          <p style={{ fontWeight:700,color:'#582E73',fontSize:13,marginBottom:16 }}>Cumplimientos por Estatus</p>
          {[
            { l:'Presentada',          k:'PRESENTADA',          c:'#F59E0B' },
            { l:'Formalmente Concluido',k:'FORMALMENTE CONCLUIDO',c:'#10B981' },
            { l:'Sin estatus',          k:'',                    c:'#A090B0' },
          ].map(({ l, k, c }) => (
            <div key={l} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',
              padding:'8px 0',borderBottom:'1px solid #EDE8F4' }}>
              <span style={{ fontSize:13 }}>{l}</span>
              <span style={{ fontWeight:700,fontSize:13,color:c }}>{cumplims.filter(r=>r.estatus===k).length}</span>
            </div>
          ))}
        </div>

        {/* No-emplazamientos */}
        <div className="ine-card" style={{ padding:20 }}>
          <p style={{ fontWeight:700,color:'#582E73',fontSize:13,marginBottom:16 }}>No-Emplazamientos por Estatus</p>
          {['EMPLAZADO','EMPLAZAMIENTO PENDIENTE','SE DESECHA'].map(k => (
            <div key={k} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',
              padding:'8px 0',borderBottom:'1px solid #EDE8F4' }}>
              <span style={{ fontSize:12 }}>{k}</span>
              <span style={{ fontWeight:700,fontSize:13,color:'#582E73' }}>{noemplaz.filter(r=>r.estatus===k).length}</span>
            </div>
          ))}
        </div>

        {/* Otros */}
        <div className="ine-card" style={{ padding:20 }}>
          <p style={{ fontWeight:700,color:'#582E73',fontSize:13,marginBottom:16 }}>Otros módulos</p>
          {[
            { l:'OIC',              v:oic.length,      c:'#8B5CF6' },
            { l:'Reencauzamiento',  v:reencauz.length, c:'#14B8A6' },
            { l:'No-Emplazamientos',v:noemplaz.length, c:'#EF4444' },
          ].map(({ l, v, c }) => (
            <div key={l} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',
              padding:'8px 0',borderBottom:'1px solid #EDE8F4' }}>
              <span style={{ fontSize:13 }}>{l}</span>
              <span style={{ fontWeight:700,fontSize:13,color:c }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── NAV CONFIG ────────────────────────────────────────────────────────── */
const NAV = [
  { key:'dashboard',   label:'Dashboard',         icon:'⊞' },
  { key:'actores',     label:'Actores',           icon:'👤' },
  { key:'emplaz',      label:'Emplazamientos',    icon:'📋' },
  { key:'noemplaz',    label:'No Emplazamientos', icon:'⛔' },
  { key:'sentencias',  label:'Sentencias',        icon:'⚖️'  },
  { key:'requerims',   label:'Requerimientos',    icon:'📌' },
  { key:'cumplims',    label:'Cumplimientos',     icon:'✅' },
  { key:'incidentes',  label:'Incidentes',        icon:'⚡' },
  { key:'amparos',     label:'Amparos',           icon:'🛡'  },
  { key:'conciliacion',label:'Conciliación',      icon:'🤝' },
  { key:'oic',         label:'OIC',               icon:'🔍' },
  { key:'reencauz',    label:'Reencauzamiento',   icon:'↩️'  },
]

/* ─── MAIN VIEW ─────────────────────────────────────────────────────────── */
export default function DALView({ user }) {
  const [active, setActive] = useState('dashboard')
  const store = useStore()
  const [seeded, setSeeded] = useState(false)

  const handleSeed = (force) => {
    applyDalSeed({
      setActores:      store.setActores,
      setEmplaz:       store.setEmplaz,
      setNoemplaz:     store.setNoemplaz,
      setSentencias:   store.setSentencias,
      setRequerims:    store.setRequerims,
      setCumplims:     store.setCumplims,
      setIncidentes:   store.setIncidentes,
      setAmparos:      store.setAmparos,
      setConciliacion: store.setConciliacion,
      setOic:          store.setOic,
      setReencauz:     store.setReencauz,
    }, force)
    setSeeded(true)
    setTimeout(() => setSeeded(false), 2500)
  }

  const sec = (title, schemas, records, setRecords) => (
    <SectionView title={title} schemas={schemas} records={records} setRecords={setRecords} user={user} />
  )

  const views = {
    dashboard:    <Dashboard store={store} />,
    actores:      sec('Actores',           S_ACTORES,    store.actores,      store.setActores),
    emplaz:       sec('Emplazamientos',    S_EMPLAZ,     store.emplaz,       store.setEmplaz),
    noemplaz:     sec('No-Emplazamientos', S_NOEMPLAZ,   store.noemplaz,     store.setNoemplaz),
    sentencias:   sec('Sentencias',        S_SENTENCIAS, store.sentencias,   store.setSentencias),
    requerims:    sec('Requerimientos',    S_REQUERIMS,  store.requerims,    store.setRequerims),
    cumplims:     sec('Cumplimientos',     S_CUMPLIMS,   store.cumplims,     store.setCumplims),
    incidentes:   sec('Incidentes',        S_INCIDENTES, store.incidentes,   store.setIncidentes),
    amparos:      sec('Amparos',           S_AMPAROS,    store.amparos,      store.setAmparos),
    conciliacion: sec('Conciliación',      S_CONCILIACION, store.conciliacion, store.setConciliacion),
    oic:          sec('OIC',               S_OIC,        store.oic,          store.setOic),
    reencauz:     sec('Reencauzamiento',   S_REENCAUZ,   store.reencauz,     store.setReencauz),
  }

  return (
    <div style={{ display:'flex',gap:0,overflow:'hidden',
      height:'calc(100vh - 120px)',borderRadius:10,border:'1px solid #E2D9EE',
      boxShadow:'0 2px 8px rgba(88,46,115,.07)' }}>
      {/* Internal sidebar */}
      <nav style={{ width:200,flexShrink:0,background:'#3D1F52',
        borderRight:'1px solid rgba(255,255,255,.06)',
        display:'flex',flexDirection:'column',paddingBottom:0 }}>
        <div style={{ flex:1,overflowY:'auto',paddingTop:12,paddingBottom:4 }}>
          <p style={{ fontSize:10,fontWeight:800,color:'rgba(255,255,255,.3)',
            letterSpacing:'0.1em',textTransform:'uppercase',padding:'0 14px 6px' }}>
            DAL · Control Laboral
          </p>
          {NAV.map((n, i) => {
            const isActive = active === n.key
            const isSectionStart = i === 1
            return (
              <React.Fragment key={n.key}>
                {isSectionStart && (
                  <p style={{ fontSize:10,fontWeight:800,color:'rgba(255,255,255,.3)',
                    letterSpacing:'0.1em',textTransform:'uppercase',padding:'14px 14px 4px',marginTop:2 }}>
                    Secciones
                  </p>
                )}
                <button onClick={() => setActive(n.key)}
                  style={{ display:'flex',alignItems:'center',gap:10,padding:'8px 14px',
                    margin:'1px 8px',borderRadius:7,cursor:'pointer',fontSize:13,fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#fff' : '#C4A8DC',background: isActive ? 'rgba(255,255,255,.15)' : 'transparent',
                    border:'none',textAlign:'left',transition:'all .15s',whiteSpace:'nowrap',width:'calc(100% - 16px)' }}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background='rgba(255,255,255,.08)'; e.currentTarget.style.color='#fff' } }}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#C4A8DC' } }}>
                  <span style={{ fontSize:14 }}>{n.icon}</span>
                  <span>{n.label}</span>
                </button>
              </React.Fragment>
            )
          })}
        </div>

        <div style={{ padding:'10px 10px 12px',borderTop:'1px solid rgba(255,255,255,.08)',flexShrink:0 }}>
          <button
            onClick={() => handleSeed(false)}
            style={{ width:'100%',padding:'7px 10px',borderRadius:7,border:'1px solid rgba(255,255,255,.18)',
              background:'rgba(255,255,255,.07)',color:'#C4A8DC',fontSize:11,cursor:'pointer',
              fontWeight:600,letterSpacing:'0.03em',textAlign:'center' }}
            title="Carga los datos iniciales de los PDF (solo si la tabla está vacía)">
            {seeded ? '✓ Datos cargados' : '⬇ Inicializar datos'}
          </button>
          <button
            onClick={() => { if (window.confirm('¿Sobreescribir todos los datos existentes con los datos iniciales?')) handleSeed(true) }}
            style={{ width:'100%',marginTop:4,padding:'5px 10px',borderRadius:7,border:'none',
              background:'transparent',color:'rgba(255,255,255,.25)',fontSize:10,cursor:'pointer' }}
            title="Fuerza la recarga aunque ya haya datos">
            Recargar (sobreescribir)
          </button>
        </div>
      </nav>

      {/* Content */}
      <div style={{ flex:1,overflowY:'auto',padding:'24px 28px',background:'#F8F5FB' }}>
        {views[active]}
      </div>
    </div>
  )
}
