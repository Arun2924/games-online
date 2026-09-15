export const WORDS = {
  Animals: [
    'cat', 'dog', 'elephant', 'lion', 'penguin', 'giraffe', 'zebra',
    'tiger', 'bear', 'rabbit', 'snake', 'monkey', 'shark', 'whale', 'dolphin',
    'turtle', 'frog', 'spider', 'butterfly', 'bee'
  ],
  Food: [
    'pizza', 'burger', 'apple', 'banana', 'orange', 'grapes', 'strawberry',
    'watermelon', 'cake', 'ice cream', 'chocolate', 'bread', 'cheese', 'egg',
    'pancake', 'hot dog', 'taco', 'sushi', 'donut', 'cookie'
  ],
  Objects: [
    'chair', 'table', 'bed', 'sofa', 'lamp', 'clock', 'computer', 'phone',
    'television', 'book', 'pen', 'pencil', 'scissors', 'knife', 'fork', 'spoon',
    'plate', 'cup', 'bottle', 'box'
  ],
  Vehicles: [
    'car', 'bus', 'train', 'airplane', 'helicopter', 'boat', 'ship', 'submarine',
    'bicycle', 'motorcycle', 'scooter', 'skateboard', 'tractor', 'truck', 'van'
  ],
  Nature: [
    'tree', 'flower', 'grass', 'leaf', 'sun', 'moon', 'star', 'cloud', 'rain',
    'snow', 'mountain', 'river', 'lake', 'ocean', 'beach', 'volcano', 'island'
  ],
  Sports: [
    'soccer', 'basketball', 'baseball', 'tennis', 'volleyball', 'golf', 'swimming',
    'boxing', 'wrestling', 'karate', 'skiing', 'snowboarding', 'surfing', 'skating'
  ],
  Places: [
    'house', 'school', 'hospital', 'park', 'library', 'museum', 'bank', 'restaurant',
    'supermarket', 'cinema', 'gym', 'pool', 'beach', 'forest', 'desert'
  ],
  Actions: [
    'running', 'jumping', 'swimming', 'sleeping', 'eating', 'drinking', 'reading',
    'writing', 'singing', 'dancing', 'crying', 'laughing', 'smiling', 'frowning'
  ],
  Technology: [
    'computer', 'phone', 'tablet', 'laptop', 'keyboard', 'mouse', 'monitor', 'printer',
    'camera', 'headphones', 'microphone', 'speaker', 'television', 'radio', 'watch'
  ],
  FunnyRandom: [
    'alien', 'zombie', 'ghost', 'vampire', 'werewolf', 'dragon', 'unicorn', 'mermaid',
    'robot', 'ninja', 'pirate', 'clown', 'superhero', 'monster', 'dinosaur'
  ]
};

export function getRandomWord(): string {
  const categories = Object.keys(WORDS) as (keyof typeof WORDS)[];
  const category = categories[Math.floor(Math.random() * categories.length)];
  const words = WORDS[category];
  return words[Math.floor(Math.random() * words.length)];
}
