import re, os, uuid

def secure_filename(filename: str, dir_path: str = ''):
    filename = re.sub(r'[<>:"/\\|?*]', '', filename).replace(" ", "_")

    if dir_path:
        path_exists = os.path.join(dir_path, filename)
           
    if os.path.exists(path_exists):
        hash = uuid.uuid4().hex
        filename, ext = os.path.splitext(filename)
        filename = f"{filename}_{hash[5:10]}{ext}"
        
    return filename
