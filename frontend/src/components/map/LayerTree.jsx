import { useApp } from '../../context/AppContext';

export default function LayerTree({ layerVis, setLayerVis, subVis, setSubVis, catVis, setCatVis, carOpacity, setCarOpacity }) {
  const { toast } = useApp();

  const tglLayer = (id, on) => setLayerVis(prev => ({ ...prev, [id]: on }));

  const tglCat = (c, on) => setCatVis(prev => ({ ...prev, [c]: on }));
  const tglCatAll = (on) => setCatVis({ A: on, B: on, C: on });

  const tglSubKey = (id, k, on) => setSubVis(prev => ({ ...prev, [id]: { ...prev[id], [k]: on } }));
  const tglSubAll = (id, on) => setSubVis(prev => {
    const ns = {};
    Object.keys(prev[id]).forEach(k => ns[k] = on);
    return { ...prev, [id]: ns };
  });

  const catAllChecked = catVis.A && catVis.B && catVis.C;
  const catIndeterminate = (catVis.A || catVis.B || catVis.C) && !catAllChecked;

  return (
    <>
      <details className="laygrp" open>
        <summary>Couches administratives</summary>
        <div className="lay"><input type="checkbox" checked={layerVis.communes} onChange={e => tglLayer('communes', e.target.checked)} /><span className="sw" style={{ background: 'none', border: '2px solid #546e7a' }}></span>Communes</div>
        <div className="lay"><input type="checkbox" checked={layerVis.provinces} onChange={e => tglLayer('provinces', e.target.checked)} /><span className="sw" style={{ background: 'none', border: '2px solid #37474f' }}></span>Provinces</div>
        <div className="lay"><input type="checkbox" checked={layerVis.regions} onChange={e => tglLayer('regions', e.target.checked)} /><span className="sw" style={{ background: 'none', border: '2px solid #263238' }}></span>Régions</div>
      </details>

      <details className="laygrp" open>
        <summary>Carte Agricole Régionale</summary>
        <div className="lay">
          <input type="checkbox" checked={catAllChecked} ref={el => { if (el) el.indeterminate = catIndeterminate; }}
            onChange={e => tglCatAll(e.target.checked)} />
          <span className="sw" style={{ background: 'linear-gradient(90deg,#1b5e20,#8bc34a,#fdd835)' }}></span>
          <b>Classement CAR — les 3 catégories</b>
          <input type="range" min="20" max="100" value={Math.round(carOpacity * 100)} onChange={e => setCarOpacity(e.target.value / 100)} title="Transparence" />
        </div>
        <div className="lay sub"><input type="checkbox" checked={catVis.A} onChange={e => tglCat('A', e.target.checked)} /><span className="sw" style={{ background: 'var(--catA)' }}></span>Potentiel A — fort (protection maximale)</div>
        <div className="lay sub"><input type="checkbox" checked={catVis.B} onChange={e => tglCat('B', e.target.checked)} /><span className="sw" style={{ background: 'var(--catB)' }}></span>Potentiel B — moyen (mise en valeur conditionnée)</div>
        <div className="lay sub"><input type="checkbox" checked={catVis.C} onChange={e => tglCat('C', e.target.checked)} /><span className="sw" style={{ background: 'var(--catC)' }}></span>Potentiel C — faible (usages extensifs)</div>
        <div className="lay"><input type="checkbox" checked={layerVis.sols} onChange={e => tglLayer('sols', e.target.checked)} /><span className="sw" style={{ background: '#a1887f' }}></span>Unités pédologiques (CPCS 1967)</div>
      </details>

      <details className="laygrp" open>
        <summary>Ressources en eau et aménagements hydro-agricoles</summary>
        <div className="lay"><input type="checkbox" checked={layerVis.oued} onChange={e => tglLayer('oued', e.target.checked)} /><span className="sw" style={{ background: '#1e88e5' }}></span>Oueds et réseau hydrographique</div>
        <div className="lay">
          <input type="checkbox" checked={Object.values(subVis.eau).every(Boolean)}
            ref={el => { if (el) el.indeterminate = Object.values(subVis.eau).some(Boolean) && !Object.values(subVis.eau).every(Boolean); }}
            onChange={e => tglSubAll('eau', e.target.checked)} />
          <span className="sw" style={{ background: '#0d47a1', borderRadius: '50%' }}></span><b>Points d'eau — toutes natures</b>
        </div>
        <div className="lay sub"><input type="checkbox" checked={subVis.eau.forage} onChange={e => tglSubKey('eau', 'forage', e.target.checked)} /><span className="sw" style={{ background: '#0d47a1', borderRadius: '50%' }}></span>Forages</div>
        <div className="lay sub"><input type="checkbox" checked={subVis.eau.puits} onChange={e => tglSubKey('eau', 'puits', e.target.checked)} /><span className="sw" style={{ background: '#4fc3f7' }}></span>Puits</div>
        <div className="lay sub"><input type="checkbox" checked={subVis.eau.source} onChange={e => tglSubKey('eau', 'source', e.target.checked)} /><span className="sw" style={{ background: '#00897b', clipPath: 'polygon(50% 0,100% 100%,0 100%)' }}></span>Sources et khettaras</div>
        <div className="lay"><input type="checkbox" checked={layerVis.gh} onChange={e => tglLayer('gh', e.target.checked)} /><span className="sw" style={{ background: 'none', border: '2px dashed #00838f' }}></span>Périmètres irrigués — Grande Hydraulique (GH)</div>
        <div className="lay"><input type="checkbox" checked={layerVis.pmh} onChange={e => tglLayer('pmh', e.target.checked)} /><span className="sw" style={{ background: 'none', border: '2px dashed #26a69a' }}></span>Périmètres irrigués — PMH</div>
        <div className="lay"><input type="checkbox" checked={layerVis.ppp} onChange={e => tglLayer('ppp', e.target.checked)} /><span className="sw" style={{ background: 'none', border: '2px dashed #7e57c2' }}></span>PPP en irrigation</div>
        <div className="lay"><input type="checkbox" checked={layerVis.priv} onChange={e => tglLayer('priv', e.target.checked)} /><span className="sw" style={{ background: '#fff', border: '2px solid #01579b', transform: 'rotate(45deg)' }}></span>Irrigation privée (forages, puits privés)</div>
        <div className="lay"><input type="checkbox" checked={layerVis.nappes} onChange={e => tglLayer('nappes', e.target.checked)} /><span className="sw" style={{ background: '#64b5f6', opacity: .5 }}></span>Nappes (extension, profondeur)</div>
        <div className="lay"><input type="checkbox" checked={layerVis.pei} onChange={e => tglLayer('pei', e.target.checked)} /><span className="sw" style={{ background: 'none', border: '2px dotted #00acc1' }}></span>Périmètres PEI (extension de l'irrigation)</div>
      </details>

      <details className="laygrp">
        <summary>Projets d'investissement agricole</summary>
        <div className="lay">
          <input type="checkbox" checked={Object.values(subVis.proj).every(Boolean)}
            ref={el => { if (el) el.indeterminate = Object.values(subVis.proj).some(Boolean) && !Object.values(subVis.proj).every(Boolean); }}
            onChange={e => tglSubAll('proj', e.target.checked)} />
          <span className="sw" style={{ background: 'linear-gradient(90deg,#1b5e20,#ef6c00,#37474f)' }}></span><b>Projets — tous programmes</b>
        </div>
        <div className="lay sub"><input type="checkbox" checked={subVis.proj.p1} onChange={e => tglSubKey('proj', 'p1', e.target.checked)} /><span className="sw" style={{ background: '#1b5e20', transform: 'rotate(45deg)' }}></span>Pilier I du PMV (agrégation, investissement privé)</div>
        <div className="lay sub"><input type="checkbox" checked={subVis.proj.p2} onChange={e => tglSubKey('proj', 'p2', e.target.checked)} /><span className="sw" style={{ background: '#ef6c00', borderRadius: '50%' }}></span>Pilier II du PMV (agriculture solidaire)</div>
        <div className="lay sub"><input type="checkbox" checked={subVis.proj.mca} onChange={e => tglSubKey('proj', 'mca', e.target.checked)} /><span className="sw" style={{ background: '#37474f' }}></span>Projets MCA</div>
        <div className="lay sub"><input type="checkbox" checked={subVis.proj.pmvb} onChange={e => tglSubKey('proj', 'pmvb', e.target.checked)} /><span className="sw" style={{ background: '#6d4c41', clipPath: 'polygon(50% 0,100% 100%,0 100%)' }}></span>PMVB (mise en valeur en bour)</div>
        <div className="lay sub"><input type="checkbox" checked={subVis.proj.pam} onChange={e => tglSubKey('proj', 'pam', e.target.checked)} /><span className="sw" style={{ background: 'none', border: '2px solid #8d6e63', clipPath: 'polygon(50% 100%,100% 0,0 0)' }}></span>Sites d'amélioration pastorale</div>
        <div className="lay"><input type="checkbox" checked={layerVis.past} onChange={e => tglLayer('past', e.target.checked)} /><span className="sw" style={{ background: '#d7ccc8' }}></span>Zones pastorales</div>
        <div className="lay"><input type="checkbox" checked={layerVis.oasis} onChange={e => tglLayer('oasis', e.target.checked)} /><span className="sw" style={{ background: '#00695c' }}></span>Zones oasiennes</div>
      </details>

      <details className="laygrp">
        <summary>Urbanisme, occupation du sol et bâti</summary>
        <div className="lay"><input type="checkbox" checked={layerVis.urb} onChange={e => tglLayer('urb', e.target.checked)} /><span className="sw" style={{ background: '#9e9e9e' }}></span>Documents d'urbanisme — délimitations en vigueur</div>
        <div className="lay"><input type="checkbox" checked={layerVis.ra} onChange={e => tglLayer('ra', e.target.checked)} /><span className="sw" style={{ background: '#bdbdbd', border: '1px dashed #616161' }}></span>Zones RA (à réglementation agricole)</div>
        <div className="lay"><input type="checkbox" checked={layerVis.ocs} onChange={e => tglLayer('ocs', e.target.checked)} /><span className="sw" style={{ background: 'linear-gradient(90deg,#2e7d32,#c0ca33,#d7ccc8)' }}></span>Occupation du sol (OCS)</div>
        <div className="lay"><input type="checkbox" checked={layerVis.bati} onChange={e => tglLayer('bati', e.target.checked)} /><span className="sw" style={{ background: '#424242' }}></span>Bâti</div>
      </details>

      <details className="laygrp">
        <summary>Foncier (conservation foncière et cadastre)</summary>
        <div className="lay"><input type="checkbox" checked={layerVis.tf} onChange={e => tglLayer('tf', e.target.checked)} /><span className="sw" style={{ background: 'none', border: '2px solid #e53935' }}></span>Titres fonciers (emprises ANCFCC)</div>
        <div className="lay">
          <input type="checkbox" checked={Object.values(subVis.stat).every(Boolean)}
            ref={el => { if (el) el.indeterminate = Object.values(subVis.stat).some(Boolean) && !Object.values(subVis.stat).every(Boolean); }}
            onChange={e => { tglLayer('stat', true); tglSubAll('stat', e.target.checked); }} />
          <span className="sw" style={{ background: 'linear-gradient(90deg,#e57373,#9575cd,#4db6ac,#ffb74d)' }}></span><b>Statuts fonciers — tous statuts</b>
        </div>
        <div className="lay sub"><input type="checkbox" checked={subVis.stat.melk} onChange={e => tglSubKey('stat', 'melk', e.target.checked)} /><span className="sw" style={{ background: '#e57373' }}></span>Melk</div>
        <div className="lay sub"><input type="checkbox" checked={subVis.stat.coll} onChange={e => tglSubKey('stat', 'coll', e.target.checked)} /><span className="sw" style={{ background: '#9575cd' }}></span>Terres collectives</div>
        <div className="lay sub"><input type="checkbox" checked={subVis.stat.hab} onChange={e => tglSubKey('stat', 'hab', e.target.checked)} /><span className="sw" style={{ background: '#4db6ac' }}></span>Habous</div>
        <div className="lay sub"><input type="checkbox" checked={subVis.stat.dom} onChange={e => tglSubKey('stat', 'dom', e.target.checked)} /><span className="sw" style={{ background: '#ffb74d' }}></span>Domaine privé de l'État</div>
      </details>

      <details className="laygrp">
        <summary>Couches dérivées (traitements)</summary>
        <div className="lay"><input type="checkbox" checked={layerVis.ndvi} onChange={e => tglLayer('ndvi', e.target.checked)} /><span className="sw" style={{ background: 'linear-gradient(90deg,#d32f2f,#fdd835,#1b5e20)' }}></span>NDVI Sentinel-2 (07/2026)</div>
        <div style={{ fontSize: '10px', color: 'var(--muted)', padding: '5px 9px', borderTop: '1px solid #eef2ee' }}>Généalogie ISO 19115 attachée à chaque couche dérivée.</div>
      </details>

      <details className="laygrp">
        <summary>Fonds de plan (Basemaps)</summary>
        <div className="lay"><input type="checkbox" checked={layerVis.esri} onChange={e => tglLayer('esri', e.target.checked)} /><span className="sw" style={{ background: '#2e7d32' }}></span>Esri World Imagery (Satellite)</div>
      </details>

      <details className="laygrp">
        <summary>Flux externes (OGC)</summary>
        <div className="lay"><input type="checkbox" onChange={() => toast('Flux WMS « Géoportail Agricole national » ajouté (simulation).')} /><span className="sw" style={{ background: '#607d8b' }}></span>WMS — Géoportail Agricole</div>
        <div className="lay"><input type="checkbox" onChange={() => toast('Flux WFS « ABH Drâa-Oued Noun » ajouté (simulation).')} /><span className="sw" style={{ background: '#607d8b' }}></span>WFS — ABH (nappes)</div>
      </details>

      <div className="note" style={{ marginTop: '10px' }}>💡 Cliquez une unité A/B/C sur la carte pour ouvrir sa carte d'identité, puis « Instruire » pour générer la fiche synoptique.</div>
    </>
  );
}
