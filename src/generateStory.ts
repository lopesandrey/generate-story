import fs from 'fs';
import path from 'path';
import { generateStorybookCode } from './ollamaClient.js';

export async function generateStory(componentPath: string) {
  if (!fs.existsSync(componentPath)) {
    console.error(`❌ Component not found at: ${componentPath}`);
    process.exit(1);
  }

  const componentCode = fs.readFileSync(componentPath, 'utf-8');
  const componentName = path.basename(componentPath).replace('.tsx', '');
  const storyPath = componentPath.replace('.tsx', '.stories.tsx');

  console.log(
    `⏳ Generating Storybook file for component: "${componentName}"...`
  );

  const prompt = `
  You are an experienced frontend developer specialized in React, TypeScript, and Storybook.
  
  Your job is to create a consistent, clean, and modern Storybook (.stories.tsx) file for the React component named "${componentName}" provided below.
  
  Strictly follow these guidelines:
  
  1. **File Structure and Imports:**
     - Always import React at the top.
     - Clearly import the component with a relative path.
     - Import types explicitly when needed.
     - Use modern Storybook syntax (version 7+):
       - Use Meta<typeof ${componentName}> and StoryObj<typeof ${componentName}> for strong typing and clarity.
  
  2. **Metadata:**
     - The 'title' property should clearly reflect the component's path inside Storybook, e.g., "Components/${componentName}".
     - Always include tags: ['autodocs'] to ensure documentation is auto-generated.
  
  3. **Stories Definition:**
     - Create at least one default story named 'Default', covering typical usage of the component.
     - Include one or two additional realistic variations if applicable (e.g., 'Disabled', 'Loading', etc.).
     - Avoid excessive or overly specific stories. Keep it clear, realistic, and useful.
  
  4. **Args and Props:**
     - Explicitly include component props in the args, using realistic default values.
     - Ensure args are correctly typed according to the provided component props.
  
  5. **Code Quality and Consistency:**
     - Generate only valid TypeScript code that compiles without errors.
     - Avoid broken JSX or syntax errors.
     - Clearly separate stories, metadata, and imports to maintain readability.

  **Output Format Instructions (STRICTLY FOLLOW):**
  - Return ONLY the raw TypeScript (.stories.tsx) code in plain text.
  - DO NOT add any Markdown syntax, such as triple backticks or language specification.
  - DO NOT write any explanatory or introductory text or comments.
  - Your response should start immediately with "import" and end with the export default statement.
  - No additional text before or after the code is permitted.

  Here is the React component "${componentName}" you will use to generate the Storybook file:
  
  ${componentCode}

  Now, output ONLY the plain TypeScript code for the .stories.tsx file as described.
`;

  const storyCode = await generateStorybookCode(prompt);
  fs.writeFileSync(storyPath, storyCode.trim());

  console.log(`✅ Storybook file successfully created: ${storyPath}`);
}
