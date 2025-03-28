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

/**
 * Attempts to auto-detect the props type from the default export of the component.
 */
export function autoDetectPropsInterface(
  sourceFile: SourceFile
): string | undefined {
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
 * If interfaceName is provided, it uses that file; otherwise, it auto-detects from the given file.
 */
export function extractDefaultMocks(
  filePath: string,
  interfaceName?: string
): Record<string, any> {
  // Create a ts-morph project using tsconfig.json
  const project = new Project({
    tsConfigFilePath: path.resolve('tsconfig.json'),
  });

  // Add the file (either the separate types file or the component file) to the project
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

  // For both interfaces and type aliases, get the underlying type and its properties.
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
