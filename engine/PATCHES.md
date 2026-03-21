# MemoMind Engine Patches

This directory contains the hindsight engine source code with MemoMind-specific patches applied.

Base version: `hindsight-all` + `hindsight-api` (pip)

## Applied Patches

### 1. Startup Timeout (server.py)
- **File**: `hindsight/server.py`
- **Change**: `def start(self, timeout: float = 30.0)` → `600.0`
- **Reason**: CUDA model cold start (bge-m3 + cross-encoder) takes >30s on first boot

### 2. Language Preservation (consolidation/prompts.py)
- **File**: `hindsight_api/engine/consolidation/prompts.py`
- **Change**: Added rule to `_PROCESSING_RULES`: "Write each observation in the SAME language as the source facts"
- **Reason**: Without this, gpt-4o translates Chinese facts into English observations

### 3. Skip Trivial Observations (consolidation/consolidator.py)
- **File**: `hindsight_api/engine/consolidation/consolidator.py`
- **Change**: Before executing `_CreateAction`, check if `len(source_mems) == 1` and text similarity > 50% — if so, skip
- **Reason**: Consolidation creates 1:1 copies of world facts as observations when there's only one source fact. Real observations should synthesize across multiple facts.

### 4. Similarity Threshold (consolidation/consolidator.py)
- **File**: `hindsight_api/engine/consolidation/consolidator.py`
- **Change**: Similarity threshold 0.8 → 0.5, plus length ratio check (`_shorter / _longer > 0.6`)
- **Reason**: gpt-4o rephrases enough to bypass 80% threshold but the observation is still semantically identical

## How Patches Are Applied

During installation (`install.sh`), patches are applied automatically via `sed` and Python string replacement. See the "Patch" sections in `install.sh`.

**Warning**: Running `pip install --upgrade hindsight-all hindsight-api` will overwrite these patches. After upgrading, re-run the patch sections of `install.sh` or copy files from this `engine/` directory.
