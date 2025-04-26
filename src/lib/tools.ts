import { invoke } from "@tauri-apps/api/core";

abstract class SplatTool {
    abstract action: string; // value to show users in the chat when the tool is called
    abstract name: string;
    abstract description: string;
    abstract parameters: object;
    basePath: string

    constructor(path: string) {
        this.basePath = path;
    }
    usage() {
        return {
            "name": this.name,
            "description": this.description,
            "parameters": this.parameters,
        }
    }
    abstract use(input: GlobOptions | string): Promise<string[]>
}

interface GlobOptions {
    // path: String,
    // respectGitignore: boolean,
    namePattern?: string,
    maxDepth?: number,
    fileType?: "f" | "d", // "f" for files, "d" for directories
}

interface FilePath {
    path: string,
    is_dir: boolean,
    size: number
}

export class GlobTool extends SplatTool {
    action = "Using file search tool..."
    name = "GlobTool"
    description = `GlobTool finds files based on pattern matching.`;
    parameters = {
        "type": "object",
        "properties": {
            namePattern: {
                type: "string",
                description: "name of the file or directory"
            },
            fileType: {
                type: "string",
                description: "search for files (f), directories (d), or both (null)."
            }
        }
    }

    async use(input: GlobOptions) {
        console.log("using tool glob with", input)
        const options = {
            path: this.basePath,
            name_pattern: input.namePattern,
            respect_gitignore: true,
            max_depth: input.maxDepth ?? null,
            file_type: input.fileType // only files
        };

        console.log("find_files" + JSON.stringify(options))
        try {
            const files: FilePath[] = await invoke("find_files", { options });
            console.log("found....")
            console.log(files);
            return files.map(f => f.path.replace(this.basePath, "").replace(/^\//, ""))
        } catch (e) {
            console.error(e)
            return [];
        }
    }
}

// export class GrepTool extends SplatTool {
//     name = "GrepTool"
//     description = `GrepTool searches within files for a given string. Pass in arguments like you would to the "grep" command but
//    assume the directory will be specified automatically. For example, you could provide "-r resume", which would recursively search for
//     all files with the word "resume" in the directory. `
//     async use(input: string) {
//         const result = await Command.create('exec-sh', [
//             '-c',
//             `grep ${input} ${this.basePath}`,
//         ]).execute();
//         return result.stdout
//     }
// }

export function parseToolCall(response: any) {
    if (response?.tool_calls && response?.tool_calls.length > 0) {
        return response.tool_calls;
    } else if (response?.message?.content) {
        try {
            const res = JSON.parse(response.message.content)
            return res;
        } catch (e) {
            return null
        }
    }
}