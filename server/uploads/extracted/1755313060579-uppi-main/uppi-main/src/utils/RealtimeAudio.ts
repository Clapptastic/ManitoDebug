/*
 * RealtimeAudio utilities
 * - AudioRecorder: captures microphone audio at 24kHz mono and streams Float32 data frames
 * - RealtimeChat: sets up WebRTC with OpenAI Realtime using an ephemeral token from a Supabase Edge Function
 *
 * Security: This uses supabase.functions.invoke to request an ephemeral token from the edge function.
 * No API keys are ever accessed directly from the client.
 */

import { supabase } from '@/integrations/supabase/client';

export class AudioRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  constructor(private onAudioData: (audioData: Float32Array) => void) {}

  async start() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.audioContext = new AudioContext({ sampleRate: 24000 });
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        this.onAudioData(new Float32Array(inputData));
      };

      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      throw error;
    }
  }

  stop() {
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export class RealtimeChat {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private audioEl: HTMLAudioElement;
  private recorder: AudioRecorder | null = null;

  constructor(private onMessage: (message: any) => void) {
    this.audioEl = document.createElement('audio');
    this.audioEl.autoplay = true;
  }

  async init(model?: string, voice?: string, instructions?: string) {
    try {
      // 1) Get ephemeral token from our Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('realtime-ephemeral-token', {
        body: { model, voice, instructions, provider: 'openai' },
      });
      if (error) {
        const ctx: any = (error as any)?.context;
        const friendly = (ctx?.error?.message || ctx?.error || (error as any)?.message || 'Failed to get ephemeral token');
        console.error('Failed to get ephemeral token:', error);
        throw new Error(friendly);
      }

      if (!data?.client_secret?.value) {
        console.error('Unexpected token response:', data);
        throw new Error('Invalid ephemeral token response');
      }

      const EPHEMERAL_KEY: string = data.client_secret.value;

      // 2) Create peer connection
      this.pc = new RTCPeerConnection();

      // Remote audio handling
      this.pc.ontrack = (e) => {
        this.audioEl.srcObject = e.streams[0];
      };

      // Local microphone track
      const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.pc.addTrack(ms.getTracks()[0]);

      // Data channel for events
      this.dc = this.pc.createDataChannel('oai-events');

      // Helper to send session.update with correct audio and VAD settings
      const sendSessionUpdate = () => {
        try {
          const sessionUpdate = {
            type: 'session.update',
            session: {
              modalities: ['text', 'audio'],
              instructions: instructions || 'You are an AI entrepreneurship cofounder. Provide concise, actionable guidance.',
              input_audio_format: 'pcm16',
              output_audio_format: 'pcm16',
              input_audio_transcription: { model: 'whisper-1' },
              turn_detection: {
                type: 'server_vad',
                threshold: 0.5,
                prefix_padding_ms: 300,
                silence_duration_ms: 1000,
              },
              tool_choice: 'auto',
              temperature: 0.8,
              max_response_output_tokens: 'inf',
            },
          } as const;
          this.dc?.send(JSON.stringify(sessionUpdate));
          console.log('Sent session.update');
        } catch (e) {
          console.warn('Failed sending session.update', e);
        }
      };

      let sessionConfigured = false;

      // After channel opens, set a fallback to configure session if we don't receive session.created promptly
      this.dc.onopen = () => {
        setTimeout(() => {
          if (!sessionConfigured) {
            console.log('session.created not received yet, sending fallback session.update');
            sendSessionUpdate();
            sessionConfigured = true;
          }
        }, 1000);
      };

      this.dc.addEventListener('message', (e) => {
        try {
          const event = JSON.parse(e.data);
          if (event?.type === 'session.created' && !sessionConfigured) {
            sendSessionUpdate();
            sessionConfigured = true;
          }
          this.onMessage?.(event);
        } catch (err) {
          console.warn('Non-JSON message received', e.data);
        }
      });

      // Create and set local description (offer)
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      // 3) Connect to OpenAI Realtime via WebRTC
      const baseUrl = 'https://api.openai.com/v1/realtime';
      const chosenModel = model || 'gpt-4o-realtime-preview-2024-12-17';

      const sdpResponse = await fetch(`${baseUrl}?model=${encodeURIComponent(chosenModel)}`, {
        method: 'POST',
        body: offer.sdp || '',
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          'Content-Type': 'application/sdp',
        },
      });

      const answer = {
        type: 'answer' as RTCSdpType,
        sdp: await sdpResponse.text(),
      };

      await this.pc.setRemoteDescription(answer);
      console.log('WebRTC connection established with OpenAI Realtime');

      // Optional: start a local recorder pipeline that streams audio buffers as input events
      this.recorder = new AudioRecorder((audioData) => {
        if (this.dc?.readyState === 'open') {
          this.dc.send(
            JSON.stringify({
              type: 'input_audio_buffer.append',
              audio: this.encodeAudioData(audioData), // PCM16@24kHz base64
            })
          );
        }
      });
      await this.recorder.start();
    } catch (error) {
      console.error('Error initializing RealtimeChat:', error);
      throw error;
    }
  }

  private encodeAudioData(float32Array: Float32Array): string {
    // Convert Float32 to 16-bit PCM and then to base64
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    const uint8Array = new Uint8Array(int16Array.buffer);
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    return btoa(binary);
  }

  async sendMessage(text: string) {
    if (!this.dc || this.dc.readyState !== 'open') {
      throw new Error('Data channel not ready');
    }

    const event = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text,
          },
        ],
      },
    };

    this.dc.send(JSON.stringify(event));
    this.dc.send(JSON.stringify({ type: 'response.create' }));
  }

  disconnect() {
    this.recorder?.stop();
    this.dc?.close();
    this.pc?.close();
  }
}
