import { isMessage, type AnyMessageEnvelope } from '../shared/messages';
import { CaptureController } from './capture-controller';

const controller = new CaptureController();

chrome.runtime.onMessage.addListener((message: AnyMessageEnvelope & { __target?: string }, _sender, respond) => {
  if (!isMessage(message) || message.__target !== 'offscreen') return false;
  void handle(message).then(() => respond({ ok: true })).catch((error) => {
    respond({ ok: false, error: error instanceof Error ? error.message : '音频采集失败' });
  });
  return true;
});

async function handle(message: AnyMessageEnvelope): Promise<void> {
  switch (message.type) {
    case 'START_CAPTURE':
      await controller.start(message.payload);
      break;
    case 'STOP_CAPTURE':
      await controller.stop();
      break;
    case 'PAUSE_CAPTURE':
      await controller.pause();
      break;
    case 'RESUME_CAPTURE':
      await controller.resume();
      break;
    case 'CAPTURE_PLAYBACK':
      controller.updatePlayback(message.payload.playback);
      break;
  }
}
