import { ReviewClient } from "@/components/review-client";
import fs from "fs/promises";
import path from "path";

/**
 * Gets all files in the project, excluding specified directories
 * Uses Node.js built-in modules for cross-platform compatibility
 */
const getAllFilesFromGit = async () => {
  try {
    const ignoreDirs = [".git", ".next", "node_modules"];
    const files: string[] = [];
    
    // Recursive function to get all files
    const getFilesRecursively = async (dir: string): Promise<void> => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(".", fullPath);
        
        if (entry.isDirectory()) {
          // Skip ignored directories
          if (!ignoreDirs.some(ignoreDir => fullPath.includes(ignoreDir))) {
            await getFilesRecursively(fullPath);
          }
        } else {
          files.push(relativePath);
        }
      }
    };
    
    await getFilesRecursively(".");
    return { files };
  } catch (error) {
    console.error("Error listing files:", error);
    return { files: [], error: "Failed to list files" };
  }
};

/**
 * Gets the content of a selected file
 * Implements security checks to prevent path traversal
 */
async function getSelectedFile(filePath: string) {
  try {
    if (!filePath) {
      return { error: "File path is required" };
    }
    
    // Security: Normalize path and prevent directory traversal
    const normalizedPath = path.normalize(filePath);
    const projectRoot = process.cwd();
    const fullPath = path.resolve(projectRoot, normalizedPath);
    
    // Security: Ensure the requested file is within the project directory
    if (!fullPath.startsWith(projectRoot)) {
      return { error: "Invalid file path: Path traversal detected" };
    }
    
    // Read file content safely
    const content = await fs.readFile(fullPath, 'utf8');
    return { content };
  } catch (error: unknown) { // Using unknown instead of any
    console.error("Error fetching file content:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { error: `Failed to fetch file content: ${errorMessage}` };
  }
}

/**
 * Main Page Component
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ path: string }>;
}) {
  const { path: filePath } = await searchParams;
  const data = await getAllFilesFromGit();
  const selectedFile = filePath ? await getSelectedFile(filePath) : { content: undefined };

  return (
    <div className=''>
      <header className='flex justify-between items-center'>
        <h1 className='text-3xl font-bold'>Code Review AI Agent</h1>
      </header>

      <div className='page-container'>
        <h2 className='text-xl font-bold'>
          Hi! I&apos;m Code Review Agent, your personal code review AI agent.
        </h2>
        <p>
          I&apos;m here to help you review your code. I&apos;ll give you a
          detailed analysis of the code, including security vulnerabilities,
          code style, and performance optimizations.
        </p>
        <ReviewClient
          files={data?.files || []}
          selectedFile={selectedFile}
          file={filePath}
        />
      </div>
    </div>
  );
}
