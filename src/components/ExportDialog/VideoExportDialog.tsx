// ============================================================
// Video Export — records the Timeline playback to MP4/WebM in
// the browser (canvas captureStream + MediaRecorder). MP4 is
// used when the browser supports it, otherwise WebM — the
// actual format is always reported honestly after recording.
// ============================================================
import React, { useRef, useState } from 'react';
import { useApp } from '../../app/AppContext';
import { IconClose } from '../Icons';
import { drawVideoFrame, pickRecorderMime, preloadSceneImages, totalDurationOf } from '../../engine/export/videoRenderer';
import { PetalSystem } from '../../engine/animation/fallingPetals';
import { getAssetObjectURL } from '../../storage/db';

type Phase = 'idle' | 'preparing' | 'recording' | 'done' | 'error';

export function VideoExportDialog({ onClose }: { onClose: () => void }) {
  const { state } = useApp();
  const project = state.project;
  const total = totalDurationOf(project);
  const hasMusic = !!project.music?.assetId;

  const [phase, setPhase] = useState<Phase>('idle');
  const [scaleOpt, setScaleOpt] = useState(1);
  const [withMusic, setWithMusic] = useState(true);
  const [withPetals, setWithPetals] = useState(true);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultExt, setResultExt] = useState('');
  const [note, setNote] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cancelRef = useRef(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  const W = project.canvas.width * scaleOpt;
  const H = project.canvas.height * scaleOpt;

  const startRecording = async () => {
    if (typeof MediaRecorder === 'undefined' || !HTMLCanvasElement.prototype.captureStream) {
      setPhase('error');
      setErrorMsg('Browser ini tidak mendukung perekaman video (MediaRecorder). Coba Chrome/Edge terbaru.');
      return;
    }
    const picked = pickRecorderMime(m => MediaRecorder.isTypeSupported(m));
    if (!picked) {
      setPhase('error');
      setErrorMsg('Tidak ada format video yang didukung browser ini.');
      return;
    }
    setPhase('preparing');
    setNote('');
    setProgress(0);
    cancelRef.current = false;

    try {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Canvas perekam tidak siap.');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Konteks canvas gagal dibuat.');

      await document.fonts.ready;
      const images = await preloadSceneImages(project);

      // Petals overlay
      let petals: PetalSystem | null = null;
      let petalsCanvas: HTMLCanvasElement | null = null;
      if (withPetals) {
        petalsCanvas = document.createElement('canvas');
        petalsCanvas.width = W;
        petalsCanvas.height = H;
        petals = new PetalSystem(petalsCanvas, 24);
      }

      // Music → audio track (recorded silently, not played to speakers)
      let audioCtx: AudioContext | null = null;
      let audioEl: HTMLAudioElement | null = null;
      let audioTrack: MediaStreamTrack | null = null;
      if (withMusic && hasMusic) {
        try {
          const url = await getAssetObjectURL(project.music.assetId!);
          if (!url) throw new Error('file musik tidak ditemukan');
          audioEl = new Audio();
          audioEl.src = url;
          audioEl.loop = true;
          audioCtx = new AudioContext();
          const src = audioCtx.createMediaElementSource(audioEl);
          const dest = audioCtx.createMediaStreamDestination();
          src.connect(dest);
          audioTrack = dest.stream.getAudioTracks()[0] ?? null;
          await audioCtx.resume();
        } catch {
          setNote('Musik latar gagal disertakan — video direkam tanpa suara.');
          audioCtx = null; audioEl = null; audioTrack = null;
        }
      }

      const videoStream = canvas.captureStream(30);
      const tracks: MediaStreamTrack[] = [...videoStream.getVideoTracks()];
      if (audioTrack) tracks.push(audioTrack);
      const combined = new MediaStream(tracks);

      const recorder = new MediaRecorder(combined, {
        mimeType: picked.mime,
        videoBitsPerSecond: scaleOpt >= 2 ? 12_000_000 : 6_000_000,
        ...(audioTrack ? { audioBitsPerSecond: 192_000 } : {}),
      });
      const chunks: Blob[] = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

      const cleanup = () => {
        petals?.stop();
        if (audioEl) { audioEl.pause(); audioEl.src = ''; }
        audioCtx?.close().catch(() => undefined);
        videoStream.getTracks().forEach(t => t.stop());
      };
      cleanupRef.current = cleanup;

      const finished = new Promise<Blob>((resolve) => {
        recorder.onstop = () => resolve(new Blob(chunks, { type: picked.mime.split(';')[0] }));
      });

      // Draw first frame, then start everything together
      drawVideoFrame(ctx, project, images, 0, scaleOpt);
      setPhase('recording');
      recorder.start(250);
      petals?.start();
      if (audioEl) { audioEl.currentTime = 0; await audioEl.play().catch(() => undefined); }

      const startStamp = performance.now();
      let lastUiUpdate = 0;
      await new Promise<void>((resolve) => {
        const tick = (now: number) => {
          const t = (now - startStamp) / 1000;
          if (cancelRef.current || t >= total) { resolve(); return; }
          drawVideoFrame(ctx, project, images, t, scaleOpt);
          if (petalsCanvas) ctx.drawImage(petalsCanvas, 0, 0);
          if (now - lastUiUpdate > 250) { lastUiUpdate = now; setProgress(Math.min(t, total)); }
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });

      const wasCancelled = cancelRef.current;
      recorder.stop();
      const blob = await finished;
      cleanup();
      cleanupRef.current = null;

      if (wasCancelled) {
        setPhase('idle');
        setProgress(0);
        setNote('Perekaman dibatalkan.');
        return;
      }
      setResultUrl(URL.createObjectURL(blob));
      setResultExt(picked.ext);
      setProgress(total);
      setPhase('done');
    } catch (err) {
      cleanupRef.current?.();
      cleanupRef.current = null;
      setPhase('error');
      setErrorMsg((err as Error).message);
    }
  };

  const cancel = () => { cancelRef.current = true; };

  const fileName = `${project.meta.name.replace(/[^\w-]+/g, '-').toLowerCase()}-video.${resultExt || 'mp4'}`;
  const busy = phase === 'preparing' || phase === 'recording';

  return (
    <div className="modal-backdrop" onClick={busy ? undefined : onClose}>
      <div className="modal" style={{ width: 520 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="toolbar-logo-mark" style={{ width: 22, height: 22, fontSize: 10 }}>▶</div>
            <div className="modal-title">Ekspor Video (dari Timeline Play)</div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} disabled={busy}><IconClose size={14} /></button>
        </div>

        <div className="modal-body">
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Undangan diputar dalam mode Timeline dan direkam menjadi video — lengkap dengan animasi objek,
            transisi scene, dan kelopak. Perekaman berjalan <strong>real-time</strong> selama total durasi
            ({total.toFixed(1)} detik). Format <strong>MP4</strong> dipakai bila browser mendukungnya;
            bila tidak, otomatis <strong>WebM</strong> (format akhir selalu ditampilkan apa adanya).
          </div>

          <div style={{ display: 'flex', gap: 14, marginTop: 12, alignItems: 'flex-start' }}>
            <canvas
              ref={canvasRef}
              width={project.canvas.width}
              height={project.canvas.height}
              style={{ width: 108, height: 'auto', maxHeight: 220, background: '#000', borderRadius: 6, border: '1px solid var(--border)', flexShrink: 0 }}
            />
            <div style={{ flex: 1, fontSize: 11, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                Resolusi:
                <select
                  className="inspector-select"
                  style={{ width: 150 }}
                  value={scaleOpt}
                  disabled={busy}
                  onChange={e => setScaleOpt(parseInt(e.target.value, 10))}
                >
                  <option value={1}>Asli — {project.canvas.width}×{project.canvas.height}</option>
                  <option value={2}>2× HD — {project.canvas.width * 2}×{project.canvas.height * 2}</option>
                </select>
              </label>
              <label style={{ display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}>
                <input type="checkbox" checked={withPetals} disabled={busy} onChange={e => setWithPetals(e.target.checked)} />
                Sertakan kelopak bunga
              </label>
              <label style={{ display: 'flex', gap: 6, alignItems: 'center', cursor: hasMusic ? 'pointer' : 'not-allowed', opacity: hasMusic ? 1 : 0.5 }}>
                <input type="checkbox" checked={withMusic && hasMusic} disabled={busy || !hasMusic} onChange={e => setWithMusic(e.target.checked)} />
                Sertakan musik latar {hasMusic ? `( ${project.music.fileName ?? 'musik proyek'})` : '(belum ada musik — atur di panel Acara & Musik)'}
              </label>
              {hasMusic && (
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                  Musik direkam ke dalam video tanpa terdengar dari speaker selama perekaman.
                </div>
              )}

              {phase === 'recording' && (
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)' }}>
                    ● Merekam… {progress.toFixed(1)}s / {total.toFixed(1)}s
                  </div>
                  <div style={{ height: 6, background: 'var(--bg-input)', borderRadius: 3, marginTop: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(progress / total) * 100}%`, background: 'var(--accent)', transition: 'width 0.25s' }} />
                  </div>
                </div>
              )}
              {phase === 'preparing' && <div style={{ fontSize: 11 }}>Menyiapkan gambar &amp; font…</div>}
              {phase === 'done' && (
                <div style={{ fontSize: 11, color: 'var(--accent)' }}>
                  ✓ Selesai — format video: <strong>{resultExt.toUpperCase()}</strong>
                </div>
              )}
              {phase === 'error' && <div style={{ fontSize: 11, color: 'var(--text-danger)' }}>Gagal: {errorMsg}</div>}
              {note && <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{note}</div>}
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ gap: 8 }}>
          <button className="btn btn-secondary" onClick={onClose} disabled={busy}>Tutup</button>
          {phase === 'recording' ? (
            <button className="btn btn-secondary" onClick={cancel}>Batalkan Rekaman</button>
          ) : phase === 'done' && resultUrl ? (
            <>
              <button className="btn btn-secondary" onClick={() => { setPhase('idle'); setResultUrl(null); }}>Rekam Ulang</button>
              <a className="btn btn-primary" href={resultUrl} download={fileName} style={{ textDecoration: 'none' }}>
                ⬇ Simpan Video ({resultExt.toUpperCase()})
              </a>
            </>
          ) : (
            <button className="btn btn-primary" onClick={startRecording} disabled={busy}>
              {phase === 'preparing' ? 'Menyiapkan…' : '● Mulai Rekam Video'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
