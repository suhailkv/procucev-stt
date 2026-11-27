export async function startMicrophone({ onChunk, onLevel }) {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Microphone access needs a modern browser over HTTPS');
  }
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
  });

  const ctx = new AudioContext();
  await ctx.audioWorklet.addModule('/pcm-recorder.worklet.js');
  const source = ctx.createMediaStreamSource(stream);
  const node = new AudioWorkletNode(ctx, 'pcm-recorder');
  node.port.onmessage = ({ data }) => {
    onChunk(data.pcm);
    onLevel?.(Math.min(1, data.level * 4));
  };
  source.connect(node);

  return {
    async stop() {
      node.port.onmessage = null;
      source.disconnect();
      node.disconnect();
      stream.getTracks().forEach((t) => t.stop());
      await ctx.close();
    },
  };
}

export function describeMicError(err) {
  if (err?.name === 'NotAllowedError') return 'Microphone permission was denied. Allow it in the browser address bar.';
  if (err?.name === 'NotFoundError') return 'No microphone was found.';
  return err?.message || 'Could not start the microphone';
}
