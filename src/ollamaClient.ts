import fetch from 'node-fetch';
import { execSync, spawn } from 'child_process';

export async function startOllama() {
  try {
    await fetch('http://localhost:11434');
    console.log('🟢 Ollama already running.');
  } catch {
    console.log('🚀 Starting Ollama server...');
    const ollamaProcess = spawn('ollama', ['serve'], {
      detached: true,
      stdio: 'ignore',
    });
    ollamaProcess.unref();
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
}

export async function stopOllama() {
  console.log('🚫 Stopping Ollama server...');
  try {
    execSync("pkill -f 'ollama serve'");
  } catch {
    console.log('⚠️ Ollama server was not running.');
  }
}

export async function generateStorybookCode(prompt: string): Promise<string> {
  const res = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'codellama:7b-instruct',
      prompt,
      stream: false,
    }),
  });

  const data = (await res.json()) as { response: string };

  return data.response;
}
