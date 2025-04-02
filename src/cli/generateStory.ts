import fs from 'fs';
import path from 'path';
import { generateStorybookCode } from '../services/ollamaClient.js';
import { getPropsInfoFromUser } from '../prompts/userPrompt.js';
import { extractDefaultMocks } from '../core/propsExtractor.js';

export async function generateStory(componentPath: string) {
  if (!fs.existsSync(componentPath)) {
    console.error(`❌ Component not found at: ${componentPath}`);
    process.exit(1);
  }

  const componentCode = fs.readFileSync(componentPath, 'utf-8');
  const componentName = path.basename(componentPath).replace('.tsx', '');
  const storyPath = componentPath.replace('.tsx', '.stories.tsx');

  // Ask the user if the props type is defined in a separate file
  const propsInfo = await getPropsInfoFromUser();
  let defaultMocks: Record<string, any>;
  if (propsInfo) {
    // Use the provided file path and interface name to extract mocks
    defaultMocks = extractDefaultMocks(
      propsInfo.filePath ? propsInfo.filePath : componentPath,
      propsInfo.interfaceName
    );
  } else {
    // Auto-detect from the component file
    defaultMocks = extractDefaultMocks(componentPath);
  }

  const mocksText = JSON.stringify(defaultMocks, null, 2);

  const prompt = `
    You are a professional frontend developer expert in React, TypeScript, and Storybook.

    Generate a .stories.tsx file for the React component "${componentName}" using the code provided below. 

    🧩 IMPORTS:
    - Import React explicitly.
    - Import the component with a relative path.
    - Import types where needed.
    - Use Storybook 7+ syntax: Meta<typeof ${componentName}> and StoryObj<typeof ${componentName}>.

    📚 METADATA:
    - Set "title" as "Components/${componentName}".
    - Include "tags: ['autodocs']".

    📌 STORIES:
    - Create a "Default" story using typical usage.
    - Add 1 or 2 realistic variations (e.g., 'Disabled', 'Loading') if applicable.
    - Keep stories clean and practical.

    🧪 ARGS:
    - Set props using the following mock values:

    ${mocksText}

    - Ensure all args are typed correctly.

    ✅ CODE QUALITY:
    - Output valid TypeScript code only.
    - No syntax or JSX errors.
    - Separate imports, metadata, and stories clearly.

    🚨 OUTPUT FORMAT (STRICT RULES):
    - Return ONLY the raw TypeScript (.stories.tsx) code.
    - DO NOT use Markdown syntax (no triple backticks or language blocks).
    - DO NOT write explanations or comments.
    - Start with "import" and end with the "export default" line.
    - Output must be plain TypeScript.

    🔽 COMPONENT CODE:
    ${componentCode}

    Now return the .stories.tsx content based on the above.
`;

  console.log(
    `⏳ Generating Storybook file for component: "${componentName}"...`
  );

  const storyCode = await generateStorybookCode(prompt);
  fs.writeFileSync(storyPath, storyCode.trim());

  console.log(`✅ Storybook file successfully created: ${storyPath}`);
}
