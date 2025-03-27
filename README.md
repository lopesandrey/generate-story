# Generate Story CLI

Generate Story CLI automatically generates Storybook (.stories.tsx) files for React components using a local Ollama LLM. This tool is designed to simplify component documentation and development by providing a standardized, modern Storybook file for each component.

---

## Setup

Follow these steps to configure your environment on a Mac:

1. **Clone or Download the Repository:**

   ```bash
   git clone <repository-url>
   cd generate-story
   ```

2. **Run the Installation Script:**

   Execute the following command to install Node dependencies, build the project, and configure the CLI:

   ```bash
   ./install.sh
   ```

   The script performs the following actions:

   - Fixes permissions for necessary files.
   - Installs Node dependencies and compiles the TypeScript project.
   - _[Optional]_ If using a global CLI, it sets up the environment using `npm link`. (For NPX usage, this step is skipped.)
   - Checks if Ollama is installed and, if not, installs it automatically.
   - Pulls the `codellama:7b-instruct` model for use by the LLM.
   - Prepares the system to generate Storybook files.

> **Note:** If you do not want to configure global permissions or if you encounter issues, you can use the CLI via NPX instead.

---

## Usage

### Running via Global CLI

After installation, you can generate Storybook files from any directory. For example:

```bash
generate-story src/components/YourComponent.tsx
```

### Running via NPX (No Global Installation Needed)

If you prefer not to install the CLI globally, you can run it directly using NPX:

```bash
npx generate-story src/components/YourComponent.tsx
```

**How It Works:**

- When you execute the command, the tool automatically starts the Ollama server to perform code generation.
- It generates a Storybook file based on your component.
- It then stops the Ollama server after completion, ensuring no processes remain running in the background.

---

## Important: Variations in AI-Generated Output

Because Generate Story CLI leverages an AI model (LLM) to generate code, **the results may vary between executions** even for the same component. Please keep the following in mind:

- **Inconsistent Outputs:**  
  The LLM may produce slightly different versions of the `.stories.tsx` file on different runs. This variation is inherent to the model's nature.

- **Review and Adjust:**  
  Although the prompt is designed for consistency, it is recommended to review the generated file to ensure it meets your requirements and that all props and types are correct.

- **Customization:**  
  If you require more consistent results, consider refining the prompt in the `src/generateStory.ts` file to better suit your specific project needs.

- **Feedback Loop:**  
  Regularly test the tool with different components and provide feedback for further improvements to reduce unwanted variations.

---

## Troubleshooting & Support

- If you encounter permission issues, refer to the installation instructions or use the NPX method.
- For any problems or feature requests, please open an issue or submit a pull request.

---

## License

This project is licensed under the [MIT License](LICENSE).
