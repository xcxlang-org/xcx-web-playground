import { runSource } from 'xcx-interpreter/browser';
import { registerVFS } from 'xcx-interpreter/browser';
import mathSource from '../../../interpreter/lib/math.xcx?raw';

// Register standard library into the Virtual File System
registerVFS('math', mathSource);
self.onmessage = (e) => {
    const { type, source, inputLines, sharedBuffer, vfs } = e.data;
    if (type !== 'run') return;

    // Register user files from the playground's virtual file system
    if (vfs && typeof vfs === 'object') {
        for (const [name, content] of Object.entries(vfs)) {
            registerVFS(name, content as string);
        }
    }

    const intBuffer = sharedBuffer ? new Int32Array(sharedBuffer) : null;

    try {
        const onOutput = (line: string) => {
            self.postMessage({ type: 'output', line });
        };

        const onStdinRequest = () => {
            if (!intBuffer) {
                throw new Error('Terminal interactivity requires SharedArrayBuffer support. Provide predefined stdin string instead.');
            }

            // Tell UI we are waiting for user input
            self.postMessage({ type: 'stdin_request' });

            // Pause worker effectively until index 0 becomes 1
            Atomics.wait(intBuffer, 0, 0);

            const len = intBuffer[1] as number;
            let res = '';
            for (let i = 0; i < len; i++) {
                res += String.fromCharCode(intBuffer[i + 2] as number);
            }

            // Reset flag to 0 for the next prompt
            Atomics.store(intBuffer, 0, 0);
            return res;
        };

        const result = runSource(source, inputLines || [], onOutput, onStdinRequest);

        if (result.error) {
            self.postMessage({ type: 'error', message: result.error });
        }
    } catch (err: any) {
        self.postMessage({ type: 'error', message: String(err) });
    } finally {
        self.postMessage({ type: 'done' });
    }
};
