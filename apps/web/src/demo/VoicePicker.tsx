import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Button } from '../components';
import { cueEngine } from '../audio/cueEngine';
import { CUE_IDS } from '../audio/cueScript';
import { useSessionStore } from '../engine/sessionStore';
import {
  VoiceApiError,
  listVoices,
  regenerateCues,
  setAgentVoice,
  type Voice,
  type VoicesResponse,
} from '../lib/voiceApi';

// S9 · Presenter rig. The coach speaks through two surfaces — the conversational agent
// in REST and the pre-rendered Tier 0 mp3s inside a set. Changing one without the other
// makes the coach sound like two different people, so this control always moves both,
// and says out loud when they have drifted apart.

/** 27 today. Read from the manifest so the copy can never lie about the count. */
const CUE_COUNT = CUE_IDS.length;

type LoadState =
  | { kind: 'loading' }
  | { kind: 'unconfigured' }
  | { kind: 'failed'; message: string }
  | { kind: 'ready'; data: VoicesResponse };

/** 'applying' = repointing the agent · 'rendering' = the 20–30s TTS pass. */
type RunState = 'idle' | 'applying' | 'rendering';

type Result = { tone: 'ok' | 'error'; text: string; hint?: string | undefined };

function voiceLabel(voice: Voice): string {
  const accent = voice.accent;
  return accent ? `${voice.name} (${accent})` : voice.name;
}

function nameFor(voices: Voice[], id: string | null): string | null {
  if (id === null) return null;
  return voices.find((v) => v.id === id)?.name ?? id;
}

function describe(err: unknown): Result {
  if (err instanceof VoiceApiError) {
    return { tone: 'error', text: err.message, hint: err.hint };
  }
  if (err instanceof Error && err.message.length > 0) {
    return { tone: 'error', text: err.message };
  }
  return { tone: 'error', text: 'Voice change failed' };
}

