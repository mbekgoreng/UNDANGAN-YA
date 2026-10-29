// ============================================================
// Templates Panel (Rich Indonesian Wedding Starter Templates)
// ============================================================
import React, { useCallback } from 'react';
import { useApp } from '../../app/AppContext';
import { buildTemplateProject } from '../../engine/scene/templateFactory';
import { forceSeedSampleAssets } from '../../assets/seedAssets';
import { listAssets } from '../../storage/db';

const TEMPLATES = [
  {
    id: 'javanese-gold',
    name: 'Pernikahan Adat Jawa Klasik',
    description: 'Gunungan wayang emas, batik kawung & midnight charcoal mewah',
    badge: 'Populer',
    colors: ['#161922', '#c9a84c', '#f5e8c7'],
  },
  {
    id: 'luxury-wedding',
    name: 'Luxury Champagne Wedding',
    description: 'Palet warm champagne gold, botanical arch & editorial serif',
    badge: 'Luxury',
    colors: ['#1a1e29', '#d4af37', '#ffffff'],
  },
  {
    id: 'emerald-botanical',
    name: 'Emerald Green & Gold',
    description: 'Nuansa hijau botani ningrat berpadu ornamen melati emas',
    badge: 'Botanical',
    colors: ['#0e241b', '#c9a84c', '#e2d9c8'],
  },
  {
    id: 'royal-maroon',
    name: 'Velvet Maroon & Gold Adat',
    description: 'Merah marun mewah gaya adat Minang / Melayu Nusantara',
    badge: 'Tradisional',
    colors: ['#290c14', '#d4af37', '#f8f0e3'],
  },
];

export function TemplatesPanel() {
  const { dispatch } = useApp();

  const applyTemplate = useCallback(async (templateId: string) => {
    const tpl = TEMPLATES.find(t => t.id === templateId);
    if (!tpl) return;
    if (!confirm(`Terapkan template "${tpl.name}"?\nTemplate ini akan memuat seluruh 6 scene undangan lengkap siap pakai.`)) return;

    // Seed sample assets so all referenced vectors exist
    await forceSeedSampleAssets();
    const assets = await listAssets();
    dispatch({ type: 'SET_ASSETS', assets });

    const project = buildTemplateProject(templateId, tpl.name);
    dispatch({ type: 'SET_PROJECT', project });
    dispatch({ type: 'SELECT_SCENE', sceneId: project.scenes[0]?.id ?? null });
  }, [dispatch]);

  return (
    <div className="flex-col" style={{ height: '100%' }}>
      <div style={{ padding: '8px 10px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Template Undangan
        </span>
        <span style={{ fontSize: 9, color: 'var(--accent)', background: 'var(--accent-muted)', padding: '1px 5px', borderRadius: 3 }}>
          6 Scene Lengkap
        </span>
      </div>

      <div className="sidebar-content" style={{ padding: '4px 8px 8px' }}>
        {TEMPLATES.map(t => (
          <div
            key={t.id}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '10px',
              marginBottom: 8,
              cursor: 'pointer',
              transition: 'var(--transition)',
              position: 'relative',
            }}
            onClick={() => applyTemplate(t.id)}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
          >
            {/* Swatches & Badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {t.colors.map((c, i) => (
                  <div
                    key={i}
                    style={{ width: 18, height: 18, borderRadius: 3, background: c, border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                ))}
              </div>
              <span style={{ fontSize: 8, fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-muted)', padding: '1px 5px', borderRadius: 2 }}>
                {t.badge}
              </span>
            </div>

            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
              {t.name}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              {t.description}
            </div>
          </div>
        ))}

        <div style={{ marginTop: 8, padding: 8, borderRadius: 'var(--radius)', background: 'var(--accent-muted)', border: '1px solid rgba(201,168,76,0.2)' }}>
          <div style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600, marginBottom: 2 }}>💡 Template Termasuk:</div>
          <div style={{ fontSize: 9, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            • Scene 1: Cover Buka Undangan<br />
            • Scene 2: Hero Mempelai Utama<br />
            • Scene 3: Biodata Kedua Mempelai<br />
            • Scene 4: Jadwal Akad & Resepsi<br />
            • Scene 5: Galeri Foto<br />
            • Scene 6: Doa & Penutup Keluarga
          </div>
        </div>
      </div>
    </div>
  );
}
