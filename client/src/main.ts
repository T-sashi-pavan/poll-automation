// client/src/main.ts
import './style.css'; // Vite allows importing CSS directly

// --- Type Definitions ---
interface PollData {
    question: string;
    options: string[];
}

// Extend the Window interface to include SpeechRecognition types
interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
}

// --- Get HTML Elements ---
const speechInput = document.getElementById('speechInput') as HTMLTextAreaElement;
const audioButton = document.getElementById('audioButton') as HTMLButtonElement;
const generateButton = document.getElementById('generateButton') as HTMLButtonElement;
const statusMessage = document.getElementById('statusMessage') as HTMLDivElement;
const pollSection = document.getElementById('pollSection') as HTMLDivElement;
const pollContainer = document.getElementById('pollContainer') as HTMLDivElement;

// --- Configure Speech Recognition ---
const SpeechRecognition = ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
let recognition: any = null;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => {
        audioButton.classList.add('listening');
        statusMessage.textContent = 'Listening...';
    };

    recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        speechInput.value = transcript;
        statusMessage.textContent = 'Speech captured. Click Generate Poll.';
    };

    recognition.onend = () => {
        audioButton.classList.remove('listening');
    };

    recognition.onerror = (event: any) => {
        statusMessage.textContent = `Error in speech recognition: ${event.error}`;
        statusMessage.classList.add('error');
    };

} else {
    statusMessage.textContent = "Sorry, your browser doesn't support Speech Recognition.";
    audioButton.disabled = true;
}

// --- Event Listeners ---
audioButton.addEventListener('click', () => {
    recognition?.start();
});

generateButton.addEventListener('click', handleGeneratePoll);

// --- Main function to generate the poll ---
async function handleGeneratePoll(): Promise<void> {
    const transcript = speechInput.value.trim();
    if (!transcript) {
        statusMessage.textContent = 'Please provide some text by speaking first.';
        statusMessage.classList.add('error');
        return;
    }

    generateButton.disabled = true;
    generateButton.textContent = 'Generating...';
    statusMessage.textContent = 'Contacting the AI... Please wait.';
    statusMessage.classList.remove('error');
    pollSection.style.display = 'none';

    try {
        // IMPORTANT: Call our Node.js backend API
        const response = await fetch('http://localhost:5000/api/generate-poll', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transcript }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }
        
        displayPoll(data);
        statusMessage.textContent = 'Poll generated successfully!';

    } catch (error) {
        console.error('Error generating poll:', error);
        statusMessage.textContent = `Error: ${error instanceof Error ? error.message : String(error)}`;
        statusMessage.classList.add('error');
    } finally {
        generateButton.disabled = false;
        generateButton.textContent = 'Generate Poll Question';
    }
}

// --- Function to display the poll on the page ---
function displayPoll(pollData: PollData): void {
    pollContainer.innerHTML = ''; 

    const questionEl = document.createElement('div');
    questionEl.className = 'poll-question';
    questionEl.textContent = pollData.question;
    pollContainer.appendChild(questionEl);

    const optionsList = document.createElement('ul');
    optionsList.className = 'poll-options';

    pollData.options.forEach(optionText => {
        const optionItem = document.createElement('li');
        optionItem.className = 'poll-option';
        optionItem.textContent = optionText;
        optionsList.appendChild(optionItem);
    });

    pollContainer.appendChild(optionsList);
    pollSection.style.display = 'block';
}