// ============================================================
// Event Panel — Acara, Musik Latar, RSVP & Amplop Digital
// Data here feeds the functional sections of the exported website.
// ============================================================
import React, { useRef, useState } from 'react';
import { useApp } from '../../app/AppContext';
import { saveAssetMeta, saveAssetBlob } from '../../storage/db';
import type { AssetItem, EventInfo, GiftAccount } from '../../schemas/project';
import { DEFAULT_EVENT_INFO } from '../../schemas/project';
import { IconClose, IconPlus, IconTrash } from '../Icons';

export function EventPanel() {
  const { state, dispatch } = useApp();
  const ev: EventInfo = state.project.event ?? DEFAULT_EVENT_INFO;
  const music = state.project.music ?? {};
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const setEvent = (u: Partial<EventInfo>) => dispatch({ type: 'SET_EVENT_INFO', event: u });
  const close = () => dispatch({ type: 'TOGGLE_EVENT_PANEL', show: false });

  const imageAssets = state.assets.filter(a => a.mimeType.startsWith('image/'));
  const audioAssets = state.assets.filter(a => a.mimeType.startsWith('audio/'));

  const updateAccount = (id: string, u: Partial<GiftAccount>) => {
    setEvent({ giftAccounts: ev.giftAccounts.map(a => (a.id === id ? { ...a, ...u } : a)) });
  };
  const addAccount = () => {
    setEvent({ giftAccounts: [...ev.giftAccounts, { id: crypto.randomUUID(), label: 'BCA', number: '', holder: '' }] });
  };
  const removeAccount = (id: string) => {
    setEvent({ giftAccounts: ev.giftAccounts.filter(a => a.id !== id) });
  };

  const handleMusicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const asset: AssetItem = {
        id: crypto.randomUUID(),
        name: file.name.replace(/\.[^/.]+$/, ''),
        category: 'audio',
        mimeType: file.type || 'audio/mpeg',
        width: 0,
        height: 0,
        fileSize: file.size,
        createdAt: new Date().toISOString(),
      };
      await saveAssetMeta(asset);
      await saveAssetBlob(asset.id, file);
      dispatch({ type: 'ADD_ASSET', asset });
      dispatch({ type: 'SET_MUSIC', music: { assetId: asset.id, fileName: file.name } });
    } catch (err) {
      console.error('Music upload failed:', err);
      alert('Gagal mengunggah musik: ' + (err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const textRow = (label: string, value: string, onCommit: (v: string) => void, props?: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div className="inspector-row" key={label}>
      <label className="inspector-label" style={{ minWidth: 110 }}>{label}</label>
      <input
        type="text"
        className="inspector-input"
        defaultValue={value}
        onBlur={e => onCommit(e.target.value.trim())}
        {...props}
      />
    </div>
  );

  return (
    <div className="modal-backdrop" onClick={close}>
      <div className="modal" style={{ width: 560, maxHeight: '86vh' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="toolbar-logo-mark" style={{ width: 22, height: 22, fontSize: 10 }}>U</div>
            <div className="modal-title">Acara, Musik &amp; Amplop</div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={close}><IconClose size={14} /></button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Data di sini muncul sebagai bagian fungsional di website hasil ekspor: hitung mundur,
            tombol peta &amp; kalender, RSVP WhatsApp, amplop digital, dan musik latar.
            Untuk nama tamu personal, tulis <strong style={{ color: 'var(--accent)' }}>{'{nama}'}</strong> di teks
            cover — otomatis terisi dari link <em>?to=Nama+Tamu</em>.
          </div>

          {/* ---- Waktu & Tempat ---- */}
          <div>
            <div className="panel-section-header" style={{ marginBottom: 6 }}>Waktu &amp; Tempat</div>
            <div className="inspector-row">
              <label className="inspector-label" style={{ minWidth: 110 }}>Tanggal &amp; Jam</label>
              <input
                type="datetime-local"
                className="inspector-input"
                defaultValue={ev.dateISO}
                onBlur={e => setEvent({ dateISO: e.target.value })}
              />
            </div>
            {textRow('Nama Tempat', ev.venueName, v => setEvent({ venueName: v }), { placeholder: 'Gedung / kediaman mempelai' })}
            {textRow('Alamat', ev.venueAddress, v => setEvent({ venueAddress: v }), { placeholder: 'Jl. …' })}
            {textRow('Link Google Maps', ev.mapsUrl, v => setEvent({ mapsUrl: v }), { placeholder: 'https://maps.app.goo.gl/…' })}
          </div>

          {/* ---- RSVP ---- */}
          <div>
            <div className="panel-section-header" style={{ marginBottom: 6 }}>RSVP</div>
            {textRow('Nomor WhatsApp', ev.rsvpWhatsapp, v => setEvent({ rsvpWhatsapp: v.replace(/[^0-9]/g, '') }), { placeholder: '6281234567890 (format internasional)' })}
          </div>

          {/* ---- Amplop ---- */}
          <div>
            <div className="panel-section-header" style={{ marginBottom: 6 }}>Amplop Digital</div>
            {ev.giftAccounts.map(a => (
              <div key={a.id} style={{ display: 'flex', gap: 4, marginBottom: 4, alignItems: 'center' }}>
                <input className="inspector-input" style={{ width: 90 }} defaultValue={a.label} placeholder="Bank/E-wallet"
                  onBlur={e => updateAccount(a.id, { label: e.target.value.trim() })} />
                <input className="inspector-input" style={{ flex: 1 }} defaultValue={a.number} placeholder="Nomor rekening / HP"
                  onBlur={e => updateAccount(a.id, { number: e.target.value.trim() })} />
                <input className="inspector-input" style={{ flex: 1 }} defaultValue={a.holder} placeholder="Atas nama"
                  onBlur={e => updateAccount(a.id, { holder: e.target.value.trim() })} />
                <button className="btn btn-danger btn-icon" style={{ width: 24, height: 24, padding: 0 }} onClick={() => removeAccount(a.id)}>
                  <IconTrash size={11} />
                </button>
              </div>
            ))}
            <button className="btn btn-secondary btn-sm" onClick={addAccount}>
              <IconPlus size={11} /> Tambah Rekening / E-Wallet
            </button>
            <div className="inspector-row" style={{ marginTop: 8 }}>
              <label className="inspector-label" style={{ minWidth: 110 }}>Gambar QRIS</label>
              <select
                className="inspector-select"
                value={ev.qrisAssetId ?? ''}
                onChange={e => setEvent({ qrisAssetId: e.target.value || undefined })}
              >
                <option value="">— Tanpa QRIS —</option>
                {imageAssets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </div>

          {/* ---- Musik ---- */}
          <div>
            <div className="panel-section-header" style={{ marginBottom: 6 }}>Musik Latar</div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                className="inspector-select"
                style={{ flex: 1, minWidth: 180 }}
                value={music.assetId ?? ''}
                onChange={e => {
                  const id = e.target.value;
                  const asset = audioAssets.find(a => a.id === id);
                  dispatch({ type: 'SET_MUSIC', music: id ? { assetId: id, fileName: asset?.name } : {} });
                }}
              >
                <option value="">— Tanpa musik —</option>
                {audioAssets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <button className="btn btn-secondary btn-sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? 'Mengunggah…' : 'Unggah MP3/Audio'}
              </button>
              <input ref={fileRef} type="file" accept="audio/*" style={{ display: 'none' }} onChange={handleMusicUpload} />
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4 }}>
              Musik mulai berbunyi saat tamu menekan tombol “Buka Undangan” (kebijakan browser), dengan tombol nyala/matikan melayang.
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={close}>Selesai</button>
        </div>
      </div>
    </div>
  );
}
