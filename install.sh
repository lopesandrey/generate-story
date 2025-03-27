#!/bin/bash
set -e

echo "🔑 Fixing permissions..."
chmod +x bin/generate-story install.sh

npm install
npm run build

if ! command -v ollama &> /dev/null; then
  echo "📥 Installing Ollama..."
  curl -fsSL https://ollama.com/install.sh | sh
fi

echo "📥 Pulling the Ollama model (codellama:7b-instruct)..."
ollama pull codellama:7b-instruct

echo ""
echo "✅ Installation done!"
echo "You can now use the CLI via NPX from anywhere:"
echo "   npx generate-story path/to/MyComponent.tsx"