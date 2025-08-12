interface CookingQuestion {
    keywords: string[];
    response: string;
}

const COOKING_QUESTIONS: CookingQuestion[] = [
    {
        keywords: ['temperature', 'temp', 'degrees', 'fahrenheit', 'celsius'],
        response: "For most baking, 350°F (175°C) is a good starting temperature. For meats, use a food thermometer: chicken should reach 165°F (74°C), beef 145°F (63°C) for medium-rare, and fish 145°F (63°C)."
    },
    {
        keywords: ['time', 'how long', 'duration', 'minutes', 'hours'],
        response: "Cooking times vary by recipe and ingredient size. As a general rule: vegetables take 5-15 minutes, chicken breasts 20-30 minutes, and roasts 20 minutes per pound plus 20 minutes. Always check for doneness!"
    },
    {
        keywords: ['substitute', 'replacement', 'instead of', 'alternative'],
        response: "Common substitutions: buttermilk = milk + lemon juice, baking powder = baking soda + cream of tartar, eggs = flax seeds + water, butter = oil or applesauce. Check online for specific ratios!"
    },
    {
        keywords: ['seasoning', 'spice', 'herb', 'flavor', 'taste'],
        response: "Start with salt and pepper, then add herbs like basil, oregano, or thyme. For heat, try cayenne or chili powder. Remember: you can always add more, but you can't take it out!"
    },
    {
        keywords: ['burn', 'burnt', 'overcook', 'crispy', 'brown'],
        response: "If food is burning, reduce heat and add liquid. For browning, use medium-high heat and don't overcrowd the pan. Burnt food can't be saved, so watch carefully!"
    },
    {
        keywords: ['undercook', 'raw', 'pink', 'soft', 'doughy'],
        response: "Undercooked food can be dangerous. Meats should reach safe internal temperatures. For baked goods, insert a toothpick - it should come out clean. When in doubt, cook a bit longer!"
    },
    {
        keywords: ['measure', 'cup', 'tablespoon', 'teaspoon', 'ounces'],
        response: "Use proper measuring tools: liquid measuring cups for liquids, dry measuring cups for dry ingredients. Level off dry ingredients with a straight edge. 1 cup = 16 tablespoons = 48 teaspoons."
    },
    {
        keywords: ['preheat', 'oven', 'heat', 'warm'],
        response: "Always preheat your oven for 10-15 minutes before baking. This ensures even cooking and proper rise. Don't put food in until the oven reaches the right temperature!"
    },
    {
        keywords: ['grease', 'oil', 'butter', 'spray', 'pan'],
        response: "Grease pans with butter, oil, or cooking spray to prevent sticking. For baking, you can also use parchment paper. Make sure to cover all surfaces evenly!"
    },
    {
        keywords: ['rest', 'sit', 'wait', 'cool', 'settle'],
        response: "Let meat rest for 5-10 minutes after cooking to redistribute juices. Let baked goods cool for 10-15 minutes before cutting. This improves texture and flavor!"
    }
];

export interface NogginResponse {
    response: string;
    stepChange?: number; // +1, -1, 0, +2, etc.
}

export interface RecipeContext {
    recipeTitle: string;
    currentStep: number;
    totalSteps: number;
    steps: Array<{
        index: number;
        content: string;
        rowNumber: number;
        time: number;
    }>;
}

export class AIService {
    private questions: CookingQuestion[];
    private nogginUrl: string;
    private nogginToken: string;

    constructor() {
        this.questions = COOKING_QUESTIONS;
        this.nogginUrl = 'https://noggin.rea.gent/extra-snail-7006';
        this.nogginToken = 'rg_v1_gjkt17b9hkufv88oqw5443wcya6qbmtqs7kt_ngk';
    }

