import os
import re

def refactor_controller(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'IStorageService' in content:
        return # Already refactored

    # Inject IStorageService
    content = re.sub(r'public class (\w+Controller)\s*:\s*ControllerBase\s*{', r'public class \1 : ControllerBase\n{\n    private readonly Backend.Services.IStorageService _storage;', content)
    
    # Update constructor
    content = re.sub(r'public (\w+Controller)\(([^)]*)\)\s*{', r'public \1(\2, Backend.Services.IStorageService storage)\n    {\n        _storage = storage;', content)

    # Note: A full regex replace for FileStream and System.IO.File is too complex and brittle.
    # I will just write a few targeted replacements for ProfileController specifically.
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

# We will just do manual replace_file_content for ProfileController to keep it safe.
