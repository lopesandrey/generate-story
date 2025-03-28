import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';

export async function getPropsInfoFromUser(): Promise<{
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
    // Use the component file for props extraction if not separate.
    filePath = '';
  }
  const interfaceName = await rl.question(
    'Enter the name of the interface or type of the props: '
  );
  rl.close();
  return { filePath, interfaceName };
}