export function VoicePicker() {
  const phase = useSessionStore((s) => s.phase);
  const [load, setLoad] = useState<LoadState>({ kind: 'loading' });
  const [selected, setSelected] = useState('');
  const [run, setRun] = useState<RunState>('idle');
  const [result, setResult] = useState<Result | null>(null);
  const [pastedId, setPastedId] = useState('');

  const alive = useRef(true);
  const preview = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // --- initial load ---------------------------------------------------------
  useEffect(() => {
    const ac = new AbortController();
    listVoices(ac.signal)
      .then((data) => {
        if (ac.signal.aborted) return;
        setLoad({ kind: 'ready', data });
        setSelected(data.agentVoiceId ?? data.voices[0]?.id ?? '');
      })
      .catch((err: unknown) => {
        if (ac.signal.aborted) return;
        // No key, no agent: an expected shape of this app, not an error. Stay quiet —
        // the session still runs on browser speech synthesis.
        if (err instanceof VoiceApiError && err.notConfigured) {
          setLoad({ kind: 'unconfigured' });
          return;
        }
        setLoad({ kind: 'failed', message: describe(err).text });
      });
    return () => ac.abort();
  }, []);

  // --- preview --------------------------------------------------------------
  const stopPreview = useCallback(() => {
    const el = preview.current;
    if (!el) return;
    try {
      el.pause();
      el.currentTime = 0;
    } catch {
      // Not seekable yet — pausing is enough.
    }
    preview.current = null;
  }, []);

  useEffect(() => stopPreview, [stopPreview]);

  const playPreview = useCallback(
    (url: string) => {
      stopPreview();
      if (typeof window === 'undefined' || typeof window.Audio === 'undefined') return;
      try {
        const el = new Audio(url);
        preview.current = el;
        const started = el.play() as Promise<void> | undefined;
        // Autoplay policy or a dead sample URL: silent, never an unhandled rejection.
        if (started && typeof started.catch === 'function') started.catch(() => undefined);
      } catch {
        preview.current = null;
      }
    },
    [stopPreview],
  );

  // --- apply ----------------------------------------------------------------
  const apply = useCallback(
    (voiceId: string) => {
      const go = async (): Promise<void> => {
        setResult(null);
        setRun('applying');
        stopPreview();
        const track = useSessionStore.getState().track;
        try {
          const agent = await setAgentVoice(voiceId);
          track('voice_changed', { voiceId, name: agent.name });

          if (alive.current) setRun('rendering');
          const cues = await regenerateCues(voiceId);
          // Do this even if the rig has unmounted: the engine is a singleton and the
          // files on disk have already changed.
          cueEngine.setCueVersion(cues.version);
          track('cues_regenerated', { voiceId, count: cues.count });

          const refreshed = await listVoices();
          if (!alive.current) return;
          setLoad({ kind: 'ready', data: refreshed });
          setResult({
            tone: 'ok',
            text: `Done — ${cues.count} cues in ${agent.name}'s voice`,
          });
        } catch (err) {
          if (!alive.current) return;
          setResult(describe(err));
        } finally {
          if (alive.current) setRun('idle');
        }
      };
      void go();
    },
    [stopPreview],
  );

  // --- render ---------------------------------------------------------------
  if (load.kind === 'loading') {
    return (
      <div className="rig-group">
        <div className="rig-label">Coach voice</div>
        <p className="rig-voice-note">Loading voices…</p>
      </div>
    );
  }

  if (load.kind === 'unconfigured') {
    return (
      <div className="rig-group">
        <div className="rig-label">Coach voice</div>
        <p className="rig-voice-note">Voice agent not configured</p>
      </div>
    );
  }

  if (load.kind === 'failed') {
    return (
      <div className="rig-group">
        <div className="rig-label">Coach voice</div>
        <p className="rig-voice-error">{load.message}</p>
      </div>
    );
  }

  const { voices, agentVoiceId, cueVoiceId } = load.data;
  const current = voices.find((v) => v.id === selected) ?? null;
  const cueName = nameFor(voices, cueVoiceId);
  const drifted = cueVoiceId !== agentVoiceId;
  const sessionRunning = phase === 'set' || phase === 'rest';
  const busy = run !== 'idle';
  const alreadyLive = selected !== '' && selected === agentVoiceId && selected === cueVoiceId;
  // The API sends '' rather than null for a voice with no sample, so test for content.
  const previewUrl = current?.previewUrl ? current.previewUrl : null;

  return (
    <div className="rig-group">
      <div className="rig-label">Coach voice</div>

      {voices.length === 0 ? (
        <p className="rig-voice-note">No voices on this account</p>
      ) : (
        <>
          <select
            className="rig-voice-select"
            value={selected}
            disabled={busy}
            aria-label="Coach voice"
            onChange={(e: ChangeEvent<HTMLSelectElement>) => {
              stopPreview();
              setResult(null);
              setSelected(e.target.value);
            }}
          >
            {voices.map((v) => (
              <option key={v.id} value={v.id}>
                {voiceLabel(v)}
              </option>
            ))}
          </select>

          <div className="rig-voice-status">
            <span>Cues</span>
            <span className="rig-voice-status-value">{cueName ?? 'not generated yet'}</span>
          </div>

          {drifted ? (
            <p className="rig-voice-warn">Cues and agent are different voices</p>
          ) : null}

          <Button
            variant="primary"
            size="sm"
            block
            disabled={busy || sessionRunning || alreadyLive || selected === ''}
            onClick={() => apply(selected)}
          >
            {run === 'idle' ? 'Use this voice' : 'Working…'}
          </Button>

          {sessionRunning ? (
            <p className="rig-voice-note">Finish or reset the session first</p>
          ) : (
            <p className="rig-voice-note">Re-renders all {CUE_COUNT} cues</p>
          )}

          {run === 'applying' ? <p className="rig-voice-progress">Updating agent…</p> : null}
          {run === 'rendering' ? (
            <p className="rig-voice-progress">
              Rendering {CUE_COUNT} cues… this takes about half a minute
            </p>
          ) : null}

          {result !== null && run === 'idle' ? (
            <p className={result.tone === 'ok' ? 'rig-voice-ok' : 'rig-voice-error'}>
              {result.text}
              {result.hint === undefined ? null : (
                <span className="rig-voice-hint">{result.hint}</span>
              )}
            </p>
          ) : null}

          {previewUrl === null ? null : (
            <Button
              variant="ghost"
              size="sm"
              icon="play"
              disabled={busy}
              onClick={() => playPreview(previewUrl)}
            >
              Preview
            </Button>
          )}
        </>
      )}

      {/* A voice from the ElevenLabs library only appears in the list above once it
          has been added to the account. Pasting an id is the escape hatch — the API
          verifies it and says plainly when it is not on this account. */}
      <form
        className="rig-voice-manual"
        onSubmit={(e: FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          const id = pastedId.trim();
          if (id !== '') apply(id);
        }}
      >
        <label className="rig-voice-manual-label" htmlFor="rig-voice-id">
          Or paste a voice id
        </label>
        <div className="rig-voice-manual-row">
          <input
            id="rig-voice-id"
            className="rig-voice-input"
            value={pastedId}
            disabled={busy || sessionRunning}
            spellCheck={false}
            autoComplete="off"
            placeholder="ZbKDEqxkr8Ub4psNm5XD"
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setResult(null);
              setPastedId(e.target.value);
            }}
          />
          <Button
            variant="outline"
            size="sm"
            type="submit"
            disabled={busy || sessionRunning || pastedId.trim() === ''}
          >
            Use
          </Button>
        </div>
      </form>
    </div>
  );
}
