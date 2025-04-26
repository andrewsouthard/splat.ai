use ignore::WalkBuilder;
use serde::{Deserialize, Serialize};
use std::path::Path;
use tauri::{command, AppHandle, Runtime};
use walkdir::WalkDir;

#[derive(Debug, Serialize, Deserialize)]
pub struct FindOptions {
    path: String,
    name_pattern: Option<String>,
    respect_gitignore: bool,
    max_depth: Option<usize>,
    file_type: Option<String>, // "f" for files, "d" for directories
}

#[derive(Debug, Serialize)]
pub struct FindResult {
    path: String,
    is_dir: bool,
    size: u64,
}

#[command]
pub async fn find_files<R: Runtime>(
    _app: AppHandle<R>,
    options: FindOptions,
) -> Result<Vec<FindResult>, String> {
    let root = Path::new(&options.path);

    if !root.exists() {
        return Err(format!("Path '{}' does not exist", options.path));
    }

    let mut results = Vec::new();

    // Use the ignore crate if we need to respect .gitignore
    if options.respect_gitignore {
        let mut builder = WalkBuilder::new(root);

        if let Some(depth) = options.max_depth {
            builder.max_depth(Some(depth));
        }

        // Configure builder to respect .gitignore
        let walker = builder.standard_filters(true).build();

        for entry in walker {
            match entry {
                Ok(entry) => {
                    let path = entry.path();
                    let metadata = match std::fs::metadata(path) {
                        Ok(m) => m,
                        Err(_) => continue,
                    };

                    // Apply file type filter
                    if let Some(ref file_type) = options.file_type {
                        match file_type.as_str() {
                            "f" if !metadata.is_file() => continue,
                            "d" if !metadata.is_dir() => continue,
                            _ => {}
                        }
                    }

                    // Apply name pattern filter
                    if let Some(ref pattern) = options.name_pattern {
                        if let Some(file_name) = path.file_name() {
                            let name = file_name.to_string_lossy();
                            if !name.to_lowercase().contains(&pattern.to_lowercase()) {
                                continue;
                            }
                        }
                    }

                    results.push(FindResult {
                        path: path.to_string_lossy().to_string(),
                        is_dir: metadata.is_dir(),
                        size: metadata.len(),
                    });
                }
                Err(_) => continue,
            }
        }
    } else {
        // Use WalkDir for standard directory traversal
        let mut walker = WalkDir::new(root);

        if let Some(depth) = options.max_depth {
            walker = walker.max_depth(depth);
        }

        for entry in walker.into_iter().filter_map(Result::ok) {
            let path = entry.path();
            let metadata = match std::fs::metadata(path) {
                Ok(m) => m,
                Err(_) => continue,
            };

            // Apply file type filter
            if let Some(ref file_type) = options.file_type {
                match file_type.as_str() {
                    "f" if !metadata.is_file() => continue,
                    "d" if !metadata.is_dir() => continue,
                    _ => {}
                }
            }

            // Apply name pattern filter
            if let Some(ref pattern) = options.name_pattern {
                if let Some(file_name) = path.file_name() {
                    let name = file_name.to_string_lossy();
                    if !name.contains(pattern) {
                        continue;
                    }
                }
            }

            results.push(FindResult {
                path: path.to_string_lossy().to_string(),
                is_dir: metadata.is_dir(),
                size: metadata.len(),
            });
        }
    }

    Ok(results)
}
