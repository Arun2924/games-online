"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.questionBank = void 0;
exports.getRandomQuestions = getRandomQuestions;
exports.questionBank = [
    // General Knowledge
    {
        question: "Which of the following is the longest river in the world?",
        choices: ["Amazon River", "Nile River", "Yangtze River", "Mississippi River"],
        correctIndex: 1,
        category: "General Knowledge",
        difficulty: "Medium"
    },
    {
        question: "What is the capital of Japan?",
        choices: ["Seoul", "Beijing", "Tokyo", "Bangkok"],
        correctIndex: 2,
        category: "General Knowledge",
        difficulty: "Easy"
    },
    // Science
    {
        question: "What is the chemical symbol for Gold?",
        choices: ["Ag", "Au", "Fe", "Cu"],
        correctIndex: 1,
        category: "Science",
        difficulty: "Easy"
    },
    {
        question: "Which planet is known as the Red Planet?",
        choices: ["Earth", "Mars", "Venus", "Jupiter"],
        correctIndex: 1,
        category: "Science",
        difficulty: "Easy"
    },
    {
        question: "What is the hardest natural substance on Earth?",
        choices: ["Gold", "Iron", "Diamond", "Quartz"],
        correctIndex: 2,
        category: "Science",
        difficulty: "Easy"
    },
    // Technology
    {
        question: "What does HTTP stand for?",
        choices: ["HyperText Transfer Protocol", "HyperText Transmission Process", "Hyperlink Transfer Technology", "HyperText Test Program"],
        correctIndex: 0,
        category: "Technology",
        difficulty: "Medium"
    },
    {
        question: "Which company developed the React JavaScript library?",
        choices: ["Google", "Microsoft", "Facebook (Meta)", "Apple"],
        correctIndex: 2,
        category: "Technology",
        difficulty: "Medium"
    },
    // Geography
    {
        question: "Which continent is the largest by land area?",
        choices: ["Africa", "North America", "Asia", "Antarctica"],
        correctIndex: 2,
        category: "Geography",
        difficulty: "Easy"
    },
    {
        question: "In which country is the Taj Mahal located?",
        choices: ["India", "Pakistan", "Bangladesh", "Nepal"],
        correctIndex: 0,
        category: "Geography",
        difficulty: "Easy"
    },
    // Animals
    {
        question: "What is the fastest land animal?",
        choices: ["Lion", "Cheetah", "Horse", "Leopard"],
        correctIndex: 1,
        category: "Animals",
        difficulty: "Easy"
    },
    {
        question: "Which mammal is capable of true flight?",
        choices: ["Flying Squirrel", "Bat", "Lemur", "Sugar Glider"],
        correctIndex: 1,
        category: "Animals",
        difficulty: "Medium"
    },
    // Sports
    {
        question: "How many players are on a standard soccer team on the field?",
        choices: ["9", "10", "11", "12"],
        correctIndex: 2,
        category: "Sports",
        difficulty: "Easy"
    },
    // Movies
    {
        question: "Who directed the movie 'Inception'?",
        choices: ["Steven Spielberg", "Christopher Nolan", "Quentin Tarantino", "James Cameron"],
        correctIndex: 1,
        category: "Movies",
        difficulty: "Medium"
    },
    // History
    {
        question: "In what year did the Titanic sink?",
        choices: ["1905", "1912", "1918", "1923"],
        correctIndex: 1,
        category: "History",
        difficulty: "Hard"
    },
    {
        question: "Who was the first President of the United States?",
        choices: ["Thomas Jefferson", "John Adams", "Abraham Lincoln", "George Washington"],
        correctIndex: 3,
        category: "History",
        difficulty: "Easy"
    }
];
function getRandomQuestions(count) {
    const shuffled = [...exports.questionBank].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}
