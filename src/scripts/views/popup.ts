interface ServiceDetails {
    id: string;
    name: string;
    rating: string;
    points: Array<{
        id: string;
        title: string;
        status: string;
        text: string;
    }>;
}

interface DonationReminder {
    active: boolean;
    allowedPlattform: boolean;
}

interface ChatContext {
    serviceName: string | null;
    grade: string | null;
    pointList: Array<{ classification: string; title: string }>;
    aiOverview: string | null;
    url: string | null;
}

let curatorMode = false;
let renderDonationReminder = false;
var apiUrl = 'api.tosdr.org';

// Store current context for chat
let currentChatContext: ChatContext = {
    serviceName: null,
    grade: null,
    pointList: [],
    aiOverview: null,
    url: null
};

chrome.storage.local.get(['api'], function (result) {
    if (result.api && result.api.length !== 0) {
        apiUrl = result.api;
    }
});

async function donationReminderLogic(): Promise<void> {
    const result = await chrome.storage.local.get('displayDonationReminder');
    console.log('displayDonationReminder:', result.displayDonationReminder);
    
    if (result.displayDonationReminder?.active) {
        try {
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth();
            const currentYear = currentDate.getFullYear();
            
            // Reset the badge text for all tabs
            const tabs = await chrome.tabs.query({});
            for (const tab of tabs) {
                if (tab.id) {
                    await chrome.action.setBadgeText({ text: '', tabId: tab.id });
                }
            }

            await chrome.storage.local.set({
                lastDismissedReminder: {
                    month: currentMonth,
                    year: currentYear,
                },
                displayDonationReminder: {
                    active: false,
                    allowedPlattform: result.displayDonationReminder?.allowedPlattform ?? false,
                },
            });

            const donationReminder = document.getElementById('donationReminder');
            if (donationReminder) {
                donationReminder.style.display = 'block';
            }
        } catch (error) {
            console.error('Error in donationReminderLogic:', error);
        }
    }
}

async function handleUrlInURLIfExists(urlOriginal: string): Promise<void> {
    const url = urlOriginal.split('?url=')[1];
    if (!url) {
        await donationReminderLogic();
        const idElement = document.getElementById('id');
        const loadingElement = document.getElementById('loading');
        const loadedElement = document.getElementById('loaded');
        const nourlElement = document.getElementById('nourl');
        const pointListElement = document.getElementById('pointList');

        if (idElement) idElement.innerHTML = 'Error: no service-id in url';
        if (loadingElement) loadingElement.style.display = 'none';
        if (loadedElement) loadedElement.style.display = 'none';
        if (nourlElement) nourlElement.style.display = 'block';
        if (pointListElement) pointListElement.style.display = 'none';
        return;
    }

    const result = await searchToSDR(url);

    if (result) {
        const phoenixButton = document.getElementById('phoenixButton');
        if (phoenixButton) {
            phoenixButton.onclick = () => {
                window.open(`https://edit.tosdr.org/services/${result}`);
            };
        }

        themeHeaderIfEnabled(result);

        const logo = document.getElementById('logo') as HTMLImageElement;
        if (logo) {
            logo.src = `https://s3.tosdr.org/logos/${result}.png`;
        }

        const idElement = document.getElementById('id');
        if (idElement) {
            idElement.innerText = result;
        }

        await getServiceDetails(result, true);
    } else {
        await donationReminderLogic();
        const idElement = document.getElementById('id');
        const loadingElement = document.getElementById('loading');
        const loadedElement = document.getElementById('loaded');
        const nourlElement = document.getElementById('nourl');
        const pointListElement = document.getElementById('pointList');

        if (idElement) idElement.innerText = 'Error: no service-id in url';
        if (loadingElement) loadingElement.style.display = 'none';
        if (loadedElement) loadedElement.style.display = 'none';
        if (nourlElement) nourlElement.style.display = 'block';
        if (pointListElement) pointListElement.style.display = 'none';
    }
}

