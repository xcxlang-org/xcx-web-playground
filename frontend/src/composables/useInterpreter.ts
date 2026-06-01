import { ref } from 'vue';

const isRunning = ref(false);
const isWaitingForInput = ref(false);
let worker: Worker | null = null;
let sharedBuffer: SharedArrayBuffer | null = null;
let intBuffer: Int32Array | null = null;

try {
    if (typeof SharedArrayBuffer !== 'undefined') {
        sharedBuffer = new SharedArrayBuffer(1024 * 1024); // 1MB for string char codes
        intBuffer = new Int32Array(sharedBuffer);
    }
} catch (e) {
    console.warn("SharedArrayBuffer is not available. Stdin interactivity will fail.", e);
}

export function useInterpreter() {

    const runCode = (
        source: string,
        vfs: Record<string, string>,
        callbacks: {
            onOutput: (line: string) => void,
            onError: (msg: string) => void,
            onDone: () => void,
            onStdinRequest: () => void,
            onClear: () => void
        }
    ) => {
        if (isRunning.value) abort();

        isRunning.value = true;
        isWaitingForInput.value = false;
        callbacks.onClear();

        worker = new Worker(new URL('../workers/xcx.worker.ts', import.meta.url), { type: 'module' });

        worker.onmessage = (e) => {
            const { type, line, message } = e.data;
            if (type === 'output') callbacks.onOutput(line);
            else if (type === 'error') callbacks.onError(message);
            else if (type === 'stdin_request') {
                isWaitingForInput.value = true;
                callbacks.onStdinRequest();
            }
            else if (type === 'done') {
                isRunning.value = false;
                isWaitingForInput.value = false;
                callbacks.onDone();
                worker?.terminate();
                worker = null;
            }
        };

        worker.onerror = (e) => {
            callbacks.onError(`Worker error: ${e.message}`);
            abort();
        };

        worker.postMessage({ type: 'run', source, vfs, sharedBuffer });
    };

    const abort = () => {
        if (worker) {
            worker.terminate();
            worker = null;
        }
        isRunning.value = false;
        isWaitingForInput.value = false;
    };

    const submitInput = (text: string) => {
        if (!isWaitingForInput.value || !intBuffer) return;

        const maxLen = (intBuffer.length - 2);
        const str = text; // Raw string
        const len = Math.min(str.length, maxLen);

        intBuffer[1] = len;
        for (let i = 0; i < len; i++) {
            intBuffer[i + 2] = str.charCodeAt(i);
        }

        isWaitingForInput.value = false;
        Atomics.store(intBuffer, 0, 1);
        Atomics.notify(intBuffer, 0, 1);
    };

    return { isRunning, isWaitingForInput, runCode, abort, submitInput };
}
