"""Apply MemoMind patches to hindsight-api installed in Windows venv.

Usage: python patch_hindsight.py [venv_path]
Default venv_path: D:\\pythonPycharms\\memomind-env
"""
import os
import sys
import shutil

VENV = sys.argv[1] if len(sys.argv) > 1 else r"D:\pythonPycharms\memomind-env"
PATCHES_DIR = os.path.join(os.path.dirname(__file__), "patches")
SITE_PACKAGES = os.path.join(VENV, "Lib", "site-packages")
HINDSIGHT_API = os.path.join(SITE_PACKAGES, "hindsight_api")

def patch_file(src_name, dst_rel_path):
    """Copy a patched file from patches/ to the installed package."""
    src = os.path.join(PATCHES_DIR, src_name)
    dst = os.path.join(HINDSIGHT_API, dst_rel_path)
    if not os.path.exists(src):
        print(f"  SKIP {src_name} (patch file not found)")
        return False
    if not os.path.exists(dst):
        print(f"  SKIP {dst_rel_path} (target not found, package not installed?)")
        return False
    # Backup original
    bak = dst + ".orig"
    if not os.path.exists(bak):
        shutil.copy2(dst, bak)
        print(f"  Backed up {dst_rel_path} -> .orig")
    shutil.copy2(src, dst)
    print(f"  PATCHED {dst_rel_path}")
    return True

def patch_link_expansion():
    """Copy the custom link_expansion_retrieval.py with super-entity filtering."""
    # Prefer the engine/ version in MemoMind repo
    src = os.path.join(os.path.dirname(__file__), "engine", "link_expansion_retrieval.py")
    if not os.path.exists(src):
        src = os.path.join(PATCHES_DIR, "link_expansion_retrieval.py")
    dst = os.path.join(HINDSIGHT_API, "engine", "search", "link_expansion_retrieval.py")
    if not os.path.exists(dst):
        print("  SKIP link_expansion_retrieval.py (target not found)")
        return False
    bak = dst + ".orig"
    if not os.path.exists(bak):
        shutil.copy2(dst, bak)
    shutil.copy2(src, dst)
    print("  PATCHED engine/search/link_expansion_retrieval.py (super-entity filter)")
    return True

def main():
    print(f"MemoMind Patch Script")
    print(f"  Venv: {VENV}")
    print(f"  Patches: {PATCHES_DIR}")
    print(f"  Target: {HINDSIGHT_API}")
    print()

    if not os.path.isdir(HINDSIGHT_API):
        print("ERROR: hindsight_api not found. Install hindsight-api-slim first.")
        sys.exit(1)

    count = 0
    # 1. fact_extraction.py - occurred_start fallback
    count += patch_file("fact_extraction.py", os.path.join("engine", "retain", "fact_extraction.py"))
    # 1b. fact_storage.py - Windows strftime %-d fix
    count += patch_file("fact_storage.py", os.path.join("engine", "retain", "fact_storage.py"))
    # 2. orchestrator.py - original_document_id
    count += patch_file("orchestrator.py", os.path.join("engine", "retain", "orchestrator.py"))
    # 3. link_expansion_retrieval.py - super entity filtering
    count += patch_link_expansion()
    # 4. consolidation prompts.py - language rule
    count += patch_file("consolidation_prompts.py", os.path.join("engine", "consolidation", "prompts.py"))
    # 5. consolidator.py - skip trivial observation
    count += patch_file("consolidator.py", os.path.join("engine", "consolidation", "consolidator.py"))

    # 6. hindsight/server.py timeout (in hindsight package, not hindsight_api)
    hindsight_server = os.path.join(SITE_PACKAGES, "hindsight", "server.py")
    if os.path.exists(hindsight_server):
        count += patch_file("hindsight_server.py", os.path.join("..", "hindsight", "server.py"))
    else:
        print("  SKIP hindsight/server.py (hindsight package not installed, using direct API)")

    print(f"\nDone: {count} files patched.")

if __name__ == "__main__":
    main()