function getServiceIDFromURL(url: string): void {
    const serviceID = url.split('?service-id=')[1]?.replace('#', '');
    
    if (!serviceID) {
        handleUrlInURLIfExists(url);
        return;
    }

    if (serviceID === '-1') {
        donationReminderLogic();
        const idElement = document.getElementById('id');
        const loadingElement = document.getElementById('loading');
        const loadedElement = document.getElementById('loaded');
        const nourlElement = document.getElementById('nourl');
        const notreviewedElement = document.getElementById('notreviewed');
        const pointListElement = document.getElementById('pointList');
        const edittextElement = document.getElementById('edittext');

        if (idElement) idElement.innerHTML = 'Error: no service-id in url';
        if (loadingElement) loadingElement.style.display = 'none';
        if (loadedElement) loadedElement.style.display = 'none';
        if (nourlElement) nourlElement.style.display = 'block';
        if (notreviewedElement) notreviewedElement.style.display = 'block';
        if (pointListElement) pointListElement.style.display = 'none';
        if (edittextElement) {
            edittextElement.onclick = () => {
                window.open('https://edit.tosdr.org');
            };
        }
        return;
    }

    const phoenixButton = document.getElementById('phoenixButton');
    const webbutton = document.getElementById('webbutton');
    const logo = document.getElementById('logo') as HTMLImageElement;
    const idElement = document.getElementById('id');

    if (phoenixButton) {
        phoenixButton.onclick = () => {
            window.open(`https://edit.tosdr.org/services/${serviceID}`);
        };
    }

    if (webbutton) {
        webbutton.onclick = () => {
            window.open(`https://tosdr.org/en/service/${serviceID}`);
        };
    }

    themeHeaderIfEnabled(serviceID);

    if (logo) {
        logo.src = `https://s3.tosdr.org/logos/${serviceID}.png`;
    }

    if (idElement) {
        idElement.innerHTML = serviceID;
    }

    getServiceDetails(serviceID);
}

function themeHeaderIfEnabled(serviceID: string): void {
    chrome.storage.local.get(['themeHeader'], function (result) {
        if (result.themeHeader) {
            const blurredTemplate = `.header::before {
                content: '';
                position: absolute;
                background-image: url('https://s3.tosdr.org/logos/${serviceID}.png');
                top: 0;
                left: 0;
                width: 100%;
                height: 90%;
                background-repeat: no-repeat;
                background-position: center;
                background-size: cover;
                filter: blur(30px);
                z-index: -2;
            }`;

            const styleElement = document.createElement('style');
            document.head.appendChild(styleElement);
            styleElement.sheet?.insertRule(blurredTemplate);
        }
    });
}

function themeHeaderColorIfEnabled(rating: string): void {
    chrome.storage.local.get(['themeHeaderRating'], function (result) {
        if (result.themeHeaderRating) {
            const header = document.getElementById('headerPopup');
            if (header) {
                header.classList.add(rating);
            }
        }
    });
}

