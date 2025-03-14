async function sendMessage() {
    const input = document.getElementById('input');
    const message = input.value.trim();
    if (!message) return;
    
    const messages = document.getElementById('messages');
    messages.innerHTML += `
        <div class="message user-message">${message}</div>
    `;
    input.value = '';
    messages.scrollTop = messages.scrollHeight;
    
    // Update status to show processing
    document.getElementById('status-text').textContent = 'Processing...';

    try {
        // Send the message to the backend API
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        const data = await response.json();
        
        // Create HTML for the response
        let responseHtml = `<div class="message agent-message">${data.response}</div>`;
        
        // Add sources if available
        if (data.sources && data.sources.length > 0) {
            responseHtml += '<div class="source">Sources: ';
            data.sources.forEach((source, index) => {
                if (index > 0) responseHtml += ', ';
                responseHtml += source;
            });
            responseHtml += '</div>';
        }
        
        // Add the response to the chat
        messages.innerHTML += responseHtml;
        messages.scrollTop = messages.scrollHeight;
        
        // Update status back to ready
        document.getElementById('status-text').textContent = 'Connected to minimal agent | Model: Mock API';
    } catch (error) {
        console.error('Error:', error);
        messages.innerHTML += `
            <div class="message agent-message" style="color: red;">
                Error: Could not get response from the agent.
            </div>
        `;
        // Update status to show error
        document.getElementById('status-text').textContent = 'Error: Connection issue';
    }
}

// Set up event listener for Enter key
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('input');
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendMessage();
            }
        });
        input.focus();
    }
});
