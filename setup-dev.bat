@echo off
setlocal enabledelayedexpansion

echo.
echo ❓ Are you using GPU for Whisper service? (Y/N):
set /p USE_GPU=

set "USE_GPU=!USE_GPU:~0,1!"
set "USE_GPU=!USE_GPU:Y=y!"
set "USE_GPU=!USE_GPU:N=n!"
set "USE_GPU=!USE_GPU:y=y!"
set "USE_GPU=!USE_GPU:n=n!"

echo 🔄 Cleaning stale processes...
echo 🧹 Killing python processes...
taskkill /f /im python.exe >nul 2>&1

echo 🧹 Deleting stale Turbo PID files...
del "%LOCALAPPDATA%\Temp\turbod\*\turbod.pid" 2>nul

echo 📝 Writing .env files...

> apps\backend\.env (
    echo PORT=3000
    echo WHISPER_SERVICE_URL=ws://localhost:8000
    echo LLM_FORWARD_URL=ws://localhost:5001/ws/transcripts
    echo MONGO_URI="mongodb://localhost:27017/"
)

> apps\frontend\.env (
    echo VITE_BACKEND_WS_URL=ws://localhost:3000
    echo VITE_PORT=5173
    echo VITE_BACKEND_API_URL=http://localhost:3000
    echo VITE_CHUNK_INTERVAL=30000
)

> services\whisper\.env (
    echo CHUNK_DURATION=30
    echo MODEL=medium
    echo SILENCE_THRESHOLD=960000
)

> services\pollgen-llm\.env (
    echo BACKEND_SETTINGS_API=http://localhost:5001/settings
    echo GEMINI_API_KEY="YOUR_API_KEY_HERE"
    echo MONGO_URI="mongodb://localhost:27017"
)

echo ✅ .env files created.
echo.

:: Whisper service
echo 🔧 Setting up Whisper Python environment...

cd services\whisper

if not exist whisper-env (
    echo 🐍 Creating virtual environment whisper-env...
    python -m venv whisper-env
)

call whisper-env\Scripts\activate

if not exist ".installed.flag" (
    echo 📦 Upgrading pip...
    python -m pip install --upgrade pip

    if /i "!USE_GPU!"=="y" (
        echo 📥 Installing GPU requirements...
        pip install -r requirements.gpu.txt --extra-index-url https://download.pytorch.org/whl/cu121 && echo gpu > .installed.flag
    ) else (
        echo 📥 Installing CPU requirements...
        pip install -r requirements.txt && echo cpu > .installed.flag
    )
) else (
    echo ✅ Whisper dependencies already installed. Skipping...
)

cd ../..

:: Pollgen LLM service
echo 🔧 Setting up PollGen LLM Python environment...

cd services\pollgen-llm

if not exist pollgenenv (
    echo 🐍 Creating virtual environment pollgenenv...
    python -m venv pollgenenv
)

call pollgenenv\Scripts\activate

if not exist ".installed.flag" (
    echo 📦 Upgrading pip...
    python -m pip install --upgrade pip

    echo 📥 Installing LLM requirements...
    pip install -r requirements.txt && echo done > .installed.flag
) else (
    echo ✅ PollGen LLM dependencies already installed. Skipping...
)

cd ../..

echo 📦 Installing JS packages...
pnpm install

echo 🚀 Starting development server...
pnpm dev
