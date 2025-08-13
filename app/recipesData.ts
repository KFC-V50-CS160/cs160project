// This file stores recipe data for use in the cooking page and other components.
// Each recipe has a title and an array of instructions.

export type Recipe = {
  title: string;
  instructions: string[];
};

export const recipes: Recipe[] = [
  {
    title: "Classic Cake",
    instructions: [
      "Preheat the oven to 350°F (175°C).",
  "Mix flour and sugar in a bowl.",
      "Add eggs and whisk until smooth.",
      "Pour batter into a greased pan.",
      "Bake for 30 minutes.",
      "Let cool before serving."
    ]
  },
  // Add more recipes here as needed
];
