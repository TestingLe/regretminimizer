// Regret Minimizer - AI-powered decision analysis
// Using Gemini API via apifree.ai

const API_KEY = 'sk-pFEPR6A37dSjeaG00CYZpMfsyMMCd';
const API_URL = 'https://api.apifree.ai/v1/chat/completions';

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

// Analyze decision using Gemini API
async function analyzeDecision(situation, options) {
    const optionsList = options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join('\n');
    
    const prompt = `You are an expert decision advisor using the Regret Minimization Framework (popularized by Jeff Bezos). 

A user is facing this decision:
"${situation}"

Their options are:
${optionsList}

Analyze each option through the lens of FUTURE REGRET - not what feels best now, but what they'll be most at peace with later. Consider:
- What would they regret NOT doing when they're 80?
- Which choice aligns with their authentic self?
- What are the long-term emotional consequences?
- Which option minimizes the "what if" feeling?

Respond in this exact JSON format (no markdown, just pure JSON):
{
    "recommendation": {
        "option": "The letter of the recommended option (A, B, or C)",
        "title": "The name of the recommended option",
        "reason": "A compelling 2-3 sentence explanation of why this minimizes future regret"
    },
    "analysis": [
        {
            "option": "A",
            "title": "Option name",
            "regretRisk": "low|medium|high",
            "regretPercentage": 25,
            "summary": "1-2 sentence analysis of regret potential",
            "pros": ["pro 1", "pro 2"],
            "cons": ["con 1", "con 2"]
        }
    ]
}

Important: regretPercentage should reflect likelihood of future regret (lower is better). Be thoughtful and nuanced.`;

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
            model: 'gemini-1.5-flash',
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 1500
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Failed to analyze decision. Please try again.');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
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