    async processQuestion(userInput: string, recipeContext?: RecipeContext): Promise<NogginResponse> {
        const input = userInput.toLowerCase();

        // Check for step navigation commands first
        if (input.includes('skip to next step') || input.includes('next step')) {
            const stepCount = this.extractStepCount(input);
            return {
                response: `Moving forward ${stepCount} step(s).`,
                stepChange: stepCount
            };
        }

        if (input.includes('go back') || input.includes('previous step') || input.includes('go back step')) {
            const stepCount = this.extractStepCount(input);
            return {
                response: `Moving back ${stepCount} step(s).`,
                stepChange: -stepCount
            };
        }

        // Check for specific step jumps
        if (input.includes('first step') || input.includes('start') || input.includes('beginning')) {
            if (recipeContext) {
                const stepChange = -recipeContext.currentStep;
                return {
                    response: `Jumping to first step.`,
                    stepChange: stepChange
                };
            }
        }

        if (input.includes('last step') || input.includes('end') || input.includes('final')) {
            if (recipeContext) {
                const stepChange = (recipeContext.totalSteps - 1) - recipeContext.currentStep;
                return {
                    response: `Jumping to last step.`,
                    stepChange: stepChange
                };
            }
        }

        // Check for specific row numbers
        const rowMatch = input.match(/(?:go to|jump to|step|row)\s*(\d+)/i);
        if (rowMatch && recipeContext) {
            const targetRow = parseInt(rowMatch[1]) - 1; // Convert to 0-based index
            const stepChange = targetRow - recipeContext.currentStep;
            return {
                response: `Jumping to step ${targetRow + 1}.`,
                stepChange: stepChange
            };
        }

        // Try to get response from Noggin
        try {
            const nogginResponse = await this.callNoggin(userInput, recipeContext);
            return nogginResponse;
        } catch (error) {
            console.warn('Noggin call failed, falling back to local responses:', error);
            return this.getLocalResponse(input);
        }
    }

    private async callNoggin(userInput: string, recipeContext?: RecipeContext): Promise<NogginResponse> {
        // Format recipe details for Noggin
        let recipeDetails = '';
        if (recipeContext) {
            recipeDetails = `Recipe: ${recipeContext.recipeTitle}\nCurrent step: ${recipeContext.currentStep + 1}\nTotal steps: ${recipeContext.totalSteps}\n\nSteps:\n${recipeContext.steps.map((step, index) => `Row ${step.rowNumber}: ${step.content}`).join('\n')}`;
        }

        const response = await fetch(this.nogginUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.nogginToken}`,
            },
            body: JSON.stringify({
                userprompt: userInput,
                recipedetail: recipeDetails,
                currentstep: recipeContext ? recipeContext.currentStep + 1 : 1,
            }),
        });

        if (!response.ok) {
            throw new Error(`Noggin API error: ${response.status}`);
        }

        const responseText = await response.text();

        // Parse the response to extract step change information
        const stepChange = this.extractStepChangeFromResponse(responseText);

        return {
            response: responseText,
            stepChange: stepChange
        };
    }

    private extractStepCount(input: string): number {
        // Extract number from phrases like "skip 2 steps", "go back 1 step", etc.
        const match = input.match(/(\d+)/);
        return match ? parseInt(match[1]) : 1;
    }

    private extractStepChangeFromResponse(response: string): number {
        // Look for patterns like +1, -1, +2, -2, 0 in the response
        const stepMatch = response.match(/[+-]?\d+/);
        if (stepMatch) {
            return parseInt(stepMatch[0]);
        }

        // Check for text-based step change indicators
        if (response.toLowerCase().includes('skip') || response.toLowerCase().includes('next')) {
            return 1;
        }
        if (response.toLowerCase().includes('back') || response.toLowerCase().includes('previous')) {
            return -1;
        }
        if (response.toLowerCase().includes('stay') || response.toLowerCase().includes('current')) {
            return 0;
        }

        return 0; // No step change by default
    }

    private getLocalResponse(input: string): NogginResponse {
        // Find the best matching question
        let bestMatch: CookingQuestion | null = null;
        let bestScore = 0;

        for (const question of this.questions) {
            let score = 0;
            for (const keyword of question.keywords) {
                if (input.includes(keyword)) {
                    score += 1;
                }
            }
            if (score > bestScore) {
                bestScore = score;
                bestMatch = question;
            }
        }

        if (bestMatch && bestScore > 0) {
            return { response: bestMatch.response };
        }

        // Default responses for common cooking questions
        if (input.includes('help') || input.includes('what') || input.includes('how')) {
            return { response: "I'm here to help with cooking questions! Ask me about temperatures, timing, substitutions, seasoning, or any cooking technique. What would you like to know?" };
        }

        if (input.includes('thank')) {
            return { response: "You're welcome! Happy cooking!" };
        }

        return { response: "I'm not sure about that specific cooking question. Try asking about temperatures, timing, substitutions, or cooking techniques. What would you like to know?" };
    }

    addCustomQuestion(keywords: string[], response: string) {
        this.questions.push({ keywords, response });
    }
} 