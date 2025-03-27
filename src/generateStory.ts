import {
  Project,
  SourceFile,
  InterfaceDeclaration,
  TypeAliasDeclaration,
  Symbol as TsSymbol,
  FunctionDeclaration,
  ArrowFunction,
} from 'ts-morph';
import fs from 'fs';
import path from 'path';
import { generateStorybookCode } from './ollamaClient.js';
import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';

/**
 * Prompts the user to determine if the props type is defined in a separate file.
 */
async function getPropsInfoFromUser(): Promise<{
  filePath: string;
  interfaceName: string;
}> {
  const rl = readline.createInterface({ input, output });
  const answer = await rl.question(
    'Is the interface or type of the component in a separate file? (Y/N): '
  );
  let filePath: string;
  if (answer.trim().toLowerCase() === 'y') {
    filePath = await rl.question('Please enter the path of the file: ');
  } else {
    // If not separate, we'll use the component file for props extraction.
    // Indicate this by returning an empty string; the main function can interpret this as "use the component file."
    filePath = '';
  }
  const interfaceName = await rl.question(
    'Enter the name of the interface or type of the props: '
  );
  rl.close();
  return { filePath, interfaceName };
}

/**
 * Tries to auto-detect the props type from the component file.
 * It looks for the default export's first parameter type if available.
 */
function autoDetectPropsInterface(sourceFile: SourceFile): string | undefined {
  const defaultExportSymbol = sourceFile.getDefaultExportSymbol();
  if (defaultExportSymbol) {
    const declarations = defaultExportSymbol.getDeclarations();
    for (const decl of declarations) {
      if (decl.getKindName() === 'FunctionDeclaration') {
        const fnDecl = decl as FunctionDeclaration;
        const params = fnDecl.getParameters();
        if (params.length > 0) {
          return params[0].getType().getText();
        }
      } else if (decl.getKindName() === 'ArrowFunction') {
        const arrowFn = decl as ArrowFunction;
        const params = arrowFn.getParameters();
        if (params.length > 0) {
          return params[0].getType().getText();
        }
      }
    }
  }
  return undefined;
}

/**
 * Extracts default mock values from the props type.
 * If interfaceName is provided, it uses that file; otherwise, it auto-detects from the component file.
 */
function extractDefaultMocks(
  filePath: string,
  interfaceName?: string
): Record<string, any> {
  // Create a ts-morph project using your tsconfig.json
  const project = new Project({
    tsConfigFilePath: path.resolve('tsconfig.json'),
  });

  // Add the file (can be the component file or a separate type file) to the project
  const sourceFile = project.addSourceFileAtPath(filePath);

  let decl;
  if (interfaceName) {
    decl =
      sourceFile.getInterface(interfaceName) ||
      sourceFile.getTypeAlias(interfaceName);
  } else {
    const autoTypeText = autoDetectPropsInterface(sourceFile);
    if (autoTypeText) {
      decl =
        sourceFile.getInterface(autoTypeText) ||
        sourceFile.getTypeAlias(autoTypeText);
      if (!decl) {
        console.warn(
          `Auto-detected props type "${autoTypeText}" not found as an interface or type alias.`
        );
        return {};
      }
    } else {
      console.warn('Could not auto-detect props type from the component.');
      return {};
    }
  }

  if (!decl) {
    console.warn(`Interface or type "${interfaceName}" not found.`);
    return {};
  }

  // For both interfaces and type aliases, get the underlying type and then its properties.
  let properties: TsSymbol[] = [];
  if (decl.getKindName() === 'InterfaceDeclaration') {
    properties = (decl as InterfaceDeclaration).getType().getProperties();
  } else if (decl.getKindName() === 'TypeAliasDeclaration') {
    properties = (decl as TypeAliasDeclaration).getType().getProperties();
  }

  const mockData: Record<string, any> = {};
  properties.forEach((prop) => {
    const name = prop.getName();
    const typeText = prop.getTypeAtLocation(sourceFile).getText();

    if (typeText === 'string') {
      mockData[name] = 'Sample text';
    } else if (typeText === 'number') {
      mockData[name] = 0;
    } else if (typeText === 'boolean') {
      mockData[name] = false;
    } else if (typeText.includes('React.ReactNode')) {
      mockData[name] = 'Sample node';
    } else {
      mockData[name] = null;
    }
  });

  return mockData;
}

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
     - Use the following default mock values for the component props:
  
  ${mocksText}
  
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
