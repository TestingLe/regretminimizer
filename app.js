// Regret Minimizer - AI-powered decision analysis
// Using Puter.js for AI

// DOM Elements
const inputSection = document.getElementById('inputSection');
const loadingSection = document.getElementById('loadingSection');
const resultsSection = document.getElementById('resultsSection');
const decisionForm = document.getElementById('decisionForm');
const resultsContent = document.getElementById('resultsContent');
const newDecisionBtn = document.getElementById('newDecisionBtn');
const loadingTip = document.getElementById('loadingTip');
const submitBtn = document.getElementById('submitBtn');

// Loading tips that rotate during analysis
const loadingTips = [
    "Considering your future self's perspective",
    "Evaluating long-term consequences",
    "Analyzing potential regrets for each option",
    "Weighing emotional vs rational factors",
    "Thinking 10 years into the future",
    "Considering what you might regret NOT doing"
];

let tipInterval;

// Initialize the app
function init() {
    decisionForm.addEventListener('submit', handleSubmit);
    newDecisionBtn.addEventListener('click', resetToInput);

    // Add focus effects to optional option
    const option3 = document.getElementById('option3');
    option3.addEventListener('focus', () => {
        document.getElementById('option3Group').classList.add('active');
    });
}

// Handle form submission
async function handleSubmit(e) {
    e.preventDefault();

    const situation = document.getElementById('situation').value.trim();
    const option1 = document.getElementById('option1').value.trim();
    const option2 = document.getElementById('option2').value.trim();
    const option3 = document.getElementById('option3').value.trim();

    if (!situation || !option1 || !option2) {
        alert('Please fill in your decision and at least two options.');
        return;
    }

    const options = [option1, option2];
    if (option3) options.push(option3);

    // Show loading state
    showLoading();

    try {
        const analysis = await analyzeDecision(situation, options);
        showResults(analysis, options);
    } catch (error) {
        console.error('Analysis error:', error);
        showError(error.message);
    }
}

// Show loading state
function showLoading() {
    inputSection.style.display = 'none';
    loadingSection.style.display = 'block';
    resultsSection.style.display = 'none';

    // Rotate loading tips
    let tipIndex = 0;
    loadingTip.textContent = loadingTips[tipIndex];
    tipInterval = setInterval(() => {
        tipIndex = (tipIndex + 1) % loadingTips.length;
        loadingTip.style.opacity = '0';
        setTimeout(() => {
            loadingTip.textContent = loadingTips[tipIndex];
            loadingTip.style.opacity = '1';
        }, 200);
    }, 2500);
}

// Analyze decision using Puter.js AI
async function analyzeDecision(situation, options) {
    const optionsList = options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join('\n');

    const prompt = `You're a chill friend helping someone make a decision they won't regret. Use the Regret Minimization idea - imagine looking back at 80 years old.

Their situation:
"${situation}"

Options:
${optionsList}

Think about:
- What would they kick themselves for NOT trying?
- Which feels more "them"?
- What's the "what if" factor?

Be casual, warm, and real - like a friend giving honest advice. No corporate speak!

Reply in this exact JSON format (no markdown, just JSON):
{
    "recommendation": {
        "option": "A or B or C",
        "title": "the option name",
        "reason": "2-3 casual sentences explaining why - talk like a friend, not a robot"
    },
    "analysis": [
        {
            "option": "A",
            "title": "Option name",
            "regretRisk": "low|medium|high",
            "regretPercentage": 25,
            "summary": "1-2 casual sentences about regret potential",
            "pros": ["short friendly pro", "another pro"],
            "cons": ["honest con", "another con"]
        }
    ]
}

Keep it real and human. No fancy words. Return ONLY valid JSON.`;

    try {
        const response = await puter.ai.chat(prompt);
        console.log('Puter AI Response:', response);
        console.log('Response type:', typeof response);

        let content;

        // Puter.js returns different formats - handle all cases
        if (typeof response === 'string') {
            content = response;
        } else if (response && typeof response === 'object') {
            // Try different possible properties
            content = response.text ||
                response.message?.content ||
                response.message ||
                response.content ||
                response.result ||
                (response.choices && response.choices[0]?.message?.content) ||
                JSON.stringify(response);
            console.log('Extracted content:', content);
        }

        if (!content || typeof content !== 'string') {
            console.error('Could not extract string content from response');
            throw new Error('Invalid AI response format');
        }

        // Parse JSON from response (handle potential markdown wrapping)
        let jsonStr = content;
        if (content.includes('```')) {
            jsonStr = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
        }

        try {
            return JSON.parse(jsonStr);
        } catch (parseError) {
            console.error('Parse error:', parseError, 'Content:', content);
            throw new Error('Failed to parse AI response. Please try again.');
        }
    } catch (error) {
        console.error('Puter AI error:', error);
        throw new Error('AI analysis failed. Please try again.');
    }
}

// Show results
function showResults(analysis, options) {
    clearInterval(tipInterval);

    loadingSection.style.display = 'none';
    resultsSection.style.display = 'block';
    resultsSection.classList.add('fadeIn');

    const { recommendation, analysis: optionAnalysis } = analysis;

    let html = `
        <div class="recommendation-card">
            <div class="recommendation-label">
                <span class="icon">✨</span>
                Recommended Choice
            </div>
            <h3 class="recommendation-title">${recommendation.title}</h3>
            <p class="recommendation-reason">${recommendation.reason}</p>
        </div>
        
        <div class="options-analysis">
            <h4 class="options-analysis-title">Detailed Analysis</h4>
    `;

    optionAnalysis.forEach((opt, index) => {
        const isRecommended = opt.option === recommendation.option;
        const riskClass = opt.regretRisk.toLowerCase();

        html += `
            <div class="option-card ${isRecommended ? 'recommended' : ''}">
                <div class="option-header">
                    <span class="option-name">${opt.option}. ${opt.title}</span>
                    <div class="regret-score ${riskClass}">
                        <span>${opt.regretPercentage}% regret risk</span>
                        <div class="regret-bar">
                            <div class="regret-bar-fill ${riskClass}" style="width: ${opt.regretPercentage}%"></div>
                        </div>
                    </div>
                </div>
                <p class="option-analysis">${opt.summary}</p>
                <div class="pros-cons">
                    <div class="pros">
                        <div class="pros-cons-title">Reasons to choose</div>
                        <ul>
                            ${opt.pros.map(pro => `<li>${pro}</li>`).join('')}
                        </ul>
                    </div>
                    <div class="cons">
                        <div class="pros-cons-title">Potential regrets</div>
                        <ul>
                            ${opt.cons.map(con => `<li>${con}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    resultsContent.innerHTML = html;

    // Animate regret bars
    setTimeout(() => {
        document.querySelectorAll('.regret-bar-fill').forEach(bar => {
            bar.style.width = bar.style.width;
        });
    }, 100);
}

// Show error
function showError(message) {
    clearInterval(tipInterval);
    loadingSection.style.display = 'none';
    inputSection.style.display = 'block';

    alert(`Error: ${message}\n\nPlease try again.`);
}

// Reset to input state
function resetToInput() {
    resultsSection.style.display = 'none';
    resultsSection.classList.remove('fadeIn');
    inputSection.style.display = 'block';
    inputSection.classList.add('fadeIn');

    // Clear form
    decisionForm.reset();

    // Remove fadeIn class after animation
    setTimeout(() => {
        inputSection.classList.remove('fadeIn');
    }, 500);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