async function getServiceDetails(id: string, unverified = false) {
    const service_url = `https://${apiUrl}/service/v3?id=${id}`;
    const response = await fetch(service_url);

    // check if we got a 200 response
    if (response.status >= 300) {
        document.getElementById('loading')!.style.display = 'none';
        document.getElementById('loaded')!.style.display = 'none';
        document.getElementById('error')!.style.display = 'flex';
        return;
    }

    const data = await response.json();

    const name = data.name;
    const rating = data.rating;
    const points = data.points;

    // Store context for chat
    currentChatContext.serviceName = name;
    currentChatContext.grade = rating;
    currentChatContext.pointList = points.map((p: any) => ({
        classification: p.case?.classification || 'neutral',
        title: p.title
    }));

    const serviceNames = document.getElementsByClassName('serviceName');

    for (let i = 0; i < serviceNames.length; i++) {
        (serviceNames[i] as HTMLElement).innerText = name;
    }

    document.getElementById('title')!.innerText = name;
    if (rating) {
        document
            .getElementById('gradelabel')!
            .classList.add(rating.toLowerCase());
        themeHeaderColorIfEnabled(rating.toLowerCase());
        document.getElementById('grade')!.innerText = rating;
    } else {
        document.getElementById('grade')!.innerText = 'N/A';
    }
    document.getElementById('pointsCount')!.innerText =
        points.length.toString();

    document.getElementById('loading')!.style.opacity = '0';
    document.getElementById('loaded')!.style.filter = 'none';
    setTimeout(function () {
        document.getElementById('loading')!.style.display = 'none';
    }, 200);

    if (unverified) {
        document.getElementById('notreviewedShown')!.style.display = 'block';
    }

    populateList(points);
}

function populateList(points: any) {
    const pointsList = document.getElementById('pointList');

    if (!curatorMode) {
        points = points.filter((point: any) => point.status === 'approved');
    } else {
        points = points.filter(
            (point: any) =>
                point.status === 'approved' || point.status === 'pending'
        );
    }

    const blockerPoints = points.filter(
        (point: any) => point.case.classification === 'blocker'
    );
    const badPoints = points.filter(
        (point: any) => point.case.classification === 'bad'
    );
    const goodPoints = points.filter(
        (point: any) => point.case.classification === 'good'
    );
    const neutralPoints = points.filter(
        (point: any) => point.case.classification === 'neutral'
    );

    createPointList(blockerPoints, pointsList, false);
    createPointList(badPoints, pointsList, false);
    createPointList(goodPoints, pointsList, false);
    createPointList(neutralPoints, pointsList, true);
}

function curatorTag(pointStatus: string) {
    if (!curatorMode || pointStatus === 'approved') {
        return '';
    }
    return "<img src='icons/pending.svg'></img>";
}

function createPointList(pointsFiltered: any, pointsList: any, last: boolean) {
    var added = 0;
    for (let i = 0; i < pointsFiltered.length; i++) {
        const point = document.createElement('div');
        var temp = `
        <div class="point ${pointsFiltered[i].case.classification}">
            <img src="icons/${pointsFiltered[i].case.classification}.svg">
            <p>${pointsFiltered[i].title}</p>
            ${curatorTag(pointsFiltered[i].status)}
        </div>`;
        point.innerHTML = temp.trim();
        pointsList.appendChild(point.firstChild);
        added++;
        if (i !== pointsFiltered.length - 1) {
            const divider = document.createElement('hr');
            pointsList.appendChild(divider);
        }
    }
    if (added !== 0 && !last) {
        const divider = document.createElement('hr');
        divider.classList.add('group');
        pointsList.appendChild(divider);
    }
}

async function searchToSDR(term: string) {
    const service_url = `https://${apiUrl}/search/v5/?query=${term}`;
    const response = await fetch(service_url);

    if (response.status !== 200) {
        document.getElementById('loading')!.style.display = 'none';
        document.getElementById('loaded')!.style.display = 'none';
        document.getElementById('error')!.style.display = 'flex';
        return;
    }

    const data = await response.json();

    if (data.services.length !== 0) {
        const urls = data.services[0].urls as string[];
        for (let i = 0; i < urls.length; i++) {
            if (urls[i] === term) {
                return data.services[0].id;
            }
        }
    }
}

getServiceIDFromURL(window.location.href);

// Get settings
chrome.storage.local.get(['darkmode', 'curatorMode', 'api'], function (result) {
    if (result.darkmode) {
        const body = document.querySelector('body')!;
        body.classList.toggle('dark-mode');
    }

    if (result.curatorMode) {
        document.getElementById('curator')!.style.display = 'block';
        curatorMode = true;
    } else {
        document.getElementById('curator')!.style.display = 'none';
    }
});

