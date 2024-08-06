let currentQuestion = 0;
let answers = [];

const questionContainer = document.getElementById('question-container');
const resultContainer = document.getElementById('result-container');

function displayQuestion() {
    if (currentQuestion < questions.length) {
        const question = questions[currentQuestion];
        questionContainer.innerHTML = `
            <h2>질문 ${currentQuestion + 1}</h2>
            <p>${question.text}</p>
            <button onclick="answerQuestion(3)">항상 그렇다</button>
            <button onclick="answerQuestion(2)">자주 그렇다</button>
            <button onclick="answerQuestion(1)">가끔 그렇다</button>
            <button onclick="answerQuestion(0)">전혀 그렇지 않다</button>
        `;
    } else {
        calculateResult();
    }
}

function answerQuestion(score) {
    answers.push({ question: currentQuestion, score: score });
    currentQuestion++;
    if (currentQuestion < questions.length) {
        displayQuestion();
    } else {
        calculateResult();
    }
}

async function getGeminiAdvice(maxType, minType) {
    const API_KEY = 'AIzaSyASPd5qXjOJk9w8H8DksyaWyKlKfw1SBFI'; // Gemini API 키를 여기에 입력하세요
    const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

    const prompt = `당신은 심리 상담가입니다. 교류분석(TA) 진단 결과를 바탕으로 조언을 해주세요. 
    다음은 각 에너지 유형에 대한 설명입니다:

    CP (Critical Parent): 비판적이고 엄격한 부모의 역할
    NP (Nurturing Parent): 양육적이고 지지적인 부모의 역할
    A (Adult): 객관적이고 이성적인 성인의 역할
    FC (Free Child): 자유롭고 창의적인 어린이의 역할
    AC (Adapted Child): 순응적이고 적응적인 어린이의 역할

    가장 높은 에너지 유형은 ${maxType}이고, 가장 낮은 에너지 유형은 ${minType}입니다. 
    다음 형식으로 응답해주세요:
    
    1. 가장 많이 사용하는 에너지 유형 (${maxType}) 설명:
    (설명을 여기에 작성)
    
    2. 가장 사용하지 않는 에너지라서 발생하는 이슈 (${minType}) 설명:
    (설명을 여기에 작성)
    
    3. 개인의 성장을 위한 조언:
    - (조언 1)
    - (조언 2)
    - (조언 3)
    
    4. 대인 관계 개선을 위한 조언:
    - (조언 1)
    - (조언 2)
    - (조언 3)
    
    5. 목표 설정과 성취:
    - (목표 설정 방법)
    - (성취 전략)
    
    각 섹션을 명확히 구분하고, 구체적이고 실행 가능한 조언을 제공해주세요. 별표(*) 사용을 피해주세요.`;

    try {
        const response = await fetch(`${API_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!response.ok) {
            throw new Error('API 요청 실패');
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error('Gemini API 오류:', error);
        return '조언을 생성하는 중 오류가 발생했습니다.';
    }
}


async function calculateResult() {
    const energyTypes = { CP: 0, NP: 0, A: 0, FC: 0, AC: 0 };
    
    answers.forEach((answer, index) => {
        energyTypes[questions[index].type] += answer.score;
    });

    const labels = Object.keys(energyTypes);
    const data = Object.values(energyTypes);

    const maxType = labels[data.indexOf(Math.max(...data))];
    const minType = labels[data.indexOf(Math.min(...data))];

    questionContainer.style.display = 'none';
    resultContainer.style.display = 'block';
    resultContainer.innerHTML = `
        <h2>진단 결과</h2>
        <p style="font-size: 21px;">가장 많이 사용하는 에너지는 ${maxType}이고, 가장 사용하지 않는 에너지는 ${minType}입니다.</p>
        <div style="height: 300px;">
            <canvas id="resultChart"></canvas>
        </div>
        <div id="advice">추가 분석 중...</div>
    `;

    const ctx = document.getElementById('resultChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1,
                pointBackgroundColor: 'rgb(75, 192, 192)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgb(75, 192, 192)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            aspectRatio: 1,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: Math.max(...data) + 5,
                    ticks: {
                        font: {
                            size: 14,
                            family: "'Pretendard', sans-serif"
                        }
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: 14,
                            family: "'Pretendard', sans-serif"
                        }
                    }
                }
            },
            elements: {
                line: {
                    borderWidth: 3
                },
                point: {
                    radius: 6,
                    hitRadius: 10,
                    hoverRadius: 8
                }
            }
        }
    });
    const advice = await getGeminiAdvice(maxType, minType);
    const formattedAdvice = advice.replace(/\n/g, '<br>').replace(/\(|\)/g, '').replace(/\*\*/g, '');
    document.getElementById('advice').innerHTML = `
        <h3>추가 분석 결과</h3>
        <div class="advice-content" style="word-break: keep-all; overflow-wrap: break-word;">
            ${formattedAdvice}
        </div>
    `;
}

displayQuestion();