// AI Button Integration

document.addEventListener('DOMContentLoaded', async () => {
    const toggleButton = document.getElementById('toggleButton');
    const settingsButton = document.getElementById('settingsButton');
    const sourceButton = document.getElementById('sourceButton');
    const donationButton = document.getElementById('donationButton');
    const source = document.getElementById('source');
    const opentosdr = document.getElementById('opentosdr');
    const aiButtons = document.querySelectorAll('.aibutton');
    //console.log('aiButtons:', aiButtons);
    if (toggleButton) {
        toggleButton.onclick = () => {
            const body = document.querySelector('body');
            if (body) {
                body.classList.toggle('dark-mode');
                const darkmode = body.classList.contains('dark-mode');
                chrome.storage.local.set({ darkmode });
            }
        };
    }

    if (settingsButton) {
        settingsButton.onclick = () => {
            chrome.runtime.openOptionsPage();
        };
    }

    if (sourceButton) {
        sourceButton.onclick = () => {
            window.open('https://github.com/jab442/Clause-For-Concern/');
        };
    }

    if (donationButton) {
        donationButton.onclick = () => {
            window.open('https://tosdr.org/en/sites/donate');
        };
    }

    if (source) {
        source.onclick = () => {
            window.open('https://github.com/jab442/Clause-For-Concern');
        };
    }

    if (opentosdr) {
        opentosdr.onclick = () => {
            window.open('https://tosdr.org/');
        };
    }

    if (aiButtons.length > 0) {
        // Display AI buttons - no API key required for server streaming
        aiButtons.forEach((button) => {
            (button as HTMLElement).style.display = 'flex';
        });
        
        aiButtons.forEach((button) => {
            button.addEventListener('click', async () => {
                const prompt = await chrome.storage.local.get(['aiPrompt']);
                
                chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
                    const activeTab = tabs[0];
                    if (activeTab && activeTab.url) {
                        const url = activeTab.url;
                        const urlObj = new URL(url);
                        const rootDomain = urlObj.hostname.replace(/^www\./, '');
                        
                        // Send message to background script to start streaming
                        chrome.runtime.sendMessage({
                            type: 'summarize_terms',
                            domain: rootDomain,
                            prompt
                        });
                        
                        const aiOverviews = document.querySelectorAll('.aiOverview');
                        aiOverviews.forEach((overview) => {
                            (overview as HTMLElement).style.display = 'block';
                            overview.innerHTML = 
                            `<h3>AI Overview for ${rootDomain}:</h3>
                            <div class="ai-loading-wrapper">                                           
                             <img
                                class="loadingIcon loadingIconBlack"
                                alt="Loading..."
                                src="icons/loading.svg"
                                />  <span> The AI is thinking... <span>
                            </div>

                            `;
                        });
                    }
                });
            });
        });
    }

    chrome.storage.onChanged.addListener((changes, namespace) => {
        for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
            if (key.startsWith('ai_summary_')) {
                const rootDomain = key.substring('ai_summary_'.length);
                const aiOverviews = document.querySelectorAll('.aiOverview');
                aiOverviews.forEach((overview) => {
                    (overview as HTMLElement).style.display = 'block';
                    overview.innerHTML = `<h3>AI Overview for ${rootDomain}:</h3><p>${newValue}</p>`;
                });
                // Store AI overview in chat context
                currentChatContext.aiOverview = newValue;
                // Scroll to show AI overview top
                const firstAiOverview = document.querySelector('.aiOverview');
                if (firstAiOverview) {
                    firstAiOverview.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
            
            // Handle chat responses
            if (key.startsWith('chat_response_')) {
                const chatMessages = document.getElementById('chatMessages');
                const loadingMessage = document.querySelector('.chat-message.loading');
                
                if (loadingMessage && newValue) {
                    loadingMessage.textContent = newValue.text || '';
                    loadingMessage.classList.remove('loading');
                    loadingMessage.classList.add('assistant');
                    
                    if (newValue.done) {
                        // Store assistant response in chat history
                        chatHistory.push({ role: 'assistant', content: newValue.text || '' });
                        
                        // Enable input after response is complete
                        const chatInput = document.getElementById('chatInput') as HTMLInputElement;
                        const chatSendButton = document.getElementById('chatSendButton') as HTMLButtonElement;
                        if (chatInput) {
                            chatInput.disabled = false;
                            chatInput.focus(); // Focus input for next question
                        }
                        if (chatSendButton) chatSendButton.disabled = false;
                        
                        // Scroll to bottom of chat
                        if (chatMessages) {
                            chatMessages.scrollTop = chatMessages.scrollHeight;
                        }
                    }
                }
            }
        }
    });
    
    // Chat functionality
    initializeChat();
});

// Store chat history for context
let chatHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];

function initializeChat(): void {
    const chatInput = document.getElementById('chatInput') as HTMLInputElement;
    const chatSendButton = document.getElementById('chatSendButton');
    const chatMessages = document.getElementById('chatMessages');
    const chatToggle = document.getElementById('chatToggle');
    const chatBody = document.getElementById('chatBody');
    const chatContainer = document.getElementById('chatContainer');
    
    if (!chatInput || !chatSendButton || !chatMessages) return;
    
    // Clear the placeholder content
    chatMessages.innerHTML = '';
    
    // Capture current URL for context
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.url) {
            currentChatContext.url = tabs[0].url;
        }
    });
    
    // Toggle collapse/expand
    if (chatToggle && chatBody && chatContainer) {
        chatToggle.addEventListener('click', () => {
            const isCollapsed = chatContainer.classList.toggle('collapsed');
            const toggleIcon = chatToggle.querySelector('.toggle-icon');
            if (toggleIcon) {
                toggleIcon.innerHTML = isCollapsed ? '&#9650;' : '&#9660;';
            }
            // Save collapsed state
            chrome.storage.local.set({ chatCollapsed: isCollapsed });
        });
        
        // Restore collapsed state
        chrome.storage.local.get(['chatCollapsed'], (result) => {
            if (result.chatCollapsed) {
                chatContainer.classList.add('collapsed');
                const toggleIcon = chatToggle.querySelector('.toggle-icon');
                if (toggleIcon) {
                    toggleIcon.innerHTML = '&#9650;';
                }
            }
        });
    }
    
    const sendMessage = async () => {
        const message = chatInput.value.trim();
        if (!message) return;
        
        // Add user message to chat
        addChatMessage(message, 'user');
        chatHistory.push({ role: 'user', content: message });
        chatInput.value = '';
        
        // Disable input while waiting for response
        chatInput.disabled = true;
        (chatSendButton as HTMLButtonElement).disabled = true;
        
        // Add loading message
        addChatMessage('Thinking...', 'loading');
        
        // Generate unique chat ID
        const chatId = Date.now().toString();
        
        // Send message to background script with chat history for context
        chrome.runtime.sendMessage({
            type: 'chat_message',
            message: message,
            context: {
                ...currentChatContext,
                chatHistory: chatHistory.slice(-10) // Include last 10 messages for context
            },
            chatId: chatId
        });
    };
    
    chatSendButton.addEventListener('click', sendMessage);
    
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}

function addChatMessage(text: string, type: 'user' | 'assistant' | 'loading'): void {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${type}`;
    messageDiv.textContent = text;
    chatMessages.appendChild(messageDiv);
    
    // Show chat messages container if hidden
    chatMessages.classList.add('has-messages');
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function ifFirefoxDesktopResize(): void {
    if (
        navigator.userAgent.includes('Firefox') &&
        !navigator.userAgent.includes('Mobile')
    ) {
        document.body.style.width = '350px';
    }
}

ifFirefoxDesktopResize();